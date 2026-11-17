import { describe, expect, it } from "vitest"

import { PATTERNS_ROOT } from "@/entities/pattern"

import { clearPatterns, hasPattern, insertPattern, removePattern, toggleEssential, type CrimeZoneMap } from "./pattern-ops"

const EMPTY: CrimeZoneMap = clearPatterns()

describe("pattern-ops — 이름 기준 사건 문양 연산", () => {
  it("넣기: 경로 · 이름 어느 쪽이든 같은 이름이면 한 번만", () => {
    const a = insertPattern(EMPTY, "top", `${PATTERNS_ROOT}s21b.png`)
    expect(a.top).toEqual([[`${PATTERNS_ROOT}s21b.png`, 0]])
    const b = insertPattern(a, "top", "/src/assets/Patterns/무늬/s21b.png")
    expect(b).toBe(a)
    expect(insertPattern(a, "mid", "s21b").mid).toEqual([["s21b", 0]]) // 다른 부위는 따로
  })

  it("빼기 · 필수 토글은 이름으로 찾는다", () => {
    const z = insertPattern(insertPattern(EMPTY, "top", "s21b"), "top", "n32_04")
    const toggled = toggleEssential(z, "top", `${PATTERNS_ROOT}n32_04.png`)
    expect(toggled.top).toEqual([["s21b", 0], ["n32_04", 1]])
    expect(toggleEssential(toggled, "top", "n32_04").top[1][1]).toBe(0)
    expect(removePattern(toggled, "top", `${PATTERNS_ROOT}s21b.png`).top).toEqual([["n32_04", 1]])
    expect(removePattern(toggled, "top", "없음")).toBe(toggled)
    expect(hasPattern(toggled.top, `${PATTERNS_ROOT}s21b.png`)).toBe(true)
  })

  it("boolean 필수 플래그도 참 · 거짓으로 읽는다", () => {
    const z: CrimeZoneMap = { ...EMPTY, mid: [["s81b", true]] }
    expect(toggleEssential(z, "mid", "s81b").mid).toEqual([["s81b", 0]])
  })
})
