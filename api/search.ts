export default async function handler(req: any, res: any) {
  const query = req.query?.query;
  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Missing query parameter' });
    return;
  }

  try {
    const display = req.query?.display || '100';
    const apiRes = await fetch(
      `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=${display}`,
      {
        headers: {
          'X-Naver-Client-Id': process.env.VITE_NAVER_CLIENT_ID!,
          'X-Naver-Client-Secret': process.env.VITE_NAVER_CLIENT_SECRET!,
        },
      }
    );

    if (!apiRes.ok) {
      const text = await apiRes.text();
      res.status(apiRes.status).json({ error: text });
      return;
    }

    const data = await apiRes.json();
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch from Naver API' });
  }
}
