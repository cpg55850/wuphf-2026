const handler = require('@/pages/api/wuphfs/[wid]/comments/[cid]').default
const { prisma, Prisma } = require('@/lib/prisma')
const { getServerSession } = require('next-auth/next')

// Mock Prisma client and Prisma error class
jest.mock('@/lib/prisma', () => ({
  prisma: {
    comments: {
      findFirst: jest.fn(),
      update: jest.fn(),
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

// Mock NextAuth getServerSession
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

describe('/api/wuphfs/[wid]/comments/[cid] handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // Parameter Validation & Method Guard
  // ---------------------------------------------------------------------------
  describe('Parameter Validation & Method Guards', () => {
    it('should return 400 if wid or cid is missing', async () => {
      const { req, res } = createMocks({ query: { wid: '101' } }) // missing cid

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: "Parameters 'wid' and 'cid' must be valid integers.",
      })
    })

    it('should return 400 if wid or cid is not a valid integer', async () => {
      const { req, res } = createMocks({
        query: { wid: '101', cid: 'not-an-integer' },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: "Parameters 'wid' and 'cid' must be valid integers.",
      })
    })

    it('should return 400 if wid or cid is passed as an array', async () => {
      const { req, res } = createMocks({
        query: { wid: ['101', '102'], cid: '1' },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: "Parameters 'wid' and 'cid' must be valid integers.",
      })
    })

    it('should return 400 if wid or cid is a negative integer or zero', async () => {
      const { req, res } = createMocks({
        query: { wid: '101', cid: '0' },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should return 405 if HTTP method is not allowed (e.g. POST)', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'jim@example.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'jim_halpert',
      })
      prisma.comments.findFirst.mockResolvedValueOnce({
        id: 1,
        userId: 'jim_halpert',
      })

      const { req, res } = createMocks({
        query: { wid: '101', cid: '1' },
        method: 'POST',
      })

      await handler(req, res)

      expect(res.setHeader).toHaveBeenCalledWith('Allow', [
        'GET',
        'PATCH',
        'DELETE',
      ])
      expect(res.status).toHaveBeenCalledWith(405)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Method POST Not Allowed',
      })
    })
  })

  // ---------------------------------------------------------------------------
  // GET: Retrieve specific comment
  // ---------------------------------------------------------------------------
  describe('GET /api/wuphfs/[wid]/comments/[cid]', () => {
    it('should return 404 if comment is not found for given post and comment ID', async () => {
      prisma.comments.findFirst.mockResolvedValueOnce(null)

      const { req, res } = createMocks({
        query: { wid: '101', cid: '999' },
        method: 'GET',
      })

      await handler(req, res)

      expect(prisma.comments.findFirst).toHaveBeenCalledWith({
        where: { id: 999, postsId: 101 },
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
      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ message: 'Comment not found' })
    })

    it('should retrieve a comment successfully', async () => {
      const mockComment = {
        id: 1,
        postsId: 101,
        userId: 'jim_halpert',
        commentBody: 'Great post!',
        createdAt: '2026-10-08T04:50:00.000Z',
        user: { avatar: { url: 'https://example.com/avatar.png' } },
      }
      prisma.comments.findFirst.mockResolvedValueOnce(mockComment)

      const { req, res } = createMocks({
        query: { wid: '101', cid: '1' },
        method: 'GET',
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(mockComment)
    })
  })

  // ---------------------------------------------------------------------------
  // Authentication & Ownership Verification (PATCH & DELETE)
  // ---------------------------------------------------------------------------
  describe('Authentication & Ownership Checks (PATCH & DELETE)', () => {
    it('should return 401 if user is unauthenticated', async () => {
      getServerSession.mockResolvedValueOnce(null)

      const { req, res } = createMocks({
        query: { wid: '101', cid: '1' },
        method: 'PATCH',
        body: { commentBody: 'New text' },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Unauthorized: You must be logged in.',
      })
    })

    it('should return 401 if session exists but lacks an email', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { name: 'No Email User' },
      })

      const { req, res } = createMocks({
        query: { wid: '101', cid: '1' },
        method: 'PATCH',
        body: { commentBody: 'New text' },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(401)
    })

    it('should return 404 if session user profile is missing in database', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'unknown@example.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce(null)

      const { req, res } = createMocks({
        query: { wid: '101', cid: '1' },
        method: 'DELETE',
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Session user profile not found.',
      })
    })

    it('should return 404 if target comment does not exist during ownership check', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'jim@example.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'jim_halpert',
      })
      prisma.comments.findFirst.mockResolvedValueOnce(null) // Target comment not found

      const { req, res } = createMocks({
        query: { wid: '101', cid: '999' },
        method: 'DELETE',
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ message: 'Comment not found' })
    })

    it('should return 403 if user tries to edit or delete another user’s comment', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'jim@example.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'jim_halpert',
      })
      prisma.comments.findFirst.mockResolvedValueOnce({
        id: 1,
        userId: 'dwight_schrute', // Comment belongs to Dwight!
      })

      const { req, res } = createMocks({
        query: { wid: '101', cid: '1' },
        method: 'DELETE',
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Forbidden: You can only edit or delete your own comments.',
      })
    })
  })

  // ---------------------------------------------------------------------------
  // PATCH: Update comment body
  // ---------------------------------------------------------------------------
  describe('PATCH /api/wuphfs/[wid]/comments/[cid]', () => {
    beforeEach(() => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'jim@example.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'jim_halpert',
      })
      prisma.comments.findFirst.mockResolvedValueOnce({
        id: 1,
        userId: 'jim_halpert',
      })
    })

    it('should return 400 if request body is completely missing or null', async () => {
      const { req, res } = createMocks({
        query: { wid: '101', cid: '1' },
        method: 'PATCH',
        body: null,
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should return 400 if commentBody is missing or whitespace only', async () => {
      const { req, res } = createMocks({
        query: { wid: '101', cid: '1' },
        method: 'PATCH',
        body: { commentBody: '   ' },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: "Field 'commentBody' must be a non-empty string.",
      })
    })

    it('should return 400 if commentBody is not a string (e.g. object or number)', async () => {
      const { req, res } = createMocks({
        query: { wid: '101', cid: '1' },
        method: 'PATCH',
        body: { commentBody: { text: 'invalid object body' } },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should update comment successfully and return 200', async () => {
      const mockUpdatedComment = {
        id: 1,
        postsId: 101,
        userId: 'jim_halpert',
        commentBody: 'Updated comment text!',
      }
      prisma.comments.update.mockResolvedValueOnce(mockUpdatedComment)

      const { req, res } = createMocks({
        query: { wid: '101', cid: '1' },
        method: 'PATCH',
        body: { commentBody: '  Updated comment text!  ' },
      })

      await handler(req, res)

      expect(prisma.comments.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { commentBody: 'Updated comment text!' },
      })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(mockUpdatedComment)
    })

    it('should handle Prisma P2025 error on update and return 404', async () => {
      prisma.comments.update.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('Record not found', {
          code: 'P2025',
        }),
      )

      const { req, res } = createMocks({
        query: { wid: '101', cid: '1' },
        method: 'PATCH',
        body: { commentBody: 'Valid text' },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ message: 'Comment not found' })
    })

    it('should handle unexpected Prisma known error codes (e.g. P2003) with 500 error', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      prisma.comments.update.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError(
          'Foreign key constraint failed',
          {
            code: 'P2003',
          },
        ),
      )

      const { req, res } = createMocks({
        query: { wid: '101', cid: '1' },
        method: 'PATCH',
        body: { commentBody: 'Valid text' },
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
  // DELETE: Delete comment
  // ---------------------------------------------------------------------------
  describe('DELETE /api/wuphfs/[wid]/comments/[cid]', () => {
    beforeEach(() => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'jim@example.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'jim_halpert',
      })
      prisma.comments.findFirst.mockResolvedValueOnce({
        id: 1,
        userId: 'jim_halpert',
      })
    })

    it('should delete comment successfully and return 200', async () => {
      const mockDeletedComment = {
        id: 1,
        postsId: 101,
        userId: 'jim_halpert',
        commentBody: 'Going to be deleted',
      }
      prisma.comments.delete.mockResolvedValueOnce(mockDeletedComment)

      const { req, res } = createMocks({
        query: { wid: '101', cid: '1' },
        method: 'DELETE',
      })

      await handler(req, res)

      expect(prisma.comments.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(mockDeletedComment)
    })

    it('should handle Prisma P2025 error on delete and return 404', async () => {
      prisma.comments.delete.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('Record to delete not found', {
          code: 'P2025',
        }),
      )

      const { req, res } = createMocks({
        query: { wid: '101', cid: '1' },
        method: 'DELETE',
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ message: 'Comment not found' })
    })
  })

  // ---------------------------------------------------------------------------
  // Server Error Handling
  // ---------------------------------------------------------------------------
  it('should return 500 when database fails unexpectedly', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    prisma.comments.findFirst.mockRejectedValueOnce(
      new Error('Unexpected DB error'),
    )

    const { req, res } = createMocks({
      query: { wid: '101', cid: '1' },
      method: 'GET',
    })

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' })

    consoleSpy.mockRestore()
  })
})
