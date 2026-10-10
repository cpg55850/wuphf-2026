const handler = require('@/pages/api/wuphfs/[wid]/likes').default
const { prisma, Prisma } = require('@/lib/prisma')
const { getServerSession } = require('next-auth/next')

// Mock Prisma client and Prisma error class
jest.mock('@/lib/prisma', () => ({
  prisma: {
    wuphf: {
      findUnique: jest.fn(),
    },
    likes: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
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

describe('/api/wuphfs/[wid]/likes handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // Parameter Validation & Method Guards
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

    it('should return 400 if wid parameter is not a valid number', async () => {
      const { req, res } = createMocks({ query: { wid: 'invalid-id' } })

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

    it('should return 400 if wid parameter is a negative integer', async () => {
      const { req, res } = createMocks({ query: { wid: '-5' } })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should return 405 if method is not allowed (e.g. PUT)', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'michael@example.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'michael_scott',
      })

      const { req, res } = createMocks({ query: { wid: '101' }, method: 'PUT' })

      await handler(req, res)

      expect(res.setHeader).toHaveBeenCalledWith('Allow', [
        'GET',
        'POST',
        'DELETE',
      ])
      expect(res.status).toHaveBeenCalledWith(405)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Method PUT Not Allowed',
      })
    })
  })

  // ---------------------------------------------------------------------------
  // GET: Retrieve likes
  // ---------------------------------------------------------------------------
  describe('GET /api/wuphfs/[wid]/likes', () => {
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

    it('should retrieve list of likes for valid Wuphf post', async () => {
      prisma.wuphf.findUnique.mockResolvedValueOnce({ id: 101 })
      const mockLikes = [
        {
          userId: 'dwight_schrute',
          wuphfId: 101,
          createdAt: '2026-10-08T04:49:25.000Z',
        },
        {
          userId: 'pam_beesly',
          wuphfId: 101,
          createdAt: '2026-10-08T04:50:00.000Z',
        },
      ]
      prisma.likes.findMany.mockResolvedValueOnce(mockLikes)

      const { req, res } = createMocks({ query: { wid: '101' }, method: 'GET' })

      await handler(req, res)

      expect(prisma.likes.findMany).toHaveBeenCalledWith({
        where: { wuphfId: 101 },
      })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(mockLikes)
    })
  })

  // ---------------------------------------------------------------------------
  // Authorization Guards for Mutating Methods (POST / DELETE)
  // ---------------------------------------------------------------------------
  describe('Authorization Guard (POST & DELETE)', () => {
    it('should return 401 if session is missing or unauthenticated', async () => {
      getServerSession.mockResolvedValueOnce(null)

      const { req, res } = createMocks({
        query: { wid: '101' },
        method: 'POST',
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Unauthorized: Active session required.',
      })
    })

    it('should return 401 if session object exists but lacks an email', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { name: 'No Email User' },
      })

      const { req, res } = createMocks({
        query: { wid: '101' },
        method: 'POST',
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(401)
    })

    it('should return 404 if session user profile is not found in database', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'unknown@example.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce(null)

      const { req, res } = createMocks({
        query: { wid: '101' },
        method: 'POST',
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Session user profile not found.',
      })
    })
  })

  // ---------------------------------------------------------------------------
  // POST: Like a Wuphf
  // ---------------------------------------------------------------------------
  describe('POST /api/wuphfs/[wid]/likes', () => {
    beforeEach(() => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'jim@example.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'jim_halpert',
        email: 'jim@example.com',
      })
    })

    it('should return 404 if target Wuphf does not exist', async () => {
      prisma.wuphf.findUnique.mockResolvedValueOnce(null)

      const { req, res } = createMocks({
        query: { wid: '999' },
        method: 'POST',
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ message: 'Wuphf post not found' })
    })

    it('should create a new like and return 201', async () => {
      prisma.wuphf.findUnique.mockResolvedValueOnce({ id: 101 })
      const mockCreatedLike = {
        userId: 'jim_halpert',
        wuphfId: 101,
        createdAt: '2026-10-08T04:49:25.000Z',
      }
      prisma.likes.create.mockResolvedValueOnce(mockCreatedLike)

      const { req, res } = createMocks({
        query: { wid: '101' },
        method: 'POST',
      })

      await handler(req, res)

      expect(prisma.likes.create).toHaveBeenCalledWith({
        data: {
          userId: 'jim_halpert',
          wuphfId: 101,
        },
      })
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(mockCreatedLike)
    })

    it('should handle duplicate likes gracefully and return 400 (P2002 error)', async () => {
      prisma.wuphf.findUnique.mockResolvedValueOnce({ id: 101 })
      prisma.likes.create.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
        }),
      )

      const { req, res } = createMocks({
        query: { wid: '101' },
        method: 'POST',
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'You have already liked this Wuphf.',
      })
    })

    it('should handle P2003 foreign key error and return 404', async () => {
      prisma.wuphf.findUnique.mockResolvedValueOnce({ id: 101 })
      prisma.likes.create.mockRejectedValueOnce(
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
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
    })
  })

  // ---------------------------------------------------------------------------
  // DELETE: Unlike a Wuphf
  // ---------------------------------------------------------------------------
  describe('DELETE /api/wuphfs/[wid]/likes', () => {
    beforeEach(() => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'jim@example.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'jim_halpert',
        email: 'jim@example.com',
      })
    })

    it('should delete an existing like and return 200', async () => {
      const mockDeletedLike = {
        userId: 'jim_halpert',
        wuphfId: 101,
        createdAt: '2026-10-08T04:49:25.000Z',
      }
      prisma.likes.delete.mockResolvedValueOnce(mockDeletedLike)

      const { req, res } = createMocks({
        query: { wid: '101' },
        method: 'DELETE',
      })

      await handler(req, res)

      expect(prisma.likes.delete).toHaveBeenCalledWith({
        where: {
          userId_wuphfId: {
            userId: 'jim_halpert',
            wuphfId: 101,
          },
        },
      })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(mockDeletedLike)
    })

    it('should return 404 when trying to delete a non-existent like (P2025 error)', async () => {
      prisma.likes.delete.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError(
          'Record to delete does not exist',
          {
            code: 'P2025',
          },
        ),
      )

      const { req, res } = createMocks({
        query: { wid: '101' },
        method: 'DELETE',
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Like relationship does not exist.',
      })
    })
  })

  // ---------------------------------------------------------------------------
  // Internal Server Error Handling
  // ---------------------------------------------------------------------------
  it('should return 500 when database operation fails unexpectedly', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    prisma.wuphf.findUnique.mockRejectedValueOnce(new Error('DB failure'))

    const { req, res } = createMocks({ query: { wid: '101' }, method: 'GET' })

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' })

    consoleSpy.mockRestore()
  })
})
