import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"

import { mswServer } from "@/test/msw-server"
import { AlignmentGate } from "./AlignmentGate"

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
beforeAll(() => {
  globalThis.ResizeObserver =
    globalThis.ResizeObserver ?? (ResizeObserverStub as unknown as typeof ResizeObserver)
  mswServer.listen({ onUnhandledRequest: "error" })
})
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())

function renderGate(crimeNumber: string, modelNumber: string, onProceed = () => {}) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <AlignmentGate crimeNumber={crimeNumber} modelNumber={modelNumber} onProceed={onProceed} />
    </QueryClientProvider>
  )
}

function stubImageLoad(img: HTMLImageElement, width = 400, height = 300) {
  Object.defineProperty(img, "naturalWidth", { value: width, configurable: true })
  Object.defineProperty(img, "naturalHeight", { value: height, configurable: true })
  img.getBoundingClientRect = () =>
    ({
      width: 200,
      height: 150,
      left: 0,
      top: 0,
      right: 200,
      bottom: 150,
      x: 0,
      y: 0,
      toJSON() {},
    }) as DOMRect
  fireEvent.load(img)
}

describe("AlignmentGate — 필수 게이트(REQ-ALIGN-001a: 스킵 경로 부재)", () => {
  beforeEach(() => {
    mswServer.use(
      http.get("*/crime/*/alignment", () =>
        HttpResponse.json({ polygon: null, arrow: null, flipHorizontal: false })
      )
    )
  })

  it("건너뛰기/스킵/나중에 류의 버튼이 존재하지 않는다", async () => {
    renderGate("2024-100", "SHOE-1")
    await waitFor(() => expect(screen.queryByText("정렬 정보를 불러오는 중…")).toBeNull())

    for (const forbidden of [/건너뛰기/, /스킵/, /skip/i, /나중에/]) {
      expect(screen.queryByText(forbidden)).toBeNull()
    }
  })

  it("미설정 상태에서는 '다음 단계로' 버튼이 비활성화된다", async () => {
    renderGate("2024-100", "SHOE-1")
    await waitFor(() => expect(screen.queryByText("정렬 정보를 불러오는 중…")).toBeNull())

    const proceedButton = screen.getByRole("button", { name: /다음 단계로/ })
    expect(proceedButton).toBeDisabled()
  })

  it("이미지 로드 시 밑창 템플릿이 자동으로 채워져 '다음: 방향 지정'이 곧바로 활성화된다(AC-ALIGN-026)", async () => {
    renderGate("2024-100", "SHOE-1")
    await waitFor(() => expect(screen.queryByText("정렬 정보를 불러오는 중…")).toBeNull())

    const img = screen.getByAltText("정렬용 저장 현장 이미지") as HTMLImageElement
    stubImageLoad(img)

    const nextButton = screen.getByRole("button", { name: /다음: 방향 지정/ })
    expect(nextButton).not.toBeDisabled()
  })

  it("템플릿 → 방향 지정(앞굽/뒤꿈치) → 저장 → 다음 단계로 전체 흐름이 동작한다", async () => {
    mswServer.use(
      http.post("*/crime/2024-100/alignment", async ({ request }) => {
        const body = (await request.json()) as {
          polygon: number[][]
          arrow: number[][]
          flipHorizontal: boolean
        }
        return HttpResponse.json(body)
      })
    )
    let proceeded = false
    renderGate("2024-100", "SHOE-1", () => {
      proceeded = true
    })
    await waitFor(() => expect(screen.queryByText("정렬 정보를 불러오는 중…")).toBeNull())

    const img = screen.getByAltText("정렬용 저장 현장 이미지") as HTMLImageElement
    stubImageLoad(img)

    fireEvent.click(screen.getByRole("button", { name: /다음: 방향 지정/ }))
    expect(screen.getByText(/앞굽\(toe\)을 클릭하세요/)).toBeInTheDocument()

    const surface = screen.getByTestId("alignment-surface")
    fireEvent.click(surface, { clientX: 5, clientY: 5 })
    expect(screen.getByText(/뒤꿈치\(heel\)를 클릭하세요/)).toBeInTheDocument()
    fireEvent.click(surface, { clientX: 15, clientY: 15 })

    const saveButton = screen.getByRole("button", { name: /^저장$/ })
    await waitFor(() => expect(saveButton).not.toBeDisabled())
    fireEvent.click(saveButton)

    const proceedButton = screen.getByRole("button", { name: /다음 단계로/ })
    await waitFor(() => expect(proceedButton).not.toBeDisabled())

    fireEvent.click(proceedButton)
    expect(proceeded).toBe(true)
  })

  it("'처음부터 그리기'를 누르면 템플릿이 비워지고 클릭 그리기로 전환된다(REQ-ALIGN-017)", async () => {
    renderGate("2024-100", "SHOE-1")
    await waitFor(() => expect(screen.queryByText("정렬 정보를 불러오는 중…")).toBeNull())
    const img = screen.getByAltText("정렬용 저장 현장 이미지") as HTMLImageElement
    stubImageLoad(img)

    fireEvent.click(screen.getByRole("button", { name: /처음부터 그리기/ }))
    // 템플릿이 비워졌으므로 방향 지정으로 넘어갈 수 없다(3점 미만).
    expect(screen.getByRole("button", { name: /다음: 방향 지정/ })).toBeDisabled()

    const surface = screen.getByTestId("alignment-surface")
    fireEvent.click(surface, { clientX: 10, clientY: 10 })
    fireEvent.click(surface, { clientX: 30, clientY: 10 })
    fireEvent.click(surface, { clientX: 30, clientY: 30 })
    expect(screen.getByRole("button", { name: /다음: 방향 지정/ })).not.toBeDisabled()
  })

  it("좌우 반전 토글이 눌리면 aria-pressed와 안내 배너가 반영된다(REQ-ALIGN-020a)", async () => {
    renderGate("2024-100", "SHOE-1")
    await waitFor(() => expect(screen.queryByText("정렬 정보를 불러오는 중…")).toBeNull())

    const flipButton = screen.getByRole("button", { name: /좌우 반전/ })
    expect(flipButton).toHaveAttribute("aria-pressed", "false")
    fireEvent.click(flipButton)
    expect(flipButton).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText(/반전 미리보기/)).toBeInTheDocument()
  })
})

describe("AlignmentGate — 복원(REQ-ALIGN-008/020b)", () => {
  it("저장된 정렬 + 반전 상태를 복원하고 review 단계로 진입한다", async () => {
    mswServer.use(
      http.get("*/crime/2024-200/alignment", () =>
        HttpResponse.json({
          polygon: [
            [10, 10],
            [50, 10],
            [50, 40],
          ],
          arrow: [
            [20, 20],
            [40, 30],
          ],
          flipHorizontal: true,
        })
      )
    )
    renderGate("2024-200", "SHOE-9")
    await waitFor(() => expect(screen.queryByText("정렬 정보를 불러오는 중…")).toBeNull())

    expect(screen.getByRole("button", { name: /다음 단계로/ })).not.toBeDisabled()
    expect(screen.getByRole("button", { name: /좌우 반전/ })).toHaveAttribute("aria-pressed", "true")
  })
})
