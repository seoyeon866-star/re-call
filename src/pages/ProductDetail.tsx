import { useLocation, Link } from 'react-router-dom'
import { getRecallImages } from '../api/consumerRecall'
import { buildRecallWithMeta, type RecallWithMeta } from '../lib/classify'

interface RecallDetailData {
  items: RecallItem[]
  fromQuery?: string
}

interface RecallItem {
  recallSn: string
  cntntsId: string
  productNm: string
  makr: string
  bsnmNm: string
  modlNmInfo: string
  shrtcomCn: string
  recallSe: string
  hrmflGrad: string
  mainSleoffic: string
  recallImgUrls: string
  injryCauseResult: string
  cnsmrGhvrTips: string
  aditfield13: string
  recallRegDt?: string
}

function DetailRow({ label, value, color }: { label: string; value: string; color?: string }) {
  if (!value || value === '-') return null
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>{label}</span>
      <span style={{ fontSize: '0.9rem', color: color || '#1e293b', lineHeight: 1.4, wordBreak: 'break-word' }}>{value}</span>
    </div>
  )
}

export default function ProductDetail() {
  const location = useLocation()
  const data = location.state as RecallDetailData | null

  if (!data || !data.items || data.items.length === 0) {
    return (
      <div style={{ padding: '64px 16px', textAlign: 'center' }}>
        <p style={{ color: '#94a3b8', marginBottom: '16px' }}>리콜 정보를 불러올 수 없습니다.</p>
        <Link to={data?.fromQuery ? `/search?query=${encodeURIComponent(data.fromQuery)}` : '/search'} style={{ color: '#3b82f6', fontSize: '0.9rem' }}>검색 결과로 돌아가기</Link>
      </div>
    )
  }

  const item: RecallWithMeta = buildRecallWithMeta(data.items[0])
  const images = getRecallImages(item)

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <div style={{ padding: '16px', position: 'sticky', top: 0, background: '#fff', zIndex: 10, borderBottom: '1px solid #f1f5f9' }}>
        <Link to={data.fromQuery ? `/search?query=${encodeURIComponent(data.fromQuery)}` : '/search'} style={{ textDecoration: 'none', color: '#64748b', fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span>&larr;</span>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>뒤로</span>
        </Link>
      </div>

      {images.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '16px', background: '#f8fafc', WebkitOverflowScrolling: 'touch' }}>
          {images.map((url, idx) => (
            <img key={idx} src={url} alt={`${item.productNm} ${idx + 1}`} style={{ width: 'clamp(120px, 40vw, 180px)', height: 'clamp(120px, 40vw, 180px)', objectFit: 'cover', borderRadius: '12px', flexShrink: 0 }} />
          ))}
        </div>
      )}

      <div style={{ padding: '16px' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(1.15rem, 4.5vw, 1.35rem)', fontWeight: 700, color: '#1e293b', lineHeight: 1.3, wordBreak: 'break-word' }}>{item.productNm}</h1>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {item.category && <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '8px', background: '#dbeafe', color: '#3b82f6', fontWeight: 600 }}>{item.category}</span>}
          {item.recallSe && <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '8px', background: '#fee2e2', color: '#ef4444', fontWeight: 600 }}>{item.recallSe}</span>}
          {item.country && <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '8px', background: '#f1f5f9', color: '#64748b' }}>{item.country}</span>}
          {item.riskTags.map(tag => (
            <span key={tag} style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '8px', background: '#fef3c7', color: '#d97706', fontWeight: 600 }}>{tag}</span>
          ))}
        </div>

        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '0 12px', marginBottom: '16px' }}>
          <DetailRow label="제품명" value={item.productNm} />
          {item.recallSe && <DetailRow label="리콜 유형" value={item.recallSe} color="#ef4444" />}
          {item.recallRegDt && <DetailRow label="공표일" value={item.recallRegDt?.slice(0, 10)} />}
          {item.makr && item.makr !== '-' && <DetailRow label="제조사" value={item.makr} />}
          {item.modlNmInfo && <DetailRow label="모델명" value={item.modlNmInfo} />}
          {item.bsnmNm && item.bsnmNm !== '-' && <DetailRow label="사업자명" value={item.bsnmNm} />}
          {item.country && <DetailRow label="제조국가" value={item.country} />}
          {item.mainSleoffic && <DetailRow label="주관기관" value={item.mainSleoffic} />}
          {item.hrmflGrad && <DetailRow label="위해성 등급" value={item.hrmflGrad} />}
        </div>

        {item.shrtcomCn && (
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', margin: '0 0 8px' }}>결함 내용</h3>
            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, margin: 0, wordBreak: 'break-word' }}>{item.shrtcomCn}</p>
          </div>
        )}

        {item.injryCauseResult && (
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', margin: '0 0 8px' }}>위해 원인</h3>
            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, margin: 0, wordBreak: 'break-word' }}>{item.injryCauseResult}</p>
          </div>
        )}

        {item.cnsmrGhvrTips && (
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', margin: '0 0 8px' }}>소비자 유의사항</h3>
            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, margin: 0, wordBreak: 'break-word' }}>{item.cnsmrGhvrTips}</p>
          </div>
        )}

        {item.cntntsId && (
          <a
            href={`https://www.consumer24.go.kr/portal/issue/issueDetail.ibo?cntntsId=${item.cntntsId}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', textAlign: 'center', padding: '12px', borderRadius: '12px', background: '#3b82f6', color: '#fff', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none', marginTop: '8px' }}
          >
            소비자24 원문 보기
          </a>
        )}
      </div>
    </div>
  )
}
