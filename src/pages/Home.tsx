import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

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
    <div style={{ textAlign: 'center', marginTop: '120px' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '8px' }}>Re:call</h1>
      <p style={{ color: '#666', marginBottom: '32px' }}>
        해외직구 상품을 검색해보세요
      </p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="상품명 입력 (예: 보조배터리)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: '400px',
            padding: '12px 16px',
            fontSize: '1rem',
            border: '1px solid #ccc',
            borderRadius: '8px 0 0 8px',
            outline: 'none',
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
          }}
        >
          검색
        </button>
      </form>
    </div>
  );
}
