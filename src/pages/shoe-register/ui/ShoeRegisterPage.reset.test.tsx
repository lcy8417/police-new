import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { mswServer } from "@/test/msw-server"
import { ShoeRegisterPage } from "./ShoeRegisterPage"

// jsdom에는 ResizeObserver가 없어 PatternCanvas 마운트가 실패한다 — no-op 폴리필.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver =
  globalThis.ResizeObserver ?? (ResizeObserverStub as unknown as typeof ResizeObserver)

beforeAll(() => mswServer.listen({ onUnhandledRequest: "bypass" }))
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())

function renderPage() {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <ShoeRegisterPage />
    </QueryClientProvider>
  )
}

describe("ShoeRegisterPage 초기화", () => {
  it("초기화 버튼이 입력 필드를 비운다", () => {
    renderPage()
    const modelInput = screen.getByPlaceholderText(
      "모델번호 입력 (필수)"
    ) as HTMLInputElement
    fireEvent.change(modelInput, { target: { value: "ABC-123" } })
    expect(modelInput.value).toBe("ABC-123")

    // 화면에 "초기화" 버튼이 둘(캔버스 문양초기화 + 정보패널 초기화) 있으므로
    // 정보패널(마지막) 버튼을 클릭한다.
    const resetButtons = screen.getAllByRole("button", { name: "초기화" })
    fireEvent.click(resetButtons[resetButtons.length - 1])

    expect(modelInput.value).toBe("")
  })
})
