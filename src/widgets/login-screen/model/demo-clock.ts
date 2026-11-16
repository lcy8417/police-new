import { createContext, useCallback, useContext, useState, useSyncExternalStore } from "react"

import { DEMO_CYCLE_MS, resolveTokens, type DemoFrames } from "../lib/demo-motion"

// S00 시연의 공통 시계. 모든 요소가 같은 시작 시각(startTime)을 써서 서로 어긋나지 않는다(시안: 같은 CY초 · 같은 시작점).
// 값이 null 이면 움직이지 않는다(움직임 줄이기 · animate 미지원) — 각 요소는 클래스에 적힌 「다 끝난 모양」으로 남는다.

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)"

function subscribeReduced(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {}
  const mql = window.matchMedia(REDUCE_QUERY)
  mql.addEventListener?.("change", onChange)
  return () => mql.removeEventListener?.("change", onChange)
}

function readReduced(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false
  return window.matchMedia(REDUCE_QUERY).matches
}

/** 운영체제 「동작 줄이기」 설정 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReduced, readReduced, () => false)
}

function timelineNow(): number | null {
  if (typeof document === "undefined" || !document.timeline) return null
  const t = document.timeline.currentTime
  return typeof t === "number" ? t : null
}

/**
 * 시연 시계의 시작 시각(ms). 움직임 줄이기면 null.
 * 움직임 줄이기 = 운영체제 설정 또는 앱 「화면 설정 → 움직임 줄이기」(`reducedMotion`, 범위 `data-motion="reduce"`).
 * Web Animations(`el.animate`)는 CSS 범위 규칙으로 멈추지 않으므로 앱 설정도 여기서 직접 받아 시계를 끈다.
 */
export function useDemoOrigin(reducedMotion = false): number | null {
  const reduced = usePrefersReducedMotion()
  const [origin] = useState(timelineNow)
  return reduced || reducedMotion ? null : origin
}

export const DemoClockContext = createContext<number | null>(null)

/**
 * 요소에 시안 키프레임을 거는 ref 콜백. 시계가 꺼져 있거나 animate 가 없으면 아무것도 하지 않는다.
 * frames 는 demo-motion 의 캐시된 객체라 렌더가 반복돼도 같은 콜백이 유지된다.
 */
export function useDemoAnim<T extends Element>(frames: DemoFrames): (el: T | null) => (() => void) | undefined {
  const origin = useContext(DemoClockContext)
  return useCallback(
    (el: T | null) => {
      if (!el || origin === null || typeof el.animate !== "function") return undefined
      const animation = el.animate(resolveTokens(frames.keyframes), { duration: DEMO_CYCLE_MS, iterations: Infinity })
      animation.startTime = origin
      return () => animation.cancel()
    },
    [origin, frames],
  )
}
