import { useCallback, useState } from "react"

import type { DevScreenId } from "./dev-screens"

// 진열 페이지가 화면별 보기 설정(보기 개수 · 열 · 쪽당 행 · 필터 · 자동 간격 …)을 이 브라우저에 기억하는 상태(설계서 §14-6).
// 진열 페이지 전체가 이 하나를 쓴다(화면 폴더마다 두던 사본 대신). 저장 키는 `scas-dev:<화면>:<이름>`.
// localStorage 읽기 · 쓰기는 모두 try/catch — 막혀 있거나 값이 깨졌거나 모양이 어긋나면 기본값으로 정상 동작한다.

/** 저장 키 앞머리 */
export const REMEMBER_PREFIX = "scas-dev:"

/** 저장 키 `scas-dev:<화면>:<이름>` */
export function rememberKey(screen: DevScreenId, name: string): string {
  return `${REMEMBER_PREFIX}${screen}:${name}`
}

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

/** 새 값 또는 이전 값으로 새 값을 만드는 함수(useState 와 같음 — 그래서 T 자체는 함수가 아니어야 한다) */
export type RememberedUpdate<T> = T | ((prev: T) => T)

/**
 * 기억되는 상태. accept 는 저장값 모양 검사(어긋나면 fallback).
 * 키는 처음 렌더 때 한 번 읽는다(화면 · 이름은 바뀌지 않는 값으로 쓴다).
 */
export function useRememberedState<T>(
  screen: DevScreenId,
  name: string,
  fallback: T,
  accept: (value: unknown) => value is T,
): [T, (next: RememberedUpdate<T>) => void] {
  const key = rememberKey(screen, name)
  const [value, setValue] = useState<T>(() => read(key, fallback, accept))
  const set = useCallback(
    (next: RememberedUpdate<T>) => {
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

// ───────── 저장값 모양 검사 ─────────

/** 값 목록 중 하나인가 */
export function oneOf<T>(values: readonly T[]) {
  return (value: unknown): value is T => values.includes(value as T)
}

/** 문자열 배열인가(숨긴 열 등) */
export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((x) => typeof x === "string")
}

/** 정한 값들 중에서만 고른 문자열 배열인가(보이는 열 등 — 없어진 열 이름이 남아 있으면 버린다) */
export function subsetOf(keys: readonly string[]) {
  return (value: unknown): value is string[] => isStringArray(value) && value.every((k) => keys.includes(k))
}

/** 문자열 배열 묶음(필터 값) 모양인가 */
export function isStringListRecord(value: unknown): value is Record<string, string[]> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.values(value).every(isStringArray)
}

/** 0.5초 단위 0.5~10초 간격인가 */
export function isIntervalMs(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 500 && value <= 10000 && value % 500 === 0
}
