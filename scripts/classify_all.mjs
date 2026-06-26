import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
const env = Object.fromEntries(readFileSync('.env','utf8').split('\n').filter(Boolean).map(l => {const [k,...v]=l.split('='); return [k,v.join('=')]}))
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

function classify(product_nm, makr, desc) {
  const t = (product_nm + ' ' + makr + ' ' + desc).toLowerCase()
  const has = (kw) => t.includes(kw)

  // 반려동물
  if (has('pet') || has('반려') || has('cat ') || has('dog ') || has('애완') || has('동물')) {
    return ['반려동물', '']
  }

  // 차량용품
  if (has('e-scooter') || has('escooter') || has('scooter') || has('e-bike') || has('ebike') ||
      has('bicycle') || has('bike') || has('car seat') || has('cargo bike') || has('snowmobile') ||
      has('outboard motor') || has('마린') || has('boat') || has('kayak') || has('자전거') ||
      has('삼륜') || has('tricycle') || has('차량') || has('타이어') || has('헬멧') || has('helmet') && has('motor') ||
      has('motorcycle') || has('automotive') || has('brompton') || has('vehicle') ||
      has('parking heater') || has('diesel car') || has('e bike') ||
      has('사이클') && (has('안장') || has('핸들') || has('프레임') || has('튜브'))) {
    let tags = []
    if (has('fire') || has('ignite') || has('overheat')) tags.push('화재')
    if (has('electric shock') || has('electrocuted') || has('live pin') || has('감전')) tags.push('감전')
    if (has('fall') || has('injur') || has('crash') || has('상해') || has('손상') || has('crack') || has('frame')) tags.push('상해')
    if (has('burn') || has('화상')) tags.push('화상')
    if (has('choke') || has('질식')) tags.push('질식')
    return ['차량용품', tags.join(',')]
  }

  // 의류
  if (has('trouser') || has('parachute') || has('garment') || has('clothing') || has('apparel') ||
      has('의류') || has('shirt') || has('dress') || has('jacket') || has('의복') ||
      has('textile product') || has('leather product') || has('신발') || has('shoes') || has('sandal') ||
      has('feather legwarmer') || has('safety shoe') || has('boot') || has('uniform') ||
      has('sock') || has('가방') || has('bag') && !has('vaccum') && !has('vacuum') && !has('backpack') ||
      has('suit') || has('vest') || has('mask for cold') ||
      has('hat') || has('모자') || has('umbrella') || has('우산') ||
      has('belt') && !has('harness') && !has('safety belt') ||
      has('지퍼') || has('drawstring') || has('string') && desc.includes('textile')) {
    let tags = []
    if (has('fire') || has('flame') || has('화재') || has('flammable')) tags.push('화재')
    if (has('strangle') || has('entrap') || has('끈') || has('string') && has('free end')) tags.push('상해')
    if (has('chemical') || has('phthalate') || has('lead') || has('cadmium') || has('formaldehyde') || has('유해') || has('hazardous') || has('chromium') || has('nickel') || has('dinp')) tags.push('유해물질')
    if (has('상해') || has('injur') || has('needle') || has('바늘') || has('peel') || has('sharp')) tags.push('상해')
    if (has('fluorescent') || has('dimethylacetamide') || has('dmAc')) tags.push('유해물질')
    return ['의류', tags.join(',')]
  }

  // 키즈 (장난감, 유아용품, 어린이 제품)
  if ((desc.includes('children') || desc.includes('baby') || desc.includes('toddler') ||
       desc.includes('infant') || desc.includes('kids') || desc.includes('어린이') ||
       desc.includes('유아') || desc.includes('영유아') || desc.includes('아동') ||
       makr.includes('Fisher') || makr.includes('Fisher-Price') ||
       product_nm.includes('Kids') || product_nm.includes('Children') ||
       product_nm.includes('Baby') || product_nm.includes('Infant') ||
       product_nm.includes('Toddler') || has('toy') || has('doll') ||
       has('pacifier') || has('stroller') || has('유모차') ||
       has('button/coin batter') || has('button batter') ||
       has('dumbbell') || has('hobby horse') || has('cocomelon') ||
       has('pram') || has('carrier') || has('crib') || has('cot') ||
       has('walker') || has('보행기') || has('playmat') || has('rattle') ||
       has('figurine') || has('plush') || has('soother') || has('sleep suit') ||
       has('spy pen') || has('child') ||
       has('for infant') || has('for children') || has('for baby') || has('for kids') ||
       product_nm.includes('JK') || product_nm.includes('JR') ||
       has('교구') || has('완구') || has('인형') || has('블록'))) {
    let tags = []
    if (has('choke') || has('질식') || has('asphyxiation') || has('small part') || has('button') && has('battery') && has('child')) tags.push('질식')
    if (has('chemical') || has('phthalate') || has('lead') || has('cadmium') || has('formaldehyde') || has('유해') || has('hazardous') || has('chromium') || has('nickel') || has('heavy metal') || has('dinp') || has('preservative') || has('nonylphenol') || has('voc') || has('환경') || has('형광')) tags.push('유해물질')
    if (has('strangle') || has('entrap') || has('injur') || has('상해') || has('fall') || has('falling') || has('떨어짐') || has('전복') || has('drop test')) tags.push('상해')
    if (has('fire') || has('overheat') || has('ignite') || has('화재')) tags.push('화재')
    if (has('cut') || has('sharp') || has('laceration')) tags.push('상해')
    if (has('allerg') || has('알레르기')) tags.push('알레르기')
    if (has('질병') || has('disease') || has('infection')) tags.push('질병')
    return ['키즈', tags.join(',')]
  }

  // 식품·키친 (주방용품, 식품)
  if (has('juicer') || has('blender') || has('blend') || has('kettle') || has('주전자') ||
      has('food') || has('식품') || has('냄비') || has('cooker') || has('rice cooker') ||
      has('kitchen') || has('주방') || has('microwave') || has('전자레인지') ||
      has('toaster') || has('토스트') || has('커피') || has('coffee') ||
      has('gas stove') || has('gas water heater') || has('boiler') ||
      has('induction') || has('electric stove') || has('electric grill') ||
      has('fridge') || has('refrigerator') || has('thermometer') && !has('ear') ||
      has('knife') || has('칼') || has('fork') || has('spoon') ||
      has('bottle') && (has('water') || has('carbonated') || has('음료')) ||
      has('stainless steel') || has('컵') || has('cup') || has('plate') || has('접시') ||
      has('bakeware') || has('오븐') || has('oven') ||
      has('hob') || has('gas hob') || has('cooktop') ||
      has('water heater') || has('heat pump') || has('pump house') ||
      has('dry:soon') || has('airer') || has('dryer') && !has('hair') && !has('hand') ||
      has('dehumidifier') || has('laminator') || has('vacuum') ||
      has('청소기') || has('냉장') || has('냉동') || has('정수기') ||
      has('보온') || has('가열') || has('조리') ||
      has('food-waste') || has('음식물') ||
      has('evaporator') || has('drain pan') || has('hvac')) {
    let tags = []
    if (has('fire') || has('overheat') || has('ignite') || has('화재') || has('flame') || has('arcing')) tags.push('화재')
    if (has('shock') || has('감전') || has('electrocuted') || has('live part')) tags.push('감전')
    if (has('burn') || has('화상') || has('scald') || has('burst')) tags.push('화상')
    if (has('blade') || has('cut') || has('laceration') || has('injur') || has('상해') || has('break') || has('come off')) tags.push('파손,상해')
    if (has('choke') || has('질식')) tags.push('질식')
    if (has('explosion') || has('explode') || has('폭발')) tags.push('화재')
    return ['식품·키친', tags.join(',')]
  }

  // 뷰티·헬스 (화장품, 뷰티, 건강)
  if ((has('cosmetic') || has('화장') || has('beauty') || has('뷰티') ||
       has('hair') || has('curl') || has('straighten') || has('eyelash') || has('eyelid') ||
       has('nail') || has('perfume') || has('향수') || has('skincare') || has('스킨') ||
       has('double eyelid') || has('tattoo') || has('sunscreen') || has('선크림') ||
       has('shampoo') || has('샴푸') || has('바디') || has('로션') ||
       has('hairdryer') || has('hair dryer') || has('curler') || has('curling') ||
       has('마스크팩') || has('essence') || has('크림') || has('미용') ||
       has('면도') || has('shaver') || has('razor') || has('trimmer') || has('이발') ||
       has('마사지') || has('massage') || has('건강') || has('헬스') ||
       has('헤어') || has('염색') || has('barber') || has('grooming')) &&
      !has('motor') && !has('helmet')) {
    let tags = []
    if (has('burn') || has('화상') || has('overheat') || has('melt')) tags.push('화상')
    if (has('감전') || has('shock') || has('electric')) tags.push('감전')
    if (has('화재') || has('fire') || has('ignite')) tags.push('화재')
    if (has('유해') || has('chemical') || has('phthalate') || has('lead') || has('cadmium') || has('organotin') || has('harmful') || has('allerg') || has('알레르기')) tags.push('유해물질')
    if (has('temperature rise') || has('과도')) tags.push('화상')
    return ['뷰티·헬스', tags.join(',')]
  }

  // 가전·디지털
  if (has('charger') || has('adapter') || has('power bank') || has('battery') ||
      has('speaker') || has('headphone') || has('earphone') || has('cable') ||
      has('전자') || has('digital') || has('디지털') || has('기기') ||
      has('laptop') || has('notebook') || has('computer') || has('monitor') ||
      has('phone') || has('휴대폰') || has('스마트폰') || has('태블릿') ||
      has('tv') || has('television') || has('dvd') || has('player') ||
      has('camera') || has('카메라') || has('가전') ||
      has('전구') || has('led') || has('light') || has('조명') ||
      has('heater') || has('electric blanket') || has('mat') && has('heat') ||
      has('electric') || has('electrical') || has('electronic') ||
      has('fan') || has('선풍기') || has('에어컨') || has('air conditioner') ||
      has('air conditioning') || has('ac adapter') || has('power supply') ||
      has('usb') || has('wireless charger') || has('transformer') ||
      has('circuit') || has('pcb') || has('live part') || has('earthing') || has('earched') ||
      has('drill') || has('plasma') || has('heat press') || has('sprayer') ||
      has('air blower') || has('led display') || has('magnetic drill') ||
      has('round knife') || has('fabric cutting') || has('insulation') ||
      has('creepage') || has('clearance') || has('fuse') || has('plug') ||
      has('laser') || has('robot') || has('smart') || has('iot') ||
      has('switch') || has('socket') || has('콘센트') ||
      has('game') || has('gaming') || has('console') ||
      has('프린터') || has('printer') || has('scanner') ||
      has('lithium-ion') || has('power bank') || has('powercore') ||
      has('soundcore') || has('anker') || has('belkin') || has('baseus') ||
      has('boiler') || has('central heating') ||
      has('power conditioner') || has('태양광') || has('solar') ||
      has('walkie') || has('talkie') || has('radio') || has('receiver') ||
      has('air purifier') || has('공기청정') || has('humidifier') || has('가습') ||
      has('선반') || has('전기') || has('세탁') || has('세척') ||
      has('console') || has('controller') ||
      has('power supply unit') || has('psu') ||
      has('inverter') || has('converter') ||
      has('soldering') || has('전동') ||
      has('오디오') || has('audio') || has('amp') || has('amplifier') ||
      has('마이크') || has('microphone') || has('handheld') ||
      has('스피커') || has('이어폰') || has('earphone') ||
      has('전기 장판') || has('전기장판') || has('온수') || has('보일러') ||
      has('백색 가전') || has('냉장고') || has('세탁기') || has('건조기')) {
    let tags = []
    if (has('fire') || has('overheat') || has('ignite') || has('화재') || has('flame') || has('spark') || has('thermal runaway') || has('explosion') || has('연기') || has('smoke') || has('catch fire')) tags.push('화재')
    if (has('shock') || has('감전') || has('electrocuted') || has('live part') || has('live pin') || has('mains voltage') || has('earthing') || has('unearthed')) tags.push('감전')
    if (has('burn') || has('화상')) tags.push('화상')
    if (has('choke') || has('질식') || has('asphyxiation')) tags.push('질식')
    if (has('laser') || has('radiation')) tags.push('상해')
    if (has('break') || has('crack') || has('파손')) tags.push('파손')
    if (has('유해') || has('chemical') || has('phthalate') || has('lead') || has('cadmium') || has('bromine') || has('decabde')) tags.push('유해물질')
    if (has('화상') || has('temperature rise') || has('melt')) tags.push('화상')
    return ['가전·디지털', tags.join(',')]
  }

  // 생활용품
  if (has('furniture') || has('가구') || has('chair') || has('table') || has('탁자') || has('desk') ||
      has('sofa') || has('소파') || has('bed') || has('침대') || has('mattress') || has('매트') ||
      has('cushion') || has('pillow') || has('베개') || has('blind') || has('커튼') || has('curtain') ||
      has('shower') || has('샤워') || has('bath') || has('toilet') || has('욕실') || has('화장실') ||
      has('clean') || has('청소') || has('mop') || has('걸레') || has('utensil') || has('주방') ||
      has('ladder') || has('사다리') || has('step stool') || has('발판') ||
      has('door') || has('lock') || has('cylinder lock') || has('열쇠') ||
      has('mirror') || has('거울') || has('frame') || has('액자') || has('photo frame') ||
      has('rug') || has('카펫') || has('carpet') || has('floor mat') || has('깔개') ||
      has('stand') && has('mobile') || has('watch') || has('시계') ||
      has('화분') || has('pot') || has('vase') || has('꽃병') ||
      has('lighting') || has('조명기') || has('등기구') || has('lantern') || has('lamp') ||
      has('향초') || has('candle') || has('incense') || has('디퓨저') ||
      has('bath stool') || has('욕실 의자') || has('stool') ||
      has('화장대') || has('dresser') || has('chest') || has('drawer') ||
      has('건전지') || has('battery') && !has('power bank') && !has('lithium') ||
      has('sunglass') || has('glasses') || has('안경') || has('선글라스') ||
      has('watch') || has('시계') ||
      has('jewellery') || has('jewelry') || has('accessory') || has('액세서리') ||
      has('pen case') || has('필통') || has('stationery') || has('문구') ||
      has('보드') || has('board') && !has('blade') ||
      has('timer') || has('golf') || has('골프') || has('sports') && !has('bike') && !has('bicycle') &&
      has('firefighter') || has('소방') || has('face shield') || has('breathing tube') ||
      has('safety belt') || has('harness') || has('climbing') || has('등반') || has('ppe') ||
      has('life jacket') || has('life vest') || has('buoyancy') || has('구명') ||
      has('helmet') || has('안전모') || has('보호대') ||
      has('humidifier') || has('가습') || has('제습') || has('dehumidifier') ||
      has('air purif') || has('공기청정') ||
      has('pen') || has('pencil') || has('marker') || has('crayon') || has('물감') ||
      has('bathroom') || has('화장실') || has('샤워기') || has('수전') ||
      has('세면') || has('싱크') || has('sink') ||
      has('garden') || has('정원') || has('화초') || has('plant') ||
      has('시트') || has('sheet') || has('cover') || has('커버') ||
      has('tool') || has('공구') || has('toy') || has('장난감')) {
    let tags = []
    if (has('fire') || has('flame') || has('smoke') || has('화재')) tags.push('화재')
    if (has('shock') || has('감전')) tags.push('감전')
    if (has('burn') || has('화상')) tags.push('화상')
    if (has('choke') || has('질식') || has('asphyxiation')) tags.push('질식')
    if (has('chemical') || has('phthalate') || has('lead') || has('cadmium') || has('formaldehyde') || has('유해') || has('flammable')) tags.push('유해물질')
    if (has('fall') || has('injur') || has('상해') || has('drown') || has('falling') || has('break') || has('tripping') || has('laceration') || has('cut') || has('sharp') || has('fracture') || has('sprain') || has('tip') || has('topple')) tags.push('상해')
    if (has('needle') || has('barrel')) tags.push('상해')
    if (has('allerg') || has('알레르기')) tags.push('알레르기')
    if (has('질병') || has('disease')) tags.push('질병')
    if (has('파손') || has('break') || has('crack') || has('deform')) tags.push('파손')
    return ['생활용품', tags.join(',')]
  }

  // Fallback to 기타
  let tags = []
  if (has('fire') || has('overheat') || has('ignite') || has('화재') || has('flame') || has('smoke')) tags.push('화재')
  if (has('shock') || has('감전')) tags.push('감전')
  if (has('burn') || has('화상')) tags.push('화상')
  if (has('choke') || has('질식') || has('asphyxiation')) tags.push('질식')
  if (has('chemical') || has('phthalate') || has('lead') || has('cadmium') || has('formaldehyde') || has('유해')) tags.push('유해물질')
  if (has('injur') || has('fall') || has('상해') || has('cut') || has('laceration')) tags.push('상해')
  if (has('allerg') || has('알레르기')) tags.push('알레르기')
  if (has('질병') || has('disease')) tags.push('질병')
  if (has('파손') || has('break') || has('crack')) tags.push('파손')
  return ['기타', tags.join(',')]
}

const { data, error } = await sb.from('recalls').select('recall_sn,product_nm,makr,shrtcom_cn,category').eq('category','기타')
if (error) { console.error('query error:', error); process.exit(1) }

console.log('Records to classify:', data.length)
let done = 0, errors = 0
for (const r of data) {
  const [cat, tags] = classify(r.product_nm, r.makr || '', r.shrtcom_cn || '')
  const { error: e } = await sb.from('recalls').update({ category: cat, risk_tags: tags || null }).eq('recall_sn', r.recall_sn)
  if (e) { console.error(r.recall_sn, e.message); errors++ }
  else done++
  if (done % 100 === 0) console.log(`Progress: ${done}/${data.length}`)
}
console.log(`Done. Updated: ${done}, Errors: ${errors}`)
