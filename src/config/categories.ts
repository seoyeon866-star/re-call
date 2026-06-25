export interface CategoryRule {
  category: string
  keywords: string[]
}

export const CATEGORY_RULES: CategoryRule[] = [
  { category: '유아동', keywords: ['유아', '신생아', '아기', '베이비', '이유식', '유모차', '젖병', '턱받이', '아동', '키즈', '분유', '기저귀', '물티슈'] },
  { category: '완구류', keywords: ['장난감', '인형', '블록', '레고', '피규어', '퍼즐', '보드게임', '물놀이', '공', '드론', 'RC'] },
  { category: '화장품', keywords: ['화장품', '크림', '로션', '향수', '립스틱', '마스크팩', '에센스', '선크림', '자외선', '바디', '샴푸', '클렌징'] },
  { category: '의류', keywords: ['의류', '옷', '점퍼', '티셔츠', '바지', '신발', '자켓', '코트', '운동화', '샌들', '슬리퍼'] },
  { category: '전자제품', keywords: ['보조배터리', '충전기', '배터리', '전원', 'USB', '케이블', '이어폰', '헤드폰', '어댑터', '전기', 'LED', '램프', '조명'] },
  { category: '생활용품', keywords: ['세제', '방향제', '탈취제', '청소용품', '생활', '수납', '정리', '다리미'] },
  { category: '주방용품', keywords: ['주방', '냄비', '프라이팬', '그릇', '컵', '머그', '칼', '도마', '주전자', '에어프라이어'] },
  { category: '욕실용품', keywords: ['욕실', '샤워', '비누', '칫솔', '치약', '수건', '샤워기', '욕조'] },
  { category: '식품류', keywords: ['식품', '과자', '음료', '분유', '건강식품', '젤리', '사탕', '초콜릿', '캔디', '비스킷'] },
  { category: '반려동물용품', keywords: ['반려동물', '강아지', '고양이', '사료', '간식', '펫', '애완', '배변'] },
]

export const CATEGORIES = CATEGORY_RULES.map(r => r.category)
