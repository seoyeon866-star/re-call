import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchProducts, type NaverShopItem } from '../api/naverApi';
import { searchRecalls, type RecallItem } from '../api/consumerRecall';

type MergedItem =
  | { kind: 'product'; item: NaverShopItem; recalls: RecallItem[]; recallCount: number; score: number }
  | { kind: 'recall'; productName: string; items: RecallItem[]; score: number };

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

function preprocess(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/\([^)]*\)|\[[^\]]*\]/g, '')
    .replace(/[^a-z0-9가-힣\s]/g, '')
    .trim()
}

function buildSearchableText(r: RecallItem): string {
  return [r.productNm, r.modlNmInfo, r.makr, r.bsnmNm]
    .filter((f) => f && f !== '-' && f.trim().length > 0)
    .map((f) => preprocess(f))
    .filter(Boolean)
    .join(' ')
}

function tokenMatchCount(tokens: string[], searchableText: string): number {
  const compact = searchableText.replace(/\s+/g, '')
  return tokens.filter((t) => t.length >= 2 && compact.includes(t)).length
}

function normalizeRecallKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/\([^)]*\)|\[[^\]]*\]/g, '')
    .replace(/[^a-z0-9가-힣\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function mergeResults(
  naverItems: NaverShopItem[],
  recallItems: RecallItem[],
  query: string
): MergedItem[] {
  const queryTokens = query.toLowerCase().split(/\s+/).filter(Boolean)

  const recallGroups = new Map<string, RecallItem[]>()
  for (const r of recallItems) {
    const key = normalizeRecallKey(`${r.productNm} ${r.modlNmInfo}`)
    if (!key) continue
    if (!recallGroups.has(key)) recallGroups.set(key, [])
    recallGroups.get(key)!.push(r)
  }

  const groupSearchText = new Map<string, string>()
  for (const [key, group] of recallGroups) {
    groupSearchText.set(key, group.map((r) => buildSearchableText(r)).filter(Boolean).join(' '))
  }

  const usedKeys = new Set<string>()
  const results: MergedItem[] = naverItems.map((naver) => {
    const titleTokens = preprocess(naver.title).split(/\s+/).filter(Boolean)
    let bestKey = ''
    let bestMatchCount = 0

    for (const [key] of recallGroups) {
      const searchText = groupSearchText.get(key) || ''
      if (!searchText) continue
      const count = tokenMatchCount(titleTokens, searchText)
      if (count > bestMatchCount) {
        bestMatchCount = count
        bestKey = key
      }
    }

    if (bestKey) usedKeys.add(bestKey)

    const matchedGroup = bestKey ? (recallGroups.get(bestKey) || []) : []
    const recallCount = matchedGroup.length

    console.log({ title: naver.title, recallCount })

    const titlePlain = preprocess(naver.title)
    const score = queryTokens.filter(t => titlePlain.includes(t)).length

    return { kind: 'product', item: naver, recalls: matchedGroup, recallCount, score }
  })

  for (const [key, group] of recallGroups) {
    if (!usedKeys.has(key)) {
      const searchText = preprocess(groupSearchText.get(key) || '')
      const score = queryTokens.filter(t => searchText.includes(t)).length
      results.push({ kind: 'recall', productName: group[0].productNm, items: group, score })
    }
  }

  return results
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
  const [recallItems, setRecallItems] = useState<RecallItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setError('');
    Promise.all([
      searchProducts(query),
      searchRecalls(query).catch(() => []),
    ])
      .then(([products, recalls]) => {
        console.log('[SearchResult] naverResults:', products.length);
        console.log('[SearchResult] consumer24Results:', recalls.length);
        setNaverItems(products);
        setRecallItems(recalls);
      })
      .catch((err) => {
        setError(err.response?.data?.errorMessage || err.message);
      })
      .finally(() => setLoading(false));
  }, [query]);

  const merged = useMemo(() => {
    const deduped = deduplicateNaverItems(naverItems)
    const m = mergeResults(deduped, recallItems, query)
    m.sort((a, b) => {
      const aRecall = a.kind === 'product' ? a.recallCount : a.items.length
      const bRecall = b.kind === 'product' ? b.recallCount : b.items.length
      if ((bRecall > 0) !== (aRecall > 0)) {
        return bRecall > 0 ? 1 : -1
      }
      return b.score - a.score
    })
    console.log('[SearchResult] dedupedResults:', deduped.length, '| mergedResults:', m.length)
    return m
  }, [naverItems, recallItems])

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 16px' }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#54B8DB' }}>
        &larr; Home
      </Link>
      <h2>"{query}" 검색 결과</h2>

      {loading && <p>검색 중...</p>}
      {error && <p style={{ color: 'red' }}>오류: {error}</p>}

      {!loading && !error && merged.length === 0 && (
        <p>검색 결과가 없습니다.</p>
      )}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {merged.map((item) => {
          if (item.kind === 'product') {
            return (
              <li
                key={item.item.productId}
                style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '16px 0',
                  borderBottom: '1px solid #eee',
                  alignItems: 'flex-start',
                }}
              >
                <Link
                  to={`/product/${item.item.productId}`}
                  state={{
                    kind: 'product',
                    item: item.item,
                    recalls: item.recalls,
                    recallCount: item.recallCount,
                  }}
                  style={{ display: 'flex', gap: '16px', textDecoration: 'none', color: 'inherit', flex: 1, alignItems: 'flex-start' }}
                >
                  <img
                    src={item.item.image}
                    alt={item.item.title}
                    width={100}
                    height={100}
                    style={{ objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    {item.item.brand && (
                      <p style={{ margin: '0 0 4px', fontSize: '0.85rem', color: '#888' }}>
                        {item.item.brand}
                      </p>
                    )}
                    <h3
                      style={{ margin: 0, fontSize: '1rem' }}
                      dangerouslySetInnerHTML={{ __html: item.item.title }}
                    />
                    <div style={{ marginTop: '8px' }}>
                      <RecallBadge count={item.recallCount} />
                    </div>
                  </div>
                </Link>
              </li>
            );
          }

          const first = item.items[0];
          const imgUrl = first?.recallImgUrls?.split(',')[0]?.trim();
          return (
            <li
              key={item.productName}
              style={{
                display: 'flex',
                gap: '16px',
                padding: '16px 0',
                borderBottom: '1px solid #eee',
                alignItems: 'flex-start',
              }}
            >
              <Link
                to={`/product/${encodeURIComponent(item.productName)}`}
                state={{
                  kind: 'recall',
                  productName: item.productName,
                  items: item.items,
                }}
                style={{ display: 'flex', gap: '16px', textDecoration: 'none', color: 'inherit', flex: 1, alignItems: 'flex-start' }}
              >
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={item.productName}
                    width={100}
                    height={100}
                    style={{ objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: '8px',
                      background: '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      flexShrink: 0,
                    }}
                  >
                    ⚠️
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  {first?.makr && first.makr !== '-' && (
                    <p style={{ margin: '0 0 4px', fontSize: '0.85rem', color: '#888' }}>
                      {first.makr}
                    </p>
                  )}
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>{item.productName}</h3>
                  <div style={{ marginTop: '8px' }}>
                    <RecallBadge count={item.items.length} />
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
