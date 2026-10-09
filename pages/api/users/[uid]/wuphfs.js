import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/authOptions";

import { prisma } from "../../../../lib/prisma";

// Yup schema for validating path parameters
const paramsSchema = yup.string().required("User ID parameter is required.");

// Yup schema for updating profile fields via PATCH
const updateUserSchema = yup.object({
  userName: yup
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(30, "Username cannot exceed 30 characters.")
    .matches(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens.",
    )
    .optional(),
  bio: yup.string().trim().nullable().optional(),
  theme: yup.string().trim().nullable().optional(),
  avatarId: yup
    .number()
    .integer("Avatar ID must be an integer.")
    .nullable()
    .optional(),
});

/**
 * @openapi
 * /api/users/{uid}:
 *   get:
 *     summary: Retrieve user profile by username
 *     description: Fetches detailed profile information for a specific user, including posts (Wuphfs), avatar, followers/following, and counts. If authenticated, attaches `isFollowed` status and strips detailed follower lists for non-owners.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: Username or URL-encoded user ID.
 *     responses:
 *       200:
 *         description: User profile details successfully retrieved.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WuphfUserDetail'
 *       400:
 *         description: Invalid or missing user ID parameter.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid or missing user ID parameter."
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No WuphfUser found with the username pam_beesly"
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
 *     summary: Update user profile
 *     description: Updates editable profile fields such as username, bio, UI theme, and avatar ID for a target user. Requires authentication.
 *     tags:
 *       - Users
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: Current username or URL-encoded user ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userName:
 *                 type: string
 *                 pattern: '^[a-zA-Z0-9_-]+$'
 *                 example: "pam_beesly_new"
 *                 description: Updated unique username (allows letters, numbers, underscores, and hyphens).
 *               bio:
 *                 type: string
 *                 example: "Dunder Mifflin receptionist and artist."
 *                 description: Short profile bio.
 *               theme:
 *                 type: string
 *                 example: "dark"
 *                 description: UI color theme preference.
 *               avatarId:
 *                 type: integer
 *                 example: 3
 *                 description: ID of the newly selected avatar.
 *     responses:
 *       200:
 *         description: Profile updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WuphfUserUpdated'
 *       400:
 *         description: Unique constraint violation or invalid request body.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Username can only contain letters, numbers, underscores, and hyphens."
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
 *         description: Forbidden action on another user's profile.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Forbidden: You cannot modify another user's profile."
 *       404:
 *         description: User to update not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No WuphfUser found"
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
 *     summary: Delete user account by username
 *     description: Looks up the specified username, resolves their associated email, and permanently deletes their root User record. Requires authentication.
 *     tags:
 *       - Users
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: Username or URL-encoded user ID of the account to delete.
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
 *                   example: "usr_12345"
 *                 email:
 *                   type: string
 *                   example: "pam@dundermifflin.com"
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
 *         description: Forbidden action on another user's account.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Forbidden: You can only delete your own account."
 *       404:
 *         description: Target user not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No WuphfUser found"
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
 *     WuphfUserDetail:
 *       type: object
 *       properties:
 *         userName:
 *           type: string
 *           example: "pam_beesly"
 *         email:
 *           type: string
 *           example: "pam@dundermifflin.com"
 *         bio:
 *           type: string
 *           nullable: true
 *           example: "Dunder Mifflin receptionist and artist."
 *         theme:
 *           type: string
 *           nullable: true
 *           example: "light"
 *         avatarId:
 *           type: integer
 *           nullable: true
 *           example: 2
 *         isFollowed:
 *           type: boolean
 *           description: Indicates whether the requesting session user follows this user (present when authenticated).
 *           example: true
 *         avatar:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: integer
 *               example: 2
 *             url:
 *               type: string
 *               example: "https://example.com/avatars/pam.png"
 *         wuphfs:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Wuphf'
 *         Followers:
 *           type: array
 *           description: List of followers (included for profile owner, stripped for non-owners).
 *           items:
 *             $ref: '#/components/schemas/FollowerRelation'
 *         Following:
 *           type: array
 *           description: List of followed users (included for profile owner, stripped for non-owners).
 *           items:
 *             $ref: '#/components/schemas/FollowerRelation'
 *         _count:
 *           type: object
 *           properties:
 *             Followers:
 *               type: integer
 *               example: 42
 *             Following:
 *               type: integer
 *               example: 18
 *
 *     WuphfUserUpdated:
 *       type: object
 *       properties:
 *         userName:
 *           type: string
 *           example: "pam_beesly_new"
 *         bio:
 *           type: string
 *           example: "Dunder Mifflin receptionist and artist."
 *         theme:
 *           type: string
 *           example: "dark"
 *         avatarId:
 *           type: integer
 *           example: 3
 *         avatar:
 *           type: object
 *           nullable: true
 *           properties:
 *             url:
 *               type: string
 *               example: "https://example.com/avatars/pam_new.png"
 *
 *     FollowerRelation:
 *       type: object
 *       properties:
 *         followerId:
 *           type: string
 *           example: "jim_halpert"
 *         userId:
 *           type: string
 *           example: "pam_beesly"
 *         user:
 *           type: object
 *           properties:
 *             avatar:
 *               type: object
 *               nullable: true
 *               properties:
 *                 url:
 *                   type: string
 *                   example: "https://example.com/avatars/jim.png"
 */
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  const rawUid = req.query.uid;

  if (!rawUid || Array.isArray(rawUid)) {
    return res
      .status(400)
      .json({ message: "Invalid or missing user ID parameter." });
  }

  let uid;
  try {
    uid = await paramsSchema.validate(decodeURIComponent(rawUid));
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  // ---------------------------------------------------------------------------
  // GET: Retrieve user profile
  // ---------------------------------------------------------------------------
  if (req.method === "GET") {
    try {
      const user = await prisma.wuphfUser.findUnique({
        where: { userName: uid },
        include: {
          wuphfs: true,
          avatar: true,
          Followers: {
            select: {
              followerId: true,
              userId: true,
              user: {
                select: {
                  avatar: {
                    select: { url: true },
                  },
                },
              },
            },
          },
          Following: {
            select: {
              followerId: true,
              userId: true,
              user: {
                select: {
                  avatar: {
                    select: { url: true },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              Followers: true,
              Following: true,
            },
          },
        },
      });

      if (!user) {
        return res
          .status(404)
          .json({ message: `No WuphfUser found with the username ${uid}` });
      }

      if (session?.user?.email) {
        const sender = await prisma.wuphfUser.findUnique({
          where: { email: session.user.email },
        });

        if (sender) {
          user.isFollowed = user.Followers.some(
            (f) => f.followerId === sender.userName,
          );

          if (sender.userName !== user.userName) {
            delete user.Followers;
            delete user.Following;
          }
        }
      } else {
        delete user.Followers;
        delete user.Following;
      }

      return res.status(200).json(user);
    } catch (error) {
      console.error("Error in GET /api/users/[uid]:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // ---------------------------------------------------------------------------
  // Authorization check for PATCH and DELETE operations
  // ---------------------------------------------------------------------------
  if (!session?.user?.email) {
    return res
      .status(401)
      .json({ message: "Unauthorized: You must be logged in." });
  }

  let sessionUser;
  try {
    sessionUser = await prisma.wuphfUser.findUnique({
      where: { email: session.user.email },
    });
  } catch (error) {
    console.error("Error fetching session user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }

  if (!sessionUser) {
    return res.status(404).json({ message: "Session user profile not found." });
  }

  if (sessionUser.userName !== uid) {
    return res.status(403).json({
      message: "Forbidden: You can only update or delete your own account.",
    });
  }

  // ---------------------------------------------------------------------------
  // PATCH: Update user profile
  // ---------------------------------------------------------------------------
  if (req.method === "PATCH") {
    try {
      // Validate request body
      const validatedBody = await updateUserSchema.validate(req.body, {
        abortEarly: true,
        stripUnknown: true,
      });

      const updatedUser = await prisma.wuphfUser.update({
        where: { userName: uid },
        data: {
          userName: validatedBody.userName || undefined,
          bio: validatedBody.bio !== undefined ? validatedBody.bio : undefined,
          theme:
            validatedBody.theme !== undefined ? validatedBody.theme : undefined,
          avatarId:
            validatedBody.avatarId !== undefined
              ? validatedBody.avatarId
              : undefined,
        },
        include: {
          avatar: {
            select: { url: true },
          },
        },
      });

      return res.status(200).json(updatedUser);
    } catch (error) {
      // Catch Yup validation errors
      if (error instanceof yup.ValidationError) {
        return res.status(400).json({ message: error.message });
      }

      // Catch Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          return res.status(404).json({ message: "No WuphfUser found" });
        }
        if (error.code === "P2002") {
          return res
            .status(400)
            .json({ message: "Username or unique field already in use." });
        }
      }

      console.error("Error in PATCH /api/users/[uid]:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // ---------------------------------------------------------------------------
  // DELETE: Delete user account by username
  // ---------------------------------------------------------------------------
  if (req.method === "DELETE") {
    try {
      const deletedUser = await prisma.user.delete({
        where: { email: sessionUser.email },
      });

      return res.status(200).json(deletedUser);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return res.status(404).json({ message: "Target user not found" });
      }

      console.error("Error in DELETE /api/users/[uid]:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  // Handle unsupported methods
  res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
}
