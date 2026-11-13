import { describe, expect, it } from "vitest"

import { FEATURES } from "@/entities/session"

import {
  USER_ID_PATTERN,
  isImpliedFeature,
  roleNames,
  sameFeatures,
  toggleFeature,
  toggleRole,
  userStatus,
} from "./user-rules"

describe("user-rules — 사용자·권한 관리 규칙", () => {
  it("계정 상태: 중지가 잠금보다 우선", () => {
    expect(userStatus({ useAt: "Y", lockAt: "N" })).toBe("ACTIVE")
    expect(userStatus({ useAt: "Y", lockAt: "Y" })).toBe("LOCKED")
    expect(userStatus({ useAt: "N", lockAt: "Y" })).toBe("DISABLED")
  })

  it("SHOE_EDIT를 켜면 SHOE_VIEW도 켜지고, 표시 순서로 정렬된다", () => {
    expect(toggleFeature([FEATURES.CRIME_SEARCH], FEATURES.SHOE_EDIT, true)).toEqual([
      FEATURES.CRIME_SEARCH,
      FEATURES.SHOE_VIEW,
      FEATURES.SHOE_EDIT,
    ])
    expect(toggleFeature([FEATURES.CRIME_SEARCH, FEATURES.CRIME_REGISTER], FEATURES.CRIME_SEARCH, false)).toEqual([
      FEATURES.CRIME_REGISTER,
    ])
  })

  it("SHOE_EDIT가 있으면 SHOE_VIEW는 포함된 것으로 본다", () => {
    expect(isImpliedFeature([FEATURES.SHOE_EDIT], FEATURES.SHOE_VIEW)).toBe(true)
    expect(isImpliedFeature([FEATURES.SHOE_VIEW], FEATURES.SHOE_VIEW)).toBe(false)
    expect(isImpliedFeature([FEATURES.SHOE_EDIT], FEATURES.CRIME_SEARCH)).toBe(false)
  })

  it("기능 목록 비교는 순서와 무관", () => {
    expect(sameFeatures([FEATURES.SHOE_VIEW, FEATURES.CRIME_SEARCH], [FEATURES.CRIME_SEARCH, FEATURES.SHOE_VIEW])).toBe(true)
    expect(sameFeatures([FEATURES.SHOE_VIEW], [FEATURES.CRIME_SEARCH])).toBe(false)
  })

  it("새 기능 코드도 켜고 끌 수 있다 — 서버 표시 순서로 정렬(모르는 코드로 잘리지 않음)", () => {
    expect(toggleFeature([FEATURES.REPORT_SEND], FEATURES.CASE_STATUS_VIEW, true)).toEqual([
      FEATURES.CASE_STATUS_VIEW,
      FEATURES.REPORT_SEND,
    ])
  })

  it("역할 켜고 끄기 — 서버 역할 순서로, 목록에 없는 기존 역할은 뒤에 그대로", () => {
    const order = ["INVESTIGATOR", "EXAMINER", "REVIEWER"]
    expect(toggleRole(["REVIEWER"], "INVESTIGATOR", true, order)).toEqual(["INVESTIGATOR", "REVIEWER"])
    expect(toggleRole(["INVESTIGATOR", "EXAMINER"], "INVESTIGATOR", false, order)).toEqual(["EXAMINER"])
    expect(toggleRole(["LEGACY"], "EXAMINER", true, order)).toEqual(["EXAMINER", "LEGACY"])
  })

  it("역할 이름 — 서버 목록 이름을 ' · '로, 모르는 코드는 코드 그대로, 없으면 null", () => {
    const roles = [
      { roleCode: "INVESTIGATOR", roleNm: "수사관", sortOrdr: 10, features: [] },
      { roleCode: "EXAMINER", roleNm: "감정관", sortOrdr: 20, features: [] },
    ]
    expect(roleNames(["INVESTIGATOR", "EXAMINER"], roles)).toBe("수사관 · 감정관")
    expect(roleNames(["NEW_ROLE"], roles)).toBe("NEW_ROLE")
    expect(roleNames([], roles)).toBeNull()
  })

  it("아이디 규칙: 영문·숫자·_ 4~20자", () => {
    expect(USER_ID_PATTERN.test("kim_01")).toBe(true)
    expect(USER_ID_PATTERN.test("abc")).toBe(false)
    expect(USER_ID_PATTERN.test("a".repeat(21))).toBe(false)
    expect(USER_ID_PATTERN.test("김수사01")).toBe(false)
  })
})
