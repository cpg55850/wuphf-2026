const handler = require('@/pages/api/wuphfs').default
const { prisma, Prisma } = require('@/lib/prisma')
const { getServerSession } = require('next-auth/next')

// Mock Prisma client and Prisma error class
jest.mock('@/lib/prisma', () => ({
  prisma: {
    wuphf: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    wuphfUser: {
      findUnique: jest.fn(),
    },
  },
  Prisma: {
    PrismaClientKnownRequestError: class extends Error {
      constructor(message, { code }) {
        super(message)
        this.code = code
      }
    },
  },
}))

// Mock NextAuth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

// Helper to construct mock Next.js req/res objects
function createMocks({ query = {}, method = 'GET', body = {} } = {}) {
  const req = {
    method,
    query,
    body,
  }
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  }
  return { req, res }
}

describe('/api/wuphfs handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // Method Guard Edge Case
  // ---------------------------------------------------------------------------
  it('should return 405 if HTTP method is not allowed (e.g., PUT)', async () => {
    const { req, res } = createMocks({ method: 'PUT' })

    await handler(req, res)

    expect(res.setHeader).toHaveBeenCalledWith('Allow', ['GET', 'POST'])
    expect(res.status).toHaveBeenCalledWith(405)
    expect(res.json).toHaveBeenCalledWith({ message: 'Method PUT Not Allowed' })
  })

  // ---------------------------------------------------------------------------
  // GET /api/wuphfs
  // ---------------------------------------------------------------------------
  describe('GET /api/wuphfs', () => {
    it('should retrieve all wuphfs successfully with status 200', async () => {
      const mockWuphfs = [
        {
          id: 1,
          userId: 'michael_scott',
          postBody: 'WUPHF!',
          createdAt: '2026-10-08T04:48:20.000Z',
          _count: { Likes: 2, Comments: 1 },
        },
      ]
      prisma.wuphf.findMany.mockResolvedValueOnce(mockWuphfs)

      const { req, res } = createMocks({ method: 'GET' })

      await handler(req, res)

      expect(prisma.wuphf.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { Likes: true, Comments: true },
          },
        },
      })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(mockWuphfs)
    })

    it('should return an empty array with 200 if no wuphfs exist in database', async () => {
      prisma.wuphf.findMany.mockResolvedValueOnce([])

      const { req, res } = createMocks({ method: 'GET' })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith([])
    })

    it('should return 500 if database fetch fails', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      prisma.wuphf.findMany.mockRejectedValueOnce(new Error('DB error'))

      const { req, res } = createMocks({ method: 'GET' })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error',
      })

      consoleSpy.mockRestore()
    })
  })

  // ---------------------------------------------------------------------------
  // POST /api/wuphfs
  // ---------------------------------------------------------------------------
  describe('POST /api/wuphfs', () => {
    // --- Validation Tests ---
    it('should return 400 if request body is completely missing or null', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: null,
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should return 400 if postBody is missing or empty', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { postBody: '    ' },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should return 400 if postBody is not a string (e.g., object or number)', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { postBody: { text: 'invalid object body' } },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should return 400 if pictureUrl is invalid', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          postBody: 'Valid post body',
          pictureUrl: 'not-a-valid-url',
        },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should return 400 if pictureUrl is missing a protocol (e.g., example.com)', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          postBody: 'Valid post body',
          pictureUrl: 'example.com/image.jpg',
        },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    // --- Authentication & Identification Tests ---
    it('should return 401 if unauthenticated and no username fallback provided', async () => {
      getServerSession.mockResolvedValueOnce(null)

      const { req, res } = createMocks({
        method: 'POST',
        body: { postBody: 'Hello world' },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        message:
          'Unauthorized: User identification required to create a Wuphf.',
      })
    })

    it('should return 401 if session exists but user object or email is missing', async () => {
      getServerSession.mockResolvedValueOnce({ user: {} })

      const { req, res } = createMocks({
        method: 'POST',
        body: { postBody: 'Hello world' },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(401)
    })

    it('should return 401 if session user email does not exist in database', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'ghost@example.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce(null)

      const { req, res } = createMocks({
        method: 'POST',
        body: { postBody: 'Hello world' },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(401)
    })

    it('should return 404 if author user profile does not exist in database via username fallback', async () => {
      getServerSession.mockResolvedValueOnce(null)
      prisma.wuphfUser.findUnique.mockResolvedValueOnce(null)

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          postBody: 'Hello world',
          userName: 'ghost_user',
        },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: "No WuphfUser found for username 'ghost_user'",
      })
    })

    // --- Success Creation Tests ---
    it('should successfully create a wuphf using session credentials and return 201', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'michael@example.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'michael_scott',
        email: 'michael@example.com',
      })

      const mockCreatedWuphf = {
        id: 10,
        userId: 'michael_scott',
        pictureUrl: 'https://example.com/image.jpg',
        postBody: 'WUPHF!',
        createdAt: '2026-10-08T04:48:20.000Z',
        user: {
          userName: 'michael_scott',
          avatar: { url: 'https://example.com/avatar.png' },
        },
        _count: { Likes: 0, Comments: 0 },
      }
      prisma.wuphf.create.mockResolvedValueOnce(mockCreatedWuphf)

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          postBody: 'WUPHF!',
          pictureUrl: 'https://example.com/image.jpg',
        },
      })

      await handler(req, res)

      expect(prisma.wuphf.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'michael_scott',
            postBody: 'WUPHF!',
          }),
        }),
      )
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(mockCreatedWuphf)
    })

    it('should successfully create a wuphf using body username fallback when session is absent', async () => {
      getServerSession.mockResolvedValueOnce(null)
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'dwight_schrute',
      })

      const mockCreatedWuphf = {
        id: 11,
        userId: 'dwight_schrute',
        pictureUrl: null,
        postBody: 'Identity theft is not a joke Jim!',
        createdAt: '2026-10-08T04:48:20.000Z',
        user: { userName: 'dwight_schrute', avatar: null },
        _count: { Likes: 0, Comments: 0 },
      }
      // Added the missing mock resolution for prisma.wuphf.create here:
      prisma.wuphf.create.mockResolvedValueOnce(mockCreatedWuphf)

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          postBody: 'Identity theft is not a joke Jim!',
          userName: 'dwight_schrute',
        },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(mockCreatedWuphf)
    })

    // --- Error Handling Tests ---
    it('should handle Prisma P2003 foreign key error and return 404 with proper message', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'test@example.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'testuser',
      })
      prisma.wuphf.create.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError(
          'Foreign key constraint failed',
          {
            code: 'P2003',
          },
        ),
      )

      const { req, res } = createMocks({
        method: 'POST',
        body: { postBody: 'Valid body' },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: "No WuphfUser found for username 'testuser'",
      })
    })

    it('should return 500 on unexpected database creation error', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      getServerSession.mockResolvedValueOnce({
        user: { email: 'test@example.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'testuser',
      })
      prisma.wuphf.create.mockRejectedValueOnce(new Error('DB crash'))

      const { req, res } = createMocks({
        method: 'POST',
        body: { postBody: 'Valid body' },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error',
      })

      consoleSpy.mockRestore()
    })
  })
})
