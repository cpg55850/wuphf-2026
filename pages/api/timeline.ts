import type { NextApiRequest, NextApiResponse } from 'next'
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
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    let wuphfUser = null

    if (session?.user?.email) {
      wuphfUser = await prisma.wuphfUser.findUnique({
        where: { email: session.user.email },
      })
    }

    // Determine the target username from the session or query parameter.
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

    // Fetch followed users and include the target user.
    const following = await prisma.follower.findMany({
      where: { followerId: targetUsername },
      select: { userId: true },
    })

    const targetUsernames = [...following.map((f) => f.userId), targetUsername]

    // Parse and validate pagination parameters.
    const rawMaxResults = Array.isArray(req.query.maxResults)
      ? req.query.maxResults[0]
      : req.query.maxResults

    const parsedMaxResults =
      rawMaxResults === undefined ? 20 : Number(rawMaxResults)

    const take =
      Number.isInteger(parsedMaxResults) && parsedMaxResults > 0
        ? Math.min(parsedMaxResults, 100)
        : 20

    const rawCursor = Array.isArray(req.query.cursor)
      ? req.query.cursor[0]
      : req.query.cursor

    const parsedCursor = rawCursor === undefined ? undefined : Number(rawCursor)

    const cursor =
      Number.isInteger(parsedCursor) && parsedCursor! > 0
        ? parsedCursor
        : undefined

    // Query timeline posts from Prisma.
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

    // Calculate whether the current user liked each post.
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

    return res.status(500).json({
      message: 'Internal server error',
    })
  }
}
