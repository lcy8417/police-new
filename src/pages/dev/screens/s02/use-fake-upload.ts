import * as React from "react"

/** 올리는 중 막대 값 */
export interface FakeUpload {
  fileName: string
  percent: number
}

/**
 * 올리기 흉내(가짜 — 서버 호출 없음): 0 → 100 을 150ms 마다 25씩 올린 뒤 onDone.
 * S02 진열(이미지 목록 끌어 놓기)과 사건 창 왼쪽 목록 맨 아래 사진 추가가 같이 쓴다. 이미 올리는 중이면 새로 시작하지 않는다.
 */
export function useFakeUpload(initial?: FakeUpload) {
  const [uploading, setUploading] = React.useState<FakeUpload | undefined>(initial)
  const timer = React.useRef<ReturnType<typeof setInterval> | null>(null)
  React.useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current)
    },
    []
  )

  const start = (fileName: string, onDone: () => void) => {
    if (timer.current) return false
    let percent = 0
    setUploading({ fileName, percent })
    timer.current = setInterval(() => {
      percent += 25
      if (percent < 100) {
        setUploading({ fileName, percent })
        return
      }
      if (timer.current) clearInterval(timer.current)
      timer.current = null
      setUploading(undefined)
      onDone()
    }, 150)
    return true
  }

  return { uploading, start }
}
