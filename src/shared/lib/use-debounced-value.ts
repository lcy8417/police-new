import { useEffect, useState } from "react"

/**
 * 값이 `delayMs` 동안 안정될 때까지 갱신을 미루는 범용 디바운스 훅.
 * 값이 계속 바뀌면 이전 타이머를 취소하고 마지막 값만 반영한다(언마운트 시에도 정리).
 *
 * 실시간 재검색에서 필수 문양 시그니처(직렬화 문자열)를 디바운스해 쿼리 키로
 * 쓰는 용도. 순수 파생값만 다루며 좌표/글로벌 상태에는 관여하지 않는다.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
