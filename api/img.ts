export default async function handler(req: any, res: any) {
  const id = req.query.id as string
  if (!id) return res.status(400).end('Missing id')

  const key = process.env.CONSUMER24_SERVICE_KEY
  const url = `https://www.consumer.go.kr/openapi/recall/contents/recallApiImage.do?atchmnflId=${id}&serviceKey=${key}`

  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; re-call/1.0)',
        'Referer': 'https://www.consumer.go.kr/',
      }
    })
    const buffer = await r.arrayBuffer()
    const contentType = r.headers.get('content-type') || 'image/jpeg'
    if (buffer.byteLength === 0) {
      console.error('[img] empty response for', id, 'status:', r.status)
      return res.status(502).end()
    }
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400')
    res.end(Buffer.from(buffer))
  } catch (e: any) {
    console.error('[img] error for', id, e.message)
    res.status(500).end()
  }
}
