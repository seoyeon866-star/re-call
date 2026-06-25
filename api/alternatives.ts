import { createClient } from '@supabase/supabase-js';

let _supabase: any = null;
function getSupabase() {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) _supabase = createClient(url, key);
  }
  return _supabase;
}

export default async function handler(req: any, res: any) {
  try {
    const { productNm } = req.query || {};
    if (!productNm) {
      return res.status(400).json({ error: 'Missing productNm parameter' });
    }

    const naverRes = await fetch(
      `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(productNm)}&display=10`,
      {
        headers: {
          'X-Naver-Client-Id': process.env.VITE_NAVER_CLIENT_ID!,
          'X-Naver-Client-Secret': process.env.VITE_NAVER_CLIENT_SECRET!,
        },
      }
    );

    if (!naverRes.ok) {
      return res.status(502).json({ error: 'Naver API failed' });
    }

    const naverData = await naverRes.json();
    const items: any[] = (naverData.items || []);

    const sb = getSupabase();

    const results = [];
    for (const item of items) {
      const title = item.title?.replace(/<\/?[^>]+(>|$)/g, '') || '';
      const brand = item.brand || '';
      const maker = item.maker || '';
      const tokens = [title, brand, maker].filter(Boolean);

      let hasRecall = false;
      if (sb) {
        for (const token of tokens) {
          const { data, error } = await sb
            .from('recalls')
            .select('recall_sn')
            .or(`product_nm.ilike.%${token}%,makr.ilike.%${token}%,bsnm_nm.ilike.%${token}%`)
            .not('recall_img_urls', 'is', null)
            .neq('recall_img_urls', '')
            .limit(1);
          if (!error && data && data.length > 0) {
            hasRecall = true;
            break;
          }
        }
      }

      if (!hasRecall) {
        results.push({
          title,
          link: item.link,
          image: item.image,
          lprice: item.lprice,
          brand,
          maker,
          mallName: item.mallName,
        });
      }
    }

    res.json({ items: results });
  } catch (err: any) {
    console.error('[Alternatives API]', err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
}
