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

/** SCAS 「매칭 조건」 선택지 — 라벨 · 순서 그대로(시안 핀 10) */
export const MATCH_OPTIONS = {
  searchKind: ["현장문양", "동일범", "용의자문양"],
  gender: ["전체", "남", "여", "혼용"],
  heel: ["전체", "유", "무", "불상"],
} as const

/** 끌어 놓기에 싣는 자료 형식(지금 앱 PatternPalette · PatternZones 와 같음) */
export const DRAG_FORMAT = "text/plain"

/** 그림 경로 → 문양 이름(표시 · 이름 기준 비교용. 경로를 다시 붙이지 않는다) */
export function patternName(path: string): string {
  const stripped = stripPatternPath(path)
  return typeof stripped === "string" ? stripped : stripped[0]
}
