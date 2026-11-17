import { act, renderHook } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"

import { useImageEdit, type UseImageEditParams } from "./use-image-edit"

const A = "data:image/png;base64,AAAA"
const B = "data:image/png;base64,BBBB"
const C = "data:image/png;base64,CCCC"

function render(params: UseImageEditParams) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  return renderHook(() => useImageEdit(params), { wrapper })
}

describe("useImageEdit 단계 저장 모드(onStep — 사건 창 편집 탭 B4)", () => {
  it("저장이 성공해야 화면에 반영한다", async () => {
    const onStep = vi.fn().mockResolvedValue(undefined)
    const { result } = render({ aprthngNo: "N-1_1", seedImage: A, onStep })
    let ok = false
    await act(async () => {
      ok = await result.current.applyImage(B, { op: "crop" })
    })
    expect(ok).toBe(true)
    expect(onStep).toHaveBeenCalledWith(B, { op: "crop" })
    expect(result.current.workingImage).toBe(B)
    expect(result.current.isProcessing).toBe(false)
  })

  it("저장이 실패하면 그대로 둔다(false)", async () => {
    const onStep = vi.fn().mockRejectedValue(new Error("409"))
    const { result } = render({ aprthngNo: "N-1_1", seedImage: A, onStep })
    let ok = true
    await act(async () => {
      ok = await result.current.applyImage(B, { op: "rotate", deg: 3 })
    })
    expect(ok).toBe(false)
    expect(result.current.workingImage).toBe(A)
    expect(result.current.canUndo).toBe(false)
  })

  it("단계 이름이 없으면(옛 화면 호출) 저장하지 않고 화면 스택에만", async () => {
    const onStep = vi.fn()
    const { result } = render({ aprthngNo: "N-1_1", seedImage: A, onStep })
    await act(async () => {
      await result.current.applyImage(B)
    })
    expect(onStep).not.toHaveBeenCalled()
    expect(result.current.workingImage).toBe(B)
    expect(result.current.canUndo).toBe(true)
  })

  it("resetTo 는 화면 스택을 비우고 그 이미지로", async () => {
    const { result } = render({ aprthngNo: "N-1_1", seedImage: A })
    await act(async () => {
      await result.current.applyImage(B)
    })
    act(() => result.current.resetTo(C))
    expect(result.current.workingImage).toBe(C)
    expect(result.current.displayImage).toBe(C)
    expect(result.current.canUndo).toBe(false)
  })
})
