// 현장 이미지 보기 조정(11/17 — 감정관이 대비 · 밝기 · 감마 · 반전 · 이진화를 바꿔 가며 문양을 찾는다).
// 보기용이라 저장하지 않는다(편집 저장은 이미지 편집 탭 몫). 진열은 CSS 필터 근사 — 운영은 지금 앱 픽셀 보정
// (`features/crime-register/lib/pixel-filters.ts`)으로 바꿔 끼울 자리. 값은 다섯 걸음(−2 ~ +2)이라 클래스가 고정 글자다
// (인라인 style 금지 — Tailwind 가 읽을 수 있게 모두 글자 그대로 둔다).

/** 한 걸음(−2 ~ +2, 0 = 그대로) */
export type TuneStep = -2 | -1 | 0 | 1 | 2

/** 보기 조정 값 */
export interface ViewTune {
  /** 대비 걸음 */
  contrast: TuneStep
  /** 밝기 걸음 */
  brightness: TuneStep
  /** 감마 걸음(중간 밝기만 올리고 내림) */
  gamma: TuneStep
  /** 색 반전 */
  invert: boolean
  /** 이진화(흑백 두 값) */
  binary: boolean
}

export const DEFAULT_VIEW_TUNE: ViewTune = { contrast: 0, brightness: 0, gamma: 0, invert: false, binary: false }

export const TUNE_STEPS: readonly TuneStep[] = [-2, -1, 0, 1, 2]

const CONTRAST: Record<TuneStep, string> = { [-2]: "contrast-50", [-1]: "contrast-75", 0: "", 1: "contrast-125", 2: "contrast-150" }
const BRIGHTNESS: Record<TuneStep, string> = { [-2]: "brightness-50", [-1]: "brightness-75", 0: "", 1: "brightness-125", 2: "brightness-150" }
/** 감마 근사 — 바깥 겹에 따로 걸어(필터는 겹마다 곱해진다) 밝기 · 대비 걸음과 부딪치지 않게 */
const GAMMA: Record<TuneStep, string> = {
  [-2]: "brightness-[.82] contrast-[1.14]",
  [-1]: "brightness-[.91] contrast-[1.07]",
  0: "",
  1: "brightness-[1.09] contrast-[.94]",
  2: "brightness-[1.18] contrast-[.88]",
}
/** 이진화 근사 — 흑백 + 아주 센 대비 */
const BINARY = "grayscale contrast-[8]"

/** 감마 걸음 → 보이는 값 */
export const GAMMA_VALUE: Record<TuneStep, string> = { [-2]: "0.6", [-1]: "0.8", 0: "1.0", 1: "1.25", 2: "1.5" }

/** 그림을 감싸는 두 겹의 클래스 — outer(감마) · inner(밝기 · 대비 · 반전 · 이진화) */
export function viewTuneClass(t: ViewTune): { outer: string; inner: string } {
  const inner = [BRIGHTNESS[t.brightness], t.binary ? BINARY : CONTRAST[t.contrast], t.invert ? "invert" : ""].filter(Boolean).join(" ")
  return { outer: GAMMA[t.gamma], inner }
}

const signed = (n: number) => (n > 0 ? `+${n}` : `−${Math.abs(n)}`)

/** 켜진 조정 글자(그림 위 꼬리표 · 살펴보기 머리) — 아무것도 없으면 빈 배열 */
export function viewTuneLabels(t: ViewTune): string[] {
  const out: string[] = []
  if (t.contrast !== 0 && !t.binary) out.push(`대비 ${signed(t.contrast)}`)
  if (t.brightness !== 0) out.push(`밝기 ${signed(t.brightness)}`)
  if (t.gamma !== 0) out.push(`감마 ${GAMMA_VALUE[t.gamma]}`)
  if (t.invert) out.push("반전")
  if (t.binary) out.push("이진화")
  return out
}

/** 걸음 하나 옮기기(−2 ~ +2 에서 멈춤) */
export function stepTune(v: TuneStep, by: 1 | -1): TuneStep {
  return Math.max(-2, Math.min(2, v + by)) as TuneStep
}

// ── 확대경 ──
/** 확대경 지름(px) 범위 · 걸음 · 기본 */
export const LENS_MIN = 96
export const LENS_MAX = 240
export const LENS_STEP = 24
export const LENS_DEFAULT = 144
/** 배율 */
export type LensZoom = 2 | 3 | 4
export const LENS_ZOOMS: readonly LensZoom[] = [2, 3, 4]
/** 배율 → 고정 클래스(왼쪽 위 기준으로 키움) */
export const LENS_SCALE: Record<LensZoom, string> = { 2: "scale-200", 3: "scale-300", 4: "scale-400" }

/** 지름을 한 걸음 바꾸기(범위 안) */
export function stepLens(size: number, by: 1 | -1): number {
  return Math.max(LENS_MIN, Math.min(LENS_MAX, size + by * LENS_STEP))
}

/**
 * 확대경 안 그림의 왼쪽 위 자리(px) — 마우스 자리 (x, y) 가 지름 d 원의 한가운데 오도록.
 * 그림은 상자 크기 그대로 두고 배율 z 로 키우므로 −(x·z − d/2).
 */
export function lensOffset(x: number, y: number, zoom: number, d: number): { left: number; top: number } {
  return { left: Math.round(d / 2 - x * zoom), top: Math.round(d / 2 - y * zoom) }
}
