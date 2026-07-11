import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useDebouncedValue } from "./use-debounced-value"

describe("useDebouncedValue", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("a", 300))
    expect(result.current).toBe("a")
  })

  it("delays updates until the value settles for delayMs", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: "a" } }
    )

    rerender({ value: "b" })
    expect(result.current).toBe("a") // 아직 디바운스 전

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe("b")
  })

  it("only reflects the last value across rapid changes", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: "a" } }
    )

    rerender({ value: "b" })
    act(() => {
      vi.advanceTimersByTime(150)
    })
    rerender({ value: "c" })
    act(() => {
      vi.advanceTimersByTime(150)
    })
    // b 타이머는 취소됨 — 아직 c 타이머가 안 끝났으므로 초기값 유지
    expect(result.current).toBe("a")

    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(result.current).toBe("c")
  })
})
