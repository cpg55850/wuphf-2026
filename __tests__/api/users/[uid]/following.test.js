const handler = require('@/pages/api/users/[uid]/following').default
const { prisma, Prisma } = require('@/lib/prisma')
const { getServerSession } = require('next-auth/next')

// Mock Prisma client and Prisma error class
jest.mock('@/lib/prisma', () => ({
  prisma: {
    wuphfUser: {
      findUnique: jest.fn(),
    },
    follower: {
      findMany: jest.fn(),
      create: jest.fn(),
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
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  }
  return { req, res }
}

describe('/api/users/[uid]/following handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // Validation / Common Edge Cases
  // ---------------------------------------------------------------------------
  describe('Validation & Common Edge Cases', () => {
    it('should return 400 if uid parameter is missing or array', async () => {
      const { req, res } = createMocks({ query: {}, method: 'GET' })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid or missing user ID parameter.',
      })
    })

    it('should return 400 if uid parameter is an empty string', async () => {
      const { req, res } = createMocks({ query: { uid: '' }, method: 'GET' })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid or missing user ID parameter.',
      })
    })

    it('should return 405 if HTTP method is not allowed (e.g. PUT)', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'charlie@example.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'charlie',
        email: 'charlie@example.com',
      })

      const { req, res } = createMocks({
        query: { uid: 'targetUser' },
        method: 'PUT',
      })

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

    it('should return 401 for POST/DELETE if unauthenticated and no email body provided', async () => {
      getServerSession.mockResolvedValueOnce(null)

      const { req, res } = createMocks({
        query: { uid: 'targetUser' },
        method: 'POST',
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Unauthorized: Session or valid email required.',
      })
    })

    it('should return 404 for POST/DELETE if user profile does not exist', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'nonexistent@example.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce(null)

      const { req, res } = createMocks({
        query: { uid: 'targetUser' },
        method: 'POST',
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: 'No WuphfUser found for nonexistent@example.com',
      })
    })
  })

  // ---------------------------------------------------------------------------
  // GET: Fetch following list
  // ---------------------------------------------------------------------------
  describe('GET /api/users/[uid]/following', () => {
    it('should fetch following list successfully as unauthenticated guest', async () => {
      getServerSession.mockResolvedValueOnce(null)
      prisma.follower.findMany.mockResolvedValueOnce([
        { userId: 'dwight_schrute' },
        { userId: 'jim_halpert' },
      ])

      const { req, res } = createMocks({
        query: { uid: 'michael_scott' },
        method: 'GET',
      })

      await handler(req, res)

      expect(prisma.follower.findMany).toHaveBeenCalledWith({
        where: { followerId: 'michael_scott' },
        select: { userId: true },
      })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith([
        { userId: 'dwight_schrute' },
        { userId: 'jim_halpert' },
      ])
    })

    it('should resolve username from session email when authenticated', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'pam@example.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'pam_beesly',
        email: 'pam@example.com',
      })
      prisma.follower.findMany.mockResolvedValueOnce([
        { userId: 'jim_halpert' },
      ])

      const { req, res } = createMocks({
        query: { uid: 'ignoredParam' },
        method: 'GET',
      })

      await handler(req, res)

      expect(prisma.wuphfUser.findUnique).toHaveBeenCalledWith({
        where: { email: 'pam@example.com' },
      })
      expect(prisma.follower.findMany).toHaveBeenCalledWith({
        where: { followerId: 'pam_beesly' },
        select: { userId: true },
      })
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('should return 404 if session email has no WuphfUser record', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'ghost@example.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce(null)

      const { req, res } = createMocks({
        query: { uid: 'someone' },
        method: 'GET',
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: 'No WuphfUser found with the email ghost@example.com',
      })
    })
  })

  // ---------------------------------------------------------------------------
  // POST: Follow user
  // ---------------------------------------------------------------------------
  describe('POST /api/users/[uid]/following', () => {
    beforeEach(() => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'michael@example.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'michael_scott',
        email: 'michael@example.com',
      })
    })

    it('should return 400 if user tries to follow themselves', async () => {
      const { req, res } = createMocks({
        query: { uid: 'michael_scott' },
        method: 'POST',
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'You cannot follow yourself',
      })
    })

    it('should return 404 if target user does not exist', async () => {
      prisma.wuphfUser.findUnique.mockResolvedValueOnce(null)

      const { req, res } = createMocks({
        query: { uid: 'ryan_howard' },
        method: 'POST',
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: 'The WuphfUser you are trying to follow does not exist',
      })
    })

    it('should create follow relationship and return 200 text message', async () => {
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'ryan_howard',
      })
      prisma.follower.create.mockResolvedValueOnce({})

      const { req, res } = createMocks({
        query: { uid: 'ryan_howard' },
        method: 'POST',
      })

      await handler(req, res)

      expect(prisma.follower.create).toHaveBeenCalledWith({
        data: {
          userId: 'ryan_howard',
          followerId: 'michael_scott',
        },
      })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalledWith('Followed ryan_howard')
    })

    it('should handle duplicate follow gracefully (P2002 error)', async () => {
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'ryan_howard',
      })
      prisma.follower.create.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
        }),
      )

      const { req, res } = createMocks({
        query: { uid: 'ryan_howard' },
        method: 'POST',
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalledWith('Already following ryan_howard')
    })
  })

  // ---------------------------------------------------------------------------
  // DELETE: Unfollow user
  // ---------------------------------------------------------------------------
  describe('DELETE /api/users/[uid]/following', () => {
    beforeEach(() => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'michael@example.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'michael_scott',
        email: 'michael@example.com',
      })
    })

    it('should return 400 if user tries to unfollow themselves', async () => {
      const { req, res } = createMocks({
        query: { uid: 'michael_scott' },
        method: 'DELETE',
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'You cannot unfollow yourself',
      })
    })

    it('should return 404 if target user to unfollow does not exist', async () => {
      prisma.wuphfUser.findUnique.mockResolvedValueOnce(null)

      const { req, res } = createMocks({
        query: { uid: 'toby_flenderson' },
        method: 'DELETE',
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: 'The WuphfUser you are trying to unfollow does not exist',
      })
    })

    it('should delete follow relationship successfully', async () => {
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'toby_flenderson',
      })
      prisma.follower.delete.mockResolvedValueOnce({})

      const { req, res } = createMocks({
        query: { uid: 'toby_flenderson' },
        method: 'DELETE',
      })

      await handler(req, res)

      expect(prisma.follower.delete).toHaveBeenCalledWith({
        where: {
          userId_followerId: {
            userId: 'toby_flenderson',
            followerId: 'michael_scott',
          },
        },
      })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalledWith('Unfollowed toby_flenderson')
    })

    it('should handle non-existent follow relationship error (P2025 error)', async () => {
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'toby_flenderson',
      })
      prisma.follower.delete.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('Record not found', {
          code: 'P2025',
        }),
      )

      const { req, res } = createMocks({
        query: { uid: 'toby_flenderson' },
        method: 'DELETE',
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Follow relationship does not exist',
      })
    })
  })

  // ---------------------------------------------------------------------------
  // 500 Server Error Edge Cases
  // ---------------------------------------------------------------------------
  describe('Server Errors', () => {
    it('should return 500 on unexpected database error', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      getServerSession.mockResolvedValueOnce(null)
      prisma.follower.findMany.mockRejectedValueOnce(
        new Error('Database crashed'),
      )

      const { req, res } = createMocks({
        query: { uid: 'someone' },
        method: 'GET',
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
