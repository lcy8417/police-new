import type { EssentialFlag, PatternZone } from "@/entities/pattern"

import { patternName } from "./constants"
import type { PaletteKind, PatternCardMeta, PatternMetaMap, WeightLevel, WeightOverrideMap } from "./types"

// 문양 가중치 룰베이스(docs/superpowers/specs/2026-11-17-pattern-weight-rule-design.md §2 · §3).
// 보통(0)에서 시작해 규칙 점수를 모두 더한 뒤 −1 ~ +1 로 자른다. 사람이 고른 값이 있으면 규칙을 보지 않는다.

/** 단계 순서(낮음 → 높음) */
export const WEIGHT_LEVELS: readonly WeightLevel[] = ["low", "normal", "high"]

/** 단계 값(§2) */
export const WEIGHT_VALUE: Record<WeightLevel, number> = { low: 0.5, normal: 1, high: 2 }

/** 단계 이름 */
export const WEIGHT_LABEL: Record<WeightLevel, string> = { low: "낮음", normal: "보통", high: "높음" }

/** 흔한 종류(R2 −1) · 드문 종류(R2 +1) */
const COMMON_KINDS: ReadonlySet<PaletteKind> = new Set<PaletteKind>(["선", "무늬"])
const RARE_KINDS: ReadonlySet<PaletteKind> = new Set<PaletteKind>(["다각", "항목"])

/** R3 — AI 확신도가 이보다 낮으면 −1 */
export const LOW_CONFIDENCE = 0.5

/** 규칙 번호 */
export type WeightRuleId = "R1" | "R2" | "R3" | "R4" | "R5"

/** 화면 요약용 규칙 한 줄(검색 조건 탭) */
export const WEIGHT_RULES: readonly { id: WeightRuleId; text: string }[] = [
  { id: "R1", text: "윤곽 부위 −1" },
  { id: "R2", text: "선 · 무늬 −1, 다각 · 항목 +1" },
  { id: "R3", text: `AI 확신도 ${LOW_CONFIDENCE} 미만 −1` },
  { id: "R4", text: "확인 전 AI 제안 −1(확인하면 한 단계 위)" },
  { id: "R5", text: "상 · 중 · 하 세 부위 모두 반복 −1" },
]

/** 한 문양에 걸린 규칙 하나 */
export interface WeightRuleHit {
  /** 규칙 번호 */
  rule: WeightRuleId
  /** 까닭(짧게) */
  text: string
  /** 더하는 점수 */
  delta: -1 | 1
}

/** 규칙 계산에 쓰는 한 문양의 사정 */
export interface WeightRuleInput {
  /** 부위 */
  zone: PatternZone
  /** 문양 종류(모르면 없음 → R2 0) */
  kind?: PaletteKind
  /** 카드 상태 · AI 확신도(없으면 수동으로 본다) */
  meta?: Pick<PatternCardMeta, "status" | "confidence">
  /** 같은 이름이 상 · 중 · 하 가운데 몇 부위에 있나(R5) */
  zonesWithName: number
}

/** 규칙만으로 낸 단계와 걸린 규칙 */
export interface RuleWeight {
  /** 잘린 단계 */
  level: WeightLevel
  /** 자르기 전 합 */
  score: number
  /** 걸린 규칙(R1 → R5 순서) */
  hits: WeightRuleHit[]
}

/** 합 → 단계(−1 이하 낮음, 0 보통, +1 이상 높음) */
export function levelOfScore(score: number): WeightLevel {
  return score <= -1 ? "low" : score >= 1 ? "high" : "normal"
}

/** 규칙 R1 ~ R5 로 기본 단계를 낸다(§3) */
export function ruleWeight({ zone, kind, meta, zonesWithName }: WeightRuleInput): RuleWeight {
  const hits: WeightRuleHit[] = []
  if (zone === "outline") hits.push({ rule: "R1", text: "윤곽 부위", delta: -1 })
  if (kind && COMMON_KINDS.has(kind)) hits.push({ rule: "R2", text: `흔한 종류(${kind})`, delta: -1 })
  if (kind && RARE_KINDS.has(kind)) hits.push({ rule: "R2", text: `드문 종류(${kind})`, delta: 1 })
  const byAi = meta?.status === "ai" || meta?.status === "suggested"
  if (byAi && meta?.confidence !== undefined && meta.confidence < LOW_CONFIDENCE) {
    hits.push({ rule: "R3", text: `AI 확신도 ${meta.confidence.toFixed(2)}`, delta: -1 })
  }
  if (meta?.status === "suggested") hits.push({ rule: "R4", text: "확인 전 AI 제안", delta: -1 })
  if (zone !== "outline" && zonesWithName >= 3) hits.push({ rule: "R5", text: "상·중·하 반복", delta: -1 })
  const score = hits.reduce((n, h) => n + h.delta, 0)
  return { level: levelOfScore(score), score, hits }
}

/** 화면에 보이는 한 문양의 가중치 */
export interface PatternWeight {
  /** 쓰는 단계(사람 값 > 규칙 값) */
  level: WeightLevel
  /** 단계 값 */
  value: number
  /** 규칙 값인가 · 사람이 고른 값인가(「직접」) */
  source: "rule" | "manual"
  /** 규칙만으로 낸 단계(되돌릴 때 이 값) */
  ruleLevel: WeightLevel
  /** 걸린 규칙 */
  hits: WeightRuleHit[]
}

/** 부위 → 문양 이름 → 가중치 */
export type PatternWeightMap = Record<PatternZone, Record<string, PatternWeight>>

/** 사건 문양 4부위(경로든 이름이든 — 이름 기준으로 읽는다) */
export type ZoneTuples = Readonly<Record<PatternZone, readonly (readonly [string, EssentialFlag])[]>>

const ZONES: readonly PatternZone[] = ["top", "mid", "bottom", "outline"]

/** 「규칙: R2 흔한 종류(선) −1 · R5 상·중·하 반복 −1 → 낮음」 같은 까닭 한 줄 */
export function describeWeight(w: PatternWeight): string {
  const rules = w.hits.length === 0 ? "걸린 규칙 없음" : w.hits.map((h) => `${h.rule} ${h.text} ${h.delta > 0 ? "+1" : "−1"}`).join(" · ")
  const rule = `규칙: ${rules} → ${WEIGHT_LABEL[w.ruleLevel]}`
  return w.source === "manual" ? `직접 ${WEIGHT_LABEL[w.level]}(${rule})` : rule
}

/**
 * 4부위 모든 문양의 가중치(§3 · §6). 이름 기준 — 같은 부위의 같은 이름은 한 값.
 * `overrides` 에 있는 단계가 규칙보다 먼저다.
 */
export function patternWeights(
  zones: ZoneTuples,
  meta: PatternMetaMap | undefined,
  kinds: Readonly<Record<string, PaletteKind>> | undefined,
  overrides: WeightOverrideMap | undefined,
): PatternWeightMap {
  // R5 — 이름별로 상 · 중 · 하 가운데 몇 부위에 있나(스펙 §3 예시대로 확인 전 제안도 센다 — 그래서 검색 이력에 그때의 제안도 남겨
  // 「다시 불러오기」가 같은 R5 를 되살린다, SearchRun.pending)
  const spread = new Map<string, number>()
  for (const z of ["top", "mid", "bottom"] as const) {
    for (const name of new Set(zones[z].map(([p]) => patternName(p)))) spread.set(name, (spread.get(name) ?? 0) + 1)
  }
  const out = {} as PatternWeightMap
  for (const zone of ZONES) {
    const row: Record<string, PatternWeight> = {}
    for (const [path] of zones[zone]) {
      const name = patternName(path)
      if (row[name]) continue
      const rule = ruleWeight({ zone, kind: kinds?.[name], meta: meta?.[zone]?.[name], zonesWithName: spread.get(name) ?? 0 })
      const manual = overrides?.[zone]?.[name]
      const level = manual ?? rule.level
      row[name] = { level, value: WEIGHT_VALUE[level], source: manual ? "manual" : "rule", ruleLevel: rule.level, hits: rule.hits }
    }
    out[zone] = row
  }
  return out
}

/** 사람이 고른 가중치 개수(「직접 n」) */
export function countOverrides(overrides: WeightOverrideMap | undefined): number {
  return ZONES.reduce((n, z) => n + Object.keys(overrides?.[z] ?? {}).length, 0)
}
