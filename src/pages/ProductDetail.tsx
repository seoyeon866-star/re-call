import { useLocation, Link } from 'react-router-dom';
import type { NaverShopItem } from '../api/naverApi';
import type { RecallItem } from '../api/consumerRecall';

interface ProductItemData {
  kind: 'product';
  item: NaverShopItem;
  recalls: RecallItem[];
  recallCount: number;
}

interface RecallItemData {
  kind: 'recall';
  productName: string;
  items: RecallItem[];
}

type DetailData = ProductItemData | RecallItemData;

export default function ProductDetail() {
  const location = useLocation();
  const data = location.state as DetailData | null;

  if (!data) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center' }}>
        <p>상품 정보를 불러올 수 없습니다.</p>
        <Link to="/search" style={{ color: '#54B8DB' }}>검색 결과로 돌아가기</Link>
      </div>
    );
  }

  if (data.kind === 'product') {
    const { item, recalls } = data;
    const hasRecall = recalls.length > 0;

    return (
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px', boxSizing: 'border-box', overflowX: 'hidden' }}>
        <Link to="/search" style={{ textDecoration: 'none', color: '#54B8DB', display: 'inline-block', marginBottom: '20px' }}>
          &larr; 검색 결과로 돌아가기
        </Link>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
          <img
            src={item.image}
            alt={item.title}
            style={{
              width: '100%',
              maxWidth: '320px',
              aspectRatio: '1/1',
              objectFit: 'cover',
              borderRadius: '12px',
              alignSelf: 'center',
            }}
          />
          <div style={{ minWidth: 0 }}>
            <h1
              style={{ margin: '0 0 8px', fontSize: 'clamp(1.2rem, 5vw, 1.5rem)', wordBreak: 'break-word' }}
              dangerouslySetInnerHTML={{ __html: item.title }}
            />
            {item.brand && <p style={{ margin: '0 0 4px', color: '#555', fontSize: '0.9rem' }}>제조사: {item.brand}</p>}
            {item.mallName && <p style={{ margin: '0 0 4px', color: '#888', fontSize: '0.9rem' }}>판매처: {item.mallName}</p>}
            {item.lprice && (
              <p style={{ margin: '0 0 12px', fontSize: 'clamp(1.1rem, 4vw, 1.25rem)', fontWeight: 700, wordBreak: 'break-word' }}>
                {Number(item.lprice).toLocaleString()}원
              </p>
            )}
            <span
              style={{
                display: 'inline-block',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: 600,
                background: hasRecall ? '#FCEBEA' : '#EAF7FC',
                color: hasRecall ? '#E63429' : '#54B8DB',
              }}
            >
              {hasRecall ? `리콜 이력 ${recalls.length}건` : '리콜 이력 없음'}
            </span>
          </div>
        </div>

        {hasRecall && (
          <div>
            <h2 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.2rem)', marginBottom: '14px' }}>리콜 상세 정보</h2>
            {recalls.map((r, i) => (
              <div
                key={r.recallSn || i}
                style={{
                  padding: '14px',
                  marginBottom: '10px',
                  borderRadius: '10px',
                  border: '1px solid #e0e0e0',
                  background: '#fafafa',
                  fontSize: '0.9rem',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                {r.productNm && <p style={{ margin: '4px 0' }}><strong>제품명:</strong> {r.productNm}</p>}
                {r.makr && r.makr !== '-' && <p style={{ margin: '4px 0' }}><strong>제조사:</strong> {r.makr}</p>}
                {r.modlNmInfo && <p style={{ margin: '4px 0' }}><strong>모델명:</strong> {r.modlNmInfo}</p>}
                {r.recallSe && <p style={{ margin: '4px 0' }}><strong>리콜 유형:</strong> {r.recallSe}</p>}
                {r.shrtcomCn && (
                  <p style={{ margin: '4px 0' }}>
                    <strong>결함 내용:</strong> {r.shrtcomCn}
                  </p>
                )}
                {r.hrmflGrad && <p style={{ margin: '4px 0' }}><strong>위해성 등급:</strong> {r.hrmflGrad}</p>}
                {r.recallRegDt && <p style={{ margin: '4px 0' }}><strong>공표일:</strong> {r.recallRegDt}</p>}
                {r.cntntsId && (
                  <p style={{ margin: '4px 0' }}>
                    <strong>원문 링크:</strong>{' '}
                    <a
                      href={`https://www.consumer24.go.kr/portal/issue/issueDetail.ibo?cntntsId=${r.cntntsId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#54B8DB', wordBreak: 'break-all' }}
                    >
                      소비자24 바로가기
                    </a>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const { productName, items } = data;
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <Link to="/search" style={{ textDecoration: 'none', color: '#54B8DB', display: 'inline-block', marginBottom: '20px' }}>
        &larr; 검색 결과로 돌아가기
      </Link>

      <h1 style={{ margin: '0 0 20px', fontSize: 'clamp(1.2rem, 5vw, 1.5rem)', wordBreak: 'break-word' }}>{productName}</h1>

      <span
        style={{
          display: 'inline-block',
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '0.9rem',
          fontWeight: 600,
          background: '#FCEBEA',
          color: '#E63429',
          marginBottom: '20px',
        }}
      >
        리콜 이력 {items.length}건
      </span>

      <div>
        {items.map((r, i) => (
          <div
            key={r.recallSn || i}
            style={{
              padding: '14px',
              marginBottom: '10px',
              borderRadius: '10px',
              border: '1px solid #e0e0e0',
              background: '#fafafa',
              fontSize: '0.9rem',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            {r.productNm && <p style={{ margin: '4px 0' }}><strong>제품명:</strong> {r.productNm}</p>}
            {r.makr && r.makr !== '-' && <p style={{ margin: '4px 0' }}><strong>제조사:</strong> {r.makr}</p>}
            {r.modlNmInfo && <p style={{ margin: '4px 0' }}><strong>모델명:</strong> {r.modlNmInfo}</p>}
            {r.recallSe && <p style={{ margin: '4px 0' }}><strong>리콜 유형:</strong> {r.recallSe}</p>}
            {r.shrtcomCn && (
              <p style={{ margin: '4px 0' }}>
                <strong>결함 내용:</strong> {r.shrtcomCn}
              </p>
            )}
            {r.hrmflGrad && <p style={{ margin: '4px 0' }}><strong>위해성 등급:</strong> {r.hrmflGrad}</p>}
            {r.recallRegDt && <p style={{ margin: '4px 0' }}><strong>공표일:</strong> {r.recallRegDt}</p>}
            {r.cntntsId && (
              <p style={{ margin: '4px 0' }}>
                <strong>원문 링크:</strong>{' '}
                <a
                  href={`https://www.consumer24.go.kr/portal/issue/issueDetail.ibo?cntntsId=${r.cntntsId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#54B8DB', wordBreak: 'break-all' }}
                >
                  소비자24 바로가기
                </a>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
