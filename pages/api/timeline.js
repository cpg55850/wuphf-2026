import { getServerSession } from 'next-auth/next'

import { authOptions } from '../../lib/authOptions'
import { prisma } from '../../lib/prisma'
/**
 * @openapi
 * /api/timeline:
 *   get:
 *     summary: Fetch user timeline
 *     parameters:
 *       - in: query
 *         name: followerId
 *         schema:
 *           type: string
 *         description: Username of the follower (used if not authenticated)
 *       - in: query
 *         name: maxResults
 *         schema:
 *           type: integer
 *         description: Number of results to return
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: integer
 *         description: Pagination cursor (Wuphf ID)
 *     responses:
 *       200:
 *         description: Successfully fetched timeline
 *       500:
 *         description: Server error
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res
      .status(405)
      .json({ message: `Method ${req.method} Not Allowed` })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    let wuphfUser = null

    if (session?.user?.email) {
      wuphfUser = await prisma.wuphfUser.findUnique({
        where: { email: session.user.email },
      })
    }

    // Determine target username from session or fallback query param
    const rawFollowerId = req.query.followerId
    const fallbackFollowerId = Array.isArray(rawFollowerId)
      ? rawFollowerId[0]
      : rawFollowerId
    const targetUsername = wuphfUser?.userName || fallbackFollowerId

    if (!targetUsername) {
      return res.status(400).json({
        message:
          'Must be authenticated or provide a followerId query parameter.',
      })
    }

    // Fetch followed users and append the current user
    const following = await prisma.follower.findMany({
      where: { followerId: targetUsername },
      select: { userId: true },
    })

    const targetUsernames = [...following.map((f) => f.userId), targetUsername]

    // Parse pagination parameters safely
    const rawMaxResults = req.query.maxResults
    const parsedMaxResults = rawMaxResults
      ? parseInt(String(rawMaxResults), 10)
      : 20
    const take = Number.isNaN(parsedMaxResults) ? 20 : parsedMaxResults

    const rawCursor = req.query.cursor
    const parsedCursor = rawCursor
      ? parseInt(String(rawCursor), 10)
      : undefined
    const cursor = Number.isNaN(parsedCursor) ? undefined : parsedCursor

    // Query timeline posts from Prisma
    const rawWuphfs = await prisma.wuphf.findMany({
      take,
      ...(cursor !== undefined && {
        skip: 1,
        cursor: { id: cursor },
      }),
      where: {
        userId: { in: targetUsernames },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        Likes: true,
        user: {
          select: {
            avatar: {
              select: { url: true },
            },
          },
        },
        _count: {
          select: {
            Likes: true,
            Comments: true,
          },
        },
      },
    })

    // Format response and compute boolean like status for current user
    const currentUsername = wuphfUser?.userName
    const timeline = rawWuphfs.map((wuphf) => {
      const userLikePost = currentUsername
        ? wuphf.Likes.some((like) => like.userId === currentUsername)
        : false

      const { Likes, ...wuphfData } = wuphf
      return {
        ...wuphfData,
        userLikePost,
      }
    })

    const nextCursor =
      timeline.length > 0 ? timeline[timeline.length - 1].id : cursor

    return res.status(200).json({
      timeline,
      cursor: nextCursor,
    })
  } catch (error) {
    console.error('Error fetching timeline:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
