import type { NextApiRequest, NextApiResponse } from 'next'
import { API_URL } from '../../lib/constants';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).send({ message: 'Method not allowed' });
  }
  const linkData = { ...req.body };
  const response = await fetch(`${API_URL}/links`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(linkData),
  })
  const respData = await response.json();
  res.status(200).json(respData);
}