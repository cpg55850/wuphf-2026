import { prisma } from '../../lib/prisma'

/**
 * @swagger
 * /api/avatar:
 *   get:
 *     summary: Get all avatars
 *     description: Returns all avatars
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Hello World!"
*/
export default async function handler(req, res) {
	if (req.method === 'GET') {
		try {
			const avatars = await prisma.Avatar.findMany()

			// if (!avatars) {
			// 	return res
			// 		.status(404)
			// 		.json({ message: 'No avatars found with the user' })
			// }
			res.json(avatars)
		} catch (error) {
			// console.error(error)
			res.status(500).json({ error })
			throw error
		}
	}
}
