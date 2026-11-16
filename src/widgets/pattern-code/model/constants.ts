import type { PatternZone } from "@/entities/pattern"
import { stripPatternPath } from "@/entities/pattern"

import type { PaletteKind } from "./types"

/** 4부위 — SCAS 행 순서(상 · 중 · 하 · 윤곽) */
export const ZONE_ROWS: readonly { zone: PatternZone; label: string }[] = [
  { zone: "top", label: "상" },
  { zone: "mid", label: "중" },
  { zone: "bottom", label: "하" },
  { zone: "outline", label: "윤곽" },
]

/** 팔레트 종류 8개 — 지금 앱 `PatternPalette` KINDS 순서 그대로 */
export const PALETTE_KINDS: readonly PaletteKind[] = ["무늬", "선", "윤곽", "다각", "삼각", "사각", "원", "항목"]

/** 그림 경로 → 문양 이름(표시 · 이름 기준 비교용. 경로를 다시 붙이지 않는다) */
export function patternName(path: string): string {
  const stripped = stripPatternPath(path)
  return typeof stripped === "string" ? stripped : stripped[0]
}
