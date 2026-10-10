import type { NextApiRequest, NextApiResponse } from 'next'
import * as yup from 'yup'

import { Prisma, prisma } from '../../../lib/prisma'

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Retrieve all users
 *     description: Fetches a list of all WuphfUser records in the database.
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: List of all WuphfUsers successfully retrieved.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WuphfUser'
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
 *     summary: Create a new user profile
 *     description: Creates a new WuphfUser associated with an email, unique username, optional bio, and optional avatar ID.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - userName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "michael@dundermifflin.com"
 *                 description: Unique email address of the user.
 *               userName:
 *                 type: string
 *                 example: "michael_scott"
 *                 description: Unique username (will be trimmed).
 *               bio:
 *                 type: string
 *                 example: "World's Best Boss."
 *                 description: Optional short bio.
 *               avatarId:
 *                 type: integer
 *                 example: 1
 *                 description: Optional numeric ID of the selected avatar.
 *     responses:
 *       201:
 *         description: WuphfUser successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WuphfUser'
 *       400:
 *         description: Missing required fields or invalid input.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Fields 'email' and 'userName' are required."
 *       409:
 *         description: Conflict - Duplicate username/email or foreign key constraint failure.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "A user with that username or email already exists."
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
 *     WuphfUser:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "michael@dundermifflin.com"
 *         userName:
 *           type: string
 *           example: "michael_scott"
 *         bio:
 *           type: string
 *           nullable: true
 *           example: "World's Best Boss."
 *         theme:
 *           type: string
 *           nullable: true
 *           example: "light"
 *         avatarId:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-10-08T04:51:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-10-08T04:51:00.000Z"
 */

// Yup validation schema for user creation.
const createUserSchema = yup.object({
  email: yup
    .string()
    .trim()
    .email('Invalid email address format.')
    .required('Email is required.'),
  userName: yup
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters.')
    .max(30, 'Username cannot exceed 30 characters.')
    .matches(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens.',
    )
    .required('Username is required.'),
  bio: yup.string().trim().nullable().optional(),
  avatarId: yup
    .number()
    .integer('Avatar ID must be an integer.')
    .nullable()
    .optional(),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // GET: Retrieve all users.
  if (req.method === 'GET') {
    try {
      const users = await prisma.wuphfUser.findMany()
      return res.status(200).json(users)
    } catch (error) {
      console.error('Error in GET /api/users:', error)
      return res.status(500).json({
        message: 'Internal server error',
      })
    }
  }

  // POST: Create a new user profile.
  if (req.method === 'POST') {
    try {
      const validatedData = await createUserSchema.validate(req.body, {
        abortEarly: true,
        stripUnknown: true,
      })

      const user = await prisma.wuphfUser.create({
        data: {
          email: validatedData.email,
          userName: validatedData.userName,
          bio: validatedData.bio || undefined,
          avatarId: validatedData.avatarId ?? undefined,
        },
      })

      return res.status(201).json(user)
    } catch (error) {
      // Handle Yup validation errors.
      if (error instanceof yup.ValidationError) {
        return res.status(400).json({
          message: error.message,
        })
      }

      // Handle Prisma errors.
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return res.status(409).json({
            message: 'A user with that username or email already exists.',
          })
        }

        if (error.code === 'P2003') {
          return res.status(409).json({
            message: 'Invalid avatarId or foreign key constraint failed.',
          })
        }
      }

      console.error('Error in POST /api/users:', error)
      return res.status(500).json({
        message: 'Internal server error',
      })
    }
  }

  // Handle unsupported methods.
  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({
    message: `Method ${req.method} Not Allowed`,
  })
}
