import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { delay, http, HttpResponse } from "msw"

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

/**
 * 판 번호 · 값을 드는 가짜 서버(C1 · C2 · C3 · D1). C2 는 기대 판 번호가 다르면 409, 맞으면 +1.
 * 확신도는 서버 칸(`app.aprthng_ptrn_meta.ai_confidence numeric(4,3)`)처럼 소수 셋째 자리로 저장한다 — AI 추출 점수는 넷째 자리까지 온다.
 */
function statefulServer(opts: { putDelayMs?: number } = {}) {
  const state = { version: 3, conflicts: 0, body: patterns(3) as Record<string, unknown> }
  const round3 = (v: unknown) => (typeof v === "number" ? Math.round(v * 1000) / 1000 : null)
  const toC1 = (b: Record<string, unknown>) => {
    const meta: Record<string, Record<string, unknown>> = { top: {}, mid: {}, bottom: {}, outline: {} }
    for (const [zone, cards] of Object.entries((b.meta ?? {}) as Record<string, Record<string, Record<string, unknown>>>)) {
      for (const [name, c] of Object.entries(cards)) {
        meta[zone][name] = card(c.status as string, {
          confidence: round3(c.confidence),
          doubtful: Boolean(c.doubtful),
          weight: c.weight ?? null,
          manual: Boolean(c.manual),
          count: c.count ?? null,
          sort_ordr: c.sortOrdr ?? 0,
          ai_run_id: c.aiRunId ?? null,
        })
      }
    }
    return { top: b.top, mid: b.mid, bottom: b.bottom, outline: b.outline, meta, sole_text: b.soleText, extracted_raw: b.extracted_raw }
  }
  mswServer.use(
    http.get("*/crime/:no/patterns", () => HttpResponse.json({ ...state.body, row_version: state.version })),
    http.get("*/crime/:no/edits", () =>
      HttpResponse.json({ original: null, working_file_id: 11, current_file_id: 12, legacy: false, items: [] }),
    ),
    http.get("*/crime/:no", () => HttpResponse.json([])),
    http.put("*/crime/:no", async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      calls.put.push(body)
      if (opts.putDelayMs) await delay(opts.putDelayMs)
      if (body.rowVersion !== state.version) {
        state.conflicts += 1
        return HttpResponse.json({ detail: "다른 사람이 먼저 고쳤습니다" }, { status: 409 })
      }
      state.version += 1
      state.body = toC1(body)
      return HttpResponse.json({ message: "ok", row_version: state.version })
    }),
    http.post("*/crime/:no/patterns_extract", () =>
      HttpResponse.json([{ code: "n32_04", score: 0.9567 }], { headers: { "X-AI-Run-Id": "77" } }),
    ),
    http.post("*/crime/:no/search", async ({ request }) => {
      calls.search.push((await request.json()) as Record<string, unknown>)
      return HttpResponse.json({ result: [], total: 0, weights_applied: {}, weights_mismatch: false, rule_ver: "2026-11-17", blend: 0, search_no: 572434 })
    }),
  )
  return state
}

const mounted: (() => void)[] = []
/** 남아 있는 탭을 모두 떠난다(탭 이동 · 창 닫기와 같음) */
const cleanupTabs = () => mounted.splice(0).forEach((u) => u())

function renderTab(client?: QueryClient) {
  const onOpenSearch = vi.fn()
  const qc = client ?? new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const view = render(
    <QueryClientProvider client={qc}>
      <div className="h-[800px]">
        <PatternTab viewer={VIEWER} image={IMAGE} onOpenSearch={onOpenSearch} />
      </div>
    </QueryClientProvider>,
  )
  let gone = false
  const unmount = () => {
    if (gone) return
    gone = true
    view.unmount()
  }
  mounted.push(unmount)
  return { onOpenSearch, ...view, unmount }
}

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
afterEach(() => {
  cleanupTabs()
  mswServer.resetHandlers()
})
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

  describe("[버그] 혼자 쓰는데 「다른 사람이 먼저 고쳤습니다」(C2 409) — 내 저장 뒤 판 번호를 놓치던 것", () => {
    it("AI 확신도(서버 소수 셋째 자리로 저장)가 든 채 「검색」 저장 뒤 탭을 떠나도 낡은 판 번호로 다시 저장하지 않는다", async () => {
      const server = statefulServer()
      const { onOpenSearch, unmount } = renderTab()
      fireEvent.click(await screen.findByRole("button", { name: "원본 이미지로 추출" }))
      fireEvent.click(await screen.findByRole("button", { name: "상에 n32_04 넣기(AI 0.96)" }))
      fireEvent.click(screen.getByRole("button", { name: "검색" }))
      await waitFor(() => expect(onOpenSearch).toHaveBeenCalledTimes(1))
      expect(calls.put).toHaveLength(1)
      expect(server.version).toBe(4)
      unmount() // 검색 결과 탭으로 — 탭을 떠날 때 저장(바뀐 게 없으면 안 함)
      await new Promise((r) => setTimeout(r, 50))
      expect(calls.put.map((b) => b.rowVersion)).toEqual([3])
      expect(server.conflicts).toBe(0)
    })

    it("탭을 떠나며 저장한 뒤 다시 들어오면 캐시의 옛 값(옛 판 번호)을 고칠 수 있게 보이지 않고, 새로 읽은 값으로 이어서 저장한다", async () => {
      const server = statefulServer()
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const first = renderTab(qc)
      fireEvent.change(await screen.findByDisplayValue("NIKE"), { target: { value: "ADIDAS" } })
      first.unmount()
      await waitFor(() => expect(server.version).toBe(4))
      renderTab(qc)
      // 옛 캐시(NIKE · 판 3)로 고치기 시작하면 다음 저장이 409 — 새로 읽기 전에는 고칠 칸을 내주지 않는다
      expect(screen.queryByDisplayValue("NIKE")).toBeNull()
      fireEvent.change(await screen.findByDisplayValue("ADIDAS"), { target: { value: "PUMA" } })
      cleanupTabs()
      await waitFor(() => expect(calls.put).toHaveLength(2))
      expect(calls.put[1]).toMatchObject({ rowVersion: 4, soleText: "PUMA" })
      await waitFor(() => expect(server.version).toBe(5))
      expect(server.conflicts).toBe(0)
    })

    it("떠나며 한 저장이 아직 끝나지 않았을 때 다시 들어와도, 그 저장이 끝나고 새로 읽을 때까지 기다린다", async () => {
      const server = statefulServer({ putDelayMs: 120 })
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const first = renderTab(qc)
      fireEvent.change(await screen.findByDisplayValue("NIKE"), { target: { value: "ADIDAS" } })
      first.unmount()
      renderTab(qc)
      // 다시 읽기(판 3 — 저장 전)는 끝났어도 앞 저장이 진행 중이면 아직 고칠 수 없다
      await new Promise((r) => setTimeout(r, 40))
      expect(screen.queryByDisplayValue("NIKE")).toBeNull()
      fireEvent.change(await screen.findByDisplayValue("ADIDAS"), { target: { value: "PUMA" } })
      cleanupTabs()
      await waitFor(() => expect(calls.put).toHaveLength(2))
      expect(calls.put[1]).toMatchObject({ rowVersion: 4, soleText: "PUMA" })
      await waitFor(() => expect(server.version).toBe(5))
      expect(server.conflicts).toBe(0)
    })

    it("진짜 동시 수정(다른 사람이 먼저 저장)은 여전히 409 로 막고 서버 값으로 되돌린다", async () => {
      const server = statefulServer()
      const { onOpenSearch } = renderTab()
      const input = await screen.findByDisplayValue("NIKE")
      server.version = 9 // 다른 사람이 그사이 저장
      fireEvent.change(input, { target: { value: "ADIDAS" } })
      fireEvent.click(screen.getByRole("button", { name: "검색" }))
      await waitFor(() => expect(server.conflicts).toBe(1))
      expect(calls.put[0]).toMatchObject({ rowVersion: 3 })
      expect(onOpenSearch).not.toHaveBeenCalled()
    })
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
