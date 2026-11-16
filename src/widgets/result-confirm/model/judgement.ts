import type { Judgement } from "./types"

/** 판정 값 → 화면 글자(SCAS 라디오 글자 그대로) */
export const JUDGEMENT_LABEL: Record<Judgement, string> = { found: "발견", notFound: "불발견", unable: "감정불능" }
