import type { FeatureCode } from "@/entities/session"
import type { ScreenStatus } from "@/shared/lib/screen-status"

// 출처: SCAS 사건관리 목록 열 25개(시안 s01-case-list.js 의 SCAS 표) + 지금 앱 `Crime`(aprthngNo · crimeNm · rqestGrfcNm ·
// frstRegistDt). 지금 앱에는 목록 전용 응답 타입이 없어(`fetchCrimeList` 는 `Crime[]`) 화면이 그리는 열만 최소로 정의한다.
// 값이 없는 칸은 빈 문자열(화면이 「—」로 보인다). 감정번호는 문자열(앞자리 0 보존).
export interface CaseListRow {
  /** 감정번호(예 `00001-25-0646`) — 행 클릭 시 상세로 넘기는 키 */
  aprthngNo: string
  /** 문서번호 */
  docNo: string
  /** 사건명 */
  caseName: string
  /** 의뢰관서 */
  requestOffice: string
  /** SCAS 사건번호 */
  scasNo: string
  /** 처리관서(SCAS 열 전체 보기에서만) */
  processOffice: string
  /** 발생관서 */
  occurOffice: string
  /** 처리 구분: 현장 = DB 검색, 대조 = 용의자 신발과 1:1 */
  kind: "현장" | "대조"
  /** 신발 · 타이어 파일 수 */
  shoeCount: number
  tireCount: number
  suspect: "유" | "무"
  /** 등록일자 `YYYY-MM-DD` */
  registeredAt: string
  /** 결과확인 완료일자(SCAS 열 전체 보기에서만, 없으면 빈 문자열) */
  confirmedAt: string
  /** 사건 결과(SCAS 열 전체 보기에서만) */
  caseResult: string
  /** 접수자(SCAS 열 전체 보기에서만) */
  receiver: string
  /** 작성자(SCAS 열 전체 보기에서만) */
  author: string
  /** 결과: 이미지 장수 */
  results: { found: number; missed: number; unable: number }
  /** 진행상태: 이미지 장수 */
  progress: { registered: number; searched: number; confirmed: number }
  /** 이미지 칸 축소판 그림 주소 */
  thumbSrc: string
}

/** SCAS 검색 폼 값(전부 문자열 — 비어 있으면 「전체」 · 조건 없음) */
export interface CaseListFilters {
  aprthngNo: string
  docNo: string
  caseName: string
  registeredFrom: string
  registeredTo: string
  victim: string
  kind: "all" | "shoe" | "tire"
  place: string
  arrested: string
  author: string
  processOffice: string
  requestOffice: string
  occurOffice: string
  caseResult: string
  /** ☐ 결과 확인 전 */
  awaitingResult: boolean
  otherOrg: string
}

export interface CaseListScreenProps {
  /** loading · error · empty · ready — 조회 실패를 「결과 없음」으로 덮지 않는다 */
  status: ScreenStatus
  /** 조회 실패를 확인한 시각 `시:분`(error 에서만) */
  errorAt?: string
  onRetry: () => void
  isAdmin: boolean
  features: readonly FeatureCode[]
  rows: readonly CaseListRow[]
  /** 조건에 맞는 전체 건수(모르면 생략) */
  total?: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  filters: CaseListFilters
  onFiltersChange: (next: CaseListFilters) => void
  onSearch: () => void
  onReset: () => void
  /** 행(또는 이미지)을 눌러 사건 상세로 */
  onOpenCase: (aprthngNo: string) => void
  /** 사건 등록(권한 있을 때만 버튼이 보인다) */
  onRegister: () => void
  /** 행 끝 「검색」 — 문양 코딩 · 검색으로 */
  onSearchCase: (aprthngNo: string) => void
  /** 행 끝 「확인」 — 검색 결과 확인으로 */
  onConfirmCase: (aprthngNo: string) => void
}
