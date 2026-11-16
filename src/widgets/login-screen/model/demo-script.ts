import { FEATURES, type FeatureCode } from "@/entities/session"

import type { DemoScreen } from "./types"

// S00 「AI 감정 시연」 대본 — 시안 s00-login.js 의 STEPS · ZONES · ROWS · METRICS · ITEMS · ROLE_MENUS 값 그대로.
// 숫자는 모두 예시(S05 · S06 · S09 화면과 같은 값)이고 서버 값이 아니다. 시간 값은 한 바퀴 14초의 %.

export interface DemoStep {
  title: string
  sub: string
  /** 시작 · 끝 % */
  start: number
  end: number
  /** 걸린 시간(예시) */
  time: string
  screen: DemoScreen
}

export const DEMO_STEPS: readonly DemoStep[] = [
  { title: "현장 족적", sub: "업로드", start: 0, end: 8, time: "—", screen: "s02" },
  { title: "이진화", sub: "배경 제거", start: 8, end: 22, time: "0.4초", screen: "s03" },
  { title: "문양 추출", sub: "상·중·하", start: 22, end: 34, time: "1.2초", screen: "s04" },
  { title: "신발 검색", sub: "리랭킹", start: 34, end: 56, time: "2.1초", screen: "s05" },
  { title: "1:1 정밀 대조", sub: "근거·신뢰도", start: 56, end: 76, time: "1.6초", screen: "s06" },
  { title: "감정서 초안", sub: "1–8항 자동", start: 76, end: 92, time: "3.8초", screen: "s09" },
]

/** 상 · 중 · 하 문양 「AI 제안」(top/h 는 족적 칸 높이의 %, at 은 나타나는 %) */
export const DEMO_ZONES = [
  { zone: "상", key: "top", name: "타원 배열", top: 0, h: 35, at: 24 },
  { zone: "중", key: "mid", name: "헤링본", top: 35, h: 32, at: 27 },
  { zone: "하", key: "bottom", name: "사각 배열", top: 67, h: 33, at: 30 },
] as const

/** 리랭킹 표 한 행 높이(px) */
export const RANK_ROW_H = 44

/** 문양 검색만으로 137위였던 정답 305657 이 AI 리랭킹 뒤 1위로(from → to 는 행 자리) */
export const DEMO_RANK_ROWS = [
  { no: "305657", sim: 61.2, from: 4, to: 0, before: "137위", after: "1위", answer: true },
  { no: "281904", sim: 61.0, from: 0, to: 1, before: "1위", after: "2위", answer: false },
  { no: "305659", sim: 60.8, from: 1, to: 2, before: "2위", after: "3위", answer: false },
  { no: "274466", sim: 60.7, from: 2, to: 3, before: "3위", after: "4위", answer: false },
  { no: "301122", sim: 60.1, from: 3, to: 4, before: "4위", after: "5위", answer: false },
] as const

/** 대응점 6개(밑창 좌표 100×264). 4번째는 불일치(주황 점선) */
export const DEMO_POINTS: readonly [number, number][] = [
  [40, 40],
  [64, 70],
  [30, 128],
  [70, 150],
  [44, 214],
  [60, 242],
]

export const DEMO_METRICS: readonly [string, string][] = [
  ["Inlier Ratio", "0.72"],
  ["NCC", "0.81"],
  ["Wasserstein", "0.14"],
  ["Mutual Info.", "1.36"],
]

/** 감정서 1–6항(줄 폭 %) */
export const DEMO_REPORT_ITEMS: readonly [string, number][] = [
  ["1. 의뢰 관서", 70],
  ["2. 감정물", 86],
  ["3. 감정 사항", 62],
  ["4. 감정 방법", 92],
  ["5. 감정 결과", 78],
  ["6. 감정 의견", 88],
]

/** 목표 숫자 3개(시안 핀 1) */
export const DEMO_TARGETS: readonly [string, string][] = [
  ["857 → 10", "먼저 볼 후보"],
  ["상·중·하", "문양 자동 제안"],
  ["1–8항", "감정서 자동 채움"],
]

export type DemoRole = "investigator" | "analyst" | "verifier" | "admin"

/** 역할별로 로그인 뒤 처음 열리는 화면(시안 ROLE_MENUS · 라벨은 시안 M.ROLES) */
export const ROLE_FIRST_SCREENS: readonly { role: DemoRole; label: string; first: string; hint: string }[] = [
  { role: "investigator", label: "수사관", first: "사건관리 (우리 청 의뢰)", hint: "의뢰·진행 확인" },
  { role: "analyst", label: "감정관", first: "사건관리 (내 담당)", hint: "검색·판단·교차 검증·감정서" },
  { role: "verifier", label: "기술책임자", first: "결재 대기함", hint: "감정서 결재" },
  { role: "admin", label: "관리자", first: "사용자 관리", hint: "계정·권한·기록·모델" },
]

/**
 * 시안 `data-role` 을 권한 코드로 옮긴 판정: 지금 보는 사람이 어느 역할 줄에 해당하나.
 * 관리자 → 결재(REPORT_APPROVE) → 판정 확정(EXAM_DECIDE) → 사건 등록(CRIME_REGISTER) 순. 어디에도 없으면 null(보기 전용).
 */
export function currentDemoRole(isAdmin: boolean, features: readonly FeatureCode[]): DemoRole | null {
  if (isAdmin) return "admin"
  if (features.includes(FEATURES.REPORT_APPROVE)) return "verifier"
  if (features.includes(FEATURES.EXAM_DECIDE)) return "analyst"
  if (features.includes(FEATURES.CRIME_REGISTER)) return "investigator"
  return null
}
