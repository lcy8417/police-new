/**
 * 사건 목록(/cases) 「출처」 · 「기간」 칩 → A1 거르기 값.
 *
 * 서버 기본은 출처 APP(새 사건) · 최근 한 달이라, 칩이 없으면 SCAS 과거 사건(17만 건)을 볼 길이 없다.
 * 칩 부품(FilterBar)은 여러 개 고르기라 아래처럼 푼다:
 * - 출처: 아무것도 안 고름 = 둘 다(ALL — 「조건 없음 = 다 보임」. 기본 기간이 한 달이라 과거 사건이 목록을 덮지 않음),
 *   「새 사건」만 = APP, 「과거 SCAS」만 = SCAS.
 * - 기간: 아무것도 안 고름 = 서버 기본(최근 한 달), 여럿이면 가장 넓은 것.
 */

export const SOURCE_OPTIONS = [
  { value: "APP", label: "새 사건" },
  { value: "SCAS", label: "과거 SCAS" },
] as const

export const PERIOD_OPTIONS = [
  { value: "3m", label: "최근 3개월" },
  { value: "1y", label: "최근 1년" },
  { value: "all", label: "전체 기간" },
] as const

/** 「전체 기간」 시작 날짜 — SCAS 가장 오래된 등록(2002년)보다 앞 */
export const ALL_PERIOD_FROM = "1990-01-01"

const PERIOD_DAYS: Record<string, number> = { "3m": 92, "1y": 366 }

/** 출처 칩 → A1 `src`(안 고름 · 둘 다 = ALL) */
export function sourceParam(values: readonly string[]): "APP" | "SCAS" | "ALL" {
  const app = values.includes("APP")
  const scas = values.includes("SCAS")
  if (scas && !app) return "SCAS"
  if (app && !scas) return "APP"
  return "ALL"
}

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
