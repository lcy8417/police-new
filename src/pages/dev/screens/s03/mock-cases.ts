import type { DenoiseState, ImageEditAiSuggestion, ImageEditHistoryEntry, ImageEditTool } from "@/widgets/image-edit"

import type { SCREEN_CASES } from "../frame/dev-screens"

// S03 이미지 편집 진열 케이스. 숫자는 시안 예시값(감정물 00001-25-0649_2, 원본 3,024 × 4,032, 자르기 1,088 × 2,964).
// 이미지 1장 편집이라 「결과 없음」 케이스가 없고, 대신 AI 노이즈제거가 도는 running · 실패한 denoise-failed 케이스를 둔다.
// 케이스 이름의 단일 출처는 frame/dev-screens.ts 의 SCREEN_CASES.
export type S03Case = (typeof SCREEN_CASES.s03)[number]

export interface S03Mock {
  status: "ready" | "loading" | "error"
  errorAt?: string
  activeTool: ImageEditTool | null
  denoiseState: DenoiseState
  /** 가짜 편집 이력(되돌리기 대상 — 길이가 되돌릴 단계 수) */
  history: ImageEditHistoryEntry[]
}

/** 시안 r3 편집 이력 3줄 그대로 */
export const S03_HISTORY: ImageEditHistoryEntry[] = [
  { no: 1, label: "좌로 4° 회전", at: "09:41:12" },
  { no: 2, label: "자르기 1,088×2,964", at: "09:41:30" },
  { no: 3, label: "좌우반전(전사판)", at: "09:41:34" },
]

export const S03_MOCK: Record<S03Case, S03Mock> = {
  ready: { status: "ready", activeTool: "crop", denoiseState: "idle", history: S03_HISTORY },
  running: { status: "ready", activeTool: "denoise", denoiseState: "running", history: S03_HISTORY },
  "denoise-failed": { status: "ready", activeTool: "denoise", denoiseState: "failed", history: S03_HISTORY },
  loading: { status: "loading", activeTool: null, denoiseState: "idle", history: [] },
  error: { status: "error", errorAt: "09:41", activeTool: null, denoiseState: "idle", history: [] },
}

export const S03_APRTHNG_NO = "00001-25-0649_2"
export const S03_ORIGINAL_SIZE = { width: 3024, height: 4032 }
/** 시안 「1,088 × 2,964 px」 자르기 틀 크기(신규 끄기 — 자 인식이 없어 px 만) */
export const S03_CROP_LABEL = "1,088 × 2,964 px"
/** 시안 r3 자 인식 뒤 자르기 틀 크기(cm 덧붙임) */
export const S03_CROP_LABEL_CM = "1,088 × 2,964 px · 9.1 × 24.7 cm"
/** 시안 족적 기울기(도) — 회전 손잡이 「−4.2° → 0°」 */
export const S03_TILT = -4.2
/** 시안 A 캔버스 AI 꼬리표 */
export const S03_CANVAS_TAGS = { ruler: "1 cm = 120 px", axis: "−4.2°" }
/** 시안 원본 해시(줄인 글자) */
export const S03_HASH = "9f3a 71c0 … 4be2 c21e"
/** 시안 AI 제안 3줄 */
export const S03_AI_SUGGESTIONS: ImageEditAiSuggestion[] = [
  { id: "tilt", title: "기울기 맞추기", reason: "족적 축 −4.2°", actionLabel: "맞추기" },
  { id: "crop", title: "족적만 자르기", reason: "여백 6% 남김", actionLabel: "적용" },
  { id: "flip", title: "좌우반전", reason: "전사판채취법 사진", actionLabel: "반전", tone: "warn" },
]
/** 시안 B 두 창 머리 글자 */
export const S03_VIEWER_LABEL = "유류 이미지 · _2"
export const S03_FOUND_LABEL = "발견 이미지 · 305659"
/** 길이측정 P3 · P4 실측(cm) — 시안 24.7 cm */
export const S03_MEASURE_CM = 24.7
