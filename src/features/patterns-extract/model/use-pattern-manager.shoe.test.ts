import { describe, expect, it } from "vitest"
import { act, renderHook } from "@testing-library/react"

import type { Shoe } from "@/entities/shoe"
import { usePatternManager } from "./use-pattern-manager"

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
