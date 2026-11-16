import * as React from "react"

// 화면별 편의 설정(열 · 쪽당 행 · 행 높이)을 이 브라우저에 기억한다. 읽기 · 쓰기 모두 try/catch — 실패해도 기본값으로 동작.
export function usePersistedState<T>(
  key: string,
  initial: T,
  isValid: (value: unknown) => value is T
): [T, (value: T) => void] {
  const [value, setValue] = React.useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw !== null) {
        const parsed: unknown = JSON.parse(raw)
        if (isValid(parsed)) return parsed
      }
    } catch {
      // 저장소를 못 읽으면 기본값
    }
    return initial
  })
  const set = React.useCallback(
    (next: T) => {
      setValue(next)
      try {
        window.localStorage.setItem(key, JSON.stringify(next))
      } catch {
        // 저장 실패는 무시
      }
    },
    [key]
  )
  return [value, set]
}
