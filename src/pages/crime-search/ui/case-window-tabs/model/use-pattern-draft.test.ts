import { describe, expect, it } from "vitest"

import type { CrimePatterns, ServerCardMeta } from "@/entities/crime/api/pattern-api"
import type { SearchHistoryEntry } from "@/entities/crime/api/search-history-api"
import { PATTERNS_ROOT } from "@/entities/pattern"
import type { PaletteKind } from "@/widgets/pattern-code"

import {
  conditionKey,
  confirmAt,
  draftFromRun,
  draftFromServer,
  draftSignature,
  hydrateZones,
  insertInto,
  removeAt,
  runConditionKey,
  runOfEntry,
  saveBodyOf,
  searchBodyOf,
  weightAt,
} from "./use-pattern-draft"

const KINDS: Record<string, PaletteKind> = { n32_04: "선", n21_05: "무늬", s81b: "항목", s10c: "윤곽" }
const COND = { searchKind: "현장문양", periodFrom: "", periodTo: "", gender: "전체", heel: "전체" }

const card = (m: Partial<ServerCardMeta> & Pick<ServerCardMeta, "status">): ServerCardMeta => ({
  confidence: null,
  doubtful: false,
  weight: null,
  manual: false,
  count: null,
  sortOrdr: 0,
  aiRunId: null,
  ...m,
})

// 서버 C1 응답(가중치 스펙 §3 예 — 제안은 튜플에 없고 메타에만)
const SERVER: CrimePatterns = {
  top: [["n32_04", 1]],
  mid: [["n32_04", 1], ["s81b", 0]],
  bottom: [],
  outline: [["s10c", 0]],
  meta: {
    top: {
      n32_04: card({ status: "ai", confidence: 0.93, count: "9", sortOrdr: 0, aiRunId: 7 }),
      n21_05: card({ status: "suggested", confidence: 0.61, sortOrdr: 1 }),
    },
    mid: { s81b: card({ status: "manual", weight: "high", manual: true, sortOrdr: 1 }) },
    bottom: { n32_04: card({ status: "suggested", confidence: 0.71, doubtful: true }) },
    outline: {},
  },
  soleText: "NIKE",
  extractedRaw: [{ code: "n32_04", score: 0.93 }],
  rowVersion: 4,
}

describe("use-pattern-draft — 서버 C1 ↔ 화면 초안 ↔ C2 · D1", () => {
  it("C1 → 초안: 제안은 카드 순서 자리에 끼우고, 직접 가중치 · 실행 번호를 따로 든다", () => {
    const d = draftFromServer(SERVER)
    expect(d.zones.top).toEqual([["n32_04", 1], ["n21_05", 0]])
    expect(d.zones.bottom).toEqual([["n32_04", 0]])
    expect(d.meta.top?.n21_05).toEqual({ status: "suggested", confidence: 0.61 })
    expect(d.meta.bottom?.n32_04?.doubtful).toBe(true)
    expect(d.overrides.mid).toEqual({ s81b: "high" })
    expect(d.runIds.top).toEqual({ n32_04: 7 })
    expect(d.soleText).toBe("NIKE")
  })

  it("초안 → C2: 제안은 튜플에서 빼고 메타로, 직접은 manual 표시, 순서 · 실행 번호 · 판 번호", () => {
    const body = saveBodyOf(draftFromServer(SERVER), 4)
    expect(body.top).toEqual([["n32_04", 1]])
    expect(body.bottom).toEqual([])
    expect(body.meta.top?.n21_05).toMatchObject({ status: "suggested", sortOrdr: 1, weight: null, manual: false })
    expect(body.meta.top?.n32_04).toMatchObject({ status: "ai", aiRunId: 7, count: "9" })
    expect(body.meta.mid?.s81b).toMatchObject({ weight: "high", manual: true })
    expect(body.meta.outline?.s10c).toMatchObject({ status: "manual" }) // 메타 없던 문양도 수동 카드로
    expect(body.rowVersion).toBe(4)
    expect(body.soleText).toBe("NIKE")
  })

  it("저장 → 다시 읽기 왕복이 같은 초안(같은 서명)", () => {
    const d = draftFromServer(SERVER)
    const body = saveBodyOf(d, 4)
    const echoed: CrimePatterns = {
      top: body.top,
      mid: body.mid,
      bottom: body.bottom,
      outline: body.outline,
      meta: Object.fromEntries(
        (["top", "mid", "bottom", "outline"] as const).map((z) => [
          z,
          Object.fromEntries(Object.entries(body.meta[z] ?? {}).map(([n, m]) => [n, card({ ...m, status: m.status } as ServerCardMeta)])),
        ]),
      ) as CrimePatterns["meta"],
      soleText: body.soleText,
      extractedRaw: body.extracted_raw,
      rowVersion: 5,
    }
    expect(draftSignature(draftFromServer(echoed))).toBe(draftSignature(d))
  })

  it("고치기: AI 결과에서 넣으면 AI · 확신도 · 실행 번호, 빼면 메타 · 직접 · 번호도 함께 지움", () => {
    let d = draftFromServer(SERVER)
    d = insertInto(d, "mid", `${PATTERNS_ROOT}n21_05.png`, { score: 0.55, runId: 9 })
    expect(d.meta.mid?.n21_05).toEqual({ status: "ai", confidence: 0.55 })
    expect(d.runIds.mid?.n21_05).toBe(9)
    d = insertInto(d, "outline", "s10a", { score: 0.9, runId: 9 }) // 윤곽은 AI 미지원 — 수동
    expect(d.meta.outline?.s10a).toBeUndefined()
    d = removeAt(d, "mid", 1) // s81b
    expect(d.overrides.mid).toEqual({})
    expect(d.zones.mid.map(([n]) => n)).toEqual(["n32_04", "n21_05"])
    d = confirmAt(d, "top", 1)
    expect(d.meta.top?.n21_05?.status).toBe("ai")
    d = weightAt(d, "top", 0, "normal")
    expect(saveBodyOf(d, 4).meta.top?.n32_04).toMatchObject({ weight: "normal", manual: true })
  })

  it("초안 → D1: 필수 = 이름 배열, 검색 문양 = 단계 문자열 + 직접 표시, 제안은 pending", () => {
    const body = searchBodyOf(draftFromServer(SERVER), KINDS, {
      image: "05019-24-0017_1",
      source: "original",
      conditions: COND,
      method: "hybrid",
      record: true,
      inputFileId: 12,
    })
    expect(body.top).toEqual(["n32_04"])
    expect(body.mid).toEqual(["n32_04"])
    expect(body.query.top).toEqual([{ name: "n32_04", essential: true, weight: "low", manual: false, status: "ai", confidence: 0.93, count: "9" }])
    expect(body.query.mid[1]).toEqual({ name: "s81b", essential: false, weight: "high", manual: true })
    expect(body.pending?.top).toEqual([{ name: "n21_05", confidence: 0.61 }])
    expect(body.pending?.bottom).toEqual([{ name: "n32_04", confidence: 0.71, doubtful: true }])
    expect(body.conditions).toEqual({ ...COND, method: "hybrid" })
    expect(body).toMatchObject({ record: true, inputFileId: 12, source: "original", soleText: "NIKE" })
    expect(JSON.stringify(body.query)).not.toMatch(/0\.5|"weight":[0-9]/) // 숫자 가중치를 보내지 않는다
  })

  it("서버 이력 줄 → 위젯 이력 줄 → 다시 불러오기 · 「지금」 줄", () => {
    const d = draftFromServer(SERVER)
    const query = searchBodyOf(d, KINDS, { image: "x", source: "original", conditions: COND, record: false })
    // 서버는 수동 카드에 status "manual"을 남긴다
    const zones = Object.fromEntries(
      Object.entries(query.query).map(([z, ps]) => [z, ps.map((p) => ({ status: "manual", ...p }))]),
    ) as SearchHistoryEntry["cond"] extends infer C ? (C extends { zones: infer Z } ? Z : never) : never
    const entry: SearchHistoryEntry = {
      searchNo: 572433,
      frstRegistDt: "2026-11-17 14:03:00",
      ranking: 0,
      mtchgId: null,
      resultCount: 2,
      source: "original",
      method: null,
      essentialSummary: { essential: 2, total: 4 },
      top: [{ ftwrId: "00758", score: 90, patternScore: 0.5 }],
      hasCond: true,
      cond: {
        ver: 1,
        source: "original",
        zones,
        pending: query.pending ?? {},
        soleText: "NIKE",
        conditions: COND,
        weightsApplied: {},
        ruleVer: "2026-11-17",
        blend: 0,
      },
    }
    const run = runOfEntry(entry)!
    expect(run.top[0]).toMatchObject({ ftwrId: "00758", score: 0.5 })
    expect(runConditionKey(run)).toBe(conditionKey(d, KINDS, COND, "original")) // 같은 조건이면 「지금」 줄

    const restored = draftFromRun(run, { ...d, zones: { top: [], mid: [], bottom: [], outline: [] }, meta: {}, overrides: {} })
    expect(conditionKey(restored, KINDS, COND, "original")).toBe(runConditionKey(run))
    expect(restored.overrides.mid).toEqual({ s81b: "high" })
    expect(restored.meta.top?.n21_05?.status).toBe("suggested")
    expect(runOfEntry({ ...entry, cond: null })).toBeNull()
  })

  it("위젯에는 경로를 한 번만 붙인다", () => {
    const z = hydrateZones({ top: [["n32_04", 1]], mid: [[`${PATTERNS_ROOT}s81b.png`, 0]], bottom: [], outline: [] })
    expect(z.top).toEqual([[`${PATTERNS_ROOT}n32_04.png`, 1]])
    expect(z.mid).toEqual([[`${PATTERNS_ROOT}s81b.png`, 0]])
  })
})
