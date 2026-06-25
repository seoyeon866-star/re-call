import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { fetchRecentRecalls } from '../api/consumerRecall'
import { buildRecallWithMeta, CATEGORIES, type RecallWithMeta } from '../lib/classify'

const RECENT_SEARCHES_KEY = 'recent_searches'
const MAX_RECENT = 8

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]')
  } catch {
    return []
  }
}

function addRecentSearch(term: string) {
  const list = getRecentSearches().filter(s => s !== term)
  list.unshift(term)
  if (list.length > MAX_RECENT) list.length = MAX_RECENT
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list))
}

export default function Home() {
  const [query, setQuery] = useState('')
  const [recentRecalls, setRecentRecalls] = useState<RecallWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const recentSearches = getRecentSearches()

  useEffect(() => {
    fetchRecentRecalls()
      .then(items => setRecentRecalls(items.map(buildRecallWithMeta)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    addRecentSearch(trimmed)
    navigate(`/search?query=${encodeURIComponent(trimmed)}`)
  }

  const handleCategoryClick = (cat: string) => {
    navigate(`/search?query=${encodeURIComponent(cat)}`)
  }

  const handleRecentSearchClick = (term: string) => {
    navigate(`/search?query=${encodeURIComponent(term)}`)
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 16px 40px', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <h1 style={{ fontSize: 'clamp(2rem, 8vw, 3rem)', marginBottom: '4px' }}>Re:call</h1>
      <p style={{ color: '#666', marginBottom: '28px', fontSize: 'clamp(0.85rem, 3vw, 1rem)' }}>
        해외직구 리콜 정보 탐색
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', width: '100%', maxWidth: '480px', marginBottom: '32px' }}>
        <input
          type="text"
          placeholder="리콜 상품 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1, minWidth: 0, padding: '12px 16px', fontSize: '1rem',
            border: '1px solid #ccc', borderRadius: '8px 0 0 8px', outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <button type="submit" style={{
          padding: '12px 24px', fontSize: '1rem', border: '1px solid #54B8DB',
          borderRadius: '0 8px 8px 0', background: '#54B8DB', color: '#fff',
          cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
        }}>검색</button>
      </form>

      {recentSearches.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '0.9rem', color: '#555', margin: '0 0 10px' }}>최근 검색어</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {recentSearches.map(term => (
              <button key={term} onClick={() => handleRecentSearchClick(term)} style={{
                padding: '6px 14px', borderRadius: '16px', border: '1px solid #ddd',
                background: '#fff', fontSize: '0.85rem', color: '#333', cursor: 'pointer',
              }}>{term}</button>
            ))}
          </div>
        </section>
      )}

      <section style={{ marginBottom: '36px' }}>
        <h3 style={{ fontSize: '0.9rem', color: '#555', margin: '0 0 10px' }}>카테고리</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => handleCategoryClick(cat)} style={{
              padding: '8px 16px', borderRadius: '8px', border: '1px solid #ddd',
              background: '#f5f5f5', fontSize: '0.85rem', color: '#333', cursor: 'pointer',
            }}>{cat}</button>
          ))}
        </div>
      </section>

      <section>
        <h3 style={{ fontSize: '0.9rem', color: '#555', margin: '0 0 12px' }}>최근 등록된 리콜</h3>
        {loading && <p style={{ color: '#999', fontSize: '0.85rem' }}>로딩 중...</p>}
        {!loading && recentRecalls.length === 0 && <p style={{ color: '#999', fontSize: '0.85rem' }}>리콜 정보를 불러올 수 없습니다.</p>}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {recentRecalls.slice(0, 10).map((item) => (
            <li key={item.recallSn} style={{ borderBottom: '1px solid #eee', padding: '10px 0' }}>
              <Link to={`/recall/${item.recallSn}`} state={{ items: [item] }} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '0.9rem', wordBreak: 'break-word' }}>{item.productNm}</p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {item.makr && item.makr !== '-' && <span style={{ fontSize: '0.8rem', color: '#888' }}>{item.makr}</span>}
                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: '#e8f4f8', color: '#54B8DB' }}>{item.category}</span>
                  {item.recallRegDt && <span style={{ fontSize: '0.75rem', color: '#aaa' }}>{item.recallRegDt?.slice(0, 10)}</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
