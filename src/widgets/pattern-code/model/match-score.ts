import type { PatternZone } from "@/entities/pattern"

import { patternName } from "./constants"
import type { PatternMetaMap, SearchRunHit, SearchRunPattern } from "./types"
import { WEIGHT_VALUE, type PatternWeightMap, type ZoneTuples } from "./weight-rules"

// 후보 신발 문양 점수(docs/superpowers/specs/2026-11-17-pattern-weight-rule-design.md §4).
//   필수 문양이 하나라도 같은 부위에 없으면 제외,
//   아니면 Σ(같은 부위에서 겹친 문양 가중치) ÷ Σ(검색 문양 가중치).
// 이미지 유사도와 섞는 비율은 운영 연결 때 정한다 — 여기서는 문양 점수만.

const ZONES: readonly PatternZone[] = ["top", "mid", "bottom", "outline"]

/** 검색에 쓰는 문양 한 칸 */
export interface QueryPattern {
  /** 부위 */
  zone: PatternZone
  /** 문양 이름 */
  name: string
  /** 필수(거르기) */
  essential: boolean
  /** 가중치 값(0.5 · 1 · 2) */
  weight: number
}

/** 신발 한 켤레의 문양(신발 문양은 이름 문자열 — docs/pattern-data-model.md §2) */
export interface ShoePatterns {
  /** 신발 ID(문자열, 앞자리 0 보존) */
  ftwrId: string
  /** 부위별 문양 이름 */
  zones: Readonly<Record<PatternZone, readonly string[]>>
}

/**
 * 4부위 문양 → 검색 문양 Q. 확인 전 AI 제안(`suggested`)은 뺀다(시안 r2 — 확인 전엔 검색에 안 들어감).
 * 같은 부위의 같은 이름은 한 번만(이름 기준). 필수는 한 칸이라도 켜져 있으면 필수.
 */
export function searchQuery(zones: ZoneTuples, meta: PatternMetaMap | undefined, weights: PatternWeightMap): QueryPattern[] {
  const out: QueryPattern[] = []
  for (const zone of ZONES) {
    const seen = new Map<string, QueryPattern>()
    for (const [path, flag] of zones[zone]) {
      const name = patternName(path)
      if (meta?.[zone]?.[name]?.status === "suggested") continue
      const prev = seen.get(name)
      if (prev) {
        prev.essential = prev.essential || Boolean(flag)
        continue
      }
      const q: QueryPattern = { zone, name, essential: Boolean(flag), weight: weights[zone]?.[name]?.value ?? WEIGHT_VALUE.normal }
      seen.set(name, q)
      out.push(q)
    }
  }
  return out
}

/** 한 신발의 문양 점수. 필수에 걸려 빠지면 null, 검색 문양이 없으면 0 */
export function patternScore(query: readonly QueryPattern[], shoe: ShoePatterns): number | null {
  let total = 0
  let hit = 0
  for (const q of query) {
    const has = shoe.zones[q.zone].includes(q.name)
    if (q.essential && !has) return null
    total += q.weight
    if (has) hit += q.weight
  }
  return total === 0 ? 0 : hit / total
}

/** 필수를 통과한 신발을 점수 내림차순(같으면 신발 ID 순)으로 */
export function rankShoes(query: readonly QueryPattern[], shoes: readonly ShoePatterns[]): SearchRunHit[] {
  const out: SearchRunHit[] = []
  for (const shoe of shoes) {
    const score = patternScore(query, shoe)
    if (score !== null) out.push({ ftwrId: shoe.ftwrId, score })
  }
  return out.sort((a, b) => b.score - a.score || a.ftwrId.localeCompare(b.ftwrId))
}

/** 검색 문양 Q → 이력에 남길 부위별 문양(필수 · 가중치 · 직접) */
export function runSnapshot(query: readonly QueryPattern[], weights: PatternWeightMap): Record<PatternZone, SearchRunPattern[]> {
  const out = { top: [], mid: [], bottom: [], outline: [] } as Record<PatternZone, SearchRunPattern[]>
  for (const q of query) {
    const w = weights[q.zone]?.[q.name]
    out[q.zone].push({ name: q.name, essential: q.essential, weight: w?.level ?? "normal", manual: w?.source === "manual" })
  }
  return out
}
