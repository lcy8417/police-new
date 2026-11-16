import { useCallback, useEffect, useRef } from "react"

import { useAutoPlay } from "@/shared/lib"

// r3 후보 자동 넘기기 시계: 공용 useAutoPlay 를 「정한 주기마다 한 걸음」 시계로만 쓴다(S05 search-result 와 같은 내용 —
// 위젯끼리 가져다 쓰지 않으려고 둘 다 두었다. 공용 훅에 「밖에서 칸 옮기기」가 생기면 지운다 — 노트 「공용 요청」).
// useAutoPlay 는 칸 번호를 안에서 들고 밖에서 옮길 길이 없는데, 지금 후보는 주소(?ftwr)에서 오므로 화면이 제어형으로 든다.
// 칸 수를 아주 크게 + 돌아가기라 시계는 끝나지 않는다 — 「마지막에서 멈춤」은 화면이 onStep 에서 판단해 재생을 끈다.
const CLOCK_COUNT = 1_000_000

export type StepDir = 1 | -1

export interface UseStepClockOptions {
  auto: boolean
  playing: boolean
  /** 잠시 멈춤(마우스 올림 등) */
  hold: boolean
  intervalMs: number
  onStep: (dir: StepDir) => void
}

export function useStepClock({ auto, playing, hold, intervalMs, onStep }: UseStepClockOptions) {
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
