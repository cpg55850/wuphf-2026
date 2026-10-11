import { v2 as cloudinary } from 'cloudinary'
import formidable, { type File } from 'formidable'
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '../../lib/authOptions'

// Configure Cloudinary using environment variables.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

// Disable Next.js body parsing for multipart/form-data.
export const config = {
  api: {
    bodyParser: false,
  },
}

/**
 * @openapi
 * /api/upload:
 *   post:
 *     summary: Upload an image file
 *     description: Parses a multipart form request and uploads the image file to Cloudinary, returning the Cloudinary public ID and hosted URL. Requires authentication.
 *     tags:
 *       - Media
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The image file to upload.
 *     responses:
 *       200:
 *         description: File successfully uploaded to Cloudinary.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 public_id:
 *                   type: string
 *                   example: "uploads/481a02f3c02d281e89"
 *                   description: Cloudinary image public identifier.
 *                 url:
 *                   type: string
 *                   example: "https://res.cloudinary.com/demo/image/upload/v1698273611/uploads/481a02f3c02d281e89.png"
 *                   description: The web-accessible URL of the uploaded image.
 *       400:
 *         description: Missing or invalid file attachment.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No image file provided in request."
 *       401:
 *         description: Unauthorized session.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized: Active session required."
 *       500:
 *         description: Form parsing or Cloudinary upload error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to upload file to Cloudinary."
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // 1. Only allow POST requests.
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])

    return res.status(405).json({
      message: `Method ${req.method} Not Allowed`,
    })
  }

  // 2. Require an authenticated session.
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({
      message: 'Unauthorized: Active session required.',
    })
  }

  // 3. Parse the multipart form.
  const form = formidable({
    multiples: false,
    keepExtensions: true,
  })

  form.parse(req, async (err, _fields, files) => {
    if (err) {
      console.error('Error parsing multipart form:', err)

      return res.status(400).json({
        message: 'Error parsing file data.',
      })
    }

    // Support Formidable versions that return either a File or File[].
    const rawFile = files.file ?? files[Object.keys(files)[0]]
    const file: File | undefined = Array.isArray(rawFile) ? rawFile[0] : rawFile

    const filePath = file?.filepath ?? file?.path

    if (!file || !filePath) {
      return res.status(400).json({
        message: 'No image file provided in request.',
      })
    }

    // 4. Upload the file to Cloudinary.
    try {
      const publicId = `uploads/${
        file.newFilename || file.originalFilename || Date.now()
      }`

      const uploadResult = await cloudinary.uploader.upload(filePath, {
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
      })

      return res.status(200).json({
        public_id: uploadResult.public_id,
        url: uploadResult.secure_url || uploadResult.url,
      })
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError)

      return res.status(500).json({
        message: 'Failed to upload file to Cloudinary.',
      })
    }
  })
}
