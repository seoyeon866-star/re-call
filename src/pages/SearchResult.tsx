import { useEffect, useState, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { searchRecalls, fetchRecentRecalls, getRecallImages, type RecallItem } from '../api/consumerRecall'
import { CATEGORIES } from '../config/categories'
import { buildRecallWithMeta, type RecallWithMeta } from '../lib/classify'

const RECALL_SE_OPTIONS = ['리콜', '판매중단', '무상수리', '교환', '환급'] as const

function highlight(text: string, query: string): string {
  if (!query) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark style="background:#fef08a;padding:0 2px;border-radius:2px">$1</mark>')
}

export default function SearchResult() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('query') || ''
  const category = searchParams.get('category') || ''

  const [rawItems, setRawItems] = useState<RecallWithMeta[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [sortBy, setSortBy] = useState<'relevance' | 'latest'>('relevance')
  const [filterRecallSe, setFilterRecallSe] = useState('')
  const [filterCountry, setFilterCountry] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterRiskTag, setFilterRiskTag] = useState('')

  const isCategoryMode = !!category && !query

  useEffect(() => {
    if (!query && !category) { setRawItems([]); return }
    setLoading(true)
    setError('')
    setFilterRecallSe('')
    setFilterCountry('')
    setFilterCategory('')
    setFilterRiskTag('')

    if (isCategoryMode) {
      fetchRecentRecalls()
        .then((items: RecallItem[]) => {
          const classified = items.map(buildRecallWithMeta)
          setRawItems(classified.filter(i => i.category === category))
        })
        .catch(err => setError(err?.response?.data?.errorMessage || err.message || '카테고리 정보를 불러올 수 없습니다'))
        .finally(() => setLoading(false))
    } else {
      searchRecalls(query)
        .then((items: RecallItem[]) => setRawItems(items.map(buildRecallWithMeta)))
        .catch(err => setError(err?.response?.data?.errorMessage || err.message || '검색 중 오류가 발생했습니다'))
        .finally(() => setLoading(false))
    }
  }, [query, category])

  const filters = useMemo(() => {
    const countries = [...new Set(rawItems.map(i => i.country).filter(Boolean))].sort()
    const riskTags = [...new Set(rawItems.flatMap(i => i.riskTags))].sort()
    return { countries, riskTags }
  }, [rawItems])

  const items = useMemo(() => {
    let result = [...rawItems]
    if (filterRecallSe) result = result.filter(i => i.recallSe === filterRecallSe)
    if (filterCountry) result = result.filter(i => i.country === filterCountry)
    if (filterCategory) result = result.filter(i => i.category === filterCategory)
    if (filterRiskTag) result = result.filter(i => i.riskTags.includes(filterRiskTag))
    if (sortBy === 'latest') result.sort((a, b) => ((b.recallRegDt || '') > (a.recallRegDt || '') ? 1 : -1))
    return result
  }, [rawItems, sortBy, filterRecallSe, filterCountry, filterCategory, filterRiskTag])

  return (
    <div style={{ minHeight: '100vh', background: '#F4FBFD', maxWidth: '480px', margin: '0 auto', padding: '24px 16px 40px', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#54B8DB', fontSize: '1.2rem' }}>&larr;</Link>
        <h2 style={{ margin: 0, fontSize: 'clamp(1rem, 4vw, 1.2rem)', fontWeight: 600, color: '#1e293b', wordBreak: 'break-word' }}>
          {isCategoryMode ? `${category}` : `&ldquo;${query}&rdquo; 검색 결과`}
        </h2>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px 0' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '12px', background: '#f8fafc' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '8px', background: '#f1f5f9', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ height: '14px', width: '70%', borderRadius: '4px', background: '#f1f5f9' }} />
                <div style={{ height: '10px', width: '40%', borderRadius: '4px', background: '#f1f5f9' }} />
                <div style={{ height: '10px', width: '50%', borderRadius: '4px', background: '#f1f5f9' }} />
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <p style={{ color: '#ef4444', fontSize: '0.9rem', padding: '12px', background: '#fef2f2', borderRadius: '8px' }}>{error}</p>}

      {!loading && rawItems.length === 0 && (
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '48px 0', fontSize: '0.9rem' }}>해당 카테고리의 리콜 정보가 없습니다.</p>
      )}

      {!loading && rawItems.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center', borderRadius: '10px', padding: '4px 8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>총 {items.length}건</span>
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as 'relevance' | 'latest')} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', background: '#fff', cursor: 'pointer', color: '#475569' }}>
              <option value="relevance">관련도순</option>
              <option value="latest">최신순</option>
            </select>
            <select value={filterRecallSe} onChange={e => setFilterRecallSe(e.target.value)} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', background: '#fff', cursor: 'pointer', color: '#475569' }}>
              <option value="">유형</option>
              {RECALL_SE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            {!isCategoryMode && (
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', background: '#fff', cursor: 'pointer', color: '#475569' }}>
                <option value="">카테고리</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {filters.countries.length > 0 && (
              <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', background: '#fff', cursor: 'pointer', color: '#475569' }}>
                <option value="">국가</option>
                {filters.countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {filters.riskTags.length > 0 && (
              <select value={filterRiskTag} onChange={e => setFilterRiskTag(e.target.value)} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem', background: '#fff', cursor: 'pointer', color: '#475569' }}>
                <option value="">위험</option>
                {filters.riskTags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {items.map((item) => {
              const images = getRecallImages(item)
              return (
              <Link key={item.recallSn} to={`/recall/${item.recallSn}`} state={{ items: [item], fromQuery: query }} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', gap: '12px', padding: '12px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0' }}>
                {images.length > 0 ? (
                  <img src={images[0]} alt={item.productNm} style={{ width: 'clamp(64px, 20vw, 80px)', height: 'clamp(64px, 20vw, 80px)', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                ) : (
                  <div style={{ width: 'clamp(64px, 20vw, 80px)', height: 'clamp(64px, 20vw, 80px)', borderRadius: '8px', background: '#e2e8f0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#cbd5e1' }}>?</div>
                )}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.3, color: '#1e293b', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: highlight(item.productNm, query) }} />
                  {item.makr && item.makr !== '-' && <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>{item.makr}</p>}
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center', marginTop: '2px' }}>
                    <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '6px', background: '#dbeafe', color: '#3b82f6' }}>{item.category}</span>
                    {item.recallSe && <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '6px', background: '#fee2e2', color: '#ef4444' }}>{item.recallSe}</span>}
                    {item.riskTags.slice(0, 2).map(tag => (
                      <span key={tag} style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: '6px', background: '#fef3c7', color: '#d97706' }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
