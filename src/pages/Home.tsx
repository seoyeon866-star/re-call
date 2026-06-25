import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { fetchRecentRecalls, getRecallImages } from '../api/consumerRecall'
import { buildRecallWithMeta, CATEGORIES, type RecallWithMeta } from '../lib/classify'

const RECENT_SEARCHES_KEY = 'recent_searches'
const MAX_RECENT = 8

const CATEGORY_ICONS: Record<string, string> = {
  '유아동': '/assets/category/유아동.png',
  '완구류': '/assets/category/완구류.png',
  '식품류': '/assets/category/식품류.png',
  '전자제품': '/assets/category/전자제품.png',
  '화장품': '/assets/category/화장품.png',
  '의류': '/assets/category/의류.png',
  '생활용품': '/assets/category/생활용품.png',
  '욕실용품': '/assets/category/욕실용품.png',
  '주방용품': '/assets/category/주방용품.png',
  '반려동물용품': '/assets/category/반려동물.png',
}

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
    addRecentSearch(cat)
    navigate(`/search?query=${encodeURIComponent(cat)}`)
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '32px 16px', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1 style={{ fontSize: 'clamp(1.8rem, 7vw, 2.4rem)', margin: 0, fontWeight: 700, letterSpacing: '-0.5px' }}>Re:call</h1>
        <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: 'clamp(0.8rem, 3vw, 0.9rem)' }}>
          해외직구 리콜 정보 탐색
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="리콜 상품명을 입력하세요"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1, minWidth: 0, padding: '12px 16px', fontSize: '0.95rem',
              border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none',
              boxSizing: 'border-box', background: '#f8fafc',
            }}
          />
          <button type="submit" style={{
            padding: '12px 20px', fontSize: '0.95rem', border: 'none',
            borderRadius: '12px', background: '#3b82f6', color: '#fff',
            cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontWeight: 600,
          }}>검색</button>
        </div>
      </form>

      <section style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>카테고리</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px 8px' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => handleCategoryClick(cat)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
              padding: '10px 4px', borderRadius: '12px', border: 'none',
              background: '#f8fafc', cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
            >
              <img src={CATEGORY_ICONS[cat]} alt={cat} style={{ width: 'clamp(28px, 6vw, 36px)', height: 'clamp(28px, 6vw, 36px)', objectFit: 'contain' }} />
              <span style={{ fontSize: 'clamp(0.65rem, 2.2vw, 0.75rem)', color: '#475569', lineHeight: 1.2, wordBreak: 'keep-all', textAlign: 'center' }}>{cat}</span>
            </button>
          ))}
        </div>
      </section>

      {recentSearches.length > 0 && (
        <section style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>최근 검색어</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {recentSearches.map(term => (
              <button key={term} onClick={() => navigate(`/search?query=${encodeURIComponent(term)}`)} style={{
                padding: '6px 14px', borderRadius: '20px', border: '1px solid #e2e8f0',
                background: '#fff', fontSize: '0.8rem', color: '#475569', cursor: 'pointer',
              }}>{term}</button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>최근 등록된 리콜</h3>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: '60px', borderRadius: '10px', background: '#f1f5f9' }} />
            ))}
          </div>
        )}
        {!loading && recentRecalls.length === 0 && (
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '32px 0' }}>리콜 정보를 불러올 수 없습니다.</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {recentRecalls.slice(0, 10).map((item) => {
            const images = getRecallImages(item)
            return (
            <Link key={item.recallSn} to={`/recall/${item.recallSn}`} state={{ items: [item] }} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', gap: '10px', alignItems: 'center', padding: '10px 12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
              {images.length > 0 ? (
                <img src={images[0]} alt={item.productNm} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
              ) : (
                <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#e2e8f0', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '0.9rem', color: '#1e293b', wordBreak: 'break-word' }}>{item.productNm}</p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', padding: '1px 8px', borderRadius: '8px', background: '#dbeafe', color: '#3b82f6' }}>{item.category}</span>
                  {item.recallRegDt && <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.recallRegDt?.slice(0, 10)}</span>}
                </div>
              </div>
            </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
