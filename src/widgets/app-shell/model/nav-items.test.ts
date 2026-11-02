import { describe, expect, it } from "vitest"

import { FEATURES, type SessionUser } from "@/entities/session"

import { visibleNavItems } from "./nav-items"

const user = (extra: Partial<SessionUser> = {}): SessionUser => ({
  userId: "kim01",
  userNm: "김수사",
  userSe: "USER",
  features: [],
  passwordChangeRequired: false,
  ...extra,
})

const labels = (u: SessionUser) => visibleNavItems(u).map((item) => item.label)

describe("visibleNavItems — 권한별 메뉴(설계서 §2·§7-5)", () => {
  it("visibleNavItems hides forbidden", () => {
    expect(labels(user({ features: [FEATURES.CRIME_REGISTER] }))).toEqual(["사건 등록"])
    expect(labels(user({ features: [FEATURES.SHOE_VIEW] }))).toEqual(["신발"])
    // 감정 의뢰·감정 결과는 사건 조회 권한에 묶인다.
    expect(labels(user({ features: [FEATURES.CRIME_SEARCH] }))).toEqual([
      "사건 조회",
      "감정 의뢰",
      "감정 결과",
    ])
    expect(labels(user())).toEqual([])
  })

  it("일반 사용자에게는 관리 구역이 없다", () => {
    const items = visibleNavItems(
      user({ features: [FEATURES.CRIME_REGISTER, FEATURES.CRIME_SEARCH, FEATURES.SHOE_EDIT, FEATURES.SHOE_VIEW] })
    )
    expect(items.some((item) => item.adminOnly)).toBe(false)
  })

  it("admin sees admin section", () => {
    const items = visibleNavItems(user({ userSe: "ADMIN", features: [] }))
    expect(items.map((item) => item.label)).toEqual([
      "사건 등록",
      "사건 조회",
      "신발",
      "감정 의뢰",
      "감정 결과",
      "사용자·권한",
      "사용 기록",
    ])
    expect(items.filter((item) => item.adminOnly).map((item) => item.to)).toEqual([
      "/manage/users",
      "/manage/logs",
    ])
  })
})
