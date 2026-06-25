import { useLocation, Link } from 'react-router-dom'
import type { RecallItem } from '../api/consumerRecall'
import { buildRecallWithMeta, type RecallWithMeta } from '../lib/classify'

interface RecallDetailData {
  items: RecallItem[]
}

export default function ProductDetail() {
  const location = useLocation()
  const data = location.state as RecallDetailData | null

  if (!data || !data.items || data.items.length === 0) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center' }}>
        <p>리콜 정보를 불러올 수 없습니다.</p>
        <Link to="/search" style={{ color: '#54B8DB' }}>검색 결과로 돌아가기</Link>
      </div>
    )
  }

  const items: RecallWithMeta[] = data.items.map(buildRecallWithMeta)

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <Link to="/search" style={{ textDecoration: 'none', color: '#54B8DB', display: 'inline-block', marginBottom: '20px' }}>
        &larr; 검색 결과로 돌아가기
      </Link>

      <span style={{ display: 'inline-block', padding: '6px 14px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600, background: '#FCEBEA', color: '#E63429', marginBottom: '20px' }}>
        리콜 이력 {items.length}건
      </span>

      {items.map((item, i) => (
        <div key={item.recallSn || i} style={{ padding: '16px', marginBottom: '12px', borderRadius: '10px', border: '1px solid #e0e0e0', background: '#fafafa', fontSize: '0.9rem', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 'clamp(1.1rem, 4vw, 1.3rem)' }}>{item.productNm}</h2>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', padding: '3px 10px', borderRadius: '12px', background: '#e8f4f8', color: '#54B8DB' }}>{item.category}</span>
            {item.recallSe && <span style={{ fontSize: '0.8rem', padding: '3px 10px', borderRadius: '12px', background: '#fcebea', color: '#e63429' }}>{item.recallSe}</span>}
            {item.country && <span style={{ fontSize: '0.8rem', padding: '3px 10px', borderRadius: '12px', background: '#f0f0f0', color: '#666' }}>{item.country}</span>}
            {item.riskTags.map(tag => (
              <span key={tag} style={{ fontSize: '0.8rem', padding: '3px 10px', borderRadius: '12px', background: '#fff3e0', color: '#e65100' }}>{tag}</span>
            ))}
          </div>

          {item.makr && item.makr !== '-' && <p style={{ margin: '6px 0' }}><strong>제조사:</strong> {item.makr}</p>}
          {item.modlNmInfo && <p style={{ margin: '6px 0' }}><strong>모델명:</strong> {item.modlNmInfo}</p>}
          {item.recallSe && <p style={{ margin: '6px 0' }}><strong>리콜 유형:</strong> {item.recallSe}</p>}
          {item.recallRegDt && <p style={{ margin: '6px 0' }}><strong>공표일:</strong> {item.recallRegDt}</p>}
          {item.shrtcomCn && <p style={{ margin: '6px 0' }}><strong>결함 내용:</strong> {item.shrtcomCn}</p>}
          {item.injryCauseResult && <p style={{ margin: '6px 0' }}><strong>위해 원인:</strong> {item.injryCauseResult}</p>}
          {item.bsnmNm && item.bsnmNm !== '-' && <p style={{ margin: '6px 0' }}><strong>사업자명:</strong> {item.bsnmNm}</p>}
          {item.cnsmrGhvrTips && <p style={{ margin: '6px 0' }}><strong>소비자 유의사항:</strong> {item.cnsmrGhvrTips}</p>}
          {item.hrmflGrad && <p style={{ margin: '6px 0' }}><strong>위해성 등급:</strong> {item.hrmflGrad}</p>}
          {item.mainSleoffic && <p style={{ margin: '6px 0' }}><strong>주관기관:</strong> {item.mainSleoffic}</p>}
          {item.cntntsId && (
            <p style={{ margin: '6px 0' }}>
              <strong>원문:</strong>{' '}
              <a href={`https://www.consumer24.go.kr/portal/issue/issueDetail.ibo?cntntsId=${item.cntntsId}`} target="_blank" rel="noopener noreferrer" style={{ color: '#54B8DB', wordBreak: 'break-all' }}>
                소비자24 바로가기
              </a>
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
