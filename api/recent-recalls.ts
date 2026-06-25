import { XMLParser } from 'fast-xml-parser';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  isArray: (name) => name === 'item',
});

export default async function handler(req: any, res: any) {
  try {
    const page = req.query?.page || '1';
    const cntPerPage = req.query?.cntPerPage || '100';
    const url = new URL('https://www.consumer.go.kr/openapi/recall/contents/index.do');
    url.searchParams.set('serviceKey', process.env.CONSUMER24_SERVICE_KEY!);
    url.searchParams.set('pageNo', page);
    url.searchParams.set('cntPerPage', cntPerPage);
    url.searchParams.set('cntntsId', '0501');
    url.searchParams.set('productNm', '');

    const response = await fetch(url.toString());
    const text = await response.text();
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('json') || text.trim().startsWith('{')
      ? JSON.parse(text)
      : xmlParser.parse(text);

    const channel = (data as any)?.selectCntntsForOpenAPIResponse?.channel;
    const content: unknown[] = channel?.return?.content
      ? (Array.isArray(channel.return.content) ? channel.return.content : [channel.return.content])
      : [];

    res.json({
      items: content,
      total: channel?.return?.totalCnt || 0,
    });
  } catch (err) {
    console.error('[RecentRecalls] exception:', err);
    res.status(500).json({ error: 'Failed to fetch recent recalls' });
  }
}
