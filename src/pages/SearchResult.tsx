import { useEffect, useState, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { searchRecalls, type RecallItem } from '../api/consumerRecall'
import { CATEGORIES, buildRecallWithMeta, type RecallWithMeta } from '../lib/classify'

const RECALL_SE_OPTIONS = ['리콜', '판매중단', '무상수리', '교환', '환급'] as const

function highlight(text: string, query: string): string {
  if (!query) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark style="background:#fff3b0;padding:0 2px">$1</mark>')
}

export default function SearchResult() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('query') || ''

  const [rawItems, setRawItems] = useState<RecallWithMeta[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [sortBy, setSortBy] = useState<'relevance' | 'latest'>('relevance')
  const [filterRecallSe, setFilterRecallSe] = useState('')
  const [filterCountry, setFilterCountry] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterRiskTag, setFilterRiskTag] = useState('')

  useEffect(() => {
    if (!query) {
      setRawItems([])
      return
    }
    setLoading(true)
    setError('')
    setFilterRecallSe('')
    setFilterCountry('')
    setFilterCategory('')
    setFilterRiskTag('')

    searchRecalls(query)
      .then((items: RecallItem[]) => {
        setRawItems(items.map(buildRecallWithMeta))
      })
      .catch((err) => {
        setError(err?.response?.data?.errorMessage || err.message || '검색 중 오류가 발생했습니다')
      })
      .finally(() => setLoading(false))
  }, [query])

  const countries = useMemo(() => {
    const set = new Set(rawItems.map(i => i.country).filter(Boolean))
    return [...set].sort()
  }, [rawItems])

  const riskTags = useMemo(() => {
    const set = new Set(rawItems.flatMap(i => i.riskTags))
    return [...set].sort()
  }, [rawItems])

  const items = useMemo(() => {
    let result = [...rawItems]

    if (filterRecallSe) result = result.filter(i => i.recallSe === filterRecallSe)
    if (filterCountry) result = result.filter(i => i.country === filterCountry)
    if (filterCategory) result = result.filter(i => i.category === filterCategory)
    if (filterRiskTag) result = result.filter(i => i.riskTags.includes(filterRiskTag))

    if (sortBy === 'latest') {
      result.sort((a, b) => ((b.recallRegDt || '') > (a.recallRegDt || '') ? 1 : -1))
    }

    return result
  }, [rawItems, sortBy, filterRecallSe, filterCountry, filterCategory, filterRiskTag])

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#54B8DB', display: 'inline-block', marginBottom: '16px' }}>
        &larr; Home
      </Link>
      <h2 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', wordBreak: 'break-word' }}>&ldquo;{query}&rdquo; 검색 결과</h2>

      {loading && <p>검색 중...</p>}
      {error && <p style={{ color: 'red' }}>오류: {error}</p>}

      {!loading && !error && rawItems.length === 0 && (
        <p>검색 결과가 없습니다.</p>
      )}

      {!loading && rawItems.length > 0 && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '10px 12px', background: '#f9f9f9', borderRadius: '8px', fontSize: '0.9rem' }}>
            <span style={{ color: '#666' }}>총 {items.length}건 / {rawItems.length}건</span>
            <div style={{ flex: 1, minWidth: 0 }} />

            <select value={sortBy} onChange={e => setSortBy(e.target.value as 'relevance' | 'latest')} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem', background: '#fff', cursor: 'pointer' }}>
              <option value="relevance">관련도순</option>
              <option value="latest">최신순</option>
            </select>

            <select value={filterRecallSe} onChange={e => setFilterRecallSe(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem', background: '#fff', cursor: 'pointer' }}>
              <option value="">리콜 유형 (전체)</option>
              {RECALL_SE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>

            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem', background: '#fff', cursor: 'pointer' }}>
              <option value="">카테고리 (전체)</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {countries.length > 0 && (
              <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem', background: '#fff', cursor: 'pointer' }}>
                <option value="">국가 (전체)</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}

            {riskTags.length > 0 && (
              <select value={filterRiskTag} onChange={e => setFilterRiskTag(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.85rem', background: '#fff', cursor: 'pointer' }}>
                <option value="">위험 태그 (전체)</option>
                {riskTags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {items.map((item) => (
              <li key={item.recallSn} style={{ padding: '14px 0', borderBottom: '1px solid #eee' }}>
                <Link to={`/recall/${item.recallSn}`} state={{ items: [item] }} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.3, wordBreak: 'break-word' }} dangerouslySetInnerHTML={{ __html: highlight(item.productNm, query) }} />
                  {item.makr && item.makr !== '-' && <p style={{ margin: '0 0 2px', fontSize: '0.8rem', color: '#888' }}>{item.makr}</p>}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: '#e8f4f8', color: '#54B8DB' }}>{item.category}</span>
                    {item.recallSe && <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: '#fcebea', color: '#e63429' }}>{item.recallSe}</span>}
                    {item.country && <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: '#f0f0f0', color: '#666' }}>{item.country}</span>}
                    {item.riskTags.slice(0, 3).map(tag => (
                      <span key={tag} style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: '#fff3e0', color: '#e65100' }}>{tag}</span>
                    ))}
                    {item.recallRegDt && <span style={{ fontSize: '0.75rem', color: '#aaa', marginLeft: 'auto' }}>{item.recallRegDt?.slice(0, 10)}</span>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
