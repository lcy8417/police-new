import type { FeatureCode } from "@/entities/session"
import type { Shoe } from "@/entities/shoe"
import type { ScreenStatus } from "@/shared/lib/screen-status"
import type { FilterGroup } from "@/shared/ui/kit"

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
  /** 처음 보일 탭(기본 기본정보) */
  initialTab?: "basic" | "pattern"
}

export interface ShoeOfficeItem {
  value: string
  label: string
}

/** 카드 · 창 머리의 작업 상태(시안 칩) */
export type ShoeWorkStatus = "승인 대기" | "문양 대기" | "측면 없음" | "AI 확인 필요"

/** 카드 위 AI 표시: 숫자 = 문양 제안 확신도(0~1), scan = 지금 AI 가 읽는 중, dup = 중복 의심 */
export type ShoeCardMark = number | "scan" | "dup"

export interface ShoeCardInfo {
  status: ShoeWorkStatus
  mark?: ShoeCardMark
}

/** 분업 단계 한 칸(시안 「작업 단계」 줄) */
export interface ShoeStageInfo {
  title: string
  count: number
  /** 담당 설명(예 「등록 담당 → 문양 입력 담당」) */
  owner: string
  /** 지금 보는 단계(파랑) */
  active?: boolean
  /** 단계 아래 AI 표식 글자 */
  aiLabel?: string
  aiTone?: "ai" | "warn"
  /** AI 표식에 맥박 점(진행 중) */
  aiBusy?: boolean
}

/** 미승인 막대 + 오늘 승인 진행(시안 줄 오른쪽) */
export interface ShoeBacklogInfo {
  monthLabel: string
  total: number
  /** 막대 조각: 문양 대기 · 그룹 대기 · 승인 대기 */
  parts: { label: string; count: number; tone: "line" | "violet" | "blue" }[]
  todayDone: number
  todayLimit: number
  note: string
}

export interface ShoeStageSummary {
  stages: ShoeStageInfo[]
  backlog: ShoeBacklogInfo
}

/** 신발 하나의 AI 사전 작업 상세(레이어 창 문양정보 탭) */
export interface ShoeAiDetail {
  /** 상 · 중 · 하 AI 확신도 */
  conf: { top: number; mid: number; bottom: number }
  /** 가려진 부분(예 가격표로 18%) */
  occlusion: { percent: number; obstacle: string }
  /** 상 · 하가 같은 문양이라 한 번에 채우는 제안 */
  sameKind: { label: string; code: string; hint: string }
  /** 중복 의심 후보 */
  duplicate?: { ftwrId: string; image: string; similarity: number; registeredAt: string }
  /** 진행 흐름 칩(등록 → 문양 입력 → 현재 단계) */
  flow: { registered: string; patterned: string; current: string }
  /** 승인 조건 */
  conditions: { ok: string[]; warn?: string }
}

/** (r3) 카드 크기 */
export type ShoeCardSize = "작게" | "보통" | "크게"

/** (r3) 목록 위 빠른 찾기 — FilterBar 값 그대로(제어형). 화류번호 · 모델명 · 상표 검색 + 칩 */
export interface ShoeDbQuickFilter {
  query: string
  onQueryChange: (query: string) => void
  groups: readonly FilterGroup[]
  onGroupChange: (key: string, values: string[]) => void
  onClear: () => void
  /** 걸러진 개수 */
  resultCount: number
  /** 거르기 전 개수 */
  total: number
}

/**
 * (r3) 카드 자동 넘기기. 강조 칸만 옮기고 아무것도 열지 않는다(Enter 가 강조된 카드의 창을 연다).
 * 상태(모드 · 간격 · 재생 · 위치)는 모두 진열 페이지가 `useAutoPlay` 로 들고 있다.
 */
export interface ShoeDbAutoPlay {
  mode: "manual" | "auto"
  onModeChange: (mode: "manual" | "auto") => void
  intervalMs: number
  onIntervalChange: (ms: number) => void
  playing: boolean
  onPlayPause: () => void
  /** 전체(모든 쪽) 안에서의 위치 */
  position: { index: number; total: number }
  remainingRatio: number
  /** 강조할 카드의 화류번호(이 쪽에 없으면 아무것도 강조하지 않는다) */
  highlightId?: string
  /** ← → 로 한 칸씩 */
  onStep: (delta: 1 | -1) => void
  /** 카드 위에 마우스가 있는 동안 멈춘다 */
  onHoverChange: (hovering: boolean) => void
}

export interface ShoeDbScreenProps {
  /** 신규 · 파일럿 요소 보이기(기본 true). 끄면 지금 기능만 남는다 */
  showPlus?: boolean
  /** 동작 없는 시안 버튼을 눌렀을 때(진열 페이지가 「시안 — 기능 준비 중」을 알린다) */
  onPlusAction?: (action: string) => void
  /** 신규: 분업 단계 줄 + 미승인 막대 */
  stageSummary?: ShoeStageSummary
  /** 신규: 신발별 카드 표시(키 = 화류번호) */
  cardInfo?: Record<string, ShoeCardInfo>
  /** 신규: 신발별 AI 상세(키 = 화류번호) */
  aiDetails?: Record<string, ShoeAiDetail>
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

  /** (r3) 빠른 찾기 — 없으면 줄이 없다 */
  quick?: ShoeDbQuickFilter
  /** (r3) 카드 크기 — onCardSizeChange 가 있을 때 고르기가 보인다 */
  cardSize?: ShoeCardSize
  onCardSizeChange?: (size: ShoeCardSize) => void
  /** (r3) 목록보기 표에서 숨긴 열 key(화류번호는 못 숨김) */
  hiddenColumns?: readonly string[]
  onHiddenColumnsChange?: (keys: string[]) => void
  /** (r3) 카드 자동 넘기기 — 문양보기에서만 */
  auto?: ShoeDbAutoPlay
}
