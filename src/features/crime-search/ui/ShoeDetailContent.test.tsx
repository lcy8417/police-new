import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"

import { mswServer } from "@/test/msw-server"
import { ShoeDetailContent } from "./ShoeDetailContent"

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())

function renderCompact(topMatchSlot?: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ShoeDetailContent
        variant="compact"
        crimeNumber="2024-100"
        modelNumber="SHOE-1"
        topMatchSlot={topMatchSlot}
      />
    </QueryClientProvider>
  )
}

function stubBackend() {
  mswServer.use(
    http.get("*/shoes/SHOE-1", () =>
      HttpResponse.json({ model_number: "SHOE-1", top: [], mid: [], bottom: [], outline: [] })
    ),
    http.post("*/crime/2024-100/similarity", () =>
      HttpResponse.json({ query_attn_map: null, ref_attn_map: null, matches: [] })
    )
  )
}

/**
 * SPEC-MATCH-TOP10-001 v0.6.0 CHANGE 2(REQ-MATCH-014/014b, AC-MATCH-020): 레거시
 * "유사부위 대응"(MatchViewer) 섹션은 렌더 트리에서 제거되었고, top-10 슬롯이 그
 * 자리를 점유한다. 백엔드 `fetchSimilarity`(어텐션 맵)는 이 화면이 계속 소비하므로
 * 무변경(REQ-MATCH-014a) — 이 테스트는 fetchSimilarity를 mock하되 그 응답을 소비하는
 * MatchViewer 컴포넌트만 렌더 트리에서 사라졌음을 검증한다.
 */
describe("ShoeDetailContent(compact) — 레거시 유사부위 대응 제거 + top-10 슬롯 점유(CHANGE 2)", () => {
  it("레거시 '유사부위 대응' 관련 표지가 렌더되지 않는다", async () => {
    stubBackend()
    renderCompact(<div data-testid="stub-top10">Top-10 결과</div>)

    await waitFor(() => expect(screen.getByTestId("stub-top10")).toBeInTheDocument())

    // MatchViewer가 렌더하던 레거시 헤더/표지가 어디에도 없어야 한다.
    expect(screen.queryByText(/유사부위 대응/)).toBeNull()
  })

  it("topMatchSlot으로 주입된 top-10 컴포넌트가 'Top-10 대응 매칭' 섹션에 렌더된다", async () => {
    stubBackend()
    renderCompact(<div data-testid="stub-top10">Top-10 결과</div>)

    await waitFor(() => expect(screen.getByText("Top-10 대응 매칭")).toBeInTheDocument())
    expect(screen.getByTestId("stub-top10")).toBeInTheDocument()
  })

  it("topMatchSlot을 전달하지 않으면 그 섹션 자체가 렌더되지 않는다(레거시 흐름 무변경)", async () => {
    stubBackend()
    renderCompact(undefined)

    await waitFor(() => expect(screen.getByText(/모델 SHOE-1/)).toBeInTheDocument())
    expect(screen.queryByText("Top-10 대응 매칭")).toBeNull()
  })

  it("[CORRECTION 1] top-10 대응 매칭 섹션이 문양 비교 섹션보다 DOM상 먼저(최상단) 렌더된다", async () => {
    stubBackend()
    renderCompact(<div data-testid="stub-top10">Top-10 결과</div>)

    await waitFor(() => expect(screen.getByText("Top-10 대응 매칭")).toBeInTheDocument())
    expect(screen.getByText("문양 비교")).toBeInTheDocument()

    const top10Heading = screen.getByText("Top-10 대응 매칭")
    const patternHeading = screen.getByText("문양 비교")
    // DOCUMENT_POSITION_FOLLOWING(4)이 설정돼 있으면 top10Heading이 patternHeading보다 앞선다.
    const position = top10Heading.compareDocumentPosition(patternHeading)
    expect(Boolean(position & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true)
  })
})
