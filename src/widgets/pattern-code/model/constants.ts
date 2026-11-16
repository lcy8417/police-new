import type { PatternZone } from "@/entities/pattern"
import { stripPatternPath } from "@/entities/pattern"

import type { ImageCodingStatus, PaletteKind, PatternCount, SearchMethod } from "./types"

/** SCAS 개수 칸 선택지(0–9 · 10이상, 시안 핀 10) */
export const PATTERN_COUNTS: readonly PatternCount[] = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10이상"]

/** 이미지 목록 상태 글자(시안 핀 3) */
export const IMAGE_STATUS_LABEL: Record<ImageCodingStatus, string> = {
  done: "확인완료",
  searching: "검색 중",
  uncoded: "미코딩",
  duplicate: "삭제(중복)",
}

/** 검색 방식 3가지(시안 핀 7 — 이미지 검색 추천) */
export const SEARCH_METHODS: readonly { value: SearchMethod; label: string; note: string; recommended?: boolean }[] = [
  { value: "image", label: "이미지 검색", note: "사진만으로 비슷한 신발을 찾음(문양 몰라도 됨)", recommended: true },
  { value: "pattern", label: "문양 검색", note: "SCAS 방식 그대로" },
  { value: "hybrid", label: "하이브리드", note: "이미지 + 필수 문양으로 좁힘" },
]

/** 팔레트 하위 탭(시안 핀 10 — SCAS 아래쪽 하위 탭) */
export const PALETTE_SUB_TABS = ["단선", "다선1", "다선2"] as const

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
