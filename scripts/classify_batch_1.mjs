import { readFileSync, writeFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env','utf8').split('\n').filter(Boolean).map(l => {
    const [k,...v] = l.split('=')
    return [k, v.join('=')]
  })
)
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// recall_sn -> { category, risk_tags }
const CLASSIFICATIONS = {
  'RCLL_000000000567816': { category: '차량용품', risk_tags: ['상해'] },
  'RCLL_000000000567809': { category: '차량용품', risk_tags: ['상해'] },
  'RCLL_000000000567817': { category: '차량용품', risk_tags: ['상해'] },
  'RCLL_000000000567722': { category: '차량용품', risk_tags: ['상해'] },
  'RCLL_000000000564813': { category: '가전·디지털', risk_tags: ['감전', '화재'] },
  'RCLL_000000000567720': { category: '차량용품', risk_tags: ['상해'] },
  'RCLL_000000000568512': { category: '차량용품', risk_tags: ['상해'] },
  'RCLL_000000000597029': { category: '가전·디지털', risk_tags: ['화재'] },
  'RCLL_000000000601234': { category: '기타', risk_tags: ['질식'] },
  'RCLL_000000000601236': { category: '가전·디지털', risk_tags: ['파손'] },
  'RCLL_000000000597489': { category: '식품·키친', risk_tags: ['상해', '파손'] },
  'RCLL_000000000601051': { category: '가전·디지털', risk_tags: ['감전', '화재'] },
  'RCLL_000000000599500': { category: '차량용품', risk_tags: ['상해'] },
  'RCLL_000000000599921': { category: '가전·디지털', risk_tags: ['화재'] },
  'RCLL_000000000599444': { category: '키즈', risk_tags: ['유해물질'] },
  'RCLL_000000000599428': { category: '식품·키친', risk_tags: ['파손', '상해'] },
  'RCLL_000000000599912': { category: '키즈', risk_tags: ['질식'] },
  'RCLL_000000000568516': { category: '차량용품', risk_tags: ['상해'] },
  'RCLL_000000000597570': { category: '차량용품', risk_tags: ['상해'] },
  'RCLL_000000000599439': { category: '가전·디지털', risk_tags: ['화재'] },
  'RCLL_000000000599441': { category: '의류', risk_tags: ['파손', '상해'] },
  'RCLL_000000000597976': { category: '차량용품', risk_tags: ['상해'] },
  'RCLL_000000000596956': { category: '가전·디지털', risk_tags: ['감전'] },
  'RCLL_000000000574168': { category: '뷰티·헬스', risk_tags: [] },
  'RCLL_000000000568511': { category: '차량용품', risk_tags: ['상해'] },
  'RCLL_000000000587066': { category: '식품·키친', risk_tags: ['파손'] },
  'RCLL_000000000594236': { category: '뷰티·헬스', risk_tags: ['상해'] },
  'RCLL_000000000594233': { category: '키즈', risk_tags: ['질식'] },
  'RCLL_000000000593416': { category: '키즈', risk_tags: ['상해'] },
  'RCLL_000000000592826': { category: '가전·디지털', risk_tags: ['화재'] },
  'RCLL_000000000592815': { category: '생활용품', risk_tags: ['상해'] },
  'RCLL_000000000591280': { category: '생활용품', risk_tags: ['파손', '상해'] },
  'RCLL_000000000573724': { category: '생활용품', risk_tags: ['파손', '상해'] },
  'RCLL_000000000573718': { category: '키즈', risk_tags: ['상해'] },
  'RCLL_000000000573694': { category: '가전·디지털', risk_tags: ['화재'] },
  'RCLL_000000000590275': { category: '의류', risk_tags: ['파손', '상해'] },
  'RCLL_000000000590279': { category: '가전·디지털', risk_tags: ['화재'] },
  'RCLL_000000000589995': { category: '의류', risk_tags: ['상해'] },
  'RCLL_000000000588076': { category: '가전·디지털', risk_tags: ['감전'] },
  'RCLL_000000000573244': { category: '차량용품', risk_tags: ['유해물질'] },
  'RCLL_000000000573240': { category: '차량용품', risk_tags: ['화재'] },
  'RCLL_000000000568514': { category: '차량용품', risk_tags: ['상해'] },
  'RCLL_000000000568519': { category: '차량용품', risk_tags: ['상해'] },
  'RCLL_000000000573121': { category: '생활용품', risk_tags: ['질식'] },
  'RCLL_000000000573107': { category: '차량용품', risk_tags: ['상해'] },
  'RCLL_000000000587067': { category: '키즈', risk_tags: ['질식'] },
  'RCLL_000000000587032': { category: '가전·디지털', risk_tags: ['화재'] },
  'RCLL_000000000586277': { category: '생활용품', risk_tags: ['상해'] },
  'RCLL_000000000585716': { category: '가전·디지털', risk_tags: ['화재', '감전'] },
  'RCLL_000000000585703': { category: '생활용품', risk_tags: ['감전'] },
  'RCLL_000000000587036': { category: '식품·키친', risk_tags: ['화상'] },
  'RCLL_000000000585825': { category: '키즈', risk_tags: ['유해물질'] },
  'RCLL_000000000568509': { category: '차량용품', risk_tags: ['상해'] },
  'RCLL_000000000585809': { category: '가전·디지털', risk_tags: ['화재'] },
  'RCLL_000000000585817': { category: '키즈', risk_tags: ['유해물질'] },
  'RCLL_000000000585832': { category: '키즈', risk_tags: ['유해물질'] },
  'RCLL_000000000585839': { category: '차량용품', risk_tags: ['상해'] },
  'RCLL_000000000585835': { category: '키즈', risk_tags: ['유해물질'] },
  'RCLL_000000000585718': { category: '가전·디지털', risk_tags: ['화재', '감전'] },
  'RCLL_000000000585836': { category: '키즈', risk_tags: ['상해'] },
  'RCLL_000000000585720': { category: '생활용품', risk_tags: ['파손', '상해'] },
  'RCLL_000000000585722': { category: '의류', risk_tags: ['유해물질'] },
  'RCLL_000000000572856': { category: '생활용품', risk_tags: ['화재', '화상'] },
  'RCLL_000000000572848': { category: '키즈', risk_tags: ['상해'] },
  'RCLL_000000000572842': { category: '차량용품', risk_tags: ['상해'] },
  'RCLL_000000000572837': { category: '차량용품', risk_tags: ['상해'] },
  'RCLL_000000000572838': { category: '차량용품', risk_tags: ['상해'] },
  'RCLL_000000000572835': { category: '차량용품', risk_tags: ['상해'] },
  'RCLL_000000000584682': { category: '가전·디지털', risk_tags: ['화재'] },
  'RCLL_000000000584315': { category: '키즈', risk_tags: ['질식'] },
  'RCLL_000000000582556': { category: '기타', risk_tags: ['상해'] },
  'RCLL_000000000582523': { category: '생활용품', risk_tags: ['파손', '상해'] },
  'RCLL_000000000582529': { category: '생활용품', risk_tags: ['파손', '상해'] },
  'RCLL_000000000582525': { category: '생활용품', risk_tags: ['파손', '상해'] },
  'RCLL_000000000581921': { category: '키즈', risk_tags: ['유해물질'] },
  'RCLL_000000000581926': { category: '뷰티·헬스', risk_tags: ['유해물질'] },
  'RCLL_000000000581826': { category: '키즈', risk_tags: ['유해물질'] },
  'RCLL_000000000581817': { category: '뷰티·헬스', risk_tags: ['화상'] },
  'RCLL_000000000581928': { category: '키즈', risk_tags: ['유해물질'] },
  'RCLL_000000000581331': { category: '생활용품', risk_tags: ['질식'] },
  'RCLL_000000000581844': { category: '생활용품', risk_tags: ['화재'] },
  'RCLL_000000000581918': { category: '키즈', risk_tags: ['유해물질'] },
  'RCLL_000000000581834': { category: '키즈', risk_tags: ['상해'] },
  'RCLL_000000000581771': { category: '의류', risk_tags: ['파손'] },
  'RCLL_000000000581311': { category: '생활용품', risk_tags: ['질식'] },
  'RCLL_000000000581071': { category: '키즈', risk_tags: ['유해물질'] },
  'RCLL_000000000581327': { category: '가전·디지털', risk_tags: ['화재'] },
  'RCLL_000000000581328': { category: '차량용품', risk_tags: ['상해'] },
  'RCLL_000000000581317': { category: '생활용품', risk_tags: ['질식'] },
  'RCLL_000000000581070': { category: '키즈', risk_tags: ['상해'] },
  'RCLL_000000000581330': { category: '키즈', risk_tags: ['질병'] },
  'RCLL_000000000581310': { category: '차량용품', risk_tags: ['상해'] },
  'RCLL_000000000580816': { category: '키즈', risk_tags: ['질식'] },
  'RCLL_000000000571914': { category: '생활용품', risk_tags: ['질병', '알레르기'] },
  'RCLL_000000000571913': { category: '식품·키친', risk_tags: ['화상', '상해'] },
  'RCLL_000000000580815': { category: '생활용품', risk_tags: ['화재'] },
  'RCLL_000000000580813': { category: '가전·디지털', risk_tags: ['감전'] },
  'RCLL_000000000580818': { category: '생활용품', risk_tags: ['화재'] },
  'RCLL_000000000580433': { category: '키즈', risk_tags: ['상해'] },
  'RCLL_000000000580435': { category: '키즈', risk_tags: ['질식'] },
}

let updated = 0
for (const [sn, cls] of Object.entries(CLASSIFICATIONS)) {
  const tags = cls.risk_tags.length > 0 ? cls.risk_tags.join(',') : null
  const { error } = await sb.from('recalls')
    .update({ category: cls.category, risk_tags: tags })
    .eq('recall_sn', sn)
  if (error) console.error('Error:', sn, error.message)
  else updated++
}

console.log(`Batch 1 done: ${updated} records updated`)
