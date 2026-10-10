const handler = require('@/pages/api/users/[uid]').default
const { prisma, Prisma } = require('@/lib/prisma')
const { getServerSession } = require('next-auth/next')

// Mock Prisma and NextAuth
jest.mock('@/lib/prisma', () => ({
  prisma: {
    wuphfUser: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      delete: jest.fn(),
    },
  },
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      constructor(message, code) {
        super(message)
        this.code = code
      }
    },
  },
}))

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

// Helper to mock Next.js req and res objects
function createMocks(query = {}, method = 'GET', body = {}) {
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

describe('/api/users/[uid] handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ==========================================
  // GENERAL VALIDATION & METHOD NOT ALLOWED
  // ==========================================
  it('should return 400 if uid parameter is missing or an array', async () => {
    const { req, res } = createMocks({ uid: ['user1', 'user2'] }, 'GET')

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid or missing user ID parameter.',
    })
  })

  it('should return 405 if method is unsupported', async () => {
    const { req, res } = createMocks({ uid: 'pam_beesly' }, 'PUT')

    await handler(req, res)

    expect(res.setHeader).toHaveBeenCalledWith('Allow', [
      'GET',
      'PATCH',
      'DELETE',
    ])
    expect(res.status).toHaveBeenCalledWith(405)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Method PUT Not Allowed',
    })
  })

  // ==========================================
  // GET: RETRIEVE USER PROFILE
  // ==========================================
  describe('GET /api/users/[uid]', () => {
    it('should return 400 if uid violates validation schema (e.g., empty string)', async () => {
      const { req, res } = createMocks({ uid: '' }, 'GET')

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should handle URL encoded or special characters in uid parameter correctly', async () => {
      getServerSession.mockResolvedValueOnce(null)
      const mockUser = {
        userName: 'pam.beesly',
        email: 'pam@dundermifflin.com',
      }
      prisma.wuphfUser.findUnique.mockResolvedValueOnce(mockUser)

      // Simulating a query parameter that had URL encoding like pam%20beesly or similar
      const { req, res } = createMocks({ uid: 'pam%20beesly' }, 'GET')

      await handler(req, res)

      expect(prisma.wuphfUser.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.any(Object),
        }),
      )
    })

    it('should return 404 if user profile is not found', async () => {
      getServerSession.mockResolvedValueOnce(null)
      prisma.wuphfUser.findUnique.mockResolvedValueOnce(null)

      const { req, res } = createMocks({ uid: 'nonexistent' }, 'GET')

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        message: 'No WuphfUser found with the username nonexistent',
      })
    })

    it('should retrieve user profile successfully unauthenticated (strips lists)', async () => {
      getServerSession.mockResolvedValueOnce(null)
      const mockUser = {
        userName: 'pam_beesly',
        email: 'pam@dundermifflin.com',
        Followers: [{ followerId: 'jim' }],
        Following: [{ userId: 'jim' }],
      }
      prisma.wuphfUser.findUnique.mockResolvedValueOnce(mockUser)

      const { req, res } = createMocks({ uid: 'pam_beesly' }, 'GET')

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      // Non-owner gets Followers and Following deleted
      expect(mockUser.Followers).toBeUndefined()
      expect(mockUser.Following).toBeUndefined()
    })

    it('should retain Followers/Following if session user is the profile owner', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'pam@dundermifflin.com' },
      })

      const mockTargetUser = {
        userName: 'pam_beesly',
        email: 'pam@dundermifflin.com',
        Followers: [{ followerId: 'jim_halpert', userId: 'pam_beesly' }],
        Following: [],
      }

      // First call finds target user, second call finds session sender
      prisma.wuphfUser.findUnique
        .mockResolvedValueOnce(mockTargetUser)
        .mockResolvedValueOnce({
          userName: 'pam_beesly',
          email: 'pam@dundermifflin.com',
        })

      const { req, res } = createMocks({ uid: 'pam_beesly' }, 'GET')

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          userName: 'pam_beesly',
          Followers: expect.any(Array), // Owner keeps them
        }),
      )
    })

    it('should handle gracefully if authenticated session email lookup returns null/missing sender user', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'ghost@dundermifflin.com' },
      })

      const mockTargetUser = {
        userName: 'pam_beesly',
        email: 'pam@dundermifflin.com',
        Followers: [],
        Following: [],
      }

      // Target user found, but session sender lookup returns null
      prisma.wuphfUser.findUnique
        .mockResolvedValueOnce(mockTargetUser)
        .mockResolvedValueOnce(null)

      const { req, res } = createMocks({ uid: 'pam_beesly' }, 'GET')

      await handler(req, res)

      // Should default safely to stripping lists or treating as non-owner without crashing
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('should return 500 on unexpected database error during GET', async () => {
      getServerSession.mockResolvedValueOnce(null)
      prisma.wuphfUser.findUnique.mockRejectedValueOnce(new Error('DB Fail'))

      const { req, res } = createMocks({ uid: 'pam_beesly' }, 'GET')

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error',
      })
    })
  })

  // ==========================================
  // PATCH: UPDATE USER PROFILE
  // ==========================================
  describe('PATCH /api/users/[uid]', () => {
    it('should return 401 if unauthenticated', async () => {
      getServerSession.mockResolvedValueOnce(null)

      const { req, res } = createMocks({ uid: 'pam_beesly' }, 'PATCH', {
        bio: 'New bio',
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Unauthorized: You must be logged in.',
      })
    })

    it('should return 403 if authenticated user tries to update another profile', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'jim@dundermifflin.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'jim_halpert',
        email: 'jim@dundermifflin.com',
      })

      const { req, res } = createMocks({ uid: 'pam_beesly' }, 'PATCH', {
        bio: 'Hacking pam profile',
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Forbidden: You can only update or delete your own account.',
      })
    })

    it('should return 404 if target user profile does not exist during PATCH check', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'pam@dundermifflin.com' },
      })
      // Target user lookup returns null
      prisma.wuphfUser.findUnique.mockResolvedValueOnce(null)

      const { req, res } = createMocks({ uid: 'nonexistent' }, 'PATCH', {
        bio: 'Updated bio',
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
    })

    it('should return 400 if validation fails on request body (invalid format/symbols)', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'pam@dundermifflin.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'pam_beesly',
        email: 'pam@dundermifflin.com',
      })

      const { req, res } = createMocks({ uid: 'pam_beesly' }, 'PATCH', {
        userName: 'pam beesly!',
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Username can only contain letters'),
        }),
      )
    })

    it('should return 400 if request body contains invalid data types (e.g. number instead of string)', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'pam@dundermifflin.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'pam_beesly',
        email: 'pam@dundermifflin.com',
      })

      const { req, res } = createMocks({ uid: 'pam_beesly' }, 'PATCH', {
        bio: 12345, // Should fail schema validation expecting string
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should handle Prisma unique constraint error (P2002) gracefully on update conflict', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'pam@dundermifflin.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'pam_beesly',
        email: 'pam@dundermifflin.com',
      })

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        'P2002',
      )
      prisma.wuphfUser.update.mockRejectedValueOnce(prismaError)

      const { req, res } = createMocks({ uid: 'pam_beesly' }, 'PATCH', {
        userName: 'already_taken',
      })

      await handler(req, res)

      // Expecting a client error status code (400 or 409 depending on your error mapper)
      expect([400, 409]).toContain(res.status.mock.calls[0][0])
    })

    it('should update profile successfully when authorized and valid', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'pam@dundermifflin.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'pam_beesly',
        email: 'pam@dundermifflin.com',
      })
      prisma.wuphfUser.update.mockResolvedValueOnce({
        userName: 'pam_new',
        bio: 'Updated bio',
      })

      const { req, res } = createMocks({ uid: 'pam_beesly' }, 'PATCH', {
        userName: 'pam_new',
        bio: 'Updated bio',
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ userName: 'pam_new' }),
      )
    })
  })

  // ==========================================
  // DELETE: DELETE USER ACCOUNT
  // ==========================================
  describe('DELETE /api/users/[uid]', () => {
    it('should return 401 if unauthenticated', async () => {
      getServerSession.mockResolvedValueOnce(null)

      const { req, res } = createMocks({ uid: 'pam_beesly' }, 'DELETE')

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(401)
    })

    it('should return 403 if user tries to delete someone else account', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'jim@dundermifflin.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'jim_halpert',
        email: 'jim@dundermifflin.com',
      })

      const { req, res } = createMocks({ uid: 'pam_beesly' }, 'DELETE')

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(403)
    })

    it('should return 404 if target user account to delete is not found', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'pam@dundermifflin.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce(null)

      const { req, res } = createMocks({ uid: 'nonexistent' }, 'DELETE')

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(404)
    })

    it('should return 500 if database deletion throws a relational constraint error', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'pam@dundermifflin.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'pam_beesly',
        email: 'pam@dundermifflin.com',
      })
      prisma.user.delete.mockRejectedValueOnce(
        new Error('Foreign key constraint failed'),
      )

      const { req, res } = createMocks({ uid: 'pam_beesly' }, 'DELETE')

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
    })

    it('should delete account successfully when authorized', async () => {
      getServerSession.mockResolvedValueOnce({
        user: { email: 'pam@dundermifflin.com' },
      })
      prisma.wuphfUser.findUnique.mockResolvedValueOnce({
        userName: 'pam_beesly',
        email: 'pam@dundermifflin.com',
      })
      prisma.user.delete.mockResolvedValueOnce({
        id: 'usr_12345',
        email: 'pam@dundermifflin.com',
      })

      const { req, res } = createMocks({ uid: 'pam_beesly' }, 'DELETE')

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'usr_12345' }),
      )
    })
  })
})
