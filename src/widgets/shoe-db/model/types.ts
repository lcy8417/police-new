import type { FeatureCode } from "@/entities/session"
import type { Shoe } from "@/entities/shoe"
import type { ScreenStatus } from "@/shared/lib/screen-status"

/** 검색 폼 값. 라디오는 문자열 한 값, 값이 없으면 빈 문자열. 모두 제어형(화면이 보관하지 않는다). */
export interface ShoeDbFilters {
  /** 화류번호(신발 ID) — 문자열 그대로(앞자리 0 보존) */
  ftwrId: string
  /** 제조사(제조사코드) */
  makrCode: string
  /** 성별: all | M | F | mix */
  sex: string
  /** 등록일자 시작 `YYYY-MM-DD` */
  regFrom: string
  /** 등록일자 끝 `YYYY-MM-DD` */
  regTo: string
  /** 상표(상표코드) */
  brandCode: string
  /** 승인: all | yes | no */
  approval: string
  /** 등록관서(Combobox 값, 없으면 null) */
  office: string | null
  /** 그룹명 */
  groupNm: string
  /** 문양 입력: all | in | out */
  patternInput: string
  /** 화종 */
  shoeKind: string
  /** 비고 */
  remark: string
}

/** 목록보기(표) / 문양보기(카드). */
export type ShoeDbView = "list" | "pattern"

/** 레이어 창(신발정보관리) 상태. 한 겹뿐이다. */
export interface ShoeDialogState {
  /** new = 신규 등록, edit = 기존 신발 수정(ID 잠김) */
  mode: "new" | "edit"
  /** 입력 중인 값 — 엔티티 `Shoe` 모양 그대로 */
  form: Shoe
  /** 저장 실패 문구(서버가 주는 한국어 그대로, 예 「이미 등록된 번호입니다」) */
  saveError?: string
}

export interface ShoeOfficeItem {
  value: string
  label: string
}

export interface ShoeDbScreenProps {
  status: ScreenStatus
  /** 조회 실패 시각 「시:분」 */
  errorAt?: string
  onRetry: () => void
  isAdmin: boolean
  features: readonly FeatureCode[]

  filters: ShoeDbFilters
  onFiltersChange: (next: ShoeDbFilters) => void
  officeItems: ShoeOfficeItem[]
  onSearch: () => void
  onReset: () => void

  view: ShoeDbView
  onViewChange: (view: ShoeDbView) => void

  shoes: Shoe[]
  /** 전체 건수(페이지 밖 포함) */
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void

  selectedId?: string
  /** 행 · 카드 눌림 — 같은 자리 레이어 창을 연다 */
  onOpenShoe: (ftwrId: string) => void
  /** 「등록」 — 쓰기 권한이 있을 때만 버튼이 있다 */
  onRegister: () => void

  /** 레이어 창. null 이면 닫힘 */
  dialog: ShoeDialogState | null
  onFormChange: (form: Shoe) => void
  onSave: () => void
  onCloseDialog: () => void
  /** 이미지 등록 · 교체 */
  onReplaceImage: () => void
  /** 이미지 회전 */
  onRotateImage: () => void
}
