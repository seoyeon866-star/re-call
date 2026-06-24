import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchProducts, type NaverShopItem } from '../api/naverApi';
import { searchRecalls, type RecallItem } from '../api/consumerRecall';

function normalizeTitle(title: string): string {
  return title
    .replace(/<[^>]*>/g, '')
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/bandai|반다이/g, '')
    .replace(/정품|일본|직구|1개|세트|단품|국내배송|무료배송|로켓배송|빠른배송/g, '')
    .replace(/[^가-힣a-z0-9]/g, '')
    .trim()
}

function deduplicateNaverItems(items: NaverShopItem[]): NaverShopItem[] {
  const uniqueMap = new Map<string, NaverShopItem>()
  items.forEach((item) => {
    if (/투어|여행|패키지여행|항공권|호텔|펜션|리조트|해외여행/.test(item.title.replace(/<[^>]*>/g, ''))) {
      return
    }
    if (/be found shop/i.test(item.mallName)) {
      return
    }
    const key = normalizeTitle(item.title)
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item)
    }
  })
  return [...uniqueMap.values()]
}

function clean(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractKeyword(item: NaverShopItem, fallback: string): string {
  if (item.brand && item.brand.trim()) {
    return item.brand.trim()
  }
  const title = clean(item.title)
  const genericWords = new Set(['보조배터리', '충전기', '케이블', '이어폰', '헤드폰', '마우스', '키보드', '파워뱅크', '기내반입', '고속충전', '미니', '휴대용', '대용량', '초고속', 'c타입', '8핀'])
  const parts = title.split(/\s+/).filter(Boolean)
  const specific = parts.find(p => p.length >= 2 && !genericWords.has(p))
  return specific || parts[0] || fallback
}

function matchesProduct(recall: RecallItem, product: NaverShopItem): boolean {
  const title = clean(product.title)
  const brand = clean(product.brand)

  const rName = clean(recall.productNm)
  const rModel = clean(recall.modlNmInfo)
  const rMakr = clean(recall.makr)

  if (rName && title.includes(rName)) return true
  if (rModel && rModel.length >= 3 && title.includes(rModel)) return true
  if (rMakr && rMakr.length >= 2 && title.includes(rMakr)) return true
  if (brand && rName && rName.includes(brand)) return true

  return false
}

function RecallBadge({ count }: { count: number }) {
  if (count === 0) {
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '0.85rem',
          fontWeight: 600,
          background: '#EAF7FC',
          color: '#54B8DB',
        }}
      >
        리콜 이력 없음
      </span>
    );
  }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '0.85rem',
        fontWeight: 600,
        background: '#FCEBEA',
        color: '#E63429',
      }}
    >
      리콜 이력 {count}건
    </span>
  );
}

export default function SearchResult() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query') || '';
  const [naverItems, setNaverItems] = useState<NaverShopItem[]>([]);
  const [recallMap, setRecallMap] = useState<Map<string, RecallItem[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'relevance' | 'latest'>('relevance');
  const [filterRecallOnly, setFilterRecallOnly] = useState(false);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setError('');
    setSortBy('relevance');
    setFilterRecallOnly(false);

    searchProducts(query)
      .then(async (products) => {
        setNaverItems(products);

        if (products.length === 0) {
          setLoading(false);
          return;
        }

        const results = await Promise.all(
          products.map(async (product) => {
            const keyword = extractKeyword(product, query);
            try {
              const rawRecalls = await searchRecalls(keyword);
              const matched = rawRecalls.filter(r => matchesProduct(r, product));

              if (matched.length > 0) {
                console.log('--- 상품 매칭 ---');
                console.log('상품명:', product.title.replace(/<[^>]*>/g, ''));
                matched.forEach(r => {
                  console.log('매칭된 리콜:', r.productNm, r.modlNmInfo || '', `(${r.recallSe || ''})`);
                });
                console.log('최종 카운트:', matched.length);
              }

              return { productId: product.productId, recalls: matched };
            } catch {
              return { productId: product.productId, recalls: [] as RecallItem[] };
            }
          })
        );

        setRecallMap(new Map(results.map(r => [r.productId, r.recalls])));
      })
      .catch((err) => {
        setError(err.response?.data?.errorMessage || err.message);
      })
      .finally(() => setLoading(false));
  }, [query]);

  const items = useMemo(() => {
    const deduped = deduplicateNaverItems(naverItems);
    let result = deduped.map((item) => {
      const recalls = recallMap.get(item.productId) || [];
      const latestRecallDate = recalls.reduce((latest, r) => {
        return r.recallRegDt && r.recallRegDt > latest ? r.recallRegDt : latest;
      }, '');
      return { item, recalls, recallCount: recalls.length, latestRecallDate };
    });

    if (filterRecallOnly) {
      result = result.filter((r) => r.recallCount > 0);
    }

    if (sortBy === 'latest') {
      result.sort((a, b) => {
        if (a.recallCount === 0 && b.recallCount === 0) return 0;
        if (a.recallCount === 0) return 1;
        if (b.recallCount === 0) return -1;
        return (b.latestRecallDate || '').localeCompare(a.latestRecallDate || '');
      });
    }

    return result;
  }, [naverItems, recallMap, sortBy, filterRecallOnly]);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#54B8DB', display: 'inline-block', marginBottom: '16px' }}>
        &larr; Home
      </Link>
      <h2 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', wordBreak: 'break-word' }}>&ldquo;{query}&rdquo; 검색 결과</h2>

      {loading && <p>검색 중...</p>}
      {error && <p style={{ color: 'red' }}>오류: {error}</p>}

      {!loading && !error && items.length === 0 && (
        <p>검색 결과가 없습니다.</p>
      )}

      {!loading && !error && items.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', marginBottom: '16px', padding: '10px 12px', background: '#f9f9f9', borderRadius: '8px', fontSize: '0.9rem' }}>
          <span style={{ color: '#666', whiteSpace: 'nowrap' }}>총 {items.length}개 검색 결과</span>
          <div style={{ flex: 1, minWidth: 0 }} />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'relevance' | 'latest')}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              fontSize: '0.85rem',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            <option value="relevance">관련도순</option>
            <option value="latest">최신순</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input
              type="checkbox"
              checked={filterRecallOnly}
              onChange={(e) => setFilterRecallOnly(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            리콜 이력 있는 제품만
          </label>
        </div>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map(({ item, recalls, recallCount }) => (
          <li
            key={item.productId}
            style={{
              display: 'flex',
              gap: '12px',
              padding: '14px 0',
              borderBottom: '1px solid #eee',
              alignItems: 'flex-start',
            }}
          >
            <Link
              to={`/product/${item.productId}`}
              state={{
                kind: 'product' as const,
                item,
                recalls,
                recallCount,
              }}
              style={{ display: 'flex', gap: '12px', textDecoration: 'none', color: 'inherit', flex: 1, alignItems: 'flex-start', minWidth: 0 }}
            >
              <img
                src={item.image}
                alt={item.title}
                style={{
                  width: 'clamp(72px, 25vw, 100px)',
                  height: 'clamp(72px, 25vw, 100px)',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                {item.brand && (
                  <p style={{ margin: '0 0 2px', fontSize: '0.8rem', color: '#888' }}>
                    {item.brand}
                  </p>
                )}
                <h3
                  style={{
                    margin: 0,
                    fontSize: '0.95rem',
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    wordBreak: 'break-word',
                  }}
                  dangerouslySetInnerHTML={{ __html: item.title }}
                />
                <div style={{ marginTop: '8px' }}>
                  <RecallBadge count={recallCount} />
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
