import { useCallback, useState } from "react"

// 이 브라우저에만 기억하는 화면 상태(판 폭 · 접힘 같은 보기 편의). 업무 값은 담지 않는다.
// localStorage 읽기 · 쓰기는 모두 try/catch — 막혀 있거나(사생활 보호 창 · 내부망 정책) 값이 깨졌거나 모양이 어긋나면 기본값으로 정상 동작한다.

/** 저장 키 앞머리(다른 앱 · 진열 화면 `scas-dev:` 와 겹치지 않게) */
export const STORED_STATE_PREFIX = "scas:"

function read<T>(key: string, fallback: T, accept: (value: unknown) => value is T): T {
  try {
    const raw = window.localStorage.getItem(STORED_STATE_PREFIX + key)
    if (raw === null) return fallback
    const value: unknown = JSON.parse(raw)
    return accept(value) ? value : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(STORED_STATE_PREFIX + key)
    else window.localStorage.setItem(STORED_STATE_PREFIX + key, JSON.stringify(value))
  } catch {
    // 저장 실패는 무시 — 이번 화면에서는 그대로 쓴다
  }
}

/** 새 값 또는 이전 값으로 새 값을 만드는 함수(useState 와 같음 — 그래서 T 자체는 함수가 아니어야 한다) */
export type StoredUpdate<T> = T | ((prev: T) => T)

/**
 * 이 브라우저에 기억되는 상태. `accept` 는 저장값 모양 검사(어긋나면 `fallback`). `null` 을 넣으면 기억을 지운다(기본값으로).
 * 키는 처음 렌더 때 한 번 읽는다(바뀌지 않는 값으로 쓴다).
 */
export function useStoredState<T>(
  key: string,
  fallback: T,
  accept: (value: unknown) => value is T,
): [T, (next: StoredUpdate<T>) => void] {
  const [value, setValue] = useState<T>(() => read(key, fallback, accept))
  const set = useCallback(
    (next: StoredUpdate<T>) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next
        write(key, resolved)
        return resolved
      })
    },
    [key],
  )
  return [value, set]
}

/** 저장값 검사 — min ~ max 사이 정수(폭 등). null 도 받는다(기억 없음 = 기본값) */
export function isIntBetween(min: number, max: number) {
  return (value: unknown): value is number | null =>
    value === null || (typeof value === "number" && Number.isInteger(value) && value >= min && value <= max)
}

/** 저장값 검사 — 참 · 거짓 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean"
}
