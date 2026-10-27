import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '../../../../lib/authOptions'
import { Prisma, prisma } from '../../../../lib/prisma'

/**
 * @openapi
 * /api/wuphfs/{wid}:
 *   get:
 *     summary: Retrieve a specific Wuphf by ID
 *     description: Fetches a single Wuphf post using its unique ID, including author avatar and like/comment counts.
 *     tags:
 *       - Wuphfs
 *     parameters:
 *       - in: path
 *         name: wid
 *         required: true
 *         schema:
 *           type: integer
 *         description: The unique numeric ID of the Wuphf.
 *     responses:
 *       200:
 *         description: Wuphf successfully retrieved.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WuphfSingleDetail'
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
 *         description: Wuphf not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Wuphf not found"
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
 *   patch:
 *     summary: Update an existing Wuphf
 *     description: Updates the content or picture of a Wuphf created by the authenticated user. Requires authentication.
 *     tags:
 *       - Wuphfs
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: wid
 *         required: true
 *         schema:
 *           type: integer
 *         description: The unique numeric ID of the Wuphf to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postBody
 *             properties:
 *               postBody:
 *                 type: string
 *                 example: "Updated Wuphf content!"
 *                 description: The new post content (cannot be empty or whitespace only).
 *               pictureUrl:
 *                 type: string
 *                 example: "https://example.com/updated_image.jpg"
 *                 description: Optional updated picture URL.
 *     responses:
 *       200:
 *         description: Wuphf update outcome (returns Prisma BatchPayload count object).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: Invalid input (e.g. empty post body).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post cannot contain only white space."
 *       401:
 *         description: Unauthorized session.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized: You must be logged in."
 *       404:
 *         description: The Wuphf to update was not found or not owned by user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "The Wuphf to update was not found"
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
 *     summary: Delete a Wuphf
 *     description: Permanently deletes a Wuphf post by its unique ID. Requires authentication and post ownership.
 *     tags:
 *       - Wuphfs
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: wid
 *         required: true
 *         schema:
 *           type: integer
 *         description: The unique numeric ID of the Wuphf to delete.
 *     responses:
 *       200:
 *         description: Wuphf deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Wuphf'
 *       401:
 *         description: Unauthorized session.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized: You must be logged in."
 *       403:
 *         description: Forbidden action on another user's Wuphf.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Forbidden: You can only delete your own Wuphfs."
 *       404:
 *         description: The Wuphf to delete was not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "The Wuphf to delete was not found"
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
 *     WuphfSingleDetail:
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
 *           example: "2026-10-08T04:48:20.000Z"
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
  // 1. Parameter validation
  const { wid } = req.query

  if (typeof wid !== 'string' || !wid.trim() || !/^\d+$/.test(wid)) {
    return res.status(400).json({
      message: "Parameter 'wid' must be a valid integer.",
    })
  }

  const wuphfId = Number(wid)

  if (!Number.isSafeInteger(wuphfId)) {
    return res.status(400).json({
      message: "Parameter 'wid' must be a valid integer.",
    })
  }

  // 2. GET: Retrieve a specific Wuphf by ID
  if (req.method === 'GET') {
    try {
      const wuphf = await prisma.wuphf.findUnique({
        where: { id: wuphfId },
        include: {
          _count: {
            select: {
              Likes: true,
              Comments: true,
            },
          },
          user: {
            select: {
              avatar: true,
            },
          },
        },
      })

      if (!wuphf) {
        return res.status(404).json({ message: 'Wuphf not found' })
      }

      // Check whether the logged-in user liked this Wuphf.
      const session = await getServerSession(req, res, authOptions)
      const userEmail = session?.user?.email

      let userLikePost = false

      if (userEmail) {
        const currentUser = await prisma.wuphfUser.findUnique({
          where: { email: userEmail },
          select: { userName: true },
        })

        if (currentUser) {
          const existingLike = await prisma.likes.findFirst({
            where: {
              userId: currentUser.userName,
              wuphfId,
            },
            select: { userId: true },
          })

          userLikePost = Boolean(existingLike)
        }
      }

      return res.status(200).json({
        ...wuphf,
        userLikePost,
      })
    } catch (error) {
      console.error('Error in GET /api/wuphfs/[wid]:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  // 3. Authorization for PATCH and DELETE
  if (req.method !== 'PATCH' && req.method !== 'DELETE') {
    res.setHeader('Allow', ['GET', 'PATCH', 'DELETE'])
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
  }

  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.email) {
    return res
      .status(401)
      .json({ message: 'Unauthorized: You must be logged in.' })
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

  // 4. PATCH: Update an existing Wuphf
  if (req.method === 'PATCH') {
    const { postBody, pictureUrl } = req.body ?? {}

    if (typeof postBody !== 'string' || !postBody.trim()) {
      return res.status(400).json({
        message: 'Post cannot contain only white space.',
      })
    }

    if (
      pictureUrl !== undefined &&
      pictureUrl !== null &&
      typeof pictureUrl !== 'string'
    ) {
      return res.status(400).json({
        message: 'pictureUrl must be a string or null.',
      })
    }

    try {
      const result = await prisma.wuphf.updateMany({
        where: {
          id: wuphfId,
          userId: sessionUser.userName,
        },
        data: {
          postBody: postBody.trim(),
          pictureUrl: pictureUrl || undefined,
        },
      })

      if (result.count === 0) {
        return res
          .status(404)
          .json({ message: 'The Wuphf to update was not found' })
      }

      return res.status(200).json(result)
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return res
          .status(404)
          .json({ message: 'The Wuphf to update was not found' })
      }

      console.error('Error in PATCH /api/wuphfs/[wid]:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  // 5. DELETE: Delete a Wuphf
  try {
    const targetWuphf = await prisma.wuphf.findUnique({
      where: { id: wuphfId },
    })

    if (!targetWuphf) {
      return res
        .status(404)
        .json({ message: 'The Wuphf to delete was not found' })
    }

    if (targetWuphf.userId !== sessionUser.userName) {
      return res.status(403).json({
        message: 'Forbidden: You can only delete your own Wuphfs.',
      })
    }

    const deletedWuphf = await prisma.wuphf.delete({
      where: { id: wuphfId },
    })

    return res.status(200).json(deletedWuphf)
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return res
        .status(404)
        .json({ message: 'The Wuphf to delete was not found' })
    }

    console.error('Error in DELETE /api/wuphfs/[wid]:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
