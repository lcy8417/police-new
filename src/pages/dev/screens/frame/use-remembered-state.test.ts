import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  isIntervalMs,
  isStringArray,
  isStringListRecord,
  oneOf,
  rememberKey,
  subsetOf,
  useRememberedState,
} from "./use-remembered-state"

describe("useRememberedState", () => {
  beforeEach(() => window.localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it("키는 scas-dev:<화면>:<이름>", () => {
    expect(rememberKey("s13", "columns")).toBe("scas-dev:s13:columns")
  })

  it("저장값이 없으면 기본값, 바꾸면 기억하고 다음 마운트에서 다시 읽는다", () => {
    const accept = oneOf([1, 3, 5] as const)
    const first = renderHook(() => useRememberedState<1 | 3 | 5>("s07", "blocks", 3, accept))
    expect(first.result.current[0]).toBe(3)
    act(() => first.result.current[1](5))
    expect(first.result.current[0]).toBe(5)
    expect(window.localStorage.getItem("scas-dev:s07:blocks")).toBe("5")
    first.unmount()
    const second = renderHook(() => useRememberedState<1 | 3 | 5>("s07", "blocks", 3, accept))
    expect(second.result.current[0]).toBe(5)
  })

  it("깨진 JSON · 모양이 어긋난 값이면 기본값", () => {
    window.localStorage.setItem("scas-dev:s05:columns", "{깨짐")
    window.localStorage.setItem("scas-dev:s05:thumb", JSON.stringify("거대"))
    const a = renderHook(() => useRememberedState("s05", "columns", 4, oneOf([1, 2, 3, 4])))
    const b = renderHook(() => useRememberedState("s05", "thumb", "보통", oneOf(["작게", "보통", "크게"])))
    expect(a.result.current[0]).toBe(4)
    expect(b.result.current[0]).toBe("보통")
  })

  it("저장소 접근이 막혀도(읽기 · 쓰기 throw) 기본값으로 동작하고 값은 바뀐다", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    const { result } = renderHook(() => useRememberedState<string[]>("s14", "hidden", [], isStringArray))
    expect(result.current[0]).toEqual([])
    act(() => result.current[1](["ip"]))
    expect(result.current[0]).toEqual(["ip"])
  })

  it("함수로 바꾸면 이전 값에서 만들고 그 값을 기억한다", () => {
    const { result } = renderHook(() => useRememberedState<string[]>("s13", "columns", ["a"], isStringArray))
    act(() => {
      result.current[1]((prev) => [...prev, "b"])
      result.current[1]((prev) => [...prev, "c"])
    })
    expect(result.current[0]).toEqual(["a", "b", "c"])
    expect(window.localStorage.getItem("scas-dev:s13:columns")).toBe(JSON.stringify(["a", "b", "c"]))
  })

  it("모양 검사 도우미", () => {
    expect(subsetOf(["a", "b"])(["b"])).toBe(true)
    expect(subsetOf(["a", "b"])(["z"])).toBe(false)
    expect(isStringArray(["a"])).toBe(true)
    expect(isStringArray(["a", 1])).toBe(false)
    expect(isStringListRecord({ a: ["x"] })).toBe(true)
    expect(isStringListRecord(["x"])).toBe(false)
    expect(isStringListRecord({ a: "x" })).toBe(false)
    expect(isIntervalMs(1500)).toBe(true)
    expect(isIntervalMs(1200)).toBe(false)
    expect(isIntervalMs(10500)).toBe(false)
  })
})
