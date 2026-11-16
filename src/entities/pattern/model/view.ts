import type { PatternZone } from "./pattern"

// 문양 표시 부품(entities/pattern/ui)이 받는 값 모양. 부품은 값 · 콜백만 받는다 —
// crime 튜플 `[경로, 필수]` · shoe 이름 문자열을 이 모양으로 바꾸는 일은 부르는 쪽(위젯)이 한다(docs/pattern-data-model.md §2, 표현을 섞지 않음).

/** 4부위 — SCAS 행 순서(상 · 중 · 하 · 윤곽) */
export const PATTERN_ZONES: readonly { zone: PatternZone; label: string }[] = [
  { zone: "top", label: "상" },
  { zone: "mid", label: "중" },
  { zone: "bottom", label: "하" },
  { zone: "outline", label: "윤곽" },
]

/** 끌어 놓기에 싣는 자료 형식(지금 앱 PatternPalette · PatternZones 와 같음) — 값은 그림 경로 */
export const PATTERN_DRAG_FORMAT = "text/plain"

/** AI 추출 결과에서 끌어 온 문양 표시(값 "1") — 놓는 쪽이 AI 출처 · 확신도를 남길지 가른다(2회차 검수) */
export const PATTERN_DRAG_AI_FORMAT = "application/x-scas-pattern-ai"

/** 문양을 어디서 넣었나 — AI 추출 결과(「AI」 탭 · 추출 결과 칸) 또는 일반 문양 목록 */
export type PatternInsertOrigin = "ai" | "palette"

/** 끌어 놓은 자료가 AI 추출 결과에서 왔나 */
export function dropOrigin(data: Pick<DataTransfer, "getData">): PatternInsertOrigin {
  return data.getData(PATTERN_DRAG_AI_FORMAT) === "1" ? "ai" : "palette"
}

/** 가중치 단계 */
export type PatternWeightLevel = "low" | "normal" | "high"

/** 가중치 세그먼트 글자(짧게) · 이름 */
export const PATTERN_WEIGHT_LEVELS: readonly { level: PatternWeightLevel; short: string; label: string }[] = [
  { level: "low", short: "낮", label: "낮음" },
  { level: "normal", short: "보", label: "보통" },
  { level: "high", short: "높", label: "높음" },
]

/** 카드에 보일 가중치(crime 전용) */
export interface PatternWeightView {
  level: PatternWeightLevel
  /** 사람이 고른 값(「직접」)인가 */
  manual: boolean
  /** 마우스 설명 — 걸린 규칙 */
  why?: string
}

/** 카드 상태 — AI 제안(확인 전) · AI(확인함) · 수동 */
export type PatternCardStatus = "suggested" | "ai" | "manual"

/** 4부위 행의 문양 한 칸 */
export interface PatternCardView {
  /** 문양 이름(비교 · 이름표 — 경로 아님) */
  name: string
  /** 그림 경로(부르는 쪽이 붙여 넘김) */
  src: string
  status: PatternCardStatus
  /** 필수(crime 전용 — 없으면 필수 단추를 그리지 않음) */
  must?: boolean
  /** AI 점수 0~1 */
  score?: number
  /** AI 가 엉뚱하게 잡았을 수 있는 제안(주황) */
  doubtful?: boolean
  /** SCAS 개수(crime 전용) */
  count?: string
  /** 가중치(crime 전용) */
  weight?: PatternWeightView
}

/** 4부위 값 */
export type PatternZoneCards = Record<PatternZone, readonly PatternCardView[]>

/** 문양 목록 한 칸 */
export interface PatternLibraryItem {
  /** 그림 경로 */
  src: string
  /** 문양 이름 */
  name: string
  /** AI 점수(「AI」 탭) */
  score?: number
  /** 코드 설명(마우스 설명 · 미리보기) */
  note?: string
}

/** 문양 목록 종류 탭 */
export interface PatternLibraryTab {
  key: string
  label: string
  /** 그 종류의 문양 수 */
  count?: number
  /** AI 추출 결과 탭(글자 AI 색) */
  ai?: boolean
}
