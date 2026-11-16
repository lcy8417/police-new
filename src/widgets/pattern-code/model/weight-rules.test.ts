import { describe, expect, it } from "vitest"

import type { PaletteKind, PatternMetaMap } from "./types"
import { countOverrides, describeWeight, levelOfScore, patternWeights, ruleWeight, type ZoneTuples } from "./weight-rules"

// 스펙 2026-11-17-pattern-weight-rule-design §3 의 규칙 표 · 예 표를 그대로 확인한다.

const KINDS: Record<string, PaletteKind> = { n32_04: "선", n21_05: "무늬", s81b: "항목", s10c: "윤곽", n51_03: "사각", n62_02: "다각" }

describe("levelOfScore — 합을 −1 ~ +1 로 자른다", () => {
  it.each([
    [-3, "low"],
    [-1, "low"],
    [0, "normal"],
    [1, "high"],
    [2, "high"],
  ] as const)("%d → %s", (score, level) => {
    expect(levelOfScore(score)).toBe(level)
  })
})

describe("ruleWeight — 규칙 R1 ~ R5", () => {
  it("아무 규칙도 안 걸리면 보통", () => {
    const r = ruleWeight({ zone: "top", kind: "사각", meta: { status: "manual" }, zonesWithName: 1 })
    expect(r).toMatchObject({ level: "normal", score: 0, hits: [] })
  })

  it("R1 윤곽 −1", () => {
    expect(ruleWeight({ zone: "outline", kind: "윤곽", zonesWithName: 0 }).level).toBe("low")
  })

  it("R2 선 · 무늬 −1, 다각 · 항목 +1, 종류 모름 0", () => {
    expect(ruleWeight({ zone: "mid", kind: "선", zonesWithName: 1 }).score).toBe(-1)
    expect(ruleWeight({ zone: "mid", kind: "무늬", zonesWithName: 1 }).score).toBe(-1)
    expect(ruleWeight({ zone: "mid", kind: "다각", zonesWithName: 1 }).level).toBe("high")
    expect(ruleWeight({ zone: "mid", kind: "항목", zonesWithName: 1 }).level).toBe("high")
    expect(ruleWeight({ zone: "mid", zonesWithName: 1 }).score).toBe(0)
  })

  it("R3 AI 확신도 0.5 미만 −1 — 수동 문양에는 걸지 않는다", () => {
    expect(ruleWeight({ zone: "top", kind: "사각", meta: { status: "ai", confidence: 0.42 }, zonesWithName: 1 }).score).toBe(-1)
    expect(ruleWeight({ zone: "top", kind: "사각", meta: { status: "ai", confidence: 0.5 }, zonesWithName: 1 }).score).toBe(0)
    expect(ruleWeight({ zone: "top", kind: "사각", meta: { status: "manual", confidence: 0.1 }, zonesWithName: 1 }).score).toBe(0)
  })

  it("R4 확인 전 AI 제안 −1 — 확인하면 한 단계 오른다", () => {
    const before = ruleWeight({ zone: "mid", kind: "항목", meta: { status: "suggested", confidence: 0.42 }, zonesWithName: 1 })
    const after = ruleWeight({ zone: "mid", kind: "항목", meta: { status: "ai", confidence: 0.42 }, zonesWithName: 1 })
    expect(before.level).toBe("low")
    expect(after.level).toBe("normal")
    expect(before.hits.map((h) => h.rule)).toEqual(["R2", "R3", "R4"])
  })

  it("R5 상 · 중 · 하 세 부위 모두 반복 −1(두 부위는 0, 윤곽은 세지 않음)", () => {
    expect(ruleWeight({ zone: "top", kind: "사각", zonesWithName: 3 }).score).toBe(-1)
    expect(ruleWeight({ zone: "top", kind: "사각", zonesWithName: 2 }).score).toBe(0)
  })

  it("둘 이상 걸려도 단계는 낮음까지만(자르기)", () => {
    const r = ruleWeight({ zone: "top", kind: "선", meta: { status: "ai", confidence: 0.93 }, zonesWithName: 3 })
    expect(r.score).toBe(-2)
    expect(r.level).toBe("low")
  })
})

describe("patternWeights — 시안 값 예(스펙 §3 표)", () => {
  const zones: ZoneTuples = {
    top: [
      ["/src/assets/Patterns/전체/n32_04.png", 1],
      ["/src/assets/Patterns/전체/n21_05.png", 0],
    ],
    mid: [
      ["n32_04", 1],
      ["s81b", 0],
    ],
    bottom: [["n32_04", 0]],
    outline: [["s10c", 0]],
  }
  const meta: PatternMetaMap = {
    top: { n32_04: { status: "ai", confidence: 0.93 }, n21_05: { status: "suggested", confidence: 0.61 } },
    mid: { n32_04: { status: "ai", confidence: 0.88 }, s81b: { status: "suggested", confidence: 0.42 } },
    bottom: { n32_04: { status: "suggested", confidence: 0.71 } },
    outline: { s10c: { status: "manual" } },
  }

  it("경로든 이름이든 이름 기준으로 읽고, 표의 단계와 같다", () => {
    const w = patternWeights(zones, meta, KINDS, undefined)
    expect(w.top.n32_04).toMatchObject({ level: "low", value: 0.5, source: "rule" })
    expect(w.top.n21_05.level).toBe("low")
    expect(w.mid.s81b.level).toBe("low")
    expect(w.outline.s10c.level).toBe("low")
    expect(w.top.n32_04.hits.map((h) => h.rule)).toEqual(["R2", "R5"])
  })

  it("사람이 고른 값이 규칙보다 먼저(「직접」), 규칙 값은 ruleLevel 에 남는다", () => {
    const w = patternWeights(zones, meta, KINDS, { mid: { s81b: "high" } })
    expect(w.mid.s81b).toMatchObject({ level: "high", value: 2, source: "manual", ruleLevel: "low" })
    expect(describeWeight(w.mid.s81b)).toMatch(/^직접 높음\(규칙: R2 드문 종류\(항목\) \+1 · R3 AI 확신도 0\.42 −1 · R4 확인 전 AI 제안 −1 → 낮음\)$/)
  })

  it("규칙이 없으면 「걸린 규칙 없음」", () => {
    const w = patternWeights({ top: [["n51_03", 0]], mid: [], bottom: [], outline: [] }, undefined, KINDS, undefined)
    expect(describeWeight(w.top.n51_03)).toBe("규칙: 걸린 규칙 없음 → 보통")
  })

  it("countOverrides — 직접 고른 개수", () => {
    expect(countOverrides(undefined)).toBe(0)
    expect(countOverrides({ top: { a: "low" }, mid: { b: "high", c: "normal" } })).toBe(3)
  })
})
