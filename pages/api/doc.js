// pages/api/doc.js
import { getApiDocs } from '../../swagger';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const spec = await getApiDocs();
    return res.status(200).json(spec);
  }
  return res.status(405).end();
}