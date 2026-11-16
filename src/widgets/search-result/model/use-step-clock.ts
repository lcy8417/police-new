import { useCallback, useEffect, useRef } from "react"

import { useAutoPlay } from "@/shared/lib"

// r3 자동 모드 시계: 공용 useAutoPlay 를 「정한 주기마다 한 걸음」 시계로만 쓴다.
// useAutoPlay 는 칸 번호(index)를 안에서 들고 밖에서 옮길(점프 — 이어 보기 · 카드 누름 · 쪽 넘김) 길이 없어서,
// 초점은 화면이 제어형으로 들고 이 시계는 「앞으로 / 뒤로 한 걸음」만 알린다(onStep(+1 | -1)).
// 칸 수를 아주 크게 + 돌아가기라 시계 자체는 끝나지 않는다 — 「마지막에서 멈춤」은 화면이 onStep 에서 판단해 재생을 끈다.
// 주기 변경 즉시 반영 · 일시정지 뒤 남은 시간부터 · 언마운트 · 수동 전환 때 타이머 정리는 useAutoPlay 가 한다.
const CLOCK_COUNT = 1_000_000

export type StepDir = 1 | -1

export interface UseStepClockOptions {
  /** 자동 모드인가 */
  auto: boolean
  /** 재생 중(제어형) */
  playing: boolean
  /** 잠시 멈춤(카드 위 마우스 등 — 놓으면 남은 시간부터 다시) */
  hold: boolean
  /** 한 걸음 간격(ms) */
  intervalMs: number
  /** 걸음 — 자동 주기 · step() 모두 이리로 온다 */
  onStep: (dir: StepDir) => void
}

export interface UseStepClockResult {
  /** 손으로 한 걸음(← →). 자동 모드면 주기도 처음부터 다시 센다 */
  step: (dir: StepDir) => void
  /** 다음 걸음까지 남은 시간 비율 0~1(수동이면 0) */
  remainingRatio: number
}

export function useStepClock({ auto, playing, hold, intervalMs, onStep }: UseStepClockOptions): UseStepClockResult {
  const dirRef = useRef<StepDir>(1)
  const onStepRef = useRef(onStep)
  useEffect(() => {
    onStepRef.current = onStep
  })

  const clock = useAutoPlay({
    count: CLOCK_COUNT,
    loop: true,
    intervalMs,
    enabled: auto,
    onStep: () => {
      const dir = dirRef.current
      dirRef.current = 1
      onStepRef.current(dir)
    },
  })

  const want = auto && playing && !hold
  const { play, pause, next, prev } = clock
  useEffect(() => {
    if (want) play()
    else pause()
  }, [want, play, pause])

  const step = useCallback(
    (dir: StepDir) => {
      dirRef.current = dir
      if (dir === 1) next()
      else prev()
    },
    [next, prev],
  )

  return { step, remainingRatio: auto && intervalMs > 0 ? clock.remainingMs / intervalMs : 0 }
}
