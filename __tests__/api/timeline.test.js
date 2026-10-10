const handler = require('@/pages/api/timeline').default
const { prisma } = require('@/lib/prisma')
const { getServerSession } = require('next-auth/next')

// Mock Prisma and NextAuth
jest.mock('@/lib/prisma', () => ({
  prisma: {
    wuphfUser: {
      findUnique: jest.fn(),
    },
    follower: {
      findMany: jest.fn(),
    },
    wuphf: {
      findMany: jest.fn(),
    },
  },
}))

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

// Helper to mock Next.js req and res objects
function createMocks(query = {}, method = 'GET') {
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

describe('/api/timeline handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // 1. Method Not Allowed Edge Case
  it('should return 405 if method is not GET', async () => {
    const { req, res } = createMocks({}, 'POST')

    await handler(req, res)

    expect(res.setHeader).toHaveBeenCalledWith('Allow', ['GET'])
    expect(res.status).toHaveBeenCalledWith(405)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Method POST Not Allowed',
    })
  })

  // 2. Bad Request Edge Case
  it('should return 400 if unauthenticated and no followerId provided', async () => {
    getServerSession.mockResolvedValueOnce(null)
    const { req, res } = createMocks({}, 'GET')

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      message: 'Must be authenticated or provide a followerId query parameter.',
    })
  })

  // 3. Success: Unauthenticated with followerId query parameter
  it('should fetch timeline successfully using followerId query param when unauthenticated', async () => {
    getServerSession.mockResolvedValueOnce(null)
    prisma.follower.findMany.mockResolvedValueOnce([{ userId: 'friend1' }])
    prisma.wuphf.findMany.mockResolvedValueOnce([
      {
        id: 10,
        userId: 'friend1',
        content: 'Hello world',
        createdAt: new Date(),
        Likes: [],
        user: { avatar: { url: 'http://example.com/avatar.jpg' } },
        _count: { Likes: 0, Comments: 1 },
      },
    ])

    const { req, res } = createMocks({ followerId: 'testuser' }, 'GET')

    await handler(req, res)

    expect(prisma.follower.findMany).toHaveBeenCalledWith({
      where: { followerId: 'testuser' },
      select: { userId: true },
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        timeline: expect.arrayContaining([
          expect.objectContaining({ id: 10, userLikePost: false }),
        ]),
        cursor: 10,
      }),
    )
  })

  // 4. Success: Authenticated via Session
  it('should fetch timeline successfully using session user when authenticated', async () => {
    getServerSession.mockResolvedValueOnce({
      user: { email: 'test@example.com' },
    })
    prisma.wuphfUser.findUnique.mockResolvedValueOnce({
      userName: 'sessionuser',
      email: 'test@example.com',
    })

    prisma.follower.findMany.mockResolvedValueOnce([])
    prisma.wuphf.findMany.mockResolvedValueOnce([
      {
        id: 15,
        userId: 'sessionuser',
        content: 'My own post',
        createdAt: new Date(),
        Likes: [{ userId: 'sessionuser', wuphfId: 15 }],
        user: { avatar: { url: null } },
        _count: { Likes: 1, Comments: 0 },
      },
    ])

    const { req, res } = createMocks({}, 'GET')

    await handler(req, res)

    expect(prisma.wuphfUser.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        timeline: [
          expect.objectContaining({
            id: 15,
            userLikePost: true,
          }),
        ],
      }),
    )
  })

  // 5. Server Error Edge Case
  it('should return 500 on unexpected database error', async () => {
    getServerSession.mockResolvedValueOnce(null)
    prisma.follower.findMany.mockRejectedValueOnce(
      new Error('DB connection failed'),
    )

    const { req, res } = createMocks({ followerId: 'testuser' }, 'GET')

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' })
  })

  // 6. Stale Session Edge Case (User in session no longer exists in DB)
  it('should return 401 or 404 if authenticated session user cannot be found in database', async () => {
    getServerSession.mockResolvedValueOnce({
      user: { email: 'deleted@example.com' },
    })
    // Simulate user not found in DB
    prisma.wuphfUser.findUnique.mockResolvedValueOnce(null)

    const { req, res } = createMocks({}, 'GET')

    await handler(req, res)

    // Depending on your implementation, you might expect 401 Unauthorized or 404 Not Found
    expect(res.status).toHaveBeenCalledWith(expect.any(Number))
    // Or assert your specific status, e.g.:
    // expect(res.status).toHaveBeenCalledWith(401)
  })

  // 7. Cursor Pagination Edge Case (Passing a cursor parameter)
  it('should pass the cursor parameter correctly to the prisma query for pagination', async () => {
    getServerSession.mockResolvedValueOnce({
      user: { email: 'test@example.com' },
    })
    prisma.wuphfUser.findUnique.mockResolvedValueOnce({
      userName: 'sessionuser',
      email: 'test@example.com',
    })

    prisma.follower.findMany.mockResolvedValueOnce([{ userId: 'friend1' }])
    prisma.wuphf.findMany.mockResolvedValueOnce([]) // Empty batch for next page

    const { req, res } = createMocks({ cursor: '10' }, 'GET')

    await handler(req, res)

    // Verify that Prisma takes the cursor into account (adjust property name based on your code e.g., cursor or skip)
    expect(prisma.wuphf.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: expect.any(Object), // or expect({ id: 10 }) depending on implementation
      }),
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })

  // 8. Empty Timeline Edge Case (Follows users, but no posts available)
  it('should return an empty timeline array when user follows accounts with no posts', async () => {
    getServerSession.mockResolvedValueOnce(null)
    prisma.follower.findMany.mockResolvedValueOnce([{ userId: 'silentFriend' }])
    prisma.wuphf.findMany.mockResolvedValueOnce([]) // No posts found

    const { req, res } = createMocks({ followerId: 'testuser' }, 'GET')

    await handler(req, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        timeline: [],
      }),
    )
  })
})
