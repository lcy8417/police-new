import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"

import { mswServer } from "@/test/msw-server"

import { fetchComparisons } from "./comparison-api"
import { fetchCrimePatterns } from "./pattern-api"
import { fetchSearchHistory, fetchSearchResultsPage, fetchSearchRun } from "./search-history-api"

// B 단계 묶음 ① 읽기 API(C1 · D2 · D3 · D4 · F2) — CRUD 계층 snake → camel, 문양 이름 키(n32_04)는 그대로

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())

describe("묶음 ① 읽기 API", () => {
  it("C1 문양 — meta 의 문양 이름 키는 그대로, 칸 이름만 camel", async () => {
    mswServer.use(
      http.get("*/crime/:no/patterns", () =>
        HttpResponse.json({
          top: [["n32_04", 1]],
          mid: [],
          bottom: [],
          outline: [],
          meta: { top: { n32_04: { status: "ai", confidence: 0.93, doubtful: false, weight: null, manual: false, count: "10이상", sort_ordr: 0, ai_run_id: 3 } }, mid: {}, bottom: {}, outline: {} },
          sole_text: "NIKE",
          extracted_raw: null,
          row_version: 2,
        }),
      ),
    )
    const p = await fetchCrimePatterns("A_1")
    expect(p.meta.top.n32_04).toMatchObject({ sortOrdr: 0, aiRunId: 3, count: "10이상" })
    expect(p.soleText).toBe("NIKE")
    expect(p.rowVersion).toBe(2)
  })

  it("D2 이력 · D3 1건 · D4 결과 쪽", async () => {
    mswServer.use(
      http.get("*/crime/history/:s/results", ({ request }) => {
        const q = new URL(request.url).searchParams
        expect([q.get("page"), q.get("size")]).toEqual(["4", "50"])
        return HttpResponse.json({
          items: [{ rank_no: 201, ftwr_id: "00758", similarity: 70.5, pattern_score: null, final_score: null, brand_code: null, top: [], mid: [], bottom: [], outline: [] }],
          total: 250,
          stored: 200,
          recomputed: true,
          basis_changed: false,
          legacy: false,
          seen: { seen_up_to: 30, seen_dt: "2026-11-17T14:03:00+09:00" },
        })
      }),
      http.get("*/crime/history/:s", () =>
        HttpResponse.json({ edit_image: null, mtchg_id: null, top: [], mid: [], bottom: [], outline: [], cond: { ver: 1, weightsApplied: { top: { n32_04: 0.5 } } }, candidate_total: 2, model: "image_search", ref_index_ver: "abc", input_file_id: 3, aprthng_no: "A_1", seen: null }),
      ),
      http.get("*/crime/:no", () =>
        HttpResponse.json([{ search_no: 1, frst_regist_dt: "2026-11-17 14:03:00", ranking: 0, mtchg_id: null, result_count: 2, source: "edited", method: "hybrid", essential_summary: { essential: 1, total: 2 }, top: [{ ftwr_id: "00758", score: 90, pattern_score: 0.5 }], has_cond: true, cond: null }]),
      ),
    )
    const rows = await fetchSearchHistory("A_1")
    expect(rows[0]).toMatchObject({ searchNo: 1, resultCount: 2, hasCond: true, top: [{ ftwrId: "00758", patternScore: 0.5 }] })
    const run = await fetchSearchRun(1)
    expect(run.cond?.weightsApplied.top).toEqual({ n32_04: 0.5 })
    expect(run.inputFileId).toBe(3)
    const page = await fetchSearchResultsPage(1, 4)
    expect(page.items[0]).toMatchObject({ rankNo: 201, ftwrId: "00758", patternScore: null })
    expect(page).toMatchObject({ recomputed: true, basisChanged: false, seen: { seenUpTo: 30 } })
  })

  it("F2 대조 기록 — 신발 거르기 쿼리", async () => {
    mswServer.use(
      http.get("*/crime/:no/comparisons", ({ request }) => {
        expect(new URL(request.url).searchParams.get("ftwr_id")).toBe("00758")
        return HttpResponse.json([{ cmpr_id: 9, ftwr_id: "00758", match_cnt: 2, metrics: { match_cnt: 2, scores: [0.8, 0.6] }, occurred_dt: "2026-11-17T14:03:00+09:00", actor_nm: "감정관" }])
      }),
    )
    const rows = await fetchComparisons("A_1", "00758")
    expect(rows[0]).toMatchObject({ cmprId: 9, matchCnt: 2, metrics: { matchCnt: 2 } })
  })
})
