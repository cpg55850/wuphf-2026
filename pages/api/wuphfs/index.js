import { object, string } from "yup";
import { getSession } from "next-auth/react";
import { prisma } from "../../../lib/prisma";

/**
 * @openapi
 * /api/wuphfs:
 *   get:
 *     summary: Retrieve all Wuphfs
 *     description: Fetches a list of all Wuphfs (posts) ordered by creation date descending, including like and comment counts.
 *     tags:
 *       - Wuphfs
 *     responses:
 *       200:
 *         description: List of Wuphfs successfully retrieved.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Wuphf'
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
 *     summary: Create a new Wuphf
 *     description: Creates a new post (Wuphf) linked to an authenticated user (or provided username fallback), with optional picture URL and required body text. Validated using Yup.
 *     tags:
 *       - Wuphfs
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postBody
 *             properties:
 *               userName:
 *                 type: string
 *                 example: "michael_scott"
 *                 description: The username of the author posting the Wuphf (used if session is absent).
 *               pictureUrl:
 *                 type: string
 *                 example: "https://example.com/image.jpg"
 *                 description: Optional image attachment URL.
 *               postBody:
 *                 type: string
 *                 example: "WUPHF! It's time for a paper convention!"
 *                 description: The text content of the post.
 *     responses:
 *       201:
 *         description: Wuphf successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WuphfDetail'
 *       400:
 *         description: Validation error due to missing or invalid fields.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: "ValidationError"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized - missing session or valid username.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized: User identification required to create a Wuphf."
 *       404:
 *         description: Author user profile not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No WuphfUser found for the specified author."
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
 *     Wuphf:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 10
 *         userId:
 *           type: string
 *           example: "michael_scott"
 *         pictureUrl:
 *           type: string
 *           nullable: true
 *           example: "https://example.com/image.jpg"
 *         postBody:
 *           type: string
 *           example: "WUPHF! It's time for a paper convention!"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-10-08T04:48:20.000Z"
 *         _count:
 *           type: object
 *           properties:
 *             Likes:
 *               type: integer
 *               example: 5
 *             Comments:
 *               type: integer
 *               example: 2
 *
 *     WuphfDetail:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 10
 *         userId:
 *           type: string
 *           example: "michael_scott"
 *         pictureUrl:
 *           type: string
 *           nullable: true
 *           example: "https://example.com/image.jpg"
 *         postBody:
 *           type: string
 *           example: "WUPHF! It's time for a paper convention!"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-10-08T04:48:20.000Z"
 *         user:
 *           type: object
 *           properties:
 *             userName:
 *               type: string
 *               example: "michael_scott"
 *             avatar:
 *               type: object
 *               nullable: true
 *               properties:
 *                 url:
 *                   type: string
 *                   example: "https://example.com/avatar.png"
 *         _count:
 *           type: object
 *           properties:
 *             Likes:
 *               type: integer
 *               example: 0
 *             Comments:
 *               type: integer
 *               example: 0
 */

// Yup Validation Schema
const wuphfSchema = object({
  userName: string().nullable(),
  pictureUrl: string().nullable().url("Picture URL must be a valid URL"),
  postBody: string()
    .required("Post body is required.")
    .trim("Post body cannot be empty or white space.")
    .min(1, "Post body cannot be empty."),
});

export default async function handler(req, res) {
  // ---------------------------------------------------------------------------
  // 1. GET: Retrieve all Wuphfs
  // ---------------------------------------------------------------------------
  if (req.method === "GET") {
    try {
      const wuphfs = await prisma.wuphf.findMany({
        orderBy: {
          createdAt: "desc",
        },
        include: {
          _count: {
            select: {
              Likes: true,
              Comments: true,
            },
          },
        },
      });

      return res.status(200).json(wuphfs);
    } catch (error) {
      console.error("Error in GET /api/wuphfs:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // ---------------------------------------------------------------------------
  // 2. POST: Create a new Wuphf
  // ---------------------------------------------------------------------------
  if (req.method === "POST") {
    // Validate request body using Yup schema
    try {
      await wuphfSchema.validate(req.body, { abortEarly: false });
    } catch (error) {
      return res.status(400).json({
        name: error.name,
        errors: error.errors,
      });
    }

    // Resolve Author Identity (Session with body fallback)
    const session = await getSession({ req });
    let authorUsername = null;

    try {
      if (session?.user?.email) {
        const sessionUser = await prisma.wuphfUser.findUnique({
          where: { email: session.user.email },
          select: { userName: true },
        });

        authorUsername = sessionUser?.userName || null;
      } else if (req.body.userName && typeof req.body.userName === "string") {
        authorUsername = req.body.userName.trim();
      }

      if (!authorUsername) {
        return res.status(401).json({
          message:
            "Unauthorized: User identification required to create a Wuphf.",
        });
      }

      // Verify Author Exists in Database
      const targetUser = await prisma.wuphfUser.findUnique({
        where: { userName: authorUsername },
        select: { userName: true },
      });

      if (!targetUser) {
        return res.status(404).json({
          message: `No WuphfUser found for username '${authorUsername}'`,
        });
      }

      // Create Wuphf
      const pictureUrlValue = req.body.pictureUrl
        ? req.body.pictureUrl.trim()
        : null;

      const wuphf = await prisma.wuphf.create({
        data: {
          userId: authorUsername,
          pictureUrl: pictureUrlValue,
          postBody: req.body.postBody.trim(),
        },
        select: {
          id: true,
          userId: true,
          pictureUrl: true,
          postBody: true,
          createdAt: true,
          user: {
            select: {
              userName: true,
              avatar: {
                select: {
                  url: true,
                },
              },
            },
          },
          _count: {
            select: {
              Likes: true,
              Comments: true,
            },
          },
        },
      });

      return res.status(201).json(wuphf);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        return res.status(404).json({
          message: "The author user record does not exist.",
        });
      }

      console.error("Error in POST /api/wuphfs:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Handle unsupported HTTP methods
  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
}
