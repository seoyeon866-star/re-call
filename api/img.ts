export default async function handler(req: any, res: any) {
  const id = req.query.id as string
  if (!id) return res.status(400).end('Missing id')

  const key = process.env.CONSUMER24_SERVICE_KEY
  const url = `https://www.consumer.go.kr/openapi/recall/contents/recallApiImage.do?atchmnflId=${id}&serviceKey=${key}`

  try {
    const r = await fetch(url)
    const buffer = await r.arrayBuffer()
    const contentType = r.headers.get('content-type') || 'image/jpeg'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400')
    res.end(Buffer.from(buffer))
  } catch {
    res.status(500).end()
  }
}
