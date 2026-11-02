import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"

import { useCrimeStore } from "@/entities/crime"
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
        aprthngNo={APRTHNG_NO}
        ftwrId={FTWR_ID}
        topMatchSlot={topMatchSlot}
      />
    </QueryClientProvider>
  )
}

/** 감정물 번호와 앞자리 0이 있는 신발 ID — 둘 다 문자열 그대로 써야 한다. */
const APRTHNG_NO = "05019-24-0017_5"
const FTWR_ID = "00758"

/** 마지막 유사도 요청의 `ftwr_id` 쿼리 값(서버로 실제 나간 신발 ID). */
let similarityFtwrId: string | null = null

function stubBackend() {
  similarityFtwrId = null
  mswServer.use(
    http.get(`*/shoes/${FTWR_ID}`, () =>
      HttpResponse.json({ ftwr_id: FTWR_ID, top: [], mid: [], bottom: [], outline: [] })
    ),
    http.post(`*/crime/${APRTHNG_NO}/similarity`, ({ request }) => {
      similarityFtwrId = new URL(request.url).searchParams.get("ftwr_id")
      return HttpResponse.json({ query_attn_map: null, ref_attn_map: null, matches: [] })
    })
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

    await waitFor(() => expect(screen.getByText(/신발 ID 00758/)).toBeInTheDocument())
    expect(screen.queryByText("Top-10 대응 매칭")).toBeNull()
  })

  it("유사도 요청은 ftwr_id 쿼리로 앞자리 0까지 그대로 보낸다", async () => {
    stubBackend()
    renderCompact(undefined)

    await waitFor(() => expect(similarityFtwrId).toBe(FTWR_ID))
  })
})

describe("ShoeDetailContent(page) — SCAS 필드 표시", () => {
  afterEach(() => useCrimeStore.setState({ crimeData: [] }))

  it("측면 이미지는 ftwrId로 조립하고, 사건 정보는 감정물 번호·신발 ID 라벨로 표시한다", async () => {
    stubBackend()
    useCrimeStore.setState({
      crimeData: [
        {
          aprthngNo: APRTHNG_NO,
          apprslReqestNo: "05019-24-0017",
          pickMthCode: "FT001",
          top: [],
          mid: [],
          bottom: [],
          outline: [],
        },
      ],
    })
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={qc}>
        <ShoeDetailContent variant="page" aprthngNo={APRTHNG_NO} ftwrId={FTWR_ID} />
      </QueryClientProvider>
    )

    const side = await screen.findByAltText("측면 이미지")
    expect(side.getAttribute("src")).toMatch(/\/shoes_images\/S\/00758\.png$/)
    expect(screen.getByText("감정물 번호")).toBeInTheDocument()
    expect(screen.getByText(APRTHNG_NO)).toBeInTheDocument()
    expect(screen.getByText("신발 ID")).toBeInTheDocument()
    expect(screen.getByText(FTWR_ID)).toBeInTheDocument()
    expect(screen.getByText("감정의뢰번호")).toBeInTheDocument()
    expect(screen.getByText("05019-24-0017")).toBeInTheDocument()
    expect(screen.getByText("채취 방법 코드")).toBeInTheDocument()
    expect(screen.getByText("FT001")).toBeInTheDocument()
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
