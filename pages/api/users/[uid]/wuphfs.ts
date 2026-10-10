import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '../../../../lib/authOptions'
import { prisma } from '../../../../lib/prisma'

/**
 * @openapi
 * /api/users/{uid}/wuphfs:
 *   get:
 *     summary: Retrieve all Wuphfs created by a specific user
 *     description: Fetches all Wuphf posts authored by the specified user ID/username, ordered descending by creation date. Computes whether the requesting user (via session or query fallback) has liked each post.
 *     tags:
 *       - Users
 *       - Wuphfs
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: Username or URL-encoded user ID whose Wuphfs are being retrieved.
 *     responses:
 *       200:
 *         description: List of user's Wuphfs successfully retrieved.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserWuphfItem'
 *       400:
 *         description: Invalid or missing user ID parameter.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid or missing user ID parameter."
 *       404:
 *         description: Target user does not exist.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No WuphfUser found with username pam_beesly"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 *
 * components:
 *   schemas:
 *     UserWuphfItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 101
 *         userId:
 *           type: string
 *           example: "michael_scott"
 *         pictureUrl:
 *           type: string
 *           nullable: true
 *           example: "https://example.com/image.jpg"
 *         postBody:
 *           type: string
 *           example: "WUPHF! Welcome to Dunder Mifflin!"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-10-08T04:42:45.000Z"
 *         userLikePost:
 *           type: boolean
 *           description: Indicates whether the evaluating user has liked this specific Wuphf.
 *           example: true
 *         user:
 *           type: object
 *           properties:
 *             avatar:
 *               type: object
 *               nullable: true
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 url:
 *                   type: string
 *                   example: "https://example.com/avatar.png"
 *         _count:
 *           type: object
 *           properties:
 *             Likes:
 *               type: integer
 *               example: 12
 *             Comments:
 *               type: integer
 *               example: 4
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // 1. Method Guard & Headers
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
  }

  // 2. Query Validation & Parsing
  const rawUid = req.query.uid

  if (!rawUid || Array.isArray(rawUid)) {
    return res
      .status(400)
      .json({ message: 'Invalid or missing user ID parameter.' })
  }

  let uid: string

  try {
    uid = decodeURIComponent(rawUid)
  } catch {
    return res
      .status(400)
      .json({ message: 'Invalid or missing user ID parameter.' })
  }

  // 3. Main Route Execution
  try {
    // Check if the requested user exists
    const targetUserExists = await prisma.wuphfUser.findUnique({
      where: { userName: uid },
      select: { userName: true },
    })

    if (!targetUserExists) {
      return res
        .status(404)
        .json({ message: `No WuphfUser found with username ${uid}` })
    }

    // Resolve the current viewer's username for checking userLikePost
    const session = await getServerSession(req, res, authOptions)
    let viewerUsername: string | null = null

    if (session?.user?.email) {
      const sessionUser = await prisma.wuphfUser.findUnique({
        where: { email: session.user.email },
        select: { userName: true },
      })

      viewerUsername = sessionUser?.userName ?? null
    } else if (typeof req.query.viewer === 'string') {
      viewerUsername = req.query.viewer
    }

    // Fetch the user's Wuphfs
    const rawWuphfs = await prisma.wuphf.findMany({
      where: {
        userId: uid,
      },
      include: {
        Likes: viewerUsername
          ? {
              where: {
                userId: viewerUsername,
              },
              select: {
                userId: true,
              },
            }
          : false,
        user: {
          select: {
            avatar: true,
          },
        },
        _count: {
          select: {
            Likes: true,
            Comments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Format output and determine userLikePost status
    const wuphfs = rawWuphfs.map((wuphf) => {
      const { Likes, ...restWuphf } = wuphf

      return {
        ...restWuphf,
        userLikePost: viewerUsername ? Likes.length > 0 : false,
      }
    })

    return res.status(200).json(wuphfs)
  } catch (error) {
    console.error('Error in GET /api/users/[uid]/wuphfs:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
