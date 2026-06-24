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

export async function searchProducts(query: string): Promise<NaverShopItem[]> {
  const { data } = await axios.get('/api/search', {
    params: { query },
  })
  return data.items
}
