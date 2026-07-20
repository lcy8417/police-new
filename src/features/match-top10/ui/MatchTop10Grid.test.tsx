import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"

import { mswServer } from "@/test/msw-server"
import { MatchTop10Grid } from "./MatchTop10Grid"

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())

/**
 * v0.6.0 CHANGE 1(역전): `OUTLINE_NOT_GENERATED`(차단)는 폐기되었고
 * `OUTLINE_GENERATION_FAILED`(자동 계산 자체가 실패한 경우에만)로 교체되었다.
 * 폐기된 코드 문자열이 안내 문구 매핑에 되살아나지 않았는지 회귀 검증한다.
 */
describe("MatchTop10Grid — 게이트 코드 안내 문구(v0.6.0 역전)", () => {
  it("OUTLINE_GENERATION_FAILED 코드에 대해 자동 계산 실패 안내 문구를 렌더한다", () => {
    render(
      <MatchTop10Grid
        crimeNumber="2024-100"
        modelNumber="SHOE-1"
        matches={[]}
        isLoading={false}
        gateCode="OUTLINE_GENERATION_FAILED"
        isGenericError={false}
        onRetry={vi.fn()}
      />
    )
    expect(screen.getByText(/현장 윤곽 자동 계산에 실패했습니다/)).toBeInTheDocument()
  })

  it("폐기된 OUTLINE_NOT_GENERATED 코드 문자열이 렌더 결과 어디에도 등장하지 않는다", () => {
    const { container } = render(
      <MatchTop10Grid
        crimeNumber="2024-100"
        modelNumber="SHOE-1"
        matches={[]}
        isLoading={false}
        gateCode="OUTLINE_GENERATION_FAILED"
        isGenericError={false}
        onRetry={vi.fn()}
      />
    )
    expect(container.textContent).not.toContain("OUTLINE_NOT_GENERATED")
  })

  it("나머지 세 게이트 코드는 무변경 문구를 유지한다", () => {
    const codes = [
      ["ALIGNMENT_NOT_SET", /정렬\(ROI\+방향\)이 설정되지 않았습니다/],
      ["SHOE_BINARY_NOT_AVAILABLE", /이진 이미지가 없어/],
      ["COORDINATE_SPACE_MISMATCH", /좌표 공간이 일치하지 않습니다/],
    ] as const
    for (const [code, pattern] of codes) {
      const { unmount } = render(
        <MatchTop10Grid
          crimeNumber="2024-100"
          modelNumber="SHOE-1"
          matches={[]}
          isLoading={false}
          gateCode={code}
          isGenericError={false}
          onRetry={vi.fn()}
        />
      )
      expect(screen.getByText(pattern)).toBeInTheDocument()
      unmount()
    }
  })
})

/**
 * [CORRECTION] 프런트 레이아웃 재설계 — 게이트/오류가 아닌 로딩·빈·성공 3상태의
 * 배선을 검증한다. 성공 상태는 `MatchCorrespondenceViewer`로 위임되며 그 내부
 * 렌더 디테일은 `MatchCorrespondenceViewer.test.tsx`가 별도로 검증한다.
 */
describe("MatchTop10Grid — 로딩/빈/성공 상태 배선", () => {
  const baseMatch = {
    fx: 10,
    fy: 20,
    sx: 5,
    sy: 6,
    score: 0.7,
    box: { cx: 10, cy: 20, size: 96 },
    box_image: "data:image/png;base64,AAA",
  }

  it("isLoading=true면 로딩 안내를 렌더하고 결과 뷰어를 렌더하지 않는다", () => {
    render(
      <MatchTop10Grid
        crimeNumber="2024-100"
        modelNumber="SHOE-1"
        matches={[]}
        isLoading
        gateCode={null}
        isGenericError={false}
        onRetry={vi.fn()}
      />
    )
    expect(screen.getByText(/top-10 대응 분석 중/)).toBeInTheDocument()
  })

  it("matches가 빈 배열이고 게이트/오류/로딩이 아니면 빈 상태 안내와 재시도 버튼을 렌더한다", () => {
    render(
      <MatchTop10Grid
        crimeNumber="2024-100"
        modelNumber="SHOE-1"
        matches={[]}
        isLoading={false}
        gateCode={null}
        isGenericError={false}
        onRetry={vi.fn()}
      />
    )
    expect(screen.getByText("대응 결과가 없습니다")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /다시 시도/ })).toBeInTheDocument()
  })

  it("matches가 있으면 crimeNumber/modelNumber를 그대로 전달해 대응 뷰어를 렌더한다", async () => {
    // MatchCorrespondenceViewer가 [CORRECTION 3b]로 정렬(alignment)을 조회하므로
    // QueryClientProvider + msw 스텁이 필요하다(폴리곤 없음 → 크롭 없는 폴백 경로).
    mswServer.use(
      http.get("*/crime/*/alignment", () =>
        HttpResponse.json({ polygon: null, arrow: null, flipHorizontal: false })
      )
    )
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={qc}>
        <MatchTop10Grid
          crimeNumber="2024-100"
          modelNumber="SHOE-1"
          matches={[baseMatch]}
          isLoading={false}
          gateCode={null}
          isGenericError={false}
          onRetry={vi.fn()}
        />
      </QueryClientProvider>
    )
    // MatchCorrespondenceViewer가 렌더한 신발 이미지 alt에 modelNumber가 그대로 반영된다.
    expect(await screen.findByAltText(/신발 이미지 \(등록 모델 SHOE-1\)/)).toBeInTheDocument()
  })
})
