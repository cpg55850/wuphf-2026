import { getServerSession } from 'next-auth/next'

import { authOptions } from '../../../../lib/authOptions'
import { Prisma, prisma } from '../../../../lib/prisma'

/**
 * @openapi
 * /api/wuphfs/{wid}/likes:
 *   get:
 *     summary: Retrieve likes for a Wuphf
 *     description: Fetches all like records associated with a specific Wuphf post ID.
 *     tags:
 *       - Likes
 *     parameters:
 *       - in: path
 *         name: wid
 *         required: true
 *         schema:
 *           type: integer
 *         description: The unique numeric ID of the Wuphf.
 *     responses:
 *       200:
 *         description: List of likes successfully retrieved.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Like'
 *       400:
 *         description: Invalid Wuphf ID parameter.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Parameter 'wid' must be a valid integer."
 *       404:
 *         description: Wuphf post not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Wuphf post not found"
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
 *   post:
 *     summary: Like a Wuphf
 *     description: Creates a new like record on the specified Wuphf for the current authenticated user.
 *     tags:
 *       - Likes
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: wid
 *         required: true
 *         schema:
 *           type: integer
 *         description: The unique numeric ID of the Wuphf to like.
 *     responses:
 *       201:
 *         description: Wuphf successfully liked.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Like'
 *       400:
 *         description: Invalid parameters or post already liked.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "You have already liked this Wuphf."
 *       401:
 *         description: Unauthorized - missing or invalid session.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized: Active session required."
 *       404:
 *         description: Target Wuphf post or user profile not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Wuphf post not found"
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
 *   delete:
 *     summary: Unlike a Wuphf
 *     description: Removes the authenticated user's like from the specified Wuphf using the compound key (`userId_wuphfId`).
 *     tags:
 *       - Likes
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: wid
 *         required: true
 *         schema:
 *           type: integer
 *         description: The unique numeric ID of the Wuphf to unlike.
 *     responses:
 *       200:
 *         description: Wuphf successfully unliked.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Like'
 *       401:
 *         description: Unauthorized - missing or invalid session.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized: Active session required."
 *       404:
 *         description: Like record or Wuphf post not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Like relationship does not exist."
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
 *     Like:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           example: "michael_scott"
 *         wuphfId:
 *           type: integer
 *           example: 101
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-10-08T04:49:25.000Z"
 */
export default async function handler(req, res) {
  // ---------------------------------------------------------------------------
  // 1. Parameter Validation
  // ---------------------------------------------------------------------------
  const { wid } = req.query
  const wuphfId = Number(wid)

  if (!wid || isNaN(wuphfId)) {
    return res.status(400).json({
      message: 'Parameter \'wid\' must be a valid integer.',
    })
  }

  // ---------------------------------------------------------------------------
  // 2. GET: Retrieve likes for a Wuphf
  // ---------------------------------------------------------------------------
  if (req.method === 'GET') {
    try {
      // Check if target Wuphf post exists
      const existingWuphf = await prisma.wuphf.findUnique({
        where: { id: wuphfId },
        select: { id: true },
      })

      if (!existingWuphf) {
        return res.status(404).json({ message: 'Wuphf post not found' })
      }

      const likes = await prisma.likes.findMany({
        where: {
          wuphfId: wuphfId,
        },
      })

      return res.status(200).json(likes)
    } catch (error) {
      console.error('Error in GET /api/wuphfs/[wid]/likes:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Authorization Guard for Mutating Operations (POST & DELETE)
  // ---------------------------------------------------------------------------
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.email) {
    return res
      .status(401)
      .json({ message: 'Unauthorized: Active session required.' })
  }

  let sessionUser
  try {
    sessionUser = await prisma.wuphfUser.findUnique({
      where: { email: session.user.email },
    })
  } catch (error) {
    console.error('Error fetching session user:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }

  if (!sessionUser) {
    return res.status(404).json({ message: 'Session user profile not found.' })
  }

  // ---------------------------------------------------------------------------
  // 4. POST: Like a Wuphf
  // ---------------------------------------------------------------------------
  if (req.method === 'POST') {
    try {
      // Check if target Wuphf exists (#error check)
      const targetWuphf = await prisma.wuphf.findUnique({
        where: { id: wuphfId },
        select: { id: true },
      })

      if (!targetWuphf) {
        return res.status(404).json({ message: 'Wuphf post not found' })
      }

      const like = await prisma.likes.create({
        data: {
          userId: sessionUser.userName,
          wuphfId: wuphfId,
        },
      })

      return res.status(201).json(like)
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return res
          .status(400)
          .json({ message: 'You have already liked this Wuphf.' })
      }

      console.error('Error in POST /api/wuphfs/[wid]/likes:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  // ---------------------------------------------------------------------------
  // 5. DELETE: Unlike a Wuphf
  // ---------------------------------------------------------------------------
  if (req.method === 'DELETE') {
    try {
      const like = await prisma.likes.delete({
        where: {
          userId_wuphfId: {
            userId: sessionUser.userName,
            wuphfId: wuphfId,
          },
        },
      })

      return res.status(200).json(like)
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return res
          .status(404)
          .json({ message: 'Like relationship does not exist.' })
      }

      console.error('Error in DELETE /api/wuphfs/[wid]/likes:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  // Handle unsupported HTTP methods
  res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
}
