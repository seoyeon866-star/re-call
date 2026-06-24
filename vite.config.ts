import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { XMLParser } from 'fast-xml-parser'

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  isArray: (name) => name === 'item',
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'api-proxy',
        configureServer(server) {
          server.middlewares.use('/api/search', async (req, res) => {
            const query = new URL(req.url || '', 'http://localhost').searchParams.get('query')
            if (!query) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Missing query parameter' }))
              return
            }

            try {
              const apiRes = await fetch(
                `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=20`,
                {
                  headers: {
                    'X-Naver-Client-Id': env.VITE_NAVER_CLIENT_ID,
                    'X-Naver-Client-Secret': env.VITE_NAVER_CLIENT_SECRET,
                  },
                }
              )

              if (!apiRes.ok) {
                const text = await apiRes.text()
                res.statusCode = apiRes.status
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: text }))
                return
              }

              const data = await apiRes.json()
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(data))
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Failed to fetch from Naver API' }))
            }
          })

          server.middlewares.use('/api/recall', async (req, res) => {
            const keyword = new URL(req.url || '', 'http://localhost').searchParams.get('keyword')
            if (!keyword) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Missing keyword parameter' }))
              return
            }

            try {
              const tokens = keyword.split(/\s+/).filter(Boolean)
              const searchTerms = [keyword, ...tokens].filter((v, i, a) => a.indexOf(v) === i)

              const fetchConsumer = async (term: string) => {
                const url = new URL('https://www.consumer.go.kr/openapi/recall/contents/index.do')
                url.searchParams.set('serviceKey', env.CONSUMER24_SERVICE_KEY)
                url.searchParams.set('pageNo', '1')
                url.searchParams.set('cntPerPage', '50')
                url.searchParams.set('cntntsId', '0501')
                url.searchParams.set('productNm', term)
                const res = await fetch(url.toString())
                const text = await res.text()
                console.log(`[Consumer24] term="${term}" status:`, res.status, 'preview:', text.slice(0, 200))
                const contentType = res.headers.get('content-type') || ''
                if (contentType.includes('json') || text.trim().startsWith('{')) {
                  return JSON.parse(text)
                }
                return xmlParser.parse(text)
              }

              const rawResults = await Promise.all(searchTerms.map(fetchConsumer))

              const seen = new Set<string>()
              const merged: Record<string, unknown>[] = []

              for (const raw of rawResults) {
                const channel = (raw as any)?.selectCntntsForOpenAPIResponse?.channel
                const content: unknown[] = channel?.return?.content
                  ? (Array.isArray(channel.return.content) ? channel.return.content : [channel.return.content])
                  : []
                for (const item of content) {
                  const sn = (item as any)?.recallSn
                  if (sn && !seen.has(sn)) {
                    seen.add(sn)
                    merged.push(item as Record<string, unknown>)
                  }
                }
              }

              const result = {
                selectCntntsForOpenAPIResponse: {
                  channel: {
                    return: {
                      content: merged,
                    },
                  },
                },
              }

              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(result))
            } catch (err) {
              console.error('[Consumer24] exception:', err)
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Failed to fetch from Consumer24 API' }))
            }
          })
        },
      },
    ],
  }
})
