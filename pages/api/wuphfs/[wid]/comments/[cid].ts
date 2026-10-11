import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '../../../../../lib/authOptions'
import { Prisma, prisma } from '../../../../../lib/prisma'

/**
 * @openapi
 * /api/wuphfs/{wid}/comments/{cid}:
 *   get:
 *     summary: Retrieve a specific comment by ID
 *     description: Fetches a single comment associated with a Wuphf post ID and comment ID, including author avatar.
 *     tags:
 *       - Comments
 *     parameters:
 *       - in: path
 *         name: wid
 *         required: true
 *         schema:
 *           type: integer
 *         description: The unique numeric ID of the Wuphf post.
 *       - in: path
 *         name: cid
 *         required: true
 *         schema:
 *           type: integer
 *         description: The unique numeric ID of the comment.
 *     responses:
 *       200:
 *         description: Comment successfully retrieved.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Invalid parameter types provided.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Parameters 'wid' and 'cid' must be valid integers."
 *       404:
 *         description: Comment not found for the given post.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment not found"
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
 *     summary: Update a comment
 *     description: Updates the body text of a specific comment. Requires authentication and comment ownership.
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
 *         description: The unique numeric ID of the Wuphf post.
 *       - in: path
 *         name: cid
 *         required: true
 *         schema:
 *           type: integer
 *         description: The unique numeric ID of the comment to update.
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
 *                 example: "Updated comment text!"
 *                 description: New content for the comment body.
 *     responses:
 *       200:
 *         description: Comment successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Missing or invalid comment body payload.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Field 'commentBody' must be a non-empty string."
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
 *         description: Forbidden action on another user's comment.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Forbidden: You can only edit or delete your own comments."
 *       404:
 *         description: Target comment not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment not found"
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
 *     summary: Delete a comment
 *     description: Permanently deletes a comment by its unique ID. Requires authentication and comment ownership.
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
 *         description: The unique numeric ID of the Wuphf post.
 *       - in: path
 *         name: cid
 *         required: true
 *         schema:
 *           type: integer
 *         description: The unique numeric ID of the comment to delete.
 *     responses:
 *       200:
 *         description: Comment successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
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
 *         description: Forbidden action on another user's comment.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Forbidden: You can only edit or delete your own comments."
 *       404:
 *         description: Target comment not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment not found"
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
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // 1. Validate route parameters.
  const { wid, cid } = req.query

  if (
    typeof wid !== 'string' ||
    typeof cid !== 'string' ||
    !/^\d+$/.test(wid) ||
    !/^\d+$/.test(cid)
  ) {
    return res.status(400).json({
      message: 'Parameters \'wid\' and \'cid\' must be valid integers.',
    })
  }

  const postsId = Number(wid)
  const commentId = Number(cid)

  if (
    !Number.isSafeInteger(postsId) ||
    !Number.isSafeInteger(commentId) ||
    postsId <= 0 ||
    commentId <= 0
  ) {
    return res.status(400).json({
      message: 'Parameters \'wid\' and \'cid\' must be valid integers.',
    })
  }

  // 2. GET: Retrieve a specific comment.
  if (req.method === 'GET') {
    try {
      const comment = await prisma.comments.findFirst({
        where: {
          id: commentId,
          postsId,
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

      if (!comment) {
        return res.status(404).json({
          message: 'Comment not found',
        })
      }

      return res.status(200).json(comment)
    } catch (error) {
      console.error('Error in GET /api/wuphfs/[wid]/comments/[cid]:', error)

      return res.status(500).json({
        message: 'Internal server error',
      })
    }
  }

  // Reject unsupported methods before performing authentication or DB work.
  if (req.method !== 'PATCH' && req.method !== 'DELETE') {
    res.setHeader('Allow', ['GET', 'PATCH', 'DELETE'])

    return res.status(405).json({
      message: `Method ${req.method} Not Allowed`,
    })
  }

  // 3. Authenticate mutation requests.
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.email) {
    return res.status(401).json({
      message: 'Unauthorized: You must be logged in.',
    })
  }

  let sessionUser

  try {
    sessionUser = await prisma.wuphfUser.findUnique({
      where: {
        email: session.user.email,
      },
    })
  } catch (error) {
    console.error('Error fetching session user:', error)

    return res.status(500).json({
      message: 'Internal server error',
    })
  }

  if (!sessionUser) {
    return res.status(404).json({
      message: 'Session user profile not found.',
    })
  }

  // 4. Find the comment and verify ownership.
  let existingComment

  try {
    existingComment = await prisma.comments.findFirst({
      where: {
        id: commentId,
        postsId,
      },
    })
  } catch (error) {
    console.error('Error fetching target comment:', error)

    return res.status(500).json({
      message: 'Internal server error',
    })
  }

  if (!existingComment) {
    return res.status(404).json({
      message: 'Comment not found',
    })
  }

  if (existingComment.userId !== sessionUser.userName) {
    return res.status(403).json({
      message: 'Forbidden: You can only edit or delete your own comments.',
    })
  }

  // 5. PATCH: Update comment body.
  if (req.method === 'PATCH') {
    const commentBody: unknown = req.body?.commentBody

    if (typeof commentBody !== 'string' || !commentBody.trim()) {
      return res.status(400).json({
        message: 'Field \'commentBody\' must be a non-empty string.',
      })
    }

    try {
      const updatedComment = await prisma.comments.update({
        where: {
          id: commentId,
        },
        data: {
          commentBody: commentBody.trim(),
        },
      })

      return res.status(200).json(updatedComment)
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return res.status(404).json({
          message: 'Comment not found',
        })
      }

      console.error('Error in PATCH /api/wuphfs/[wid]/comments/[cid]:', error)

      return res.status(500).json({
        message: 'Internal server error',
      })
    }
  }

  // 6. DELETE: Delete the comment.
  try {
    const deletedComment = await prisma.comments.delete({
      where: {
        id: commentId,
      },
    })

    return res.status(200).json(deletedComment)
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return res.status(404).json({
        message: 'Comment not found',
      })
    }

    console.error('Error in DELETE /api/wuphfs/[wid]/comments/[cid]:', error)

    return res.status(500).json({
      message: 'Internal server error',
    })
  }
}
