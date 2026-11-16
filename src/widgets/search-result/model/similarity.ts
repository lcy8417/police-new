import type { StatusDotTone } from "@/shared/ui/kit"

// imageSearch 유사도(퍼센트 0~100) 표시 규칙. 0~1 로 추측해 바꾸지 않는다(docs/api-communication.md — 응답은 퍼센트).
// 색 등급은 지금 앱(RetrievalResultsGrid)의 임계값 그대로: 80 이상 ok · 60 이상 warn · 그 아래 danger.

/** 유사도 색 등급. 숫자가 아니면 unknown */
export type SimilarityGrade = "ok" | "warn" | "danger" | "unknown"

/** 퍼센트 값으로 읽는다(문자열도 허용). 숫자가 아니면 null */
export function parseSimilarity(similarity: number | string): number | null {
  const value = typeof similarity === "number" ? similarity : Number.parseFloat(similarity)
  return Number.isFinite(value) ? value : null
}

/** 등급 — 반올림 전 값으로 정한다 */
export function similarityGrade(value: number | null): SimilarityGrade {
  if (value === null) return "unknown"
  if (value >= 80) return "ok"
  if (value >= 60) return "warn"
  return "danger"
}

/** 화면 글자 — 69.99 → 「70%」, 숫자가 아니면 「—」 */
export function formatSimilarity(value: number | null): string {
  if (value === null) return "—"
  return `${Math.round(Math.min(100, Math.max(0, value)))}%`
}

/** 등급 → 점 색과 읽는 글자(색만으로 구분하지 않게) */
export const GRADE_DOT: Record<SimilarityGrade, { tone: StatusDotTone; text: string }> = {
  ok: { tone: "ok", text: "높음" },
  warn: { tone: "warn", text: "보통" },
  danger: { tone: "danger", text: "낮음" },
  unknown: { tone: "off", text: "모름" },
}
