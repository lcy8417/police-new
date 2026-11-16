import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  DEFAULT_DISPLAY_PREFS,
  DISPLAY_PREFS_KEY,
  normalizeDisplayPrefs,
  readDisplayPrefs,
  resetDisplayPrefsCache,
  useDisplayPrefs,
  writeDisplayPrefs,
} from "./display-prefs"

beforeEach(() => {
  localStorage.clear()
  resetDisplayPrefsCache()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("기본값", () => {
  it("scas-light · d2coding · 보통 · 움직임 그대로", () => {
    expect(DEFAULT_DISPLAY_PREFS).toEqual({ theme: "scas-light", font: "d2coding", scale: "md", reducedMotion: false })
  })

  it("기억한 값이 없으면 기본값", () => {
    expect(readDisplayPrefs()).toEqual(DEFAULT_DISPLAY_PREFS)
  })
})

describe("읽기 · 쓰기", () => {
  it("쓴 값을 그대로 읽는다", () => {
    const prefs = { theme: "light-soft", font: "pretendard", scale: "xl", reducedMotion: true } as const
    writeDisplayPrefs(prefs)
    expect(readDisplayPrefs()).toEqual(prefs)
  })

  it("깨진 JSON이면 기본값", () => {
    localStorage.setItem(DISPLAY_PREFS_KEY, "{not json")
    expect(readDisplayPrefs()).toEqual(DEFAULT_DISPLAY_PREFS)
  })

  it("모르는 값은 그 칸만 기본값", () => {
    localStorage.setItem(DISPLAY_PREFS_KEY, JSON.stringify({ theme: "neon", font: "noto-sans", scale: 3, reducedMotion: "yes" }))
    expect(readDisplayPrefs()).toEqual({ ...DEFAULT_DISPLAY_PREFS, font: "noto-sans" })
  })

  it("배열 · null 같은 엉뚱한 모양도 기본값", () => {
    expect(normalizeDisplayPrefs(null)).toEqual(DEFAULT_DISPLAY_PREFS)
    expect(normalizeDisplayPrefs(["dark"])).toEqual(DEFAULT_DISPLAY_PREFS)
    expect(normalizeDisplayPrefs("dark")).toEqual(DEFAULT_DISPLAY_PREFS)
  })

  it("저장소 읽기가 실패해도 기본값", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError")
    })
    expect(readDisplayPrefs()).toEqual(DEFAULT_DISPLAY_PREFS)
  })

  it("저장소 쓰기가 실패해도 오류를 내지 않는다", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError")
    })
    expect(() => writeDisplayPrefs({ ...DEFAULT_DISPLAY_PREFS, theme: "dark" })).not.toThrow()
  })
})

describe("useDisplayPrefs", () => {
  it("set 하면 모든 사용처가 같은 값을 보고, 저장소에 기억한다", () => {
    const a = renderHook(() => useDisplayPrefs())
    const b = renderHook(() => useDisplayPrefs())
    expect(a.result.current.theme).toBe("scas-light")
    act(() => a.result.current.set({ theme: "dark", scale: "lg" }))
    expect(b.result.current.theme).toBe("dark")
    expect(b.result.current.scale).toBe("lg")
    expect(JSON.parse(localStorage.getItem(DISPLAY_PREFS_KEY) ?? "{}")).toMatchObject({ theme: "dark", scale: "lg" })
  })

  it("쓰기가 실패해도 이번 창에서는 바뀐 값으로 동작", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError")
    })
    const { result } = renderHook(() => useDisplayPrefs())
    act(() => result.current.set({ font: "nanum-gothic" }))
    expect(result.current.font).toBe("nanum-gothic")
  })

  it("다른 탭의 변경(storage 이벤트)을 따라가고, 저장소 비우기(key=null)면 기본값으로", () => {
    const { result } = renderHook(() => useDisplayPrefs())
    localStorage.setItem(DISPLAY_PREFS_KEY, JSON.stringify({ ...DEFAULT_DISPLAY_PREFS, theme: "light-soft" }))
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: DISPLAY_PREFS_KEY }))
    })
    expect(result.current.theme).toBe("light-soft")
    localStorage.clear()
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: null }))
    })
    expect(result.current.theme).toBe("scas-light")
  })

  it("storage 듣개는 구독자 수와 상관없이 창에 하나만 단다", () => {
    const add = vi.spyOn(window, "addEventListener")
    const remove = vi.spyOn(window, "removeEventListener")
    const hooks = [renderHook(() => useDisplayPrefs()), renderHook(() => useDisplayPrefs()), renderHook(() => useDisplayPrefs())]
    expect(add.mock.calls.filter(([type]) => type === "storage")).toHaveLength(1)
    for (const h of hooks) h.unmount()
    expect(remove.mock.calls.filter(([type]) => type === "storage")).toHaveLength(1)
  })

  it("set 에 틀린 값이 들어와도 그 칸은 기본값으로 고친다", () => {
    const { result } = renderHook(() => useDisplayPrefs())
    act(() => result.current.set({ theme: "neon" as never }))
    expect(result.current.theme).toBe("scas-light")
  })
})
