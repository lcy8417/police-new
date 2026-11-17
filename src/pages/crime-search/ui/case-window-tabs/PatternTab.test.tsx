import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"

import type { Crime } from "@/entities/crime"
import { mswServer } from "@/test/msw-server"

import { useSearchRunSession } from "./model/search-run-session"
import { PatternTab } from "./PatternTab"

// 「문양 코드」 탭(B 단계 묶음 ①) — C1 읽기 · C2 저장(바뀐 게 있을 때만) · D1 기록 · D2 이력. 서버는 MSW.

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver ?? (ResizeObserverStub as unknown as typeof ResizeObserver)

const NO = "05019-24-0017_2"
const IMAGE: Crime = { aprthngNo: NO, apprslReqestNo: "05019-24-0017", image: "data:image/png;base64,AAAA", top: [], mid: [], bottom: [], outline: [] }
const VIEWER = { isAdmin: false, features: ["CRIME_SEARCH"] as const }

const card = (status: string, extra: Record<string, unknown> = {}) => ({
  status, confidence: null, doubtful: false, weight: null, manual: false, count: null, sort_ordr: 0, ai_run_id: null, ...extra,
})

function patterns(rowVersion = 3) {
  return {
    top: [["s21b", 1]],
    mid: [],
    bottom: [],
    outline: [],
    meta: { top: { s21b: card("ai", { confidence: 0.9 }), n21_05: card("suggested", { confidence: 0.6, sort_ordr: 1 }) }, mid: {}, bottom: {}, outline: {} },
    sole_text: "NIKE",
    extracted_raw: null,
    row_version: rowVersion,
  }
}

const calls = { put: [] as Record<string, unknown>[], search: [] as Record<string, unknown>[] }

function useHandlers(opts: { putStatus?: number } = {}) {
  mswServer.use(
    http.get("*/crime/:no/patterns", () => HttpResponse.json(patterns())),
    http.get("*/crime/:no/edits", () =>
      HttpResponse.json({ original: null, working_file_id: 11, current_file_id: 12, legacy: false, items: [] }),
    ),
    http.get("*/crime/:no", () => HttpResponse.json([])),
    http.put("*/crime/:no", async ({ request }) => {
      calls.put.push((await request.json()) as Record<string, unknown>)
      if (opts.putStatus) return HttpResponse.json({ detail: "다른 사람이 먼저 고쳤습니다" }, { status: opts.putStatus })
      return HttpResponse.json({ message: "ok", row_version: 4 })
    }),
    http.post("*/crime/:no/search", async ({ request }) => {
      calls.search.push((await request.json()) as Record<string, unknown>)
      return HttpResponse.json({ result: [], total: 0, weights_applied: {}, weights_mismatch: false, rule_ver: "2026-11-17", blend: 0, search_no: 572433 })
    }),
  )
}

function renderTab() {
  const onOpenSearch = vi.fn()
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const view = render(
    <QueryClientProvider client={qc}>
      <div className="h-[800px]">
        <PatternTab viewer={VIEWER} image={IMAGE} onOpenSearch={onOpenSearch} />
      </div>
    </QueryClientProvider>,
  )
  return { onOpenSearch, ...view }
}

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())
beforeEach(() => {
  calls.put = []
  calls.search = []
  useSearchRunSession.setState({ byImage: {} })
})

describe("PatternTab — 서버 문양 · 검색 기록", () => {
  it("C1 값(제안 카드 포함)을 그리고, 바뀐 게 없으면 「검색」은 저장 없이 D1 기록 하나 → 검색 결과 탭", async () => {
    useHandlers()
    const { onOpenSearch } = renderTab()
    expect(await screen.findByRole("region", { name: "문양 코딩" })).toBeInTheDocument()
    await waitFor(() => expect(document.querySelectorAll('img[src$="s21b.png"]').length).toBeGreaterThan(0))

    fireEvent.click(screen.getByRole("button", { name: "검색" }))
    await waitFor(() => expect(onOpenSearch).toHaveBeenCalledTimes(1))
    expect(calls.put).toHaveLength(0)
    expect(calls.search).toHaveLength(1)
    expect(calls.search[0]).toMatchObject({
      image: NO,
      top: ["s21b"],
      record: true,
      inputFileId: 11, // 원본으로 검색 = 작업본 파일
      source: "original",
      soleText: "NIKE",
      pending: { top: [{ name: "n21_05", confidence: 0.6 }] },
    })
    expect((calls.search[0].query as { top: unknown[] }).top[0]).toMatchObject({ name: "s21b", essential: true, status: "ai" })
    expect(useSearchRunSession.getState().byImage[NO]).toBe(572433)
  })

  it("밑창 문자열을 바꾸면 「검색」 전에 C2(판 번호 그대로) 한 번", async () => {
    useHandlers()
    const { onOpenSearch } = renderTab()
    await screen.findByRole("region", { name: "문양 코딩" })
    const input = await screen.findByDisplayValue("NIKE")
    fireEvent.change(input, { target: { value: "ADIDAS" } })
    fireEvent.click(screen.getByRole("button", { name: "검색" }))
    await waitFor(() => expect(onOpenSearch).toHaveBeenCalled())
    expect(calls.put).toHaveLength(1)
    expect(calls.put[0]).toMatchObject({ soleText: "ADIDAS", rowVersion: 3, top: [["s21b", 1]] })
    expect((calls.put[0].meta as { top: Record<string, unknown> }).top.n21_05).toMatchObject({ status: "suggested", sortOrdr: 1 })
  })

  it("[검수] 확정 판정 장: 「다시 판정」 확인 창이 떠 있는 동안 탭을 떠나면(닫기 · 이동) 저장하지 않는다", async () => {
    useHandlers()
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const view = render(
      <QueryClientProvider client={qc}>
        <div className="h-[800px]">
          <PatternTab viewer={VIEWER} image={IMAGE} judged onOpenSearch={vi.fn()} />
        </div>
      </QueryClientProvider>,
    )
    const input = await screen.findByDisplayValue("NIKE")
    fireEvent.change(input, { target: { value: "ADIDAS" } })
    expect(await screen.findByText(/다시 판정 상태가 됩니다/)).toBeInTheDocument()
    view.unmount() // 확인 창에 답하지 않고 탭을 떠남
    await new Promise((r) => setTimeout(r, 50))
    expect(calls.put).toHaveLength(0)
  })

  it("확정 판정 장이라도 「계속」을 누른 뒤 탭을 떠나면 저장한다", async () => {
    useHandlers()
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const view = render(
      <QueryClientProvider client={qc}>
        <div className="h-[800px]">
          <PatternTab viewer={VIEWER} image={IMAGE} judged onOpenSearch={vi.fn()} />
        </div>
      </QueryClientProvider>,
    )
    const input = await screen.findByDisplayValue("NIKE")
    fireEvent.change(input, { target: { value: "ADIDAS" } })
    fireEvent.click(await screen.findByRole("button", { name: "계속" }))
    view.unmount()
    await waitFor(() => expect(calls.put).toHaveLength(1))
  })

  it("저장이 409 면 검색하지 않고 서버 값으로 되돌린다", async () => {
    useHandlers({ putStatus: 409 })
    const { onOpenSearch } = renderTab()
    const input = await screen.findByDisplayValue("NIKE")
    fireEvent.change(input, { target: { value: "ADIDAS" } })
    fireEvent.click(screen.getByRole("button", { name: "검색" }))
    await waitFor(() => expect(calls.put).toHaveLength(1))
    await waitFor(() => expect(screen.getByDisplayValue("NIKE")).toBeInTheDocument())
    expect(calls.search).toHaveLength(0)
    expect(onOpenSearch).not.toHaveBeenCalled()
  })

  it("C1 실패는 조회 실패 상태", async () => {
    mswServer.use(
      http.get("*/crime/:no/patterns", () => new HttpResponse(null, { status: 500 })),
      http.get("*/crime/:no/edits", () => new HttpResponse(null, { status: 500 })),
      http.get("*/crime/:no", () => HttpResponse.json([])),
    )
    renderTab()
    expect(await screen.findByRole("button", { name: /다시/ })).toBeInTheDocument()
  })
})
