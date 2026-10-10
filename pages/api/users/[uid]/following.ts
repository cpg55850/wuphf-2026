import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '../../../../lib/authOptions'
import { Prisma, prisma } from '../../../../lib/prisma'

/**
 * @openapi
 * /api/users/{uid}/following:
 *   get:
 *     summary: Retrieve following list
 *     description: Fetches a list of user IDs that the specified user (or authenticated session user) is following.
 *     tags:
 *       - Follows
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: Username or URL-encoded user ID.
 *     responses:
 *       200:
 *         description: List of user IDs being followed.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                     example: "jim_halpert"
 *       404:
 *         description: Authenticated user profile not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No WuphfUser found with the email user@example.com"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *
 *   post:
 *     summary: Follow a user
 *     description: Creates a follow relationship where the authenticated session user (or user specified by email) follows the target user (`uid`).
 *     tags:
 *       - Follows
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: Username of the user to follow.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *                 description: User email (used if session is absent).
 *     responses:
 *       200:
 *         description: Successfully followed user.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Followed dwight_schrute"
 *       400:
 *         description: Invalid action (e.g., trying to follow yourself).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "You cannot follow yourself"
 *       404:
 *         description: Target user to follow does not exist.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "The WuphfUser you are trying to follow does not exist"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *
 *   delete:
 *     summary: Unfollow a user
 *     description: Removes the follow relationship between the authenticated session user and the target user (`uid`).
 *     tags:
 *       - Follows
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: Username of the user to unfollow.
 *     responses:
 *       200:
 *         description: Successfully unfollowed user.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Unfollowed dwight_schrute"
 *       404:
 *         description: Target user to unfollow does not exist.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "The WuphfUser you are trying to unfollow does not exist"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions)
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

  // GET: Retrieve following list
  if (req.method === 'GET') {
    try {
      let targetUsername = uid

      // If a session exists, resolve the logged-in user's username.
      if (session?.user?.email) {
        const wuphfUser = await prisma.wuphfUser.findUnique({
          where: { email: session.user.email },
        })

        if (!wuphfUser) {
          return res.status(404).json({
            message: `No WuphfUser found with the email ${session.user.email}`,
          })
        }

        targetUsername = wuphfUser.userName
      }

      const users = await prisma.follower.findMany({
        where: { followerId: targetUsername },
        select: { userId: true },
      })

      return res.status(200).json(users)
    } catch (error) {
      console.error('Error in GET /api/users/[uid]/following:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  // Resolve the current operating user for POST and DELETE.
  const userEmail = session?.user?.email || req.body?.email

  if (!userEmail || typeof userEmail !== 'string') {
    return res
      .status(401)
      .json({ message: 'Unauthorized: Session or valid email required.' })
  }

  let currentUser

  try {
    currentUser = await prisma.wuphfUser.findUnique({
      where: { email: userEmail },
    })
  } catch (error) {
    console.error('Error resolving user profile:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }

  if (!currentUser) {
    return res.status(404).json({
      message: `No WuphfUser found for ${userEmail}`,
    })
  }

  const currentUsername = currentUser.userName

  // POST: Follow a user
  if (req.method === 'POST') {
    if (uid === currentUsername) {
      return res.status(400).json({ message: 'You cannot follow yourself' })
    }

    try {
      const userToFollow = await prisma.wuphfUser.findUnique({
        where: { userName: uid },
      })

      if (!userToFollow) {
        return res.status(404).json({
          message: 'The WuphfUser you are trying to follow does not exist',
        })
      }

      await prisma.follower.create({
        data: {
          userId: uid,
          followerId: currentUsername,
        },
      })

      return res.status(200).send(`Followed ${uid}`)
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return res.status(200).send(`Already following ${uid}`)
      }

      console.error('Error in POST /api/users/[uid]/following:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  // DELETE: Unfollow a user
  if (req.method === 'DELETE') {
    try {
      const userToUnfollow = await prisma.wuphfUser.findUnique({
        where: { userName: uid },
      })

      if (!userToUnfollow) {
        return res.status(404).json({
          message: 'The WuphfUser you are trying to unfollow does not exist',
        })
      }

      await prisma.follower.delete({
        where: {
          userId_followerId: {
            userId: uid,
            followerId: currentUsername,
          },
        },
      })

      return res.status(200).send(`Unfollowed ${uid}`)
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return res.status(404).json({
          message: 'Follow relationship does not exist',
        })
      }

      console.error('Error in DELETE /api/users/[uid]/following:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  // Handle unsupported methods
  res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
}
