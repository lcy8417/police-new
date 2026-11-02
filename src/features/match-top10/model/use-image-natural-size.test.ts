import { afterEach, describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"

import { revalidateSession } from "@/shared/api"

import { useImageNaturalSize } from "./use-image-natural-size"

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api")>()),
  revalidateSession: vi.fn(() => Promise.resolve()),
}))

/** 모든 로드가 실패하는 `Image` 스텁 — 마지막으로 시도한 crossOrigin 값을 기록한다. */
function stubFailingImage() {
  const OriginalImage = globalThis.Image
  const modes: Array<string | null> = []
  class FailingImage {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    crossOrigin: string | null = null
    set src(_value: string) {
      modes.push(this.crossOrigin)
      queueMicrotask(() => this.onerror?.())
    }
  }
  // @ts-expect-error - 테스트 전용 스텁 생성자로 교체
  globalThis.Image = FailingImage
  return {
    modes,
    restore: () => {
      globalThis.Image = OriginalImage
    },
  }
}

/** 실제 `Image` 생성자를 스텁으로 교체해 onload를 동기적으로 즉시 발생시킨다
 * (jsdom은 실제 이미지를 로드하지 않으므로 명시 스텁 필요 — 기존 관례와 동일). */
function stubImageConstructor(natural: { width: number; height: number }) {
  const OriginalImage = globalThis.Image
  class StubImage {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    crossOrigin: string | null = null
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

describe("useImageNaturalSize — 표시하지 않고 원본 크기만 실측", () => {
  it("enabled=true면 이미지를 로드해 자연 크기를 반환한다", async () => {
    const restore = stubImageConstructor({ width: 300, height: 756 })
    try {
      const { result } = renderHook(() =>
        useImageNaturalSize({ src: "/shoes_images/Shoerinsics/SHOE-1.png", enabled: true })
      )
      expect(result.current).toBeNull()
      await waitFor(() => expect(result.current).toEqual({ width: 300, height: 756 }))
    } finally {
      restore()
    }
  })

  it("쿠키 포함 CORS → 일반 모드 순서로 시도하고, 모두 실패하면 세션을 재확인한다", async () => {
    const { modes, restore } = stubFailingImage()
    try {
      const { result } = renderHook(() =>
        useImageNaturalSize({ src: "/shoes_images/Shoerinsics/SHOE-1.png" })
      )
      await waitFor(() => expect(revalidateSession).toHaveBeenCalledTimes(1))
      expect(modes).toEqual(["use-credentials", null])
      expect(result.current).toBeNull()
    } finally {
      restore()
    }
  })

  it("enabled=false면 측정하지 않고 null을 유지한다", async () => {
    const restore = stubImageConstructor({ width: 300, height: 756 })
    try {
      const { result } = renderHook(() =>
        useImageNaturalSize({ src: "/shoes_images/Shoerinsics/SHOE-1.png", enabled: false })
      )
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(result.current).toBeNull()
    } finally {
      restore()
    }
  })
})
