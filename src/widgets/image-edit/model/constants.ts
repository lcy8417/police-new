import type { EvidenceLook } from "@/shared/ui/viewer"

import type { ViewAdjustments } from "./types"

/** SCAS 이미지 커팅 · 이미지 뷰어 아래 버튼 줄 — 이름 · 순서 그대로(시안 핀 1) */
export const SCAS_BOTTOM_BUTTONS = ["처음상태", "평준화", "색상반전", "좌우반전", "밝게", "어둡게", "상하반전"] as const
export type ScasBottomButton = (typeof SCAS_BOTTOM_BUTTONS)[number]

/** 보기 설정 기본값(지금 앱 `DEFAULT_ADJUSTMENTS`와 같음) */
export const DEFAULT_VIEW_ADJUSTMENTS: ViewAdjustments = {
  brightness: 0,
  contrast: 0,
  gamma: 1,
  threshold: null,
  invert: false,
  grayscale: false,
}

/**
 * 보정 그림의 근사 보기 방식. 시안 단계라 EvidenceImage 의 4가지 보기 중 가장 가까운 것으로 보인다
 * (실제 픽셀 보정은 운영 연결 때 지금 앱 `useImageAdjustments`가 그린다).
 */
export function lookFor(a: ViewAdjustments): EvidenceLook {
  if (a.threshold !== null) return "binary"
  if (a.invert) return "invert"
  if (a.grayscale || a.contrast > 0) return "contrast"
  return "raw"
}
