import { describe, expect, it } from "vitest"

import { FEATURES, type FeatureCode, type SessionUser } from "@/entities/session"

import { canSeeCases } from "./bar-items"

const user = (features: FeatureCode[]): SessionUser => ({
  userId: "u1",
  userNm: "사용자",
  userSe: "USER",
  features,
  passwordChangeRequired: false,
})

describe("canSeeCases — 위 막대 「← 사건관리」", () => {
  it("[검수] 사건관리를 볼 수 있는 권한 셋(진행 상태 조회 · 사건 조회 · 감정 기록 보기) 모두 — /cases 입구와 같은 규칙", () => {
    expect(canSeeCases(user([FEATURES.CASE_STATUS_VIEW]))).toBe(true)
    expect(canSeeCases(user([FEATURES.EXAM_VIEW]))).toBe(true)
    expect(canSeeCases(user([FEATURES.CRIME_SEARCH]))).toBe(true)
    expect(canSeeCases(user([FEATURES.SHOE_VIEW]))).toBe(false)
  })
})
