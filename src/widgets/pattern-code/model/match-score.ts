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

/** 한 신발의 판정 — 필수에 걸려 빠짐 / 문양 점수(0~1) / 점수 없음(검색 문양이 비어 이미지 유사도만) */
export type PatternScoreResult = { excluded: true } | { excluded: false; score: number | null }

/**
 * 한 신발의 문양 점수(spec §4). 필수에 걸려 빠지면 null.
 * 검색 문양 Q 가 비면 「점수 없음」 — 0점과 다르다(1회차 검수: 0 으로 두면 모든 신발이 0점 동점으로 ID 순 정렬됨). `scoreOf` 로 구분해 읽는다.
 */
export function scoreOf(query: readonly QueryPattern[], shoe: ShoePatterns): PatternScoreResult {
  let total = 0
  let hit = 0
  for (const q of query) {
    const has = shoe.zones[q.zone].includes(q.name)
    if (q.essential && !has) return { excluded: true }
    total += q.weight
    if (has) hit += q.weight
  }
  return { excluded: false, score: total === 0 ? null : hit / total }
}

/** 한 신발의 문양 점수 — 필수에 걸려 빠지거나 검색 문양이 없어 점수가 없으면 null(둘을 가르려면 `scoreOf`) */
export function patternScore(query: readonly QueryPattern[], shoe: ShoePatterns): number | null {
  const r = scoreOf(query, shoe)
  return r.excluded ? null : r.score
}

/**
 * 필수를 통과한 신발을 점수 내림차순(같으면 신발 ID 순)으로.
 * 검색 문양이 없으면(점수 없음) 점수로 줄 세우지 않고 받은 순서(= 이미지 유사도 순서) 그대로, 점수는 null.
 */
export function rankShoes(query: readonly QueryPattern[], shoes: readonly ShoePatterns[]): SearchRunHit[] {
  const out: SearchRunHit[] = []
  for (const shoe of shoes) {
    const r = scoreOf(query, shoe)
    if (!r.excluded) out.push({ ftwrId: shoe.ftwrId, score: r.score })
  }
  if (query.length === 0) return out
  return out.sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.ftwrId.localeCompare(b.ftwrId))
}

/**
 * 그때 화면에 있던 확인 전 AI 제안(Q 밖) → 이력 `SearchRun.pending`. 검색에는 안 들어가지만 가중치 R5(세 부위 반복)가
 * 제안까지 세므로, 「다시 불러오기」가 같은 문맥을 되살리려면 함께 남겨야 한다(2회차 검수). 없으면 undefined
 */
export function pendingSnapshot(
  zones: ZoneTuples,
  meta: PatternMetaMap | undefined,
): Partial<Record<PatternZone, { name: string; confidence?: number }[]>> | undefined {
  const out: Partial<Record<PatternZone, { name: string; confidence?: number }[]>> = {}
  let any = false
  for (const z of ZONES) {
    for (const [path] of zones[z]) {
      const name = patternName(path)
      const m = meta?.[z]?.[name]
      if (m?.status !== "suggested") continue
      ;(out[z] ??= []).push(m.confidence !== undefined ? { name, confidence: m.confidence } : { name })
      any = true
    }
  }
  return any ? out : undefined
}

/** 검색 문양 Q → 이력에 남길 부위별 문양(필수 · 가중치 · 직접 · 그때의 카드 상태와 확신도) */
export function runSnapshot(
  query: readonly QueryPattern[],
  weights: PatternWeightMap,
  meta?: PatternMetaMap,
): Record<PatternZone, SearchRunPattern[]> {
  const out = { top: [], mid: [], bottom: [], outline: [] } as Record<PatternZone, SearchRunPattern[]>
  for (const q of query) {
    const w = weights[q.zone]?.[q.name]
    const m = meta?.[q.zone]?.[q.name]
    const p: SearchRunPattern = { name: q.name, essential: q.essential, weight: w?.level ?? "normal", manual: w?.source === "manual" }
    // 검색에 들어간 문양은 확인된 문양뿐(확인 전 제안은 Q 에서 빠짐) — AI 면 「ai」로, 확신도를 함께 남긴다
    if (m && m.status !== "manual") {
      p.status = "ai"
      if (m.confidence !== undefined) p.confidence = m.confidence
    }
    out[q.zone].push(p)
  }
  return out
}

/** 이력 한 줄의 문양 → 검색 문양 Q(검색 결과 탭이 그 검색의 순위를 다시 낼 때 — 그때의 가중치 단계 값 그대로) */
export function queryOfRun(zones: Readonly<Record<PatternZone, readonly SearchRunPattern[]>>): QueryPattern[] {
  return ZONES.flatMap((zone) => zones[zone].map((p) => ({ zone, name: p.name, essential: p.essential, weight: WEIGHT_VALUE[p.weight] })))
}
