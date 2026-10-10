const handler = require('@/pages/api/me').default
const { prisma, Prisma } = require('@/lib/prisma')
const { getServerSession } = require('next-auth/next')

// Mock Prisma client and Prisma error class
jest.mock('@/lib/prisma', () => ({
  prisma: {
    wuphfUser: {
      findUnique: jest.fn(),
    },
    user: {
      delete: jest.fn(),
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

describe('/api/me handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // 1. Authentication Guard
  // ---------------------------------------------------------------------------
  describe('Authentication Guard', () => {
    it('should return 401 if session is missing or unauthenticated', async () => {
      getServerSession.mockResolvedValueOnce(null)

      const { req, res } = createMocks({ method: 'GET' })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Unauthorized: Active session required.',
      })
    })

    it('should return 401 if session exists but user object or email is missing', async () => {
      getServerSession.mockResolvedValueOnce({ user: {} })

      const { req, res } = createMocks({ method: 'GET' })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Unauthorized: Active session required.',
      })
    })

    it('should return 401 if session user object is explicitly null', async () => {
      getServerSession.mockResolvedValueOnce({ user: null })

      const { req, res } = createMocks({ method: 'GET' })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(401)
    })
  })

  // ---------------------------------------------------------------------------
  // 2. Method Guard
  // ---------------------------------------------------------------------------
  describe('Method Guard', () => {
    it('should return 405 if HTTP method is not allowed (e.g., POST)', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'michael@example.com' },
      })

      const { req, res } = createMocks({ method: 'POST' })

      await handler(req, res)

      expect(res.setHeader).toHaveBeenCalledWith('Allow', ['GET', 'DELETE'])
      expect(res.status).toHaveBeenCalledWith(405)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Method POST Not Allowed',
      })
    })

    it('should return 405 if HTTP method is PATCH', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'michael@example.com' },
      })

      const { req, res } = createMocks({ method: 'PATCH' })

      await handler(req, res)

      expect(res.setHeader).toHaveBeenCalledWith('Allow', ['GET', 'DELETE'])
      expect(res.status).toHaveBeenCalledWith(405)
    })
  })

  // ---------------------------------------------------------------------------
  // 3. GET /api/me: Get Profile
  // ---------------------------------------------------------------------------
  describe('GET /api/me', () => {
    beforeEach(() => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'michael@example.com' },
      })
    })

    it('should return 404 if profile is not found for session email', async () => {
      prisma.wuphfUser.findUnique.mockResolvedValueOnce(null)

      const { req, res } = createMocks({ method: 'GET' })

      await handler(req, res)

      expect(prisma.wuphfUser.findUnique).toHaveBeenCalledWith({
        where: { email: 'michael@example.com' },
        include: {
          Followers: true,
          Following: true,
          avatar: true,
          _count: {
            select: {
              Followers: true,
              Following: true,
            },
          },
        },
      })
      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: 'No WuphfUser found with the email michael@example.com',
      })
    })

    it('should retrieve user profile successfully and return 200', async () => {
      const mockUser = {
        email: 'michael@example.com',
        userName: 'michael_scott',
        bio: 'World’s Best Boss',
        avatar: { id: 1, url: 'https://example.com/avatar.png' },
        Followers: [],
        Following: [],
        _count: { Followers: 10, Following: 5 },
      }
      prisma.wuphfUser.findUnique.mockResolvedValueOnce(mockUser)

      const { req, res } = createMocks({ method: 'GET' })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(mockUser)
    })

    it('should return 500 when database findUnique fails', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      prisma.wuphfUser.findUnique.mockRejectedValueOnce(new Error('DB failure'))

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
  // 4. DELETE /api/me: Delete Account
  // ---------------------------------------------------------------------------
  describe('DELETE /api/me', () => {
    beforeEach(() => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'michael@example.com' },
      })
    })

    it('should delete user account successfully and return 200', async () => {
      const mockDeletedUser = {
        id: 'usr_123456',
        email: 'michael@example.com',
      }
      prisma.user.delete.mockResolvedValueOnce(mockDeletedUser)

      const { req, res } = createMocks({ method: 'DELETE' })

      await handler(req, res)

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { email: 'michael@example.com' },
      })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(mockDeletedUser)
    })

    it('should return 404 when target user to delete is not found (P2025 error)', async () => {
      prisma.user.delete.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('Record to delete not found', {
          code: 'P2025',
        }),
      )

      const { req, res } = createMocks({ method: 'DELETE' })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Target user not found',
      })
    })

    it('should return 500 on unexpected Prisma known error codes (e.g. P2003)', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      prisma.user.delete.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError(
          'Foreign key constraint failed',
          {
            code: 'P2003',
          },
        ),
      )

      const { req, res } = createMocks({ method: 'DELETE' })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error',
      })

      consoleSpy.mockRestore()
    })

    it('should return 500 on unexpected delete failure', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      prisma.user.delete.mockRejectedValueOnce(
        new Error('Unexpected deletion error'),
      )

      const { req, res } = createMocks({ method: 'DELETE' })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error',
      })

      consoleSpy.mockRestore()
    })
  })
})
