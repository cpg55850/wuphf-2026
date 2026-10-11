import type { NextApiRequest, NextApiResponse } from 'next'

import { prisma } from '../../lib/prisma'

/**
 * @openapi
 * /api/search:
 *   get:
 *     summary: Search users by username
 *     description: Performs a case-insensitive substring search across Wuphf usernames.
 *     parameters:
 *       - in: query
 *         name: userName
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query string to match against usernames.
 *     responses:
 *       200:
 *         description: List of matching users with their avatar URLs.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userName:
 *                     type: string
 *                     example: "ryan_howard"
 *                   avatar:
 *                     type: object
 *                     nullable: true
 *                     properties:
 *                       url:
 *                         type: string
 *                         example: "https://example.com/avatar.png"
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
  // 1. Method check
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])

    return res.status(405).json({
      message: `Method ${req.method} Not Allowed`,
    })
  }

  // 2. Input validation and sanitization
  const rawQuery = req.query.userName

  if (typeof rawQuery !== 'string' || !rawQuery.trim()) {
    return res.status(400).json({
      message: 'Query parameter \'userName\' must be a non-empty string.',
    })
  }

  const searchQuery = rawQuery.trim()

  // 3. Query database
  try {
    const users = await prisma.wuphfUser.findMany({
      where: {
        userName: {
          contains: searchQuery,
          mode: 'insensitive',
        },
      },
      select: {
        userName: true,
        avatar: {
          select: {
            url: true,
          },
        },
      },
    })

    return res.status(200).json(users)
  } catch (error) {
    console.error('Error in GET /api/search:', error)

    return res.status(500).json({
      message: 'Internal server error',
    })
  }
}
