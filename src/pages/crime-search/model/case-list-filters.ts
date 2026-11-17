/**
 * 사건 목록(/cases) 「기간」 칩 → A1 거르기 값.
 *
 * 목록은 출처를 나누지 않고 늘 전체(새로 등록한 사건 + SCAS 에서 옮겨 온 사건 — A1 `src=ALL`)를 보인다(사용자 결정 11/17).
 * 서버 기본 기간은 최근 한 달이라, 오래된 사건은 기간 칩으로 넓혀 본다.
 * 칩 부품(FilterBar)은 여러 개 고르기라 기간이 여럿이면 가장 넓은 것을 쓴다.
 */

/** A1 출처 — 늘 전체 */
export const LIST_SOURCE = "ALL" as const

export const PERIOD_OPTIONS = [
  { value: "3m", label: "최근 3개월" },
  { value: "1y", label: "최근 1년" },
  { value: "all", label: "전체 기간" },
] as const

/** 「전체 기간」 시작 날짜 — SCAS 가장 오래된 등록(2002년)보다 앞 */
export const ALL_PERIOD_FROM = "1990-01-01"

const PERIOD_DAYS: Record<string, number> = { "3m": 92, "1y": 366 }

/** 한국 날짜 YYYY-MM-DD(nowMs 기준 days 일 전) */
function kstDate(nowMs: number, daysBefore: number): string {
  return new Date(nowMs + 9 * 60 * 60 * 1000 - daysBefore * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

/** 기간 칩 → A1 `from`(undefined = 서버 기본 최근 한 달). 여럿이면 가장 넓은 것 */
export function periodFrom(values: readonly string[], nowMs: number): string | undefined {
  if (values.includes("all")) return ALL_PERIOD_FROM
  const days = values.map((v) => PERIOD_DAYS[v]).filter((d): d is number => d !== undefined)
  if (days.length === 0) return undefined
  return kstDate(nowMs, Math.max(...days))
}
