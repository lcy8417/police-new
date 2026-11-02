import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"

import { mswServer } from "@/test/msw-server"
import { MatchTop10Panel } from "./MatchTop10Panel"

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
afterEach(() => {
  mswServer.resetHandlers()
  vi.unstubAllGlobals()
})
afterAll(() => mswServer.close())

function renderPanel() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MatchTop10Panel crimeNumber="2024-100" modelNumber="SHOE-1" />
    </QueryClientProvider>
  )
}

const MATCHES_RESPONSE = {
  matches: Array.from({ length: 4 }, (_, i) => ({
    fx: i * 10,
    fy: i * 10,
    sx: i * 5,
    sy: i * 5,
    score: 0.9 - i * 0.1,
    box: { cx: i * 10, cy: i * 10, size: 96 },
    box_image: `data:image/png;base64,AAA${i}`,
  })),
  crime_number: "2024-100",
  model_number: "SHOE-1",
}

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
  )
}

describe("MatchTop10Panel — 시각화 애니메이션(CHANGE 4, REQ-MATCH-015 계열)", () => {
  beforeEach(() => {
    stubReducedMotion(false)
    // MatchCorrespondenceViewer가 [CORRECTION 3b]로 정렬(alignment)을 조회한다 —
    // 이 스위트의 관심사가 아니므로 폴리곤 없음(크롭 없는 폴백)으로 기본 스텁한다.
    mswServer.use(
      http.get("*/crime/*/alignment", () =>
        HttpResponse.json({ polygon: null, arrow: null, flipHorizontal: false })
      )
    )
  })

  // 회귀 방지: 예전에는 "Top-10 매칭 시작" 버튼을 눌러야 조회가 시작됐다. 이 패널은
  // 상세 슬라이드 패널이 열릴 때 비로소 마운트되므로 마운트 자체가 사용자 의사표시다.
  it("마운트되면 버튼 클릭 없이 곧바로 match_top10을 조회한다", async () => {
    let callCount = 0
    mswServer.use(
      http.post("*/crime/2024-100/match_top10", () => {
        callCount += 1
        return HttpResponse.json(MATCHES_RESPONSE)
      })
    )
    renderPanel()

    await waitFor(() => expect(callCount).toBe(1))
    // 매칭을 다시 요구하는 트리거 버튼이 남아 있지 않다.
    expect(screen.queryByRole("button", { name: /매칭 시작/ })).toBeNull()
  })

  it("마운트 후 정확히 1회의 match_top10 호출만 발생한다 — 애니메이션이 추가 호출을 만들지 않는다", async () => {
    let callCount = 0
    mswServer.use(
      http.post("*/crime/2024-100/match_top10", () => {
        callCount += 1
        return HttpResponse.json(MATCHES_RESPONSE)
      })
    )
    renderPanel()

    await waitFor(() => expect(screen.getByTestId("match-reveal-overlay")).toBeInTheDocument())

    // 애니메이션이 진행되는 동안에도(오버레이 표시 중) 추가 호출은 없다.
    expect(callCount).toBe(1)
  })

  it("스킵을 누르면 오버레이가 즉시 사라지고 카드 그리드(결과)에 도달한다(비차단, REQ-MATCH-015b)", async () => {
    mswServer.use(
      http.post("*/crime/2024-100/match_top10", () => HttpResponse.json(MATCHES_RESPONSE))
    )
    renderPanel()

    await waitFor(() => expect(screen.getByTestId("match-reveal-overlay")).toBeInTheDocument())

    fireEvent.click(screen.getByRole("button", { name: /건너뛰기/ }))

    await waitFor(() => expect(screen.queryByTestId("match-reveal-overlay")).toBeNull())
    // 결과 카드 이미지(box_image)가 실제로 렌더된다 — 스킵해도 결과가 보존됨(payload 불변).
    expect(screen.getAllByAltText(/신발 이미지/).length).toBeGreaterThan(0)
  })

  it("prefers-reduced-motion이 켜져 있으면 애니메이션 없이 결과가 즉시 표시된다(REQ-MATCH-015c)", async () => {
    stubReducedMotion(true)
    mswServer.use(
      http.post("*/crime/2024-100/match_top10", () => HttpResponse.json(MATCHES_RESPONSE))
    )
    renderPanel()

    await waitFor(() =>
      expect(screen.getAllByAltText(/신발 이미지/).length).toBeGreaterThan(0)
    )
    expect(screen.queryByTestId("match-reveal-overlay")).toBeNull()
  })

  it("게이트 오류 상태에서는 애니메이션 오버레이가 뜨지 않는다(정렬 미설정 등)", async () => {
    mswServer.use(
      http.post("*/crime/2024-100/match_top10", () =>
        HttpResponse.json(
          { detail: { code: "ALIGNMENT_NOT_SET", crime_number: "2024-100" } },
          { status: 409 }
        )
      )
    )
    renderPanel()

    await waitFor(() =>
      expect(screen.getByText(/정렬\(ROI\+방향\)이 설정되지 않았습니다/)).toBeInTheDocument()
    )
    expect(screen.queryByTestId("match-reveal-overlay")).toBeNull()
  })
})
