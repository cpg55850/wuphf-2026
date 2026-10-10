const handler = require('@/pages/api/search').default
const { prisma } = require('@/lib/prisma')

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    wuphfUser: {
      findMany: jest.fn(),
    },
  },
}))

// Helper to construct mock Next.js req/res objects
function createMocks({ query = {}, method = 'GET' } = {}) {
  const req = {
    method,
    query,
  }
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  }
  return { req, res }
}

describe('/api/search handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // 1. Method Guard
  // ---------------------------------------------------------------------------
  describe('Method Guards', () => {
    it('should return 405 if HTTP method is POST', async () => {
      const { req, res } = createMocks({
        query: { userName: 'ryan' },
        method: 'POST',
      })

      await handler(req, res)

      expect(res.setHeader).toHaveBeenCalledWith('Allow', ['GET'])
      expect(res.status).toHaveBeenCalledWith(405)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Method POST Not Allowed',
      })
    })

    it('should return 405 if HTTP method is PUT', async () => {
      const { req, res } = createMocks({
        query: { userName: 'ryan' },
        method: 'PUT',
      })

      await handler(req, res)

      expect(res.setHeader).toHaveBeenCalledWith('Allow', ['GET'])
      expect(res.status).toHaveBeenCalledWith(405)
    })
  })

  // ---------------------------------------------------------------------------
  // 2. Query Parameter Validation
  // ---------------------------------------------------------------------------
  describe('Query Parameter Validation', () => {
    it('should return 400 if userName parameter is missing', async () => {
      const { req, res } = createMocks({ query: {} })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: "Query parameter 'userName' must be a non-empty string.",
      })
    })

    it('should return 400 if userName parameter is an array', async () => {
      const { req, res } = createMocks({
        query: { userName: ['ryan', 'michael'] },
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: "Query parameter 'userName' must be a non-empty string.",
      })
    })

    it('should return 400 if userName parameter is empty or whitespace only', async () => {
      const { req, res } = createMocks({ query: { userName: '   ' } })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: "Query parameter 'userName' must be a non-empty string.",
      })
    })

    it('should return 400 if userName parameter is an empty string', async () => {
      const { req, res } = createMocks({ query: { userName: '' } })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  // ---------------------------------------------------------------------------
  // 3. Successful Search Execution & Input Edge Cases
  // ---------------------------------------------------------------------------
  describe('GET /api/search', () => {
    it('should search users case-insensitively and return 200 with matching results', async () => {
      const mockUsers = [
        {
          userName: 'ryan_howard',
          avatar: { url: 'https://example.com/ryan.png' },
        },
      ]
      prisma.wuphfUser.findMany.mockResolvedValueOnce(mockUsers)

      const { req, res } = createMocks({ query: { userName: '   RYAN  ' } })

      await handler(req, res)

      expect(prisma.wuphfUser.findMany).toHaveBeenCalledWith({
        where: {
          userName: {
            contains: 'RYAN',
            mode: 'insensitive',
          },
        },
        select: {
          userName: true,
          avatar: {
            select: {
              url: true,
            },
          },
        },
      })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(mockUsers)
    })

    it('should handle search queries containing special symbols or punctuation', async () => {
      prisma.wuphfUser.findMany.mockResolvedValueOnce([])

      const { req, res } = createMocks({
        query: { userName: 'user.name-123!' },
      })

      await handler(req, res)

      expect(prisma.wuphfUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userName: {
              contains: 'user.name-123!',
              mode: 'insensitive',
            },
          },
        }),
      )
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('should handle search queries containing emojis or Unicode characters', async () => {
      prisma.wuphfUser.findMany.mockResolvedValueOnce([])

      const { req, res } = createMocks({ query: { userName: '🔥fire_user👑' } })

      await handler(req, res)

      expect(prisma.wuphfUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userName: {
              contains: '🔥fire_user👑',
              mode: 'insensitive',
            },
          },
        }),
      )
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('should handle extra unexpected query parameters gracefully', async () => {
      prisma.wuphfUser.findMany.mockResolvedValueOnce([])

      const { req, res } = createMocks({
        query: { userName: 'dwight', role: 'admin', limit: '10' },
      })

      await handler(req, res)

      expect(prisma.wuphfUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userName: {
              contains: 'dwight',
              mode: 'insensitive',
            },
          },
        }),
      )
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('should return an empty array if no users match the query', async () => {
      prisma.wuphfUser.findMany.mockResolvedValueOnce([])

      const { req, res } = createMocks({ query: { userName: 'nonexistent' } })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith([])
    })
  })

  // ---------------------------------------------------------------------------
  // 4. Server Error Handling
  // ---------------------------------------------------------------------------
  it('should return 500 when database search fails unexpectedly', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    prisma.wuphfUser.findMany.mockRejectedValueOnce(
      new Error('Search DB error'),
    )

    const { req, res } = createMocks({ query: { userName: 'michael' } })

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' })

    consoleSpy.mockRestore()
  })
})
