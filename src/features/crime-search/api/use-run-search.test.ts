import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"

import { mswServer } from "@/test/msw-server"

import { recordComparison } from "./record-comparison"
import { runSearch, saveSeen } from "./use-run-search"

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())

describe("runSearch — D1 확장(무변환 응답)", () => {
  it("본문을 그대로 보내고 snake 응답(search_no · weights_applied)을 그대로 돌려준다", async () => {
    let body: Record<string, unknown> | undefined
    let page: string | null = null
    mswServer.use(
      http.post("*/crime/:no/search", async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        page = new URL(request.url).searchParams.get("page")
        return HttpResponse.json({
          result: [{ ftwr_id: "00758", similarity: 90, pattern_score: 0.5, final_score: null, brand_code: "B1", top: [], mid: [], bottom: [], outline: [] }],
          total: 1,
          weights_applied: { top: { n32_04: 0.5 } },
          weights_mismatch: false,
          rule_ver: "2026-11-17",
          blend: 0,
          search_no: 572433,
        })
      }),
    )
    const res = await runSearch("A_1", {
      image: "A_1",
      top: ["n32_04"],
      mid: [],
      bottom: [],
      outline: [],
      query: { top: [{ name: "n32_04", essential: true, weight: "low", manual: false }], mid: [], bottom: [], outline: [] },
      source: "original",
      record: true,
      inputFileId: 3,
    })
    expect(page).toBe("0")
    expect(body).toMatchObject({ record: true, inputFileId: 3, top: ["n32_04"] })
    expect(res.search_no).toBe(572433)
    expect(res.result[0].ftwr_id).toBe("00758") // 앞자리 0 그대로
  })

  it("409 · 400 은 ApiError(서버 문구)", async () => {
    mswServer.use(http.post("*/crime/:no/search", () => HttpResponse.json({ detail: "접수 먼저 하세요" }, { status: 409 })))
    await expect(
      runSearch("A_1", { image: "x", top: [], mid: [], bottom: [], outline: [], query: { top: [], mid: [], bottom: [], outline: [] }, source: "original", record: false }),
    ).rejects.toMatchObject({ status: 409, detail: "접수 먼저 하세요" })
  })
})

describe("saveSeen · recordComparison", () => {
  it("E1 PUT …/seen { seenUpTo } → camel 결과", async () => {
    mswServer.use(
      http.put("*/crime/history/:s/seen", async ({ request, params }) => {
        expect(params.s).toBe("572433")
        expect(await request.json()).toEqual({ seenUpTo: 30 })
        return HttpResponse.json({ seen_up_to: 30, seen_dt: "2026-11-17T14:03:00+09:00" })
      }),
    )
    expect(await saveSeen(572433, 30)).toEqual({ seenUpTo: 30, seenDt: "2026-11-17T14:03:00+09:00" })
  })

  it("F1 record=true 쿼리로 부르고 cmpr_id 를 읽는다", async () => {
    mswServer.use(
      http.post("*/crime/:no/similarity", ({ request }) => {
        const q = new URL(request.url).searchParams
        expect([q.get("ftwr_id"), q.get("record")]).toEqual(["00758", "true"])
        return HttpResponse.json({ query: {}, ref: {}, matches: [{ score: 0.8 }], cmpr_id: 9 })
      }),
    )
    expect((await recordComparison("A_1", "00758")).cmpr_id).toBe(9)
  })
})
