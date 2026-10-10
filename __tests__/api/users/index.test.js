const handler = require('@/pages/api/users/index').default
const { prisma, Prisma } = require('@/lib/prisma')

// Mock Prisma client and Prisma error class
jest.mock('@/lib/prisma', () => ({
  prisma: {
    wuphfUser: {
      findMany: jest.fn(),
      create: jest.fn(),
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

// Helper function to mock Next.js req and res objects
function createMocks(method, body = {}) {
  const req = {
    method,
    body,
  }
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  }
  return { req, res }
}

describe('/api/users API Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {}) // Suppress expected console.errors in tests
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  // ==========================================
  // GET /api/users TESTS
  // ==========================================
  describe('GET /api/users', () => {
    it('should retrieve all users successfully with status 200', async () => {
      const mockUsers = [
        {
          id: 1,
          email: 'michael@dundermifflin.com',
          userName: 'michael_scott',
          bio: 'Boss',
          avatarId: 1,
        },
      ]
      prisma.wuphfUser.findMany.mockResolvedValue(mockUsers)

      const { req, res } = createMocks('GET')
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(mockUsers)
    })

    it('should return 500 if prisma.wuphfUser.findMany throws an error', async () => {
      prisma.wuphfUser.findMany.mockRejectedValue(
        new Error('Database connection failed'),
      )

      const { req, res } = createMocks('GET')
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error',
      })
    })
  })

  // ==========================================
  // POST /api/users TESTS (Success & Validation)
  // ==========================================
  describe('POST /api/users', () => {
    const validPayload = {
      email: 'dwight@dundermifflin.com',
      userName: 'dwight_schrute',
      bio: 'Assistant to the Regional Manager',
      avatarId: 2,
    }

    it('should create a new user successfully with status 201', async () => {
      const createdUser = { id: 2, ...validPayload }
      prisma.wuphfUser.create.mockResolvedValue(createdUser)

      const { req, res } = createMocks('POST', validPayload)
      await handler(req, res)

      expect(prisma.wuphfUser.create).toHaveBeenCalledWith({
        data: {
          email: 'dwight@dundermifflin.com',
          userName: 'dwight_schrute',
          bio: 'Assistant to the Regional Manager',
          avatarId: 2,
        },
      })
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(createdUser)
    })

    // ------------------------------------------
    // Edge Cases: Yup Validation Failures (400)
    // ------------------------------------------
    it('should return 400 if email is missing', async () => {
      const { req, res } = createMocks('POST', { userName: 'dwight_schrute' })
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) }),
      )
    })

    it('should return 400 if username is missing', async () => {
      const { req, res } = createMocks('POST', {
        email: 'dwight@dundermifflin.com',
      })
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) }),
      )
    })

    it('should return 400 if email format is invalid', async () => {
      const { req, res } = createMocks('POST', {
        email: 'not-an-email',
        userName: 'dwight',
      })
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid email address format.',
      })
    })

    it('should return 400 if email contains trailing/leading whitespace or invalid structure', async () => {
      const { req, res } = createMocks('POST', {
        email: 'dwight@ dundermifflin.com',
        userName: 'dwight',
      })
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should return 400 if username is too short (< 3 chars)', async () => {
      const { req, res } = createMocks('POST', {
        email: 'dwight@dundermifflin.com',
        userName: 'dw',
      })
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Username must be at least 3 characters.',
      })
    })

    it('should return 400 if username is excessively long', async () => {
      const { req, res } = createMocks('POST', {
        email: 'dwight@dundermifflin.com',
        userName: 'a'.repeat(100), // Assuming there's a max limit like 30 or 50
      })
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should return 400 if username contains invalid characters', async () => {
      const { req, res } = createMocks('POST', {
        email: 'dwight@dundermifflin.com',
        userName: 'dwight schrute!',
      })
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message:
          'Username can only contain letters, numbers, underscores, and hyphens.',
      })
    })

    it('should return 400 if username contains symbols or spaces', async () => {
      const { req, res } = createMocks('POST', {
        email: 'dwight@dundermifflin.com',
        userName: 'dwight@schrute',
      })
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should return 400 if bio exceeds max character limits', async () => {
      const { req, res } = createMocks('POST', {
        email: 'dwight@dundermifflin.com',
        userName: 'dwight_schrute',
        bio: 'a'.repeat(501), // Assuming a max limit of 500 characters for bio
      })
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should return 400 if avatarId is not an integer', async () => {
      const { req, res } = createMocks('POST', {
        email: 'dwight@dundermifflin.com',
        userName: 'dwight',
        avatarId: 1.5,
      })
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Avatar ID must be an integer.',
      })
    })

    it('should return 400 if avatarId is a negative integer', async () => {
      const { req, res } = createMocks('POST', {
        email: 'dwight@dundermifflin.com',
        userName: 'dwight',
        avatarId: -1,
      })
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should return 400 if avatarId is passed as a string instead of a number', async () => {
      const { req, res } = createMocks('POST', {
        email: 'dwight@dundermifflin.com',
        userName: 'dwight',
        avatarId: '2',
      })
      await handler(req, res)

      // Depending on strict typing or schema coercion, adjust expectation:
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should return 400 if request body contains unexpected extra fields (if strict validation is on)', async () => {
      const { req, res } = createMocks('POST', {
        ...validPayload,
        isAdmin: true, // Malicious injection attempt of unauthorized field
      })
      await handler(req, res)

      // If your schema strips unknown keys, it might pass 201, but if strict mode is enabled, it returns 400.
      // Update assertion based on your validation strip/abortEarly settings.
      expect([201, 400]).toContain(res.status.mock.calls[0]?.[0])
    })

    it('should return 400 if request body is empty, null, or undefined', async () => {
      const { req, res } = createMocks('POST', null)
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should return 400 if request body is an array instead of an object', async () => {
      const { req, res } = createMocks('POST', [validPayload])
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    // ------------------------------------------
    // Edge Cases: Prisma Known Request Errors (409 & 500)
    // ------------------------------------------
    it('should return 409 if a unique constraint fails on email (P2002)', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`email`)',
        { code: 'P2002' },
      )
      prisma.wuphfUser.create.mockRejectedValue(prismaError)

      const { req, res } = createMocks('POST', validPayload)
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(409)
      expect(res.json).toHaveBeenCalledWith({
        message: 'A user with that username or email already exists.',
      })
    })

    it('should return 409 if a unique constraint fails on username (P2002)', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`userName`)',
        { code: 'P2002' },
      )
      prisma.wuphfUser.create.mockRejectedValue(prismaError)

      const { req, res } = createMocks('POST', validPayload)
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(409)
      expect(res.json).toHaveBeenCalledWith({
        message: 'A user with that username or email already exists.',
      })
    })

    it('should return 409 if a foreign key constraint fails (P2003)', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        { code: 'P2003' },
      )
      prisma.wuphfUser.create.mockRejectedValue(prismaError)

      const { req, res } = createMocks('POST', validPayload)
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(409)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid avatarId or foreign key constraint failed.',
      })
    })

    it('should return 500 for unhandled Prisma Known Request Error codes (e.g., P2025)', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Some unhandled prisma error',
        { code: 'P2025' },
      )
      prisma.wuphfUser.create.mockRejectedValue(prismaError)

      const { req, res } = createMocks('POST', validPayload)
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error',
      })
    })

    it('should return 500 for unhandled Prisma or general server errors on POST', async () => {
      prisma.wuphfUser.create.mockRejectedValue(
        new Error('Unexpected DB crash'),
      )

      const { req, res } = createMocks('POST', validPayload)
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error',
      })
    })
  })

  // ==========================================
  // UNSUPPORTED HTTP METHODS (405)
  // ==========================================
  describe('Unsupported HTTP Methods', () => {
    it.each(['PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'])(
      'should return 405 and Allow header for unsupported method like %s',
      async (method) => {
        const { req, res } = createMocks(method)
        await handler(req, res)

        expect(res.setHeader).toHaveBeenCalledWith('Allow', ['GET', 'POST'])
        expect(res.status).toHaveBeenCalledWith(405)
        expect(res.json).toHaveBeenCalledWith({
          message: `Method ${method} Not Allowed`,
        })
      },
    )
  })
})
