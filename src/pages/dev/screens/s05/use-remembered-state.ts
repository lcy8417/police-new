import { useCallback, useState } from "react"

// r3 진열 페이지가 화면별 보기 설정(보기 개수 · 썸네일 · 간격 · 필터)을 이 브라우저에 기억하는 상태.
// localStorage 읽기 · 쓰기는 모두 try/catch — 막혀 있거나 값이 깨져 있어도 기본값으로 정상 동작한다.
// 같은 일을 하는 공용 훅이 아직 없어 S05 폴더에 두고 S06 · S07 진열 페이지도 가져다 쓴다(노트 「공용 요청」).

/** 저장 키 앞머리 — 화면 id 를 붙인다(예 `scas-dev:s05:view`) */
export const REMEMBER_PREFIX = "scas-dev:"

function read<T>(key: string, fallback: T, accept: (value: unknown) => value is T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    const value: unknown = JSON.parse(raw)
    return accept(value) ? value : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 저장 실패(사생활 보호 창 · 용량)는 무시 — 이번 화면에서는 그대로 쓴다
  }
}

/** 기억되는 상태. accept 는 저장값 모양 검사(어긋나면 fallback) */
export function useRememberedState<T>(
  key: string,
  fallback: T,
  accept: (value: unknown) => value is T,
): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(() => read(key, fallback, accept))
  const set = useCallback(
    (next: T) => {
      setValue(next)
      write(key, next)
    },
    [key],
  )
  return [value, set]
}

/** 값 목록 중 하나인가 */
export function oneOf<T>(values: readonly T[]) {
  return (value: unknown): value is T => values.includes(value as T)
}

/** 문자열 배열 묶음(필터 값) 모양인가 */
export function isStringListRecord(value: unknown): value is Record<string, string[]> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((v) => Array.isArray(v) && v.every((x) => typeof x === "string"))
  )
}

/** 0.5초 단위 0.5~10초 간격인가 */
export function isIntervalMs(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 500 && value <= 10000 && value % 500 === 0
}
