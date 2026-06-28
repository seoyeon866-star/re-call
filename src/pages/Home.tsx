import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { fetchRecentRecalls, getRecallImages, handleImgError } from '../api/consumerRecall'
import { buildRecallWithMeta, parseProductName, type RecallWithMeta } from '../lib/classify'
import { CATEGORIES } from '../config/categories'

const RECOMMENDED_KEYWORDS = ['영양제', '장난감', '텀블러', '충전기']

const CATEGORY_ICONS: Record<string, string> = {
  '키즈': '/assets/category/키즈.png',
  '뷰티·헬스': '/assets/category/뷰티·헬스.png',
  '생활용품': '/assets/category/생활용품.png',
  '의류': '/assets/category/의류.png',
  '식품·키친': '/assets/category/식품·키친.png',
  '차량용품': '/assets/category/차량용품.png',
  '반려동물': '/assets/category/반려동물.png',
  '가전·디지털': '/assets/category/가전·디지털.png',
}

export default function Home() {
  const [query, setQuery] = useState('')
  const [recentRecalls, setRecentRecalls] = useState<RecallWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

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
    navigate(`/search?query=${encodeURIComponent(trimmed)}`)
  }

  const handleCategoryClick = (cat: string) => {
    window.location.href = `/search?category=${encodeURIComponent(cat)}`
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4FBFD', boxSizing: 'border-box' }}>
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
                boxSizing: 'border-box', background: '#fff',
              }}
            />
            <button type="submit" style={{
              padding: '12px 20px', fontSize: '0.95rem', border: 'none',
              borderRadius: '12px', background: '#54B8DB', color: '#fff',
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontWeight: 600,
            }}>검색</button>
          </div>
        </form>

        <section style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', margin: '0 0 10px' }}>추천 검색어</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {RECOMMENDED_KEYWORDS.map(term => (
              <button key={term} onClick={() => navigate(`/search?query=${encodeURIComponent(term)}`)} style={{
                padding: '6px 14px', borderRadius: '20px', border: '1px solid #54B8DB',
                background: '#EBF7FD', fontSize: '0.8rem', color: '#54B8DB', cursor: 'pointer', fontWeight: 500,
              }}>{term}</button>
            ))}
          </div>
        </section>

        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', margin: '0 0 12px' }}>카테고리</h3>
        <section style={{ marginBottom: '28px', background: '#fff', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 8px' }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => handleCategoryClick(cat)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                padding: '0', border: 'none', background: 'transparent', cursor: 'pointer',
              }}>
                <img src={CATEGORY_ICONS[cat]} alt={cat} style={{ width: 'clamp(28px, 6vw, 36px)', height: 'clamp(28px, 6vw, 36px)', objectFit: 'contain' }} />
                <span style={{ fontSize: 'clamp(0.65rem, 2.2vw, 0.75rem)', color: '#475569', lineHeight: 1.2, wordBreak: 'keep-all', textAlign: 'center' }}>{cat}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', margin: '0 0 12px' }}>최근 등록된 리콜</h3>
          {loading && (
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{ width: 'clamp(130px, 38vw, 170px)', borderRadius: '12px', background: '#fff', flexShrink: 0, aspectRatio: '2/3' }} />
              ))}
            </div>
          )}
          {!loading && recentRecalls.length === 0 && (
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '32px 0' }}>리콜 정보를 불러올 수 없습니다.</p>
          )}
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px', WebkitOverflowScrolling: 'touch' }}>
            {recentRecalls.filter(item => getRecallImages(item).length > 0).map((item) => {
              const images = getRecallImages(item)
              return (
              <Link key={item.recallSn} to={`/recall/${item.recallSn}`} state={{ items: [item] }} style={{ textDecoration: 'none', color: 'inherit', flexShrink: 0, width: 'clamp(130px, 38vw, 170px)' }}>
                <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', background: '#f1f5f9', flexShrink: 0 }}>
                    {images.length > 0 ? (
                      <img src={images[0]} alt={item.productNm} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => handleImgError(e, item.category)} />
                    ) : (
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#cbd5e1' }}>?</div>
                    )}
                  </div>
                  <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ margin: '0 0 4px' }}>
                      {(() => { const parsed = parseProductName(item.productNm); const brand = parsed?.brand || (item.makr && item.makr !== '-' ? item.makr : ''); return (
                        <>
                          {brand && <p style={{ margin: 0, fontSize: '0.6rem', color: '#94a3b8', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{brand}</p>}
                          <p style={{ margin: 0, fontSize: '0.78rem', color: '#1e293b', fontWeight: 600, wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: brand ? 1 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3 }}>{parsed?.product || item.productNm}</p>
                        </>
                      )})()}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '6px', background: '#EBF7FD', color: '#54B8DB' }}>{item.category}</span>
                      {item.recallRegDt && <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{item.recallRegDt.slice(0, 10)}</span>}
                    </div>
                  </div>
                </div>
              </Link>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
