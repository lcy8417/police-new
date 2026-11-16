import type { ImageEditScreenProps } from "./types"

/** A 오른쪽 칸(AI 제안 · 원본 → 편집본 · 편집 이력)이 있는가 — 신규 켜기 + 값이 하나라도 있을 때만 */
export const hasCuttingSide = (p: Pick<ImageEditScreenProps, "aiSuggestions" | "beforeAfter" | "editHistory"> & { plus: boolean }) =>
  p.plus && (p.aiSuggestions !== undefined || p.beforeAfter !== undefined || p.editHistory !== undefined)
