import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

const RECOMMENDED_KEYWORDS = [
  '휴대용 선풍기',
  '모기 퇴치제',
  '완구류',
  '고속 충전기',
  '보조배터리',
  '유아용품',
  '전기장판',
  '물놀이용품',
];

export default function Home() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/search?query=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div style={{ textAlign: 'center', padding: '80px 16px 40px', boxSizing: 'border-box', maxWidth: '100vw', overflowX: 'hidden' }}>
      <h1 style={{ fontSize: 'clamp(2rem, 8vw, 3rem)', marginBottom: '8px' }}>Re:call</h1>
      <p style={{ color: '#666', marginBottom: '32px', fontSize: 'clamp(0.9rem, 3vw, 1rem)' }}>
        해외직구 상품을 검색해보세요
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', justifyContent: 'center', width: '100%', maxWidth: '480px', margin: '0 auto' }}>
        <input
          type="text"
          placeholder="상품명 입력 (예: 보조배터리)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            minWidth: 0,
            padding: '12px 16px',
            fontSize: '1rem',
            border: '1px solid #ccc',
            borderRadius: '8px 0 0 8px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '12px 24px',
            fontSize: '1rem',
            border: '1px solid #54B8DB',
            borderRadius: '0 8px 8px 0',
            background: '#54B8DB',
            color: '#fff',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          검색
        </button>
      </form>
      <div style={{ marginTop: '32px' }}>
        <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '12px' }}>추천 검색어</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', maxWidth: '480px', margin: '0 auto' }}>
          {RECOMMENDED_KEYWORDS.map((keyword) => (
            <button
              key={keyword}
              onClick={() => navigate(`/search?query=${encodeURIComponent(keyword)}`)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: '1px solid #ddd',
                background: '#fff',
                fontSize: '0.85rem',
                color: '#333',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#54B8DB';
                e.currentTarget.style.color = '#54B8DB';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#ddd';
                e.currentTarget.style.color = '#333';
              }}
            >
              {keyword}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
