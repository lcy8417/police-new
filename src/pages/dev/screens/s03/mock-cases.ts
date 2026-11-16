import type { DenoiseState, ImageEditTool } from "@/widgets/image-edit"

// S03 이미지 편집 진열 케이스. 숫자는 시안 예시값(감정물 00001-25-0649_2, 원본 3,024 × 4,032, 자르기 1,088 × 2,964).
// 이미지 1장 편집이라 「결과 없음」 케이스가 없고, 대신 AI 노이즈제거가 도는 running · 실패한 denoise-failed 케이스를 둔다.
export const S03_CASES = ["ready", "running", "denoise-failed", "loading", "error"] as const
export type S03Case = (typeof S03_CASES)[number]

export interface S03Mock {
  status: "ready" | "loading" | "error"
  errorAt?: string
  activeTool: ImageEditTool | null
  denoiseState: DenoiseState
  /** 되돌릴 단계 수(가짜 편집 이력) */
  undoCount: number
}

export const S03_MOCK: Record<S03Case, S03Mock> = {
  ready: { status: "ready", activeTool: "crop", denoiseState: "idle", undoCount: 2 },
  running: { status: "ready", activeTool: "denoise", denoiseState: "running", undoCount: 2 },
  "denoise-failed": { status: "ready", activeTool: "denoise", denoiseState: "failed", undoCount: 2 },
  loading: { status: "loading", activeTool: null, denoiseState: "idle", undoCount: 0 },
  error: { status: "error", errorAt: "09:41", activeTool: null, denoiseState: "idle", undoCount: 0 },
}

export const S03_APRTHNG_NO = "00001-25-0649_2"
export const S03_ORIGINAL_SIZE = { width: 3024, height: 4032 }
/** 시안 「1,088 × 2,964 px」 자르기 틀 크기 */
export const S03_CROP_LABEL = "1,088 × 2,964 px"
/** 시안 족적 기울기(도) — 회전 손잡이 「−4° → 0°」 */
export const S03_TILT = -4
/** 길이측정 P3 · P4 실측(cm) — 시안 24.7 cm */
export const S03_MEASURE_CM = 24.7
