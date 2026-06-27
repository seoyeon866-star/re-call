import { useEffect, useState } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { getRecallImages, handleImgError } from '../api/consumerRecall'
import { buildRecallWithMeta, RISK_ICONS, type RecallWithMeta } from '../lib/classify'

interface AltProduct {
  title: string
  link: string
  image: string
  lprice: string
  brand: string
  maker: string
  mallName: string
}

function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value || value === '-') return null
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
      <p style={{ margin: '0 0 2px', fontSize: '0.78rem', color: '#94a3b8' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e293b' }}>{value}</p>
    </div>
  )
}

export default function ProductDetail() {
  const location = useLocation()
  const data = location.state as { items: any[]; fromQuery?: string } | null

  const [altItems, setAltItems] = useState<AltProduct[]>([])

  const item: RecallWithMeta | null = data?.items?.[0]
    ? buildRecallWithMeta(data.items[0])
    : null

  const navigate = useNavigate()

  useEffect(() => {
    if (!item) return
    const name = item.productNm
    if (!name) return
    fetch(`/api/alternatives?productNm=${encodeURIComponent(name)}`)
      .then(r => r.json())
      .then(data => {
        if (data.items) setAltItems(data.items)
      })
      .catch(() => {})
  }, [item?.recallSn])

  if (!item) {
    return (
      <div style={{ minHeight: '100vh', background: '#F4FBFD', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '40px' }}>
        <p style={{ color: '#94a3b8' }}>리콜 정보를 불러올 수 없습니다.</p>
        <Link to="/search" style={{ color: '#54B8DB', fontSize: '0.9rem' }}>검색 결과로 돌아가기</Link>
      </div>
    )
  }

  const images = getRecallImages(item)

  return (
    <div style={{ minHeight: '100vh', background: '#F4FBFD', boxSizing: 'border-box' }}>
      {/* ── Header ── */}
      <div style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#54B8DB', fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}>
          <span style={{ fontSize: '1.1rem' }}>&larr;</span> 뒤로
        </button>
        <Link to="/" style={{ textDecoration: 'none', color: '#54B8DB', fontSize: '0.9rem', fontWeight: 500 }}>
          검색
        </Link>
      </div>

      {/* ── Image ── */}
      <div style={{ background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'clamp(200px, 50vw, 320px)' }}>
        {images.length > 0 ? (
          <img src={images[0]} alt={item.productNm} style={{ width: '100%', maxHeight: 'clamp(200px, 50vw, 320px)', objectFit: 'cover' }} onError={(e) => handleImgError(e, item.category)} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: '#cbd5e1', width: '100%', height: 'clamp(200px, 50vw, 320px)' }}>
            ?
          </div>
        )}
      </div>

      {/* ── Product info card ── */}
      <div style={{ margin: '-20px 16px 0', background: '#fff', borderRadius: '20px', padding: '24px', position: 'relative', zIndex: 1, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        {item.makr && item.makr !== '-' && (
          <p style={{ margin: '0 0 4px', fontSize: '0.8rem', color: '#94a3b8' }}>{item.makr}</p>
        )}
        <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(1.2rem, 5vw, 1.4rem)', fontWeight: 700, color: '#1e293b', lineHeight: 1.3, wordBreak: 'break-word' }}>
          {item.productNm}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {item.riskTags.map(tag => (
            <span key={tag} style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', background: '#FCEBEA', color: '#E63429', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
              {RISK_ICONS[tag] && <img src={RISK_ICONS[tag]} alt={tag} style={{ width: '12px', height: '12px' }} />}
              {tag}
            </span>
          ))}
          <span style={{ fontSize: '0.82rem', color: '#94a3b8', marginLeft: '4px' }}>
            {item.recallRegDt?.slice(0, 7).replace('-', '.')} · {item.recallSe || '리콜'}
          </span>
        </div>

        {/* ── Defect section ── */}
        <div style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', margin: '0 0 10px' }}>결함 내용</h2>
          <div style={{ background: '#FEF2F2', borderRadius: '12px', padding: '16px' }}>
            {item.riskTags.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {item.riskTags.map(tag => (
                  <span key={tag} style={{ fontSize: '12px', padding: '2px 4px', borderRadius: '6px', background: '#FCEBEA', color: '#E63429', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                    {RISK_ICONS[tag] && <img src={RISK_ICONS[tag]} alt={tag} style={{ width: '12px', height: '12px' }} />}
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e293b', lineHeight: 1.6, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{item.shrtcomCn || '정보 없음'}</p>
          </div>
        </div>

        {/* ── Product info ── */}
        <div style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', margin: '0 0 10px' }}>제품 정보</h2>
          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '0 14px' }}>
            {item.modlNmInfo && <InfoRow label="모델명" value={item.modlNmInfo} />}
            {item.makr && item.makr !== '-' && <InfoRow label="제조사" value={item.makr} />}
            {item.bsnmNm && item.bsnmNm !== '-' && <InfoRow label="사업자명" value={item.bsnmNm} />}
            {item.recallRegDt && <InfoRow label="공표일" value={item.recallRegDt?.slice(0, 10)} />}
            {item.country && <InfoRow label="제조국가" value={item.country} />}
            {item.mainSleoffic && <InfoRow label="주관기관" value={item.mainSleoffic} />}
            {(item as any).agencyName && (
              <InfoRow label="리콜 공표기관" value={(item as any).agencyName} />
            )}
            <div style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
              <p style={{ margin: '0 0 2px', fontSize: '0.78rem', color: '#94a3b8' }}>공표문</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {item.cntntsId && (
                  <a href={`https://www.consumer24.go.kr/portal/issue/issueDetail.ibo?cntntsId=${item.cntntsId}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', color: '#54B8DB', textDecoration: 'none', fontWeight: 500 }}>
                    소비자24 원문 →
                  </a>
                )}
                {(item as any).infoCreatUrl && (
                  <a href={(item as any).infoCreatUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', color: '#54B8DB', textDecoration: 'none', fontWeight: 500 }}>
                    원본 리콜 공고 →
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Alternative products ── */}
      {altItems.length > 0 && (
        <div style={{ padding: '24px 16px 32px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', margin: '0 0 4px' }}>대체상품 추천</h2>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0 0 16px' }}>리콜 이력이 없는 유사 상품입니다.</p>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px', WebkitOverflowScrolling: 'touch' }}>
            {altItems.slice(0, 6).map((alt, idx) => (
              <a key={idx} href={alt.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', flexShrink: 0, width: 'clamp(120px, 35vw, 160px)' }}>
                <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                  <div style={{ width: '100%', aspectRatio: '1/1', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#cbd5e1' }}>
                    {alt.image ? (
                      <img src={alt.image} alt={alt.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : '?'}
                  </div>
                  <div style={{ padding: '10px' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '0.78rem', color: '#1e293b', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3 }}>{alt.title}</p>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '8px', fontSize: '0.68rem', fontWeight: 600, background: '#dcfce7', color: '#16a34a' }}>리콜이력없음</span>
                    {alt.lprice && <span style={{ display: 'block', marginTop: '4px', fontSize: '0.75rem', color: '#64748b' }}>{Number(alt.lprice).toLocaleString()}원</span>}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── More button ── */}
      {item.category && item.category !== '기타' && (
        <div style={{ padding: '0 16px 32px', textAlign: 'center' }}>
          <Link to={`/search?category=${encodeURIComponent(item.category)}`} style={{ display: 'inline-block', padding: '12px 32px', borderRadius: '12px', background: '#54B8DB', color: '#fff', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}>
            {item.category} 전체보기
          </Link>
        </div>
      )}
    </div>
  )
}
