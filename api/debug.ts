export default async function handler(req: any, res: any) {
  res.json({
    method: req.method,
    url: req.url,
    query: req.query,
    headers: req.headers,
  });
}
