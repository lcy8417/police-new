import { describe, expect, it } from "vitest"

import { patternScore, rankShoes, runSnapshot, searchQuery, type QueryPattern, type ShoePatterns } from "./match-score"
import { patternWeights } from "./weight-rules"

// 스펙 2026-11-17-pattern-weight-rule-design §4 예시 계산을 그대로 확인한다.

const Q: QueryPattern[] = [
  { zone: "top", name: "n32_04", essential: true, weight: 0.5 },
  { zone: "mid", name: "n32_04", essential: true, weight: 0.5 },
  { zone: "bottom", name: "n32_04", essential: false, weight: 0.5 },
  { zone: "mid", name: "s81b", essential: false, weight: 2 },
  { zone: "outline", name: "s10c", essential: false, weight: 0.5 },
]
const shoe = (ftwrId: string, z: Partial<ShoePatterns["zones"]>): ShoePatterns => ({
  ftwrId,
  zones: { top: [], mid: [], bottom: [], outline: [], ...z },
})
const A = shoe("00758", { top: ["n32_04"], mid: ["n32_04", "s81b"], bottom: ["n32_04"] })
const B = shoe("305659", { top: ["n32_04"], mid: ["n32_04"], bottom: ["n32_04"], outline: ["s10c"] })
const C = shoe("00012", { top: ["n32_04"], mid: ["s81b"], bottom: ["n32_04"] })

describe("patternScore — 스펙 §4 예시", () => {
  it("A = 3.5 ÷ 4.0 = 0.875, B = 2.0 ÷ 4.0 = 0.5", () => {
    expect(patternScore(Q, A)).toBeCloseTo(0.875)
    expect(patternScore(Q, B)).toBeCloseTo(0.5)
  })

  it("C 는 필수(중 n32_04)가 없어 제외(null)", () => {
    expect(patternScore(Q, C)).toBeNull()
  })

  it("가중치가 모두 1 이면 A · B 가 0.80 으로 같다", () => {
    const flat = Q.map((q) => ({ ...q, weight: 1 }))
    expect(patternScore(flat, A)).toBeCloseTo(0.8)
    expect(patternScore(flat, B)).toBeCloseTo(0.8)
  })

  it("같은 부위끼리만 맞춘다(다른 부위의 같은 이름은 안 맞음)", () => {
    const q: QueryPattern[] = [{ zone: "top", name: "s81b", essential: false, weight: 1 }]
    expect(patternScore(q, shoe("1", { mid: ["s81b"] }))).toBe(0)
  })

  it("검색 문양이 없으면 0", () => {
    expect(patternScore([], A)).toBe(0)
  })
})

describe("rankShoes", () => {
  it("필수 통과만, 점수 내림차순 · 같으면 신발 ID 순, ID 는 문자열 그대로(앞자리 0)", () => {
    expect(rankShoes(Q, [B, C, A])).toEqual([
      { ftwrId: "00758", score: 0.875 },
      { ftwrId: "305659", score: 0.5 },
    ])
    const flat = Q.map((q) => ({ ...q, weight: 1 }))
    expect(rankShoes(flat, [B, A]).map((h) => h.ftwrId)).toEqual(["00758", "305659"])
  })
})

describe("searchQuery · runSnapshot", () => {
  const zones = {
    top: [
      ["/src/assets/Patterns/전체/n32_04.png", 1],
      ["/src/assets/Patterns/전체/n21_05.png", 0],
    ],
    mid: [["s81b", 0]],
    bottom: [],
    outline: [["s10c", 0]],
  } as const
  const meta = { top: { n21_05: { status: "suggested" as const, confidence: 0.61 } }, mid: { s81b: { status: "ai" as const, confidence: 0.42 } } }

  it("확인 전 AI 제안은 빼고, 이름으로 · 가중치 값을 싣는다", () => {
    const w = patternWeights(zones, meta, { n32_04: "선", s81b: "항목", s10c: "윤곽" }, { mid: { s81b: "high" } })
    const q = searchQuery(zones, meta, w)
    expect(q).toEqual([
      { zone: "top", name: "n32_04", essential: true, weight: 0.5 },
      { zone: "mid", name: "s81b", essential: false, weight: 2 },
      { zone: "outline", name: "s10c", essential: false, weight: 0.5 },
    ])
    expect(runSnapshot(q, w)).toEqual({
      top: [{ name: "n32_04", essential: true, weight: "low", manual: false }],
      mid: [{ name: "s81b", essential: false, weight: "high", manual: true }],
      bottom: [],
      outline: [{ name: "s10c", essential: false, weight: "low", manual: false }],
    })
  })
})
