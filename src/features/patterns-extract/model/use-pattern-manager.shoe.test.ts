import { afterEach, describe, expect, it, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"

import type { Shoe } from "@/entities/shoe"
import { usePatternManager } from "./use-pattern-manager"
import * as api from "@/services/api"

/** formData/setFormData를 가진 신발 모드로 훅을 구동하는 테스트 하네스. */
function renderShoeManager() {
  let formData: Shoe = {
    image: "data:image/png;base64,AAAA",
    top: [],
    mid: [],
    bottom: [],
    outline: [],
    modelNumber: "",
  }
  const setFormData = (updater: Shoe | ((prev: Shoe) => Shoe)) => {
    formData = typeof updater === "function" ? updater(formData) : updater
  }
  const view = renderHook(() =>
    usePatternManager({ formData, setFormData, imgRef: null })
  )
  return { view, get: () => formData }
}

describe("usePatternManager 신발 모드 clearPattern", () => {
  it("삽입된 문양을 네 부위 모두 비운다", () => {
    const { view, get } = renderShoeManager()

    act(() => {
      view.result.current.insertPatternToZone("top", "/patterns/무늬1.png")
      view.result.current.insertPatternToZone("bottom", "/patterns/원2.png")
    })
    expect(get().top).toEqual(["/patterns/무늬1.png"])
    expect(get().bottom).toEqual(["/patterns/원2.png"])

    act(() => {
      view.result.current.clearPattern()
    })
    expect(get().top).toEqual([])
    expect(get().mid).toEqual([])
    expect(get().bottom).toEqual([])
    expect(get().outline).toEqual([])
  })
})

describe("usePatternManager 신발 모드 extractPattern — 좌표 계약 회귀 가드 (AC-SCENE-015)", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("요청 본문에 line_ys·render_size가 여전히 포함되고 [1, renderH-1]로 clamp된다", async () => {
    const spy = vi.spyOn(api, "patternsExtract").mockResolvedValue({
      top: [],
      mid: [],
      bottom: [],
      outline: [],
    })

    const { view } = renderShoeManager()
    Object.defineProperty(view.result.current.canvasRef, "current", {
      value: { getBoundingClientRect: () => ({ width: 200, height: 300 }) },
      writable: true,
    })

    await act(async () => {
      await view.result.current.extractPattern()
    })

    const body = (spy.mock.calls[0][0] as {
      body: { line_ys?: unknown; render_size?: unknown; type?: unknown }
    }).body
    expect("line_ys" in body).toBe(true)
    expect("render_size" in body).toBe(true)
    // 기본 lineYs [100, 200]는 [1, renderH-1]=[1,299] 범위 안이므로 그대로 정수로 나간다.
    expect(body.line_ys).toEqual([100, 200])
    expect(body.render_size).toEqual([200, 300])
    expect(body.type).toBe("shoes")
  })
})
