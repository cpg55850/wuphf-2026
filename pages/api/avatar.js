import { prisma } from "../../lib/prisma";

/**
 * @openapi
 * /api/avatars:
 *   get:
 *     summary: Get all available avatars
 *     description: Retrieves a list of all preset or existing avatar objects stored in the database.
 *     tags:
 *       - Avatars
 *     responses:
 *       200:
 *         description: List of avatars successfully retrieved.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Avatar'
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
 *     Avatar:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         url:
 *           type: string
 *           example: "https://example.com/avatars/avatar1.png"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-10-08T04:42:45.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-10-08T04:42:45.000Z"
 */
export default async function handler(req, res) {
  // ---------------------------------------------------------------------------
  // 1. Method Guard & Headers
  // ---------------------------------------------------------------------------
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res
      .status(405)
      .json({ message: `Method ${req.method} Not Allowed` });
  }

  // ---------------------------------------------------------------------------
  // 2. GET: Retrieve all avatars
  // ---------------------------------------------------------------------------
  try {
    const avatars = await prisma.avatar.findMany();
    return res.status(200).json(avatars);
  } catch (error) {
    console.error("Error in GET /api/avatars:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
