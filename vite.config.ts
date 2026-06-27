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

          server.middlewares.use('/api/img', async (req, res) => {
            const id = new URL(req.url || '', 'http://localhost').searchParams.get('id')
            if (!id) { res.statusCode = 400; res.end('Missing id'); return }
            try {
              const r = await fetch(
                `https://www.consumer.go.kr/openapi/recall/contents/recallApiImage.do?atchmnflId=${id}&serviceKey=${env.CONSUMER24_SERVICE_KEY}`,
                { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; re-call/1.0)', 'Referer': 'https://www.consumer.go.kr/' } }
              )
              const buffer = await r.arrayBuffer()
              if (buffer.byteLength === 0) { res.statusCode = 502; res.end(); return }
              res.setHeader('Content-Type', r.headers.get('content-type') || 'image/jpeg')
              res.setHeader('Cache-Control', 'public, max-age=86400')
              res.end(Buffer.from(buffer))
            } catch { res.statusCode = 500; res.end() }
          })

          server.middlewares.use('/api/recalls', async (req, res) => {
            const params = new URL(req.url || '', 'http://localhost').searchParams
            const { createClient } = await import('@supabase/supabase-js')
            const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

            function toClient(row: any) {
              const DOMAIN_MAP: Record<string, string> = {
                'ec.europa.eu': '유럽 집행위원회',
                'www.cpsc.gov': '미국 CPSC',
                'recalls-rappels.canada.ca': '캐나다 보건부',
                'www.safetykorea.kr': '한국 제품안전정보센터',
                'www.recall.caa.go.jp': '일본 소비자청',
                'www.gov.uk': '영국 OPSS',
                'www.fda.gov': '미국 FDA',
              }
              let agency = ''
              try { const host = new URL(row.info_creat_url || '').hostname; agency = DOMAIN_MAP[host] || host } catch {}
              return {
                recallSn: row.recall_sn, cntntsId: row.cntnts_id, productNm: row.product_nm,
                makr: row.makr, bsnmNm: row.bsnm_nm, modlNmInfo: row.modl_nm_info,
                shrtcomCn: row.shrtcom_cn, recallSe: row.recall_se, hrmflGrad: row.hrmfl_grad,
                mainSleoffic: row.main_sleoffic, recallImgUrls: row.recall_img_urls,
                injryCauseResult: row.injry_cause_result, cnsmrGhvrTips: row.cnsmr_ghvr_tips,
                aditfield13: row.aditfield13, recallRegDt: row.recall_reg_dt,
                category: row.category, infoCreatUrl: row.info_creat_url || '', agencyName: agency,
              }
            }

            try {
              const { q, category, recent } = Object.fromEntries(params)
              let query = sb.from('recalls').select('*').not('recall_img_urls', 'is', null).neq('recall_img_urls', '')

              if (category) {
                query = query.eq('category', category).order('recall_reg_dt', { ascending: false, nullsFirst: false }).limit(100)
              } else if (recent === 'true') {
                query = query.order('recall_reg_dt', { ascending: false, nullsFirst: false }).limit(5)
              } else if (q) {
                query = query.or(`product_nm.ilike.%${q}%,makr.ilike.%${q}%,bsnm_nm.ilike.%${q}%`).order('recall_reg_dt', { ascending: false, nullsFirst: false }).limit(100)
              } else {
                res.statusCode = 400; res.end(JSON.stringify({ error: 'Missing query' })); return
              }

              const { data, error } = await query
              if (error) { res.statusCode = 500; res.end(JSON.stringify({ error: error.message })); return }
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ items: (data || []).map(toClient), source: 'db' }))
            } catch (e: any) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: e.message || 'Internal error' }))
            }
          })
        },
      },
    ],
  }
})
