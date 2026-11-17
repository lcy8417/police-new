import * as React from "react"

import type { CondPattern, CrimePatterns, SearchHistoryEntry } from "@/entities/crime"
import { insertPatternPath, type PatternZone } from "@/entities/pattern"
import { shoeImageUrl } from "@/entities/shoe"
import type { RunSearchBody } from "@/features/crime-search"
import {
  insertPattern as insertTuple,
  nameOf,
  PATTERN_ZONES,
  removePattern as removeTuple,
  toggleEssential as toggleTuple,
  type CrimeZoneMap,
  type SavePatternsBody,
} from "@/features/patterns-extract"
import {
  patternWeights,
  pendingSnapshot,
  runSnapshot,
  searchQuery,
  type CrimePatternTuple,
  type CrimeZones,
  type MatchConditionValues,
  type PaletteKind,
  type PatternCardMeta,
  type PatternCount,
  type PatternMetaMap,
  type SearchImageSource,
  type SearchMethod,
  type SearchRun,
  type SearchRunPending,
  type WeightLevel,
  type WeightOverrideMap,
} from "@/widgets/pattern-code"

/**
 * 「문양 코드」 탭의 화면 초안(B 단계 — 이식 계획 §3-1 ③). 정본 = 서버 C1(`useCrimePatterns`), 화면에서 고친 값은 이 초안에만 두고
 * 「검색」 직전 · 탭을 떠날 때 바뀐 게 있으면 C2 1건으로 저장한다(잠금 §1-③). 옛 전역 store(`useCrimeStore`)는 쓰지 않는다.
 *
 * 초안 문양은 **이름** 튜플(확인 전 AI 제안도 부위 목록 안에 — 위젯이 흐리게 그린다). 서버 저장 때만 제안을 튜플에서 빼고 메타로 보낸다
 * (서버: SUGGESTED 는 SCAS 문양 표에 없다 — 설계서 §3-3). 위젯에 넘길 때는 경로를 한 번 붙인다(`hydrateZones`).
 */

export interface PatternDraft {
  /** 4부위 이름 튜플(제안 포함, 부위 안 순서 = 카드 순서) */
  zones: CrimeZoneMap
  /** 카드 덧붙임(위젯 값) */
  meta: PatternMetaMap
  /** 사람이 고른 가중치(「직접」) */
  overrides: WeightOverrideMap
  /** 카드를 낸 AI 실행 번호(부위 → 이름 → 번호) — 화면에 보이지 않고 저장 때 실어 보낸다 */
  runIds: Partial<Record<PatternZone, Record<string, number>>>
  /** 밑창 문자열 */
  soleText: string
  /** AI 통합 추출 원본(「AI」 탭 목록) */
  extracted: { code: string; score: number }[]
}

export const EMPTY_DRAFT: PatternDraft = {
  zones: { top: [], mid: [], bottom: [], outline: [] },
  meta: {},
  overrides: {},
  runIds: {},
  soleText: "",
  extracted: [],
}

/** C1 응답 → 초안. 제안 카드는 서버 카드 순서(sort_ordr) 자리에 끼워 넣는다 */
export function draftFromServer(p: CrimePatterns): PatternDraft {
  const zones = {} as Record<PatternZone, (readonly [string, 0 | 1])[]>
  const meta: PatternMetaMap = {}
  const overrides: WeightOverrideMap = {}
  const runIds: PatternDraft["runIds"] = {}
  for (const z of PATTERN_ZONES) {
    const tuples: (readonly [string, 0 | 1])[] = p[z].map(([n, f]) => [n, f ? 1 : 0] as const)
    const zm = p.meta?.[z] ?? {}
    const suggested = Object.entries(zm)
      .filter(([, m]) => m.status === "suggested")
      .sort((a, b) => a[1].sortOrdr - b[1].sortOrdr)
    for (const [name, m] of suggested) {
      if (tuples.some(([n]) => n === name)) continue
      tuples.splice(Math.min(Math.max(0, m.sortOrdr), tuples.length), 0, [name, 0] as const)
    }
    zones[z] = tuples
    const zoneMeta: Record<string, PatternCardMeta> = {}
    const zoneOver: Record<string, WeightLevel> = {}
    const zoneRuns: Record<string, number> = {}
    for (const [name, m] of Object.entries(zm)) {
      const card: PatternCardMeta = { status: m.status }
      if (m.confidence !== null) card.confidence = m.confidence
      if (m.count !== null) card.count = m.count
      if (m.doubtful) card.doubtful = true
      zoneMeta[name] = card
      if (m.manual && m.weight) zoneOver[name] = m.weight
      if (m.aiRunId !== null) zoneRuns[name] = m.aiRunId
    }
    if (Object.keys(zoneMeta).length) meta[z] = zoneMeta
    if (Object.keys(zoneOver).length) overrides[z] = zoneOver
    if (Object.keys(zoneRuns).length) runIds[z] = zoneRuns
  }
  return { zones, meta, overrides, runIds, soleText: p.soleText ?? "", extracted: p.extractedRaw ?? [] }
}

/** 초안 → C2 본문(제안은 튜플에서 빼고 메타로, 「직접」 가중치는 manual 표시와 함께) */
export function saveBodyOf(d: PatternDraft, rowVersion: number): SavePatternsBody {
  const body = {
    top: [],
    mid: [],
    bottom: [],
    outline: [],
    extracted_raw: d.extracted.length ? d.extracted : null,
    meta: {},
    soleText: d.soleText.trim() ? d.soleText.trim() : null,
    rowVersion,
  } as SavePatternsBody
  for (const z of PATTERN_ZONES) {
    const zoneMeta: SavePatternsBody["meta"][PatternZone] = {}
    d.zones[z].forEach(([path, flag], index) => {
      const name = nameOf(path)
      const m = d.meta[z]?.[name]
      const status = m?.status ?? "manual"
      if (status !== "suggested") body[z].push([name, flag ? 1 : 0])
      const weight = d.overrides[z]?.[name] ?? null
      zoneMeta[name] = {
        status,
        confidence: m?.confidence ?? null,
        doubtful: Boolean(m?.doubtful),
        weight,
        manual: weight !== null,
        count: m?.count ?? null,
        sortOrdr: index,
        aiRunId: d.runIds[z]?.[name] ?? null,
      }
    })
    if (Object.keys(zoneMeta).length) body.meta[z] = zoneMeta
  }
  return body
}

/** 저장할 게 있나(서버 값으로 만든 기준과 비교 — 판 번호 제외) */
export function draftSignature(d: PatternDraft): string {
  const { rowVersion: _ignored, ...rest } = saveBodyOf(d, 0)
  void _ignored
  return JSON.stringify(rest)
}

/** 위젯용 4부위(이름 → 그림 경로) */
export function hydrateZones(zones: CrimeZoneMap): CrimeZones {
  const out = {} as Record<PatternZone, CrimePatternTuple[]>
  for (const z of PATTERN_ZONES) out[z] = zones[z].map((t) => insertPatternPath([nameOf(t[0]), t[1]]) as CrimePatternTuple)
  return out
}

/** 지금 초안의 검색 문양 · 제안(이력 모양 — D1 `query` · `pending`과 같은 모양) */
export function searchCardsOf(d: PatternDraft, kinds: Readonly<Record<string, PaletteKind>>) {
  const weights = patternWeights(d.zones, d.meta, kinds, d.overrides)
  const zones = runSnapshot(searchQuery(d.zones, d.meta, weights), weights, d.meta)
  const pending = pendingSnapshot(d.zones, d.meta, d.overrides)
  return { zones, pending }
}

/** 초안 → D1 본문(필수 = 거르기 이름 배열, 가중치 = 단계 문자열) */
export function searchBodyOf(
  d: PatternDraft,
  kinds: Readonly<Record<string, PaletteKind>>,
  opts: {
    image: string
    source: SearchImageSource
    conditions: MatchConditionValues
    method?: SearchMethod
    record: boolean
    inputFileId?: number
  },
): RunSearchBody {
  const { zones, pending } = searchCardsOf(d, kinds)
  const essentials = (z: PatternZone) => zones[z].filter((p) => p.essential).map((p) => p.name)
  return {
    image: opts.image,
    top: essentials("top"),
    mid: essentials("mid"),
    bottom: essentials("bottom"),
    outline: essentials("outline"),
    query: zones as unknown as Record<PatternZone, CondPattern[]>,
    ...(pending ? { pending } : {}),
    soleText: d.soleText,
    conditions: { ...opts.conditions, ...(opts.method ? { method: opts.method } : {}) },
    source: opts.source,
    record: opts.record,
    ...(opts.inputFileId !== undefined ? { inputFileId: opts.inputFileId } : {}),
  }
}

const DEFAULT_CONDITIONS: MatchConditionValues = { searchKind: "현장문양", periodFrom: "", periodTo: "", gender: "전체", heel: "전체" }

/** 서버 이력 한 줄 → 위젯 이력 줄(조건이 남은 새 기록만 — 옛 이력은 null) */
export function runOfEntry(e: SearchHistoryEntry): SearchRun | null {
  if (!e.cond) return null
  // 서버 jsonb 는 키 순서를 바꿔 저장한다 — 화면 이력 모양(runSnapshot · pendingSnapshot)과 같은 순서로 다시 짓는다(「지금」 줄 비교가 같게).
  // 서버는 수동 카드에도 status "manual"을 남기지만 화면 이력은 수동이면 status 가 없다.
  const zones = {} as Record<PatternZone, SearchRun["zones"][PatternZone]>
  for (const z of PATTERN_ZONES) {
    zones[z] = (e.cond.zones[z] ?? []).map((p) => ({
      name: p.name,
      essential: p.essential,
      weight: p.weight,
      manual: p.manual,
      ...(p.status && p.status !== "manual" ? { status: p.status } : {}),
      ...(p.confidence !== undefined ? { confidence: p.confidence } : {}),
      ...(p.count !== undefined ? { count: p.count } : {}),
    }))
  }
  const pendingOut: Partial<Record<PatternZone, SearchRunPending[]>> = {}
  for (const z of PATTERN_ZONES) {
    const items = e.cond.pending?.[z]
    if (!items?.length) continue
    pendingOut[z] = items.map((s) => ({
      name: s.name,
      ...(s.confidence !== undefined ? { confidence: s.confidence } : {}),
      ...(s.weight !== undefined ? { weight: s.weight } : {}),
      ...(s.count !== undefined ? { count: s.count } : {}),
      ...(s.doubtful ? { doubtful: true } : {}),
    }))
  }
  const pending = Object.keys(pendingOut).length ? pendingOut : undefined
  const c = e.cond.conditions ?? {}
  const conditions: MatchConditionValues = {
    searchKind: c.searchKind ?? DEFAULT_CONDITIONS.searchKind,
    periodFrom: c.periodFrom ?? DEFAULT_CONDITIONS.periodFrom,
    periodTo: c.periodTo ?? DEFAULT_CONDITIONS.periodTo,
    gender: c.gender ?? DEFAULT_CONDITIONS.gender,
    heel: c.heel ?? DEFAULT_CONDITIONS.heel,
  }
  return {
    searchNo: e.searchNo,
    at: e.frstRegistDt ?? "",
    source: e.cond.source,
    zones,
    ...(pending ? { pending } : {}),
    soleText: e.cond.soleText,
    conditions,
    resultCount: e.resultCount ?? 0,
    top: e.top.map((h) => ({ ftwrId: h.ftwrId, score: h.patternScore, src: shoeImageUrl(h.ftwrId, "B") })),
  }
}

/** 「이 조건 다시 불러오기」 — 그때의 문양 · 필수 · 가중치 · 카드 상태 · 개수 · 제안 · 문자열(진열 S04 restoreRun 과 같은 규칙) */
export function draftFromRun(run: SearchRun, prev: PatternDraft): PatternDraft {
  const zones = {} as Record<PatternZone, (readonly [string, 0 | 1])[]>
  const meta: PatternMetaMap = {}
  const overrides: WeightOverrideMap = {}
  for (const z of PATTERN_ZONES) {
    zones[z] = run.zones[z].map((p) => [p.name, p.essential ? 1 : 0] as const)
    const zm: Record<string, PatternCardMeta> = {}
    const zo: Record<string, WeightLevel> = {}
    for (const p of run.zones[z]) {
      const count = p.count !== undefined ? { count: p.count } : {}
      if (p.status && p.status !== "manual") zm[p.name] = { status: "ai", ...(p.confidence !== undefined ? { confidence: p.confidence } : {}), ...count }
      else if (p.count !== undefined) zm[p.name] = { status: "manual", ...count }
      if (p.manual) zo[p.name] = p.weight
    }
    for (const s of run.pending?.[z] ?? []) {
      if (zones[z].some(([n]) => n === s.name)) continue
      zones[z] = [...zones[z], [s.name, 0] as const]
      zm[s.name] = {
        status: "suggested",
        ...(s.confidence !== undefined ? { confidence: s.confidence } : {}),
        ...(s.count !== undefined ? { count: s.count } : {}),
        ...(s.doubtful ? { doubtful: true } : {}),
      }
      if (s.weight !== undefined) zo[s.name] = s.weight
    }
    if (Object.keys(zm).length) meta[z] = zm
    if (Object.keys(zo).length) overrides[z] = zo
  }
  return { ...prev, zones, meta, overrides, runIds: {}, soleText: run.soleText ?? "" }
}

/** 「지금」 줄 찾기 — 지금 초안 · 조건 · 이미지와 똑같은 이력 줄의 모양(진열 S04 conditionKey 와 같은 순서) */
export function conditionKey(
  d: PatternDraft,
  kinds: Readonly<Record<string, PaletteKind>>,
  conditions: MatchConditionValues,
  source: SearchImageSource,
): string {
  const { zones, pending } = searchCardsOf(d, kinds)
  return JSON.stringify([zones, pending ?? null, d.soleText, conditions, source])
}

export const runConditionKey = (r: SearchRun) => JSON.stringify([r.zones, r.pending ?? null, r.soleText ?? "", r.conditions, r.source])

// ── 초안 고치기(순수) ──

function patchMeta(d: PatternDraft, zone: PatternZone, name: string, patch: Partial<PatternCardMeta> | null): PatternMetaMap {
  const zm = { ...(d.meta[zone] ?? {}) }
  if (patch === null) delete zm[name]
  else zm[name] = { ...(zm[name] ?? { status: "manual" }), ...patch }
  return { ...d.meta, [zone]: zm }
}

function setOverride(d: PatternDraft, zone: PatternZone, name: string, level: WeightLevel | null): WeightOverrideMap {
  const row = { ...(d.overrides[zone] ?? {}) }
  if (level === null) delete row[name]
  else row[name] = level
  return { ...d.overrides, [zone]: row }
}

/** 넣기 — AI 추출 결과에서 넣으면(그리고 윤곽이 아니면) AI · 확신도 · 실행 번호, 그 밖은 수동 */
export function insertInto(d: PatternDraft, zone: PatternZone, src: string, ai: { score: number; runId: number | null } | null): PatternDraft {
  const name = nameOf(src)
  const zones = insertTuple(d.zones, zone, name)
  if (zones === d.zones) return d
  const isAi = ai !== null && zone !== "outline"
  const runIds = { ...d.runIds, [zone]: { ...(d.runIds[zone] ?? {}) } }
  delete runIds[zone]![name]
  if (isAi && ai.runId !== null) runIds[zone]![name] = ai.runId
  return { ...d, zones, meta: patchMeta(d, zone, name, isAi ? { status: "ai", confidence: ai.score } : null), runIds }
}

export function removeAt(d: PatternDraft, zone: PatternZone, index: number): PatternDraft {
  const path = d.zones[zone][index]?.[0]
  if (path === undefined) return d
  const name = nameOf(path)
  const runIds = { ...d.runIds, [zone]: { ...(d.runIds[zone] ?? {}) } }
  delete runIds[zone]![name]
  return {
    ...d,
    zones: removeTuple(d.zones, zone, name),
    meta: patchMeta(d, zone, name, null),
    overrides: setOverride(d, zone, name, null),
    runIds,
  }
}

export function toggleAt(d: PatternDraft, zone: PatternZone, index: number): PatternDraft {
  const path = d.zones[zone][index]?.[0]
  return path === undefined ? d : { ...d, zones: toggleTuple(d.zones, zone, path) }
}

export function nameAt(d: PatternDraft, zone: PatternZone, index: number): string | null {
  const path = d.zones[zone][index]?.[0]
  return path === undefined ? null : nameOf(path)
}

export function confirmAt(d: PatternDraft, zone: PatternZone, index: number): PatternDraft {
  const name = nameAt(d, zone, index)
  return name === null ? d : { ...d, meta: patchMeta(d, zone, name, { status: "ai" }) }
}

export function confirmAll(d: PatternDraft): PatternDraft {
  const meta: PatternMetaMap = {}
  for (const z of PATTERN_ZONES) {
    const zm = d.meta[z]
    if (!zm) continue
    meta[z] = Object.fromEntries(Object.entries(zm).map(([n, m]) => [n, m.status === "suggested" ? { ...m, status: "ai" as const } : m]))
  }
  return { ...d, meta }
}

export function countAt(d: PatternDraft, zone: PatternZone, index: number, count: PatternCount): PatternDraft {
  const name = nameAt(d, zone, index)
  return name === null ? d : { ...d, meta: patchMeta(d, zone, name, { count }) }
}

export function weightAt(d: PatternDraft, zone: PatternZone, index: number, level: WeightLevel | null): PatternDraft {
  const name = nameAt(d, zone, index)
  return name === null ? d : { ...d, overrides: setOverride(d, zone, name, level) }
}

// ── 훅 ──

/**
 * 서버 문양(C1) → 화면 초안. 서버 판 번호가 바뀌면(저장 뒤 다시 읽음 · 다른 사람이 고침):
 *   - 초안에 저장 안 한 게 없거나, 초안이 새 서버 값과 같으면(내가 방금 저장) → 서버 값으로 맞춘다
 *   - 저장 안 한 게 있고 서버 값과 다르면 → 초안은 두고 **기준 판 번호도 옛 값 그대로**(저장하면 서버가 409 — 다른 사람 값을 몰래 덮지 않게)
 * `dirty` = 기준과 다른가(저장할 것 있음). `rowVersion` = 이 초안이 기댄 판 번호(C2 기대 버전). `reset` = 서버 값으로 버리고 다시.
 */
export function usePatternDraft(server: CrimePatterns | undefined) {
  const [state, setState] = React.useState<{ base: string; version: number | null | undefined; draft: PatternDraft }>({
    base: draftSignature(EMPTY_DRAFT),
    version: undefined,
    draft: EMPTY_DRAFT,
  })
  const serverVersion = server?.rowVersion
  // 판 번호는 늘기만 한다 — 내 저장(markSaved)보다 늦게 온 옛 읽기 값(다시 읽기 실패 · 늦음)으로 되돌아가지 않는다
  const newer =
    state.version === undefined ||
    (state.version !== serverVersion && (serverVersion == null || state.version == null || serverVersion > state.version))
  if (server !== undefined && newer) {
    const fresh = draftFromServer(server)
    const sig = draftSignature(fresh)
    const current = draftSignature(state.draft)
    const dirtyNow = state.version !== undefined && current !== state.base
    if (!dirtyNow || current === sig) setState({ base: sig, version: serverVersion, draft: dirtyNow ? state.draft : fresh })
  }
  const update = React.useCallback((fn: (d: PatternDraft) => PatternDraft) => setState((s) => ({ ...s, draft: fn(s.draft) })), [])
  // 기준을 비우면 다음 그림에서 서버 값(지금 것 — 다시 읽은 값이 오면 그것)으로 맞춘다
  const reset = React.useCallback(() => setState((s) => ({ ...s, version: undefined })), [])
  // 내 저장(C2)이 성공하면 기준 = 내가 보낸 초안 · 판 번호 = 서버가 준 새 번호. 다시 읽은 서버 값과 글자가 달라도(확신도를
  // 서버가 소수 셋째 자리로 저장 — AI 점수는 넷째 자리) 옛 번호에 묶여 다음 저장이 409 로 튕기지 않게([버그] 혼자 쓰는데
  // 「다른 사람이 먼저 고쳤습니다」). 그 사이 다른 사람이 또 저장했으면 다음 다시 읽기에서 서버 번호가 달라 위 규칙대로 가른다
  const markSaved = React.useCallback(
    (saved: PatternDraft, version: number) => setState((s) => ({ ...s, base: draftSignature(saved), version })),
    [],
  )
  const dirty = draftSignature(state.draft) !== state.base
  return { draft: state.draft, update, reset, markSaved, dirty, rowVersion: state.version ?? null, ready: server !== undefined }
}
