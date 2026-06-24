import { XMLParser } from 'fast-xml-parser';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  isArray: (name) => name === 'item',
});

export default async function handler(req: any, res: any) {
  const keyword = req.query?.keyword;
  if (!keyword || typeof keyword !== 'string') {
    res.status(400).json({ error: 'Missing keyword parameter' });
    return;
  }

  try {
    const tokens = keyword.split(/\s+/).filter(Boolean);
    const searchTerms = [keyword, ...tokens].filter((v, i, a) => a.indexOf(v) === i);

    const fetchConsumer = async (term: string) => {
      const url = new URL('https://www.consumer.go.kr/openapi/recall/contents/index.do');
      url.searchParams.set('serviceKey', process.env.CONSUMER24_SERVICE_KEY!);
      url.searchParams.set('pageNo', '1');
      url.searchParams.set('cntPerPage', '50');
      url.searchParams.set('cntntsId', '0501');
      url.searchParams.set('productNm', term);
      const response = await fetch(url.toString());
      const text = await response.text();
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('json') || text.trim().startsWith('{')) {
        return JSON.parse(text);
      }
      return xmlParser.parse(text);
    };

    const rawResults = await Promise.all(searchTerms.map(fetchConsumer));

    const seen = new Set<string>();
    const merged: Record<string, unknown>[] = [];

    for (const raw of rawResults) {
      const channel = (raw as any)?.selectCntntsForOpenAPIResponse?.channel;
      const content: unknown[] = channel?.return?.content
        ? (Array.isArray(channel.return.content) ? channel.return.content : [channel.return.content])
        : [];
      for (const item of content) {
        const sn = (item as any)?.recallSn;
        if (sn && !seen.has(sn)) {
          seen.add(sn);
          merged.push(item as Record<string, unknown>);
        }
      }
    }

    const result = {
      selectCntntsForOpenAPIResponse: {
        channel: {
          return: {
            content: merged,
          },
        },
      },
    };

    res.json(result);
  } catch (err) {
    console.error('[Consumer24] exception:', err);
    res.status(500).json({ error: 'Failed to fetch from Consumer24 API' });
  }
}
