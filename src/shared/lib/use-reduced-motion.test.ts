import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"

import { resetDisplayPrefsCache, setDisplayPrefs } from "./display-prefs"
import { useReducedMotion } from "./use-reduced-motion"

// 1회차 검수: 자동 스크롤 같은 JavaScript 움직임이 운영체제 설정만 보고 앱 「화면 설정 → 움직임 줄이기」는 무시하던 것.

beforeEach(() => {
  localStorage.clear()
  resetDisplayPrefsCache()
})

describe("useReducedMotion", () => {
  it("앱 화면 설정의 움직임 줄이기를 켜면 true", () => {
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
    act(() => setDisplayPrefs({ reducedMotion: true }))
    expect(result.current).toBe(true)
  })
})
