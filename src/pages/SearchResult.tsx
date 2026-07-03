import { useEffect, useState, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { searchRecalls, fetchByCategory, getRecallImages, handleImgError } from '../api/consumerRecall'
import { CATEGORIES } from '../config/categories'
import { buildRecallWithMeta, parseProductName, RISK_ICONS, type RecallWithMeta } from '../lib/classify'
import { logEvent } from '../lib/analytics'

interface FilterOption { value: string; label: string }

function FilterChip({ label, value, options, onChange, displayMap }: {
  label: string
  value: string
  options: FilterOption[]
  onChange: (v: string) => void
  displayMap?: Record<string, string>
}) {
  const [open, setOpen] = useState(false)
  const selected = value ? (displayMap?.[value] || options.find(o => o.value === value)?.label || value) : null

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(!open)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          height: '38px', padding: '0 16px',
          borderRadius: '999px', border: selected ? 'none' : '1px solid #D9D9D9',
          background: selected ? '#42B7F3' : '#fff',
          color: selected ? '#fff' : '#2B2B2B',
          fontSize: '14px', cursor: 'pointer', fontWeight: 500,
          transition: 'background-color 0.2s ease',
          whiteSpace: 'nowrap',
        }}
        className="filter-chip"
      >
        {selected || label}
        <span style={{ fontSize: '12px', lineHeight: 1, color: selected ? '#fff' : '#888' }}>⌄</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '44px', left: 0, zIndex: 20,
          background: '#fff', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          padding: '4px', minWidth: '140px',
        }}>
          {options.map(opt => (
            <button
              key={opt.value}
              onMouseDown={() => { onChange(opt.value === value ? '' : opt.value); setOpen(false) }}
              style={{
                display: 'block', width: '100%', padding: '10px 14px', border: 'none',
                background: value === opt.value ? '#EBF7FD' : 'transparent',
                color: value === opt.value ? '#42B7F3' : '#2B2B2B',
                fontSize: '14px', cursor: 'pointer', borderRadius: '8px', textAlign: 'left',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SearchResult() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const query = params.get('query') || ''
  const category = params.get('category') || ''

  const [rawItems, setRawItems] = useState<RecallWithMeta[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [sortBy, setSortBy] = useState<'relevance' | 'latest'>('relevance')
  const [filterCountry, setFilterCountry] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterRiskTag, setFilterRiskTag] = useState('')

  const isCategoryMode = !!category && !query

  useEffect(() => {
    if (!query && !category) { setRawItems([]); return }
    setLoading(true)
    setError('')
    setFilterCountry('')
    setFilterCategory('')
    setFilterRiskTag('')

    if (isCategoryMode) {
      fetchByCategory(category)
        .then(items => setRawItems(items.map(buildRecallWithMeta)))
        .catch(err => setError(err?.message || '카테고리 정보를 불러올 수 없습니다'))
        .finally(() => setLoading(false))
    } else {
      searchRecalls(query)
        .then(items => setRawItems(items.map(buildRecallWithMeta)))
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
    if (filterCountry) result = result.filter(i => i.country === filterCountry)
    if (filterCategory) result = result.filter(i => i.category === filterCategory)
    if (filterRiskTag) result = result.filter(i => i.riskTags.includes(filterRiskTag))
    if (sortBy === 'latest') result.sort((a, b) => ((b.recallRegDt || '') > (a.recallRegDt || '') ? 1 : -1))
    return result
  }, [rawItems, sortBy, filterCountry, filterCategory, filterRiskTag])

  return (
    <div style={{ minHeight: '100vh', background: '#F4FBFD', boxSizing: 'border-box' }}>
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px 40px', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#54B8DB', fontSize: '1.2rem' }}>
          <img src="/assets/icon_arrow.png" alt="back" style={{ width: '20px', height: '20px' }} />
        </Link>
        <h2 style={{ margin: 0, fontSize: 'clamp(1rem, 4vw, 1.2rem)', fontWeight: 600, color: '#1e293b', wordBreak: 'break-word' }}>
          {isCategoryMode ? category : `"${query}" 검색 결과`}
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

      {!loading && rawItems.length === 0 && !error && (
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '48px 0', fontSize: '0.9rem' }}>해당 카테고리의 리콜 정보가 없습니다.</p>
      )}

      {!loading && rawItems.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px', WebkitOverflowScrolling: 'touch' }} className="hide-scrollbar">
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center', borderRadius: '10px', padding: '4px 8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>총 {items.length}건</span>
            </div>
            <FilterChip
              label="관련도순"
              value={sortBy}
              options={[
                { value: 'relevance', label: '관련도순' },
                { value: 'latest', label: '최신순' },
              ]}
              onChange={(v) => { setSortBy(v as 'relevance' | 'latest'); logEvent('filter_apply', { sort: v }); logEvent('filter_click', { filterType: 'sort', filterValue: v }, { utVersion: '2' }); }}
              displayMap={{ relevance: '관련도순', latest: '최신순' }}
            />
            {!isCategoryMode && (
              <FilterChip
                label="카테고리"
                value={filterCategory}
                options={CATEGORIES.map(c => ({ value: c, label: c }))}
                onChange={(v) => { setFilterCategory(v); logEvent('filter_apply', v ? { category: v } : {}); logEvent('filter_click', { filterType: 'category', filterValue: v }, { utVersion: '2' }); }}
              />
            )}
            {filters.countries.length > 0 && (
              <FilterChip
                label="국가"
                value={filterCountry}
                options={filters.countries.map(c => ({ value: c, label: c }))}
                onChange={(v) => { setFilterCountry(v); logEvent('filter_apply', v ? { country: v } : {}); logEvent('filter_click', { filterType: 'country', filterValue: v }, { utVersion: '2' }); }}
              />
            )}
            {filters.riskTags.length > 0 && (
              <FilterChip
                label="위험"
                value={filterRiskTag}
                options={filters.riskTags.map(t => ({ value: t, label: t }))}
                onChange={(v) => { setFilterRiskTag(v); logEvent('filter_apply', v ? { riskTag: v } : {}); logEvent('filter_click', { filterType: 'riskTag', filterValue: v }, { utVersion: '2' }); }}
              />
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {items.map((item, idx) => {
              const images = getRecallImages(item)
              return (
              <Link key={item.recallSn} to={`/recall/${item.recallSn}`} state={{ items: [item], fromQuery: query }} onClick={() => logEvent('search_result_click', { productName: item.productNm, index: idx })} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', gap: '12px', padding: '12px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0' }} className="search-item">
                <div className="search-item-img" style={{ position: 'relative', width: 'clamp(64px, 20vw, 80px)', height: 'clamp(64px, 20vw, 80px)', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', background: '#e2e8f0' }}>
                  {images.length > 0 ? (
                    <img src={images[0]} alt={item.productNm} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => handleImgError(e, item.category)} />
                  ) : (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#cbd5e1' }}>?</div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {(() => { const parsed = parseProductName(item.productNm); const brand = parsed?.brand || (item.makr && item.makr !== '-' ? item.makr : ''); return (
                    <div style={{ margin: 0 }}>
                      {brand && <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>{brand}</p>}
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 400, lineHeight: 1.3, color: '#1e293b', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: brand ? 1 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{parsed?.product || item.productNm}</p>
                    </div>
                  )})()}
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center', marginTop: '2px' }}>
                    {item.riskTags.slice(0, 2).map(tag => (
                      <span key={tag} style={{ fontSize: '12px', padding: '2px 4px', borderRadius: '6px', background: '#FCEBEA', color: '#E63429', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                        {RISK_ICONS[tag] && <img src={RISK_ICONS[tag]} alt={tag} style={{ width: '12px', height: '12px' }} />}
                        {tag}
                      </span>
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
    </div>
  )
}
