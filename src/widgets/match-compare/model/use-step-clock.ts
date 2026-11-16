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
  const { play, pause, next } = clock
  useEffect(() => {
    if (want) play()
    else pause()
  }, [want, play, pause])

  // 방향은 dirRef 로만 넘기고 시계는 늘 앞으로(next) — prev() 를 쓰면 시계가 마지막 칸으로 돌아가고,
  // 그 뒤 play() 가 「마지막에서 멈춘 것」으로 읽어 처음 칸으로 되돌리며 걸음(+1)을 한 번 더 부른다.
  const step = useCallback(
    (dir: StepDir) => {
      dirRef.current = dir
      next()
    },
    [next],
  )

  return { step, remainingRatio: auto && intervalMs > 0 ? clock.remainingMs / intervalMs : 0 }
}
