const handler = require('@/pages/api/users/[uid]/wuphfs').default
const { prisma } = require('@/lib/prisma')
const { getServerSession } = require('next-auth/next')

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    wuphfUser: {
      findUnique: jest.fn(),
    },
    wuphf: {
      findMany: jest.fn(),
    },
  },
}))

// Mock NextAuth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

// Helper function to create mock req and res objects
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

describe('/api/users/[uid]/wuphfs handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // 1. HTTP Method Guard
  // ---------------------------------------------------------------------------
  it('should return 405 if HTTP method is not GET', async () => {
    const { req, res } = createMocks({
      query: { uid: 'michael_scott' },
      method: 'POST',
    })

    await handler(req, res)

    expect(res.setHeader).toHaveBeenCalledWith('Allow', ['GET'])
    expect(res.status).toHaveBeenCalledWith(405)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Method POST Not Allowed',
    })
  })

  // ---------------------------------------------------------------------------
  // 2. Query Parameter Validation
  // ---------------------------------------------------------------------------
  it('should return 400 if uid parameter is missing', async () => {
    const { req, res } = createMocks({ query: {} })

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid or missing user ID parameter.',
    })
  })

  it('should return 400 if uid parameter is an empty string', async () => {
    const { req, res } = createMocks({ query: { uid: '' } })

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid or missing user ID parameter.',
    })
  })

  it('should return 400 if uid parameter is an array', async () => {
    const { req, res } = createMocks({ query: { uid: ['user1', 'user2'] } })

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid or missing user ID parameter.',
    })
  })

  // ---------------------------------------------------------------------------
  // 3. User Existence Check
  // ---------------------------------------------------------------------------
  it('should return 404 if target user does not exist', async () => {
    prisma.wuphfUser.findUnique.mockResolvedValueOnce(null)

    const { req, res } = createMocks({ query: { uid: 'nonexistent_user' } })

    await handler(req, res)

    expect(prisma.wuphfUser.findUnique).toHaveBeenCalledWith({
      where: { userName: 'nonexistent_user' },
      select: { userName: true },
    })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      message: 'No WuphfUser found with username nonexistent_user',
    })
  })

  // ---------------------------------------------------------------------------
  // 4. Successful Wuphfs Retrieval Scenarios
  // ---------------------------------------------------------------------------
  it('should decode URI components in uid parameter correctly', async () => {
    prisma.wuphfUser.findUnique.mockResolvedValueOnce({
      userName: 'pam beesly',
    })
    getServerSession.mockResolvedValueOnce(null)
    prisma.wuphf.findMany.mockResolvedValueOnce([])

    const { req, res } = createMocks({ query: { uid: 'pam%20beesly' } })

    await handler(req, res)

    expect(prisma.wuphfUser.findUnique).toHaveBeenCalledWith({
      where: { userName: 'pam beesly' },
      select: { userName: true },
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([])
  })

  it('should fetch posts and calculate userLikePost=true for authenticated viewer session', async () => {
    // 1. Target user exists
    prisma.wuphfUser.findUnique.mockResolvedValueOnce({
      userName: 'dwight_schrute',
    })

    // 2. Session exists and evaluates viewer
    getServerSession.mockResolvedValueOnce({
      user: { email: 'jim@example.com' },
    })
    prisma.wuphfUser.findUnique.mockResolvedValueOnce({
      userName: 'jim_halpert',
    })

    // 3. Mock posts with Likes returned for viewer
    prisma.wuphf.findMany.mockResolvedValueOnce([
      {
        id: 101,
        userId: 'dwight_schrute',
        postBody: 'Bears, beets, Battlestar Galactica.',
        createdAt: '2026-10-08T04:42:45.000Z',
        Likes: [{ userId: 'jim_halpert' }],
        user: { avatar: { id: 1, url: 'https://example.com/avatar.png' } },
        _count: { Likes: 1, Comments: 0 },
      },
    ])

    const { req, res } = createMocks({ query: { uid: 'dwight_schrute' } })

    await handler(req, res)

    expect(prisma.wuphf.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'dwight_schrute' },
        include: expect.objectContaining({
          Likes: {
            where: { userId: 'jim_halpert' },
            select: { userId: true },
          },
        }),
      }),
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([
      {
        id: 101,
        userId: 'dwight_schrute',
        postBody: 'Bears, beets, Battlestar Galactica.',
        createdAt: '2026-10-08T04:42:45.000Z',
        userLikePost: true,
        user: { avatar: { id: 1, url: 'https://example.com/avatar.png' } },
        _count: { Likes: 1, Comments: 0 },
      },
    ])
  })

  it('should handle authenticated session whose email maps to no wuphfUser record gracefully', async () => {
    // Target user exists
    prisma.wuphfUser.findUnique.mockResolvedValueOnce({
      userName: 'dwight_schrute',
    })

    // Session exists, but email doesn't match any wuphfUser
    getServerSession.mockResolvedValueOnce({
      user: { email: 'ghost@example.com' },
    })
    prisma.wuphfUser.findUnique.mockResolvedValueOnce(null)

    prisma.wuphf.findMany.mockResolvedValueOnce([
      {
        id: 101,
        userId: 'dwight_schrute',
        postBody: 'Bears, beets, Battlestar Galactica.',
        Likes: [],
        user: { avatar: null },
        _count: { Likes: 0, Comments: 0 },
      },
    ])

    const { req, res } = createMocks({ query: { uid: 'dwight_schrute' } })

    await handler(req, res)

    expect(prisma.wuphf.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          Likes: false,
        }),
      }),
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('should evaluate viewer from query parameter fallback when session is absent', async () => {
    prisma.wuphfUser.findUnique.mockResolvedValueOnce({
      userName: 'michael_scott',
    })
    getServerSession.mockResolvedValueOnce(null) // No session

    prisma.wuphf.findMany.mockResolvedValueOnce([
      {
        id: 102,
        userId: 'michael_scott',
        postBody: 'That’s what she said!',
        Likes: [], // Viewer hasn't liked it
        user: { avatar: null },
        _count: { Likes: 5, Comments: 2 },
      },
    ])

    const { req, res } = createMocks({
      query: { uid: 'michael_scott', viewer: 'pam_beesly' },
    })

    await handler(req, res)

    expect(prisma.wuphf.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          Likes: {
            where: { userId: 'pam_beesly' },
            select: { userId: true },
          },
        }),
      }),
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 102,
        userLikePost: false,
      }),
    ])
  })

  it('should return userLikePost=false for anonymous viewer without session or viewer query param', async () => {
    prisma.wuphfUser.findUnique.mockResolvedValueOnce({
      userName: 'ryan_howard',
    })
    getServerSession.mockResolvedValueOnce(null)

    prisma.wuphf.findMany.mockResolvedValueOnce([
      {
        id: 103,
        userId: 'ryan_howard',
        postBody: 'WUPHF is the future.',
        Likes: undefined,
        user: { avatar: null },
        _count: { Likes: 0, Comments: 0 },
      },
    ])

    const { req, res } = createMocks({ query: { uid: 'ryan_howard' } })

    await handler(req, res)

    expect(prisma.wuphf.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          Likes: false,
        }),
      }),
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 103,
        userLikePost: false,
      }),
    ])
  })

  // ---------------------------------------------------------------------------
  // 5. Internal Server Error Handling
  // ---------------------------------------------------------------------------
  it('should catch errors and return 500 when database fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    prisma.wuphfUser.findUnique.mockRejectedValueOnce(
      new Error('Database connection failed'),
    )

    const { req, res } = createMocks({ query: { uid: 'michael_scott' } })

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' })

    consoleSpy.mockRestore()
  })
})
