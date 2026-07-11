/**
 * 사건 목록 카드/행에 투영되는 행 형태(`Crime`의 표시 컬럼 부분집합). 모든
 * 필드는 서버 응답에 따라 비어 있을 수 있어 optional로 둔다. 소비 측(페이지)이
 * `Crime` → `CrimeSearchRow`로 투영(`toRow`)해 목록 컴포넌트에 넘긴다.
 */
export interface CrimeSearchRow {
  crimeNumber?: string
  imageNumber?: string
  crimeName?: string
  findTime?: string
  requestOffice?: string
  findMethod?: string
}
