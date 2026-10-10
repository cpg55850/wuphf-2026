const handler = require('@/pages/api/wuphfs/[wid]/comments').default
const { prisma, Prisma } = require('@/lib/prisma')
const { getServerSession } = require('next-auth/next')

// Mock Prisma client and Prisma error class
jest.mock('@/lib/prisma', () => ({
  prisma: {
    wuphf: {
      findUnique: jest.fn(),
    },
    comments: {
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

// Helper function to create mock req and res objects
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

describe('/api/wuphfs/[wid]/comments handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // Validation & Method Guards
  // ---------------------------------------------------------------------------
  describe('Parameter Validation & Method Guards', () => {
    it('should return 400 if wid parameter is missing', async () => {
      const { req, res } = createMocks({ query: {} })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: "Parameter 'wid' must be a valid integer.",
      })
    })

    it('should return 400 if wid parameter is not a valid integer', async () => {
      const { req, res } = createMocks({ query: { wid: 'abc' } })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: "Parameter 'wid' must be a valid integer.",
      })
    })

    it('should return 400 if wid parameter is an array', async () => {
      const { req, res } = createMocks({ query: { wid: ['101', '102'] } })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: "Parameter 'wid' must be a valid integer.",
      })
    })

    it('should return 400 if wid parameter is a negative integer or zero', async () => {
      const { req, res } = createMocks({ query: { wid: '0' } })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should return 405 if HTTP method is not allowed (e.g. DELETE)', async () => {
      const { req, res } = createMocks({
        query: { wid: '101' },
        method: 'DELETE',
      })

      await handler(req, res)

      expect(res.setHeader).toHaveBeenCalledWith('Allow', ['GET', 'POST'])
      expect(res.status).toHaveBeenCalledWith(405)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Method DELETE Not Allowed',
      })
    })
  })

  // ---------------------------------------------------------------------------
  // GET: Retrieve comments
  // ---------------------------------------------------------------------------
  describe('GET /api/wuphfs/[wid]/comments', () => {
    it('should return 404 if target Wuphf post does not exist', async () => {
      prisma.wuphf.findUnique.mockResolvedValueOnce(null)

      const { req, res } = createMocks({ query: { wid: '999' }, method: 'GET' })

      await handler(req, res)

      expect(prisma.wuphf.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        select: { id: true },
      })
      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ message: 'Wuphf post not found' })
    })

    it('should successfully retrieve comments for a valid Wuphf post', async () => {
      prisma.wuphf.findUnique.mockResolvedValueOnce({ id: 101 })
      const mockComments = [
        {
          id: 1,
          postsId: 101,
          userId: 'jim_halpert',
          commentBody: 'Great Wuphf!',
          createdAt: '2026-10-08T04:50:00.000Z',
          user: { avatar: { url: 'https://example.com/avatar.png' } },
        },
      ]
      prisma.comments.findMany.mockResolvedValueOnce(mockComments)

      const { req, res } = createMocks({ query: { wid: '101' }, method: 'GET' })

      await handler(req, res)

      expect(prisma.comments.findMany).toHaveBeenCalledWith({
        where: { postsId: 101 },
        include: {
          user: {
            select: {
              avatar: {
                select: { url: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(mockComments)
    })
  })

  // ---------------------------------------------------------------------------
  // POST: Add a comment
  // ---------------------------------------------------------------------------
  describe('POST /api/wuphfs/[wid]/comments', () => {
    // --- Input Body Validation ---
    it('should return 400 if request body is completely missing or null', async () => {
      const { req, res } = createMocks({
        query: { wid: '101' },
        method: 'POST',
        body: null,
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should return 400 if commentBody is missing', async () => {
      const { req, res } = createMocks({
        query: { wid: '101' },
        method: 'POST',
        body: {},
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Comment body cannot be empty or contain only whitespace.',
      })
    })

    it('should return 400 if commentBody contains only whitespace', async () => {
      const { req, res } = createMocks({
        query: { wid: '101' },
        method: 'POST',
        body: { commentBody: '    ' },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Comment body cannot be empty or contain only whitespace.',
      })
    })

    it('should return 400 if commentBody is not a string (e.g. object or number)', async () => {
      const { req, res } = createMocks({
        query: { wid: '101' },
        method: 'POST',
        body: { commentBody: { text: 'invalid comment object' } },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    // --- Authentication & User Resolution ---
    it('should return 401 if unauthenticated and no userId body fallback is provided', async () => {
      getServerSession.mockResolvedValueOnce(null)

      const { req, res } = createMocks({
        query: { wid: '101' },
        method: 'POST',
        body: { commentBody: 'Nice post!' },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Unauthorized: User identification required to comment.',
      })
    })

    it('should return 401 if session exists but user object or email is missing', async () => {
      getServerSession.mockResolvedValueOnce({ user: {} })

      const { req, res } = createMocks({
        query: { wid: '101' },
        method: 'POST',
        body: { commentBody: 'Nice post!' },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(401)
    })

    it('should return 404 if session email has no corresponding WuphfUser profile', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'unknown@example.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce(null)

      const { req, res } = createMocks({
        query: { wid: '101' },
        method: 'POST',
        body: { commentBody: 'Hello' },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: 'No WuphfUser found for session email unknown@example.com',
      })
    })

    it('should return 404 if target Wuphf post does not exist', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'jim@example.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'jim_halpert',
      })
      prisma.wuphf.findUnique.mockResolvedValueOnce(null) // Post not found

      const { req, res } = createMocks({
        query: { wid: '999' },
        method: 'POST',
        body: { commentBody: 'Nice post!' },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ message: 'Wuphf post not found' })
    })

    // --- Success Creation Scenarios ---
    it('should create comment using session credentials and return 201', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'jim@example.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'jim_halpert',
      })
      prisma.wuphf.findUnique.mockResolvedValueOnce({ id: 101 })

      const mockCreatedComment = {
        id: 1,
        postsId: 101,
        userId: 'jim_halpert',
        commentBody: 'Great Wuphf!',
        user: { avatar: { url: 'https://example.com/avatar.png' } },
      }
      prisma.comments.create.mockResolvedValueOnce(mockCreatedComment)

      const { req, res } = createMocks({
        query: { wid: '101' },
        method: 'POST',
        body: { commentBody: 'Great Wuphf!' },
      })

      await handler(req, res)

      expect(prisma.comments.create).toHaveBeenCalledWith({
        data: {
          postsId: 101,
          commentBody: 'Great Wuphf!',
          userId: 'jim_halpert',
        },
        include: {
          user: {
            select: {
              avatar: {
                select: { url: true },
              },
            },
          },
        },
      })
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(mockCreatedComment)
    })

    it('should create comment using userId fallback in body when unauthenticated', async () => {
      getServerSession.mockResolvedValueOnce(null)
      prisma.wuphf.findUnique.mockResolvedValueOnce({ id: 101 })

      const mockCreatedComment = {
        id: 2,
        postsId: 101,
        userId: 'guest_user',
        commentBody: 'Fallback comment',
        user: { avatar: null },
      }
      prisma.comments.create.mockResolvedValueOnce(mockCreatedComment)

      const { req, res } = createMocks({
        query: { wid: '101' },
        method: 'POST',
        body: {
          commentBody: 'Fallback comment',
          userId: 'guest_user',
        },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(mockCreatedComment)
    })

    // --- Error Handling ---
    it('should handle Prisma P2003 foreign key error and return 404', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'jim@example.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'jim_halpert',
      })
      prisma.wuphf.findUnique.mockResolvedValueOnce({ id: 101 })

      prisma.comments.create.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError(
          'Foreign key constraint failed',
          {
            code: 'P2003',
          },
        ),
      )

      const { req, res } = createMocks({
        query: { wid: '101' },
        method: 'POST',
        body: { commentBody: 'Comment text' },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Referenced Wuphf post or user does not exist.',
      })
    })

    it('should return 500 on unexpected Prisma known error codes (e.g. P2002)', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      getServerSession.mockResolvedValueOnce({
        user: { email: 'jim@example.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'jim_halpert',
      })
      prisma.wuphf.findUnique.mockResolvedValueOnce({ id: 101 })

      prisma.comments.create.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
        }),
      )

      const { req, res } = createMocks({
        query: { wid: '101' },
        method: 'POST',
        body: { commentBody: 'Comment text' },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error',
      })

      consoleSpy.mockRestore()
    })
  })

  // ---------------------------------------------------------------------------
  // Server Error Handling
  // ---------------------------------------------------------------------------
  it('should return 500 on unexpected database error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    prisma.wuphf.findUnique.mockRejectedValueOnce(
      new Error('Unexpected DB error'),
    )

    const { req, res } = createMocks({ query: { wid: '101' }, method: 'GET' })

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' })

    consoleSpy.mockRestore()
  })
})
