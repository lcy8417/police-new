import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"

import type { Crime } from "@/entities/crime"
import { mswServer } from "@/test/msw-server"

import { useSearchRunSession } from "./model/search-run-session"
import { SearchTab } from "./SearchTab"

// 「검색 결과」 탭(B 단계 묶음 ①) — 검색 기록이 있으면 그 검색의 결과 쪽(D4), 없으면 지금 앱 인라인 검색. 서버는 MSW.

const NO = "05019-24-0017_2"
const IMAGE: Crime = { aprthngNo: NO, apprslReqestNo: "05019-24-0017", image: "data:image/png;base64,AAAA", top: [["/src/assets/Patterns/전체/s21b.png", 1]], mid: [], bottom: [], outline: [] }
const VIEWER = { isAdmin: false, features: ["CRIME_SEARCH"] as const }

const historyRow = (searchNo: number) => ({
  search_no: searchNo, frst_regist_dt: "2026-11-17 14:03:00", ranking: 0, mtchg_id: null, result_count: 2, source: "original",
  method: null, essential_summary: { essential: 1, total: 1 }, top: [], has_cond: true, cond: null,
})
const RUN = {
  edit_image: null, mtchg_id: null, top: [], mid: [], bottom: [], outline: [], cond: null, candidate_total: 1, model: null,
  ref_index_ver: null, input_file_id: null, aprthng_no: NO, seen: null,
}
const row = (rank: number, ftwrId: string, similarity: number) => ({
  rank_no: rank, ftwr_id: ftwrId, similarity, pattern_score: 0.5, final_score: null, brand_code: "NK", top: [], mid: [], bottom: [], outline: [],
})

function renderTab() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
      <div className="h-[800px]">
        <SearchTab viewer={VIEWER} image={IMAGE} onOpenCompare={vi.fn()} />
      </div>
    </QueryClientProvider>,
  )
}

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())
beforeEach(() => useSearchRunSession.setState({ byImage: {} }))

describe("SearchTab — 검색 기록의 결과 쪽(D4)", () => {
  it("고른 검색(없으면 가장 최근)의 저장 순위를 그린다 — 실시간 검색은 부르지 않는다", async () => {
    const pages: string[] = []
    let liveSearch = 0
    mswServer.use(
      http.get("*/crime/history/:s/results", ({ params, request }) => {
        pages.push(`${params.s}:${new URL(request.url).searchParams.get("page")}`)
        return HttpResponse.json({ items: [row(1, "00758", 90), row(2, "01234", 80)], total: 2, stored: 2, recomputed: false, basis_changed: false, legacy: false, seen: null })
      }),
      http.get("*/crime/:no", () => HttpResponse.json([historyRow(100), historyRow(101)])),
      http.post("*/crime/:no/search", () => {
        liveSearch += 1
        return HttpResponse.json({ result: [], total: 0 })
      }),
    )
    renderTab()
    expect(await screen.findByText("90%")).toBeInTheDocument()
    expect(pages).toEqual(["101:0"]) // 가장 최근 검색
    expect(liveSearch).toBe(0)
  })

  it("문양 코드 탭에서 고른 검색번호가 먼저 · 옛 이력은 「순위 기록 없음」", async () => {
    useSearchRunSession.getState().setRun(NO, 100)
    mswServer.use(
      http.get("*/crime/history/:s/results", ({ params }) => {
        expect(params.s).toBe("100")
        return HttpResponse.json({ items: [], total: null, stored: 0, recomputed: false, basis_changed: false, legacy: true, seen: null })
      }),
      http.get("*/crime/:no", () => HttpResponse.json([historyRow(100), historyRow(101)])),
    )
    renderTab()
    expect(await screen.findByText("옛 이력 — 순위 기록 없음")).toBeInTheDocument()
  })

  it("[검수] 지난 검색의 순위 옆에는 그 검색에 쓴 파일(inputFileId)을 보인다 — 지금 편집본 · 원본이 아님", async () => {
    mswServer.use(
      http.get("*/crime/history/:s/results", () =>
        HttpResponse.json({ items: [row(1, "00758", 90)], total: 1, stored: 1, recomputed: false, basis_changed: false, legacy: false, seen: null })
      ),
      http.get("*/crime/:no/edits", () =>
        HttpResponse.json({ original: null, working_file_id: 4, current_file_id: 9, legacy: false, items: [] })
      ),
      http.get("*/crime/history/:s", () => HttpResponse.json({ ...RUN, input_file_id: 7 })),
      http.get("*/crime/:no", () => HttpResponse.json([historyRow(101)])),
    )
    renderTab()
    await screen.findByText("90%")
    await waitFor(() => {
      const scenes = screen.getAllByRole("img", { name: "현장 족적" })
      expect(scenes.length).toBeGreaterThan(0)
      for (const s of scenes) expect(s.getAttribute("src")).toMatch(/\/files\/7$/)
    })
  })

  it("검색 기록이 없으면 지금 앱 인라인 검색(필수 문양만)", async () => {
    let body: Record<string, unknown> | undefined
    mswServer.use(
      http.get("*/crime/:no/image_load", () => HttpResponse.json({ image: NO })),
      http.get("*/crime/:no", () => HttpResponse.json([])),
      http.post("*/crime/:no/search", async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ result: [{ ftwr_id: "00758", similarity: 70 }], total: 1 })
      }),
    )
    renderTab()
    await waitFor(() => expect(body).toBeDefined())
    expect(body).toMatchObject({ top: ["s21b"] })
    expect(await screen.findByText("70%")).toBeInTheDocument()
  })
})
