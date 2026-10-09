import { Prisma, prisma } from "../../../lib/prisma";

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
export default async function handler(req, res) {
  // ---------------------------------------------------------------------------
  // GET: Retrieve all users
  // ---------------------------------------------------------------------------
  if (req.method === "GET") {
    try {
      const users = await prisma.wuphfUser.findMany();
      return res.status(200).json(users);
    } catch (error) {
      console.error("Error in GET /api/users:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // ---------------------------------------------------------------------------
  // POST: Create a new user profile
  // ---------------------------------------------------------------------------
  if (req.method === "POST") {
    const { email, userName, bio, avatarId } = req.body || {};

    // Input Validation
    if (
      !email ||
      typeof email !== "string" ||
      !userName ||
      typeof userName !== "string" ||
      !userName.trim()
    ) {
      return res.status(400).json({
        message: "Valid 'email' and non-empty 'userName' are required.",
      });
    }

    try {
      const parsedAvatarId =
        avatarId !== undefined && avatarId !== null ? Number(avatarId) : NaN;

      const user = await prisma.wuphfUser.create({
        data: {
          email: email.trim(),
          userName: userName.trim(),
          bio: bio || undefined,
          avatarId: !isNaN(parsedAvatarId) ? parsedAvatarId : undefined,
        },
      });

      return res.status(201).json(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return res.status(409).json({
            message: "A user with that username or email already exists.",
          });
        }
        if (error.code === "P2003") {
          return res.status(409).json({
            message: "Invalid avatarId or foreign key constraint failed.",
          });
        }
      }

      console.error("Error in POST /api/users:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Handle unsupported methods
  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
}
