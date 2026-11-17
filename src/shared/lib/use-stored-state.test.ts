import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { isBoolean, isIntBetween, STORED_STATE_PREFIX, useStoredState } from "./use-stored-state"

const isWidth = isIntBetween(200, 400)

describe("useStoredState", () => {
  afterEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it("저장값이 없으면 기본값, 바꾸면 기억한다(앞머리 scas:)", () => {
    const { result } = renderHook(() => useStoredState<number | null>("w", null, isWidth))
    expect(result.current[0]).toBeNull()
    act(() => result.current[1](300))
    expect(result.current[0]).toBe(300)
    expect(window.localStorage.getItem(`${STORED_STATE_PREFIX}w`)).toBe("300")
  })

  it("null 을 넣으면 기억을 지운다", () => {
    window.localStorage.setItem(`${STORED_STATE_PREFIX}w`, "260")
    const { result } = renderHook(() => useStoredState<number | null>("w", null, isWidth))
    expect(result.current[0]).toBe(260)
    act(() => result.current[1](null))
    expect(window.localStorage.getItem(`${STORED_STATE_PREFIX}w`)).toBeNull()
  })

  it("모양이 어긋나거나 깨진 값은 기본값", () => {
    window.localStorage.setItem(`${STORED_STATE_PREFIX}w`, "9999")
    window.localStorage.setItem(`${STORED_STATE_PREFIX}b`, "{깨짐")
    expect(renderHook(() => useStoredState<number | null>("w", null, isWidth)).result.current[0]).toBeNull()
    expect(renderHook(() => useStoredState("b", false, isBoolean)).result.current[0]).toBe(false)
  })

  it("저장소가 막혀 있어도(읽기 · 쓰기 throw) 화면 상태는 그대로 동작한다", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    const { result } = renderHook(() => useStoredState("b", false, isBoolean))
    expect(result.current[0]).toBe(false)
    act(() => result.current[1]((v) => !v))
    expect(result.current[0]).toBe(true)
  })
})
