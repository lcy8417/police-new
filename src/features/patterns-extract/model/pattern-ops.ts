import { stripPatternPath, type EssentialFlag, type PatternEntry, type PatternZone } from "@/entities/pattern"

/**
 * 사건(crime) 문양 4부위의 순수 연산 — 이름 기준(docs/pattern-data-model.md §2: 경로가 아니라 `stripPatternPath` 이름으로 비교).
 * 화면 초안(`use-pattern-draft`)과 옛 훅(`usePatternManager` crime 모드)이 같은 규칙을 쓰도록 한 곳에 둔다.
 * 입력을 고치지 않고 새 값을 돌려준다(그대로면 같은 참조).
 */

/** 사건 문양 한 칸 `[경로 또는 이름, 필수]` */
export type CrimeTuple = readonly [string, EssentialFlag]
/** 4부위 */
export type CrimeZoneMap = Readonly<Record<PatternZone, readonly CrimeTuple[]>>

export const PATTERN_ZONES: readonly PatternZone[] = ["top", "mid", "bottom", "outline"]

/** 경로든 이름이든 이름만 */
export function nameOf(pathOrName: string): string {
  return stripPatternPath(pathOrName as PatternEntry) as string
}

/** 그 부위에 같은 이름이 있나 */
export function hasPattern(items: readonly CrimeTuple[], pathOrName: string): boolean {
  const name = nameOf(pathOrName)
  return items.some(([p]) => nameOf(p) === name)
}

/** 부위 끝에 넣기 — 같은 이름이 이미 있으면 그대로(필수 아님으로 넣는다) */
export function insertPattern(zones: CrimeZoneMap, zone: PatternZone, entry: string): CrimeZoneMap {
  if (hasPattern(zones[zone], entry)) return zones
  return { ...zones, [zone]: [...zones[zone], [entry, 0] as const] }
}

/** 이름으로 빼기 */
export function removePattern(zones: CrimeZoneMap, zone: PatternZone, pathOrName: string): CrimeZoneMap {
  const name = nameOf(pathOrName)
  const next = zones[zone].filter(([p]) => nameOf(p) !== name)
  return next.length === zones[zone].length ? zones : { ...zones, [zone]: next }
}

/** 필수 켜고 끄기(이름으로). 플래그는 참 · 거짓으로만 읽는다(0/1 · boolean 둘 다) */
export function toggleEssential(zones: CrimeZoneMap, zone: PatternZone, pathOrName: string): CrimeZoneMap {
  const name = nameOf(pathOrName)
  if (!hasPattern(zones[zone], name)) return zones
  return {
    ...zones,
    [zone]: zones[zone].map((t) => (nameOf(t[0]) === name ? ([t[0], t[1] ? 0 : 1] as const) : t)),
  }
}

/** 4부위 모두 비우기 */
export function clearPatterns(): CrimeZoneMap {
  return { top: [], mid: [], bottom: [], outline: [] }
}
