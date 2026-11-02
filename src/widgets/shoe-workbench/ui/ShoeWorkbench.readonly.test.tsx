import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { mswServer } from "@/test/msw-server"
import { ShoeWorkbench } from "./ShoeWorkbench"

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

function renderWorkbench(props: { canEdit: boolean; mode: "new" | "edit" }) {
  const onNewRegister = vi.fn()
  const qc = new QueryClient()
  render(
    <QueryClientProvider client={qc}>
      <ShoeWorkbench
        {...props}
        onNewRegister={onNewRegister}
        listPanel={<p>신발 목록 자리</p>}
        infoSheetOpen
      />
    </QueryClientProvider>
  )
  return { onNewRegister }
}

describe("ShoeWorkbench 보기 전용(SHOE_EDIT 없음)", () => {
  it("read-only workbench hides mutations", () => {
    // ?mode=new로 들어와도 보기 모드 — 신규 등록 폼·탭이 없다.
    renderWorkbench({ canEdit: false, mode: "new" })

    expect(screen.getByText("신발 목록 자리")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "새 신발" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "신규 신발 등록" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /이미지 (등록|교체)/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "추출" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "초기화" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^(등록|저장)$/ })).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText("신발ID 입력 (필수)")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "왼쪽으로 90도 회전" })).not.toBeInTheDocument()
    // 편집 시트도 열리지 않는다(infoSheetOpen이 true여도).
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(screen.getByText("보기 전용 · 문양을 바꿀 수 없습니다")).toBeInTheDocument()
  })

  it("편집 권한이 있으면 기존처럼 등록 폼과 추출 버튼이 보인다", () => {
    renderWorkbench({ canEdit: true, mode: "new" })

    expect(screen.getByRole("button", { name: "새 신발" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "추출" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "등록" })).toBeInTheDocument()
    expect(screen.getByPlaceholderText("신발ID 입력 (필수)")).toBeInTheDocument()
  })
})
