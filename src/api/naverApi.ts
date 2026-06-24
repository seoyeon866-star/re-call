import axios from 'axios'

export interface NaverShopItem {
  title: string
  link: string
  image: string
  lprice: string
  hprice: string
  mallName: string
  productId: string
  brand: string
  category1: string
  category2: string
  category3: string
  category4: string
}

export interface NaverSearchResult {
  total: number
  items: NaverShopItem[]
}

export async function searchProducts(query: string): Promise<NaverSearchResult> {
  const { data } = await axios.get('/api/search', {
    params: { query, display: 100 },
  })
  return { total: data.total || 0, items: data.items || [] }
}
