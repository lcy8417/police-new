import { useEffect, useState } from "react"

import { useActiveThemeScope, useDisplayPrefs } from "./display-prefs"

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)"

/**
 * 움직임 줄이기 — 운영체제 설정(`prefers-reduced-motion`) 또는 앱 「화면 설정 → 움직임 줄이기」 중 하나라도 켜져 있으면 true.
 * CSS 움직임은 범위 `data-motion="reduce"` 로 꺼지지만 JavaScript 로 움직이는 것(자동 스크롤 등)은 이 값을 직접 봐야 한다(1회차 검수).
 */
export function useReducedMotion(): boolean {
  const [os, setOs] = useState(false)
  const prefs = useDisplayPrefs()
  const scope = useActiveThemeScope()
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return
    const mq = window.matchMedia(REDUCE_QUERY)
    setOs(mq.matches)
    const on = () => setOs(mq.matches)
    mq.addEventListener?.("change", on)
    return () => mq.removeEventListener?.("change", on)
  }, [])
  return os || prefs.reducedMotion || scope?.reducedMotion === true
}
