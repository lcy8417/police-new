import { FEATURES, type FeatureCode } from "@/entities/session"

import type { DevViewer } from "./dev-viewers"

// 진열 화면 목록(11개). 주소 `/dev/<id>`, 목차 · 왼쪽 메뉴 · 각 진열 페이지가 함께 쓴다.

/** 화면별 진열 케이스(단일 출처). 각 진열 페이지와 목차가 여기서 읽는다. */
export const SCREEN_CASES = {
  s00: ["ready", "loading", "failed", "locked", "error", "password-change"],
  s01: ["ready", "loading", "error", "empty"],
  s02: ["ready", "loading", "error"],
  s03: ["ready", "running", "denoise-failed", "loading", "error"],
  s04: ["ready", "running", "loading", "error", "empty"],
  s05: ["ready", "loading", "error", "empty"],
  s06: ["ready", "loading", "error", "no-alignment"],
  s07: ["ready", "loading", "error", "empty"],
  s10: ["ready", "loading", "error", "empty", "duplicate"],
  s13: ["ready", "loading", "error", "empty"],
  s14: ["ready", "loading", "error", "empty", "full-page", "exact-page"],
} as const

export type DevScreenId = keyof typeof SCREEN_CASES

export interface DevScreenInfo {
  id: DevScreenId
  /** 시안 화면 번호 */
  screen: string
  title: string
  /** 이 화면의 진열 케이스 */
  cases: readonly string[]
  /** 이 화면의 메뉴를 보려면 필요한 기능 권한(`widgets/app-shell/model/nav-items.ts` 와 같은 규칙). 없으면 항상 보임 */
  feature?: FeatureCode
  /** 관리자만 보이는 메뉴 묶음에 놓는가 */
  admin?: boolean
  /** `?as=` 가 없을 때 이 화면을 보는 사람(시안 각 화면의 기본 역할) */
  defaultViewer: DevViewer
}

export const DEV_SCREENS: readonly DevScreenInfo[] = [
  { id: "s00", screen: "S00", title: "로그인", cases: SCREEN_CASES.s00, defaultViewer: "analyst" },
  { id: "s01", screen: "S01", title: "사건관리", cases: SCREEN_CASES.s01, feature: FEATURES.CRIME_SEARCH, defaultViewer: "analyst" },
  { id: "s02", screen: "S02", title: "사건 상세", cases: SCREEN_CASES.s02, feature: FEATURES.CRIME_SEARCH, defaultViewer: "analyst" },
  { id: "s03", screen: "S03", title: "이미지 편집", cases: SCREEN_CASES.s03, feature: FEATURES.CRIME_SEARCH, defaultViewer: "analyst" },
  { id: "s04", screen: "S04", title: "문양 코드", cases: SCREEN_CASES.s04, feature: FEATURES.CRIME_SEARCH, defaultViewer: "analyst" },
  { id: "s05", screen: "S05", title: "검색 결과", cases: SCREEN_CASES.s05, feature: FEATURES.CRIME_SEARCH, defaultViewer: "analyst" },
  { id: "s06", screen: "S06", title: "정밀 대조", cases: SCREEN_CASES.s06, feature: FEATURES.CRIME_SEARCH, defaultViewer: "analyst" },
  { id: "s07", screen: "S07", title: "결과 확인", cases: SCREEN_CASES.s07, feature: FEATURES.CRIME_SEARCH, defaultViewer: "analyst" },
  { id: "s10", screen: "S10", title: "신발 DB", cases: SCREEN_CASES.s10, feature: FEATURES.SHOE_VIEW, defaultViewer: "analyst" },
  { id: "s13", screen: "S13", title: "사용자 관리", cases: SCREEN_CASES.s13, admin: true, defaultViewer: "admin" },
  { id: "s14", screen: "S14", title: "사용 기록", cases: SCREEN_CASES.s14, admin: true, defaultViewer: "admin" },
]

/** 화면 한 개의 진열 정보(없는 id 는 만들 수 없어 항상 있다). */
export function devScreen(id: DevScreenId): DevScreenInfo {
  return DEV_SCREENS.find((s) => s.id === id) as DevScreenInfo
}
