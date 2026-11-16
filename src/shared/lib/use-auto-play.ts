import { useCallback, useEffect, useRef, useState } from "react"

// 자동 모드(정해진 주기마다 다음 칸으로) 훅. 화면이 index 를 받아 초점 · 스크롤 · 쪽을 옮긴다.
// 움직임 줄이기와 무관하게 동작한다(줄이는 것은 보이는 애니메이션뿐 — 시간 흐름은 그대로).
// - enabled=false(수동 모드): 타이머 0개, playing=false. index 는 유지.
// - 주기가 바뀌면 곧바로 새 주기로 다시 센다. 일시정지 후 재개는 남은 시간부터.
// - 마지막 칸에서 주기가 다 차면 멈춘다(loop 가 아니면). 멈춘 뒤 play() 는 처음부터 다시 시작.
export interface UseAutoPlayOptions {
  /** 전체 칸 수 */
  count: number
  /** 한 칸당 머무는 시간(ms) */
  intervalMs: number
  /** 자동 모드 여부 */
  enabled: boolean
  /** 칸이 바뀔 때(자동 · next · prev · 처음부터 다시) 부른다 */
  onStep?: (index: number) => void
  /** 마지막 다음에 처음으로 돌아갈지(기본 false) */
  loop?: boolean
}

export interface UseAutoPlayResult {
  index: number
  playing: boolean
  play: () => void
  pause: () => void
  next: () => void
  prev: () => void
  /** 지금 칸이 넘어가기까지 남은 시간(ms) */
  remainingMs: number
}

const TICK_MS = 100

export function useAutoPlay({ count, intervalMs, enabled, onStep, loop = false }: UseAutoPlayOptions): UseAutoPlayResult {
  const [rawIndex, setRawIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [remaining, setRemaining] = useState(intervalMs)
  const [prevEnabled, setPrevEnabled] = useState(enabled)

  // 수동 → 자동으로 돌아올 때는 다시 재생 상태로(렌더 중 파생 갱신)
  if (prevEnabled !== enabled) {
    setPrevEnabled(enabled)
    if (!enabled) setPaused(false)
  }

  const last = Math.max(0, count - 1)
  const index = Math.min(rawIndex, last)
  const playing = enabled && !paused

  const indexRef = useRef(index)
  const onStepRef = useRef(onStep)
  const deadlineRef = useRef(0)
  const resumeRef = useRef<number | null>(null)
  useEffect(() => {
    indexRef.current = index
    onStepRef.current = onStep
  })

  const goTo = useCallback((to: number) => {
    indexRef.current = to
    setRawIndex(to)
    onStepRef.current?.(to)
  }, [])

  useEffect(() => {
    if (!enabled || paused) return
    const first = resumeRef.current ?? intervalMs
    resumeRef.current = null
    deadlineRef.current = Date.now() + first
    const id = setInterval(() => {
      const now = Date.now()
      const rest = deadlineRef.current - now
      if (rest > 0) {
        setRemaining(rest)
        return
      }
      const cur = indexRef.current
      if (cur < last) {
        goTo(cur + 1)
      } else if (loop && last > 0) {
        goTo(0)
      } else {
        setRemaining(0)
        setPaused(true)
        return
      }
      deadlineRef.current = now + intervalMs
      setRemaining(intervalMs)
    }, Math.min(TICK_MS, Math.max(1, intervalMs)))
    // 시작(주기 변경 · 재개) 때 남은 시간 표시를 맞춘다
    setRemaining(first)
    return () => clearInterval(id)
  }, [enabled, paused, intervalMs, last, loop, goTo])

  const restart = useCallback(() => {
    resumeRef.current = null
    deadlineRef.current = Date.now() + intervalMs
    setRemaining(intervalMs)
  }, [intervalMs])

  const pause = useCallback(() => {
    if (!enabled || paused) return
    resumeRef.current = Math.max(0, deadlineRef.current - Date.now())
    setPaused(true)
  }, [enabled, paused])

  const play = useCallback(() => {
    if (!enabled) return
    // 마지막에서 멈춘 뒤(남은 시간 없음) 다시 누르면 처음부터
    if (indexRef.current >= last && last > 0 && resumeRef.current === null) goTo(0)
    setPaused(false)
  }, [enabled, last, goTo])

  const next = useCallback(() => {
    const cur = indexRef.current
    const to = cur < last ? cur + 1 : loop && last > 0 ? 0 : cur
    if (to !== cur) goTo(to)
    restart()
  }, [last, loop, goTo, restart])

  const prev = useCallback(() => {
    const cur = indexRef.current
    const to = cur > 0 ? cur - 1 : loop && last > 0 ? last : cur
    if (to !== cur) goTo(to)
    restart()
  }, [last, loop, goTo, restart])

  return { index, playing, play, pause, next, prev, remainingMs: enabled ? remaining : intervalMs }
}
