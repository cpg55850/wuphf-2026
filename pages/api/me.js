import { getServerSession } from 'next-auth/next'

import { authOptions } from '../../lib/authOptions'
import { Prisma, prisma } from '../../lib/prisma'

/**
 * @openapi
 * /api/me:
 *   get:
 *     summary: Get current authenticated user profile
 *     description: Retrieves the current user's profile details including followers, following lists, avatar, and counts using their session email.
 *     tags:
 *       - Profile
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile successfully retrieved.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WuphfUserProfile'
 *       401:
 *         description: User not authenticated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized: Active session required."
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
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 *
 *   delete:
 *     summary: Delete current user account
 *     description: Permanently deletes the account associated with the current authenticated user's session email.
 *     tags:
 *       - Profile
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User account deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "usr_123456"
 *                 email:
 *                   type: string
 *                   example: "user@example.com"
 *       401:
 *         description: User not authenticated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized: Active session required."
 *       404:
 *         description: Target user to delete not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Target user not found"
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
 *     WuphfUserProfile:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           example: "cpg55850@ucmo.edu"
 *         userName:
 *           type: string
 *           example: "wuphf_fan"
 *         bio:
 *           type: string
 *           nullable: true
 *           example: "Washington, D.C."
 *         avatar:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: integer
 *               example: 1
 *             url:
 *               type: string
 *               example: "https://example.com/avatar.png"
 *         Followers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "follower_username"
 *         Following:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "following_username"
 *         _count:
 *           type: object
 *           properties:
 *             Followers:
 *               type: integer
 *               example: 15
 *             Following:
 *               type: integer
 *               example: 30
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: next-auth.session-token
 */
export default async function handler(req, res) {
  // ---------------------------------------------------------------------------
  // 1. Authentication Check
  // ---------------------------------------------------------------------------
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.email) {
    return res
      .status(401)
      .json({ message: 'Unauthorized: Active session required.' })
  }

  const userEmail = session.user.email

  // ---------------------------------------------------------------------------
  // 2. GET: Get current authenticated user profile
  // ---------------------------------------------------------------------------
  if (req.method === 'GET') {
    try {
      const user = await prisma.wuphfUser.findUnique({
        where: {
          email: userEmail,
        },
        include: {
          Followers: true,
          Following: true,
          avatar: true,
          _count: {
            select: {
              Followers: true,
              Following: true,
            },
          },
        },
      })

      // Handle missing user profile record (#error tag fix)
      if (!user) {
        return res.status(404).json({
          message: `No WuphfUser found with the email ${userEmail}`,
        })
      }

      return res.status(200).json(user)
    } catch (error) {
      console.error('Error in GET /api/me:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  // ---------------------------------------------------------------------------
  // 3. DELETE: Delete current user account
  // ---------------------------------------------------------------------------
  if (req.method === 'DELETE') {
    try {
      const user = await prisma.user.delete({
        where: {
          email: userEmail,
        },
      })

      return res.status(200).json(user)
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return res.status(404).json({ message: 'Target user not found' })
      }

      console.error('Error in DELETE /api/me:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  // Handle unsupported methods
  res.setHeader('Allow', ['GET', 'DELETE'])
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` })
}
