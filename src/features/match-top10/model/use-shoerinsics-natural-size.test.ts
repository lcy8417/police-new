import { afterEach, describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"

import { useShoerinsicsNaturalSize } from "./use-shoerinsics-natural-size"

/** 실제 `Image` 생성자를 스텁으로 교체해 onload를 동기적으로 즉시 발생시킨다
 * (jsdom은 실제 이미지를 로드하지 않으므로 명시 스텁 필요 — 기존 관례와 동일). */
function stubImageConstructor(natural: { width: number; height: number }) {
  const OriginalImage = globalThis.Image
  class StubImage {
    onload: (() => void) | null = null
    naturalWidth = natural.width
    naturalHeight = natural.height
    set src(_value: string) {
      // 마이크로태스크로 지연시켜 실제 네트워크 로드와 유사한 비동기 특성을 유지한다.
      queueMicrotask(() => this.onload?.())
    }
  }
  // @ts-expect-error - 테스트 전용 스텁 생성자로 교체
  globalThis.Image = StubImage
  return () => {
    globalThis.Image = OriginalImage
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("useShoerinsicsNaturalSize — Shoerinsics 원본 크기 실측(RGB 모드 정규화용)", () => {
  it("enabled=true면 Shoerinsics 이미지를 로드해 자연 크기를 반환한다", async () => {
    const restore = stubImageConstructor({ width: 300, height: 756 })
    try {
      const { result } = renderHook(() =>
        useShoerinsicsNaturalSize({ modelNumber: "SHOE-1", enabled: true })
      )
      expect(result.current).toBeNull()
      await waitFor(() => expect(result.current).toEqual({ width: 300, height: 756 }))
    } finally {
      restore()
    }
  })

  it("enabled=false면 측정하지 않고 null을 유지한다(스케치/이진 모드는 정규화 불필요)", async () => {
    const restore = stubImageConstructor({ width: 300, height: 756 })
    try {
      const { result } = renderHook(() =>
        useShoerinsicsNaturalSize({ modelNumber: "SHOE-1", enabled: false })
      )
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(result.current).toBeNull()
    } finally {
      restore()
    }
  })
})
