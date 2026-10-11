import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '../../../../../lib/authOptions'
import { Prisma, prisma } from '../../../../../lib/prisma'

/**
 * @openapi
 * /api/wuphfs/{wid}/comments:
 *   get:
 *     summary: Retrieve comments for a Wuphf
 *     description: Fetches all comments associated with a specific Wuphf post ID, including the commenter's avatar URL.
 *     tags:
 *       - Comments
 *     parameters:
 *       - in: path
 *         name: wid
 *         required: true
 *         schema:
 *           type: integer
 *         description: The unique numeric ID of the Wuphf.
 *     responses:
 *       200:
 *         description: List of comments successfully retrieved.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
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
 *         description: Target Wuphf post not found.
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
 *     summary: Add a comment to a Wuphf
 *     description: Creates a new comment on a specific Wuphf. Uses the session user's username if authenticated; otherwise falls back to `userId` provided in the request body.
 *     tags:
 *       - Comments
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: wid
 *         required: true
 *         schema:
 *           type: integer
 *         description: The unique numeric ID of the Wuphf to comment on.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - commentBody
 *             properties:
 *               commentBody:
 *                 type: string
 *                 example: "Great Wuphf!"
 *                 description: Text content of the comment (cannot be empty or whitespace only).
 *               userId:
 *                 type: string
 *                 example: "guest_user"
 *                 description: Author username (required only if no session cookie is present).
 *     responses:
 *       201:
 *         description: Comment created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Invalid input or missing user/comment data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment body cannot be empty or contain only whitespace."
 *       401:
 *         description: Unauthorized session or missing user identification.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized: User identification required to comment."
 *       404:
 *         description: Target Wuphf post or commenting user not found.
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
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         postsId:
 *           type: integer
 *           example: 101
 *         userId:
 *           type: string
 *           example: "jim_halpert"
 *         commentBody:
 *           type: string
 *           example: "Great Wuphf!"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-10-08T04:50:00.000Z"
 *         user:
 *           type: object
 *           properties:
 *             avatar:
 *               type: object
 *               nullable: true
 *               properties:
 *                 url:
 *                   type: string
 *                   example: "https://example.com/avatar.png"
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // 1. Validate the Wuphf ID.
  const { wid } = req.query

  if (typeof wid !== 'string' || !/^\d+$/.test(wid)) {
    return res.status(400).json({
      message: 'Parameter \'wid\' must be a valid integer.',
    })
  }

  const postsId = Number(wid)

  if (!Number.isSafeInteger(postsId) || postsId <= 0) {
    return res.status(400).json({
      message: 'Parameter \'wid\' must be a valid integer.',
    })
  }

  // 2. GET: Retrieve comments for a Wuphf.
  if (req.method === 'GET') {
    try {
      const existingWuphf = await prisma.wuphf.findUnique({
        where: { id: postsId },
        select: { id: true },
      })

      if (!existingWuphf) {
        return res.status(404).json({
          message: 'Wuphf post not found',
        })
      }

      const comments = await prisma.comments.findMany({
        where: { postsId },
        include: {
          user: {
            select: {
              avatar: {
                select: {
                  url: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      })

      return res.status(200).json(comments)
    } catch (error) {
      console.error('Error in GET /api/wuphfs/[wid]/comments:', error)

      return res.status(500).json({
        message: 'Internal server error',
      })
    }
  }

  // Reject unsupported methods before doing database work.
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST'])

    return res.status(405).json({
      message: `Method ${req.method} Not Allowed`,
    })
  }

  // 3. POST: Validate the comment body.
  const body: unknown = req.body
  const payload =
    body !== null && typeof body === 'object'
      ? (body as Record<string, unknown>)
      : {}

  const { commentBody, userId: fallbackUserId } = payload

  if (typeof commentBody !== 'string' || !commentBody.trim()) {
    return res.status(400).json({
      message: 'Comment body cannot be empty or contain only whitespace.',
    })
  }

  // 4. Resolve the author.
  const session = await getServerSession(req, res, authOptions)
  let authorUserId: string | null = null

  try {
    if (session?.user?.email) {
      const wuphfUser = await prisma.wuphfUser.findUnique({
        where: { email: session.user.email },
        select: { userName: true },
      })

      if (!wuphfUser) {
        return res.status(404).json({
          message: `No WuphfUser found for session email ${session.user.email}`,
        })
      }

      authorUserId = wuphfUser.userName
    } else if (typeof fallbackUserId === 'string' && fallbackUserId.trim()) {
      authorUserId = fallbackUserId.trim()
    }

    if (!authorUserId) {
      return res.status(401).json({
        message: 'Unauthorized: User identification required to comment.',
      })
    }

    // 5. Verify the target Wuphf exists.
    const targetWuphf = await prisma.wuphf.findUnique({
      where: { id: postsId },
      select: { id: true },
    })

    if (!targetWuphf) {
      return res.status(404).json({
        message: 'Wuphf post not found',
      })
    }

    // 6. Create the comment.
    const comment = await prisma.comments.create({
      data: {
        postsId,
        commentBody: commentBody.trim(),
        userId: authorUserId,
      },
      include: {
        user: {
          select: {
            avatar: {
              select: {
                url: true,
              },
            },
          },
        },
      },
    })

    return res.status(201).json(comment)
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2003'
    ) {
      return res.status(404).json({
        message: 'Referenced Wuphf post or user does not exist.',
      })
    }

    console.error('Error in POST /api/wuphfs/[wid]/comments:', error)

    return res.status(500).json({
      message: 'Internal server error',
    })
  }
}
