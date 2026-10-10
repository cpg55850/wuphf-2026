import type { NextApiRequest, NextApiResponse } from 'next'

import { getApiDocs } from '../../swagger'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end()
  }

  try {
    const spec = await getApiDocs()
    return res.status(200).json(spec)
  } catch (error) {
    console.error('Error generating API documentation:', error)
    return res.status(500).json({
      message: 'Internal server error',
    })
  }
}
