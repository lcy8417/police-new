import type { Crime } from "@/entities/crime"
import { insertPatternPath, stripPatternPath, type PatternEntry } from "@/entities/pattern"
import type { CaseDetailForm } from "@/widgets/case-detail"
import type { PatternIconItem, ZonePatterns } from "@/widgets/match-compare"
import type { CrimePatternTuple, CrimeZones } from "@/widgets/pattern-code"

import { imageSeqOf } from "./resolve-image"

// 실제 레코드 → 위젯 값(순수 함수). 문양 표현 규칙(docs/pattern-data-model.md): crime 튜플 · shoe 문자열, 비교 · 표시 이름은 stripPatternPath.

const ZONES = ["top", "mid", "bottom", "outline"] as const

/** 채취 일시 `YYYY-MM-DDTHH:MM:SS` → 폼 글자 `YYYY-MM-DD HH:mm`(없으면 빈 칸) */
export function pickDtLabel(pickDt: string | null | undefined): string {
  if (!pickDt) return ""
  return pickDt.replace("T", " ").slice(0, 16)
}

/** 감정물 레코드 → 사건 정보 폼 값(지금 데이터에 있는 칸만, 없으면 빈 칸) */
export function caseFormOf(crime: Crime): CaseDetailForm {
  return {
    apprslReqestNo: crime.apprslReqestNo ?? "",
    aprthngSn: imageSeqOf(crime.aprthngNo ?? ""),
    rqestGrfcNm: crime.rqestGrfcNm ?? "",
    crimeNm: crime.crimeNm ?? "",
    pickDt: pickDtLabel(crime.pickDt),
    pickPlace: crime.pickPlace ?? "",
    pickMthCode: crime.pickMthCode ?? "",
  }
}

/** 사건 문양 한 칸을 튜플로(crime 문양은 `[경로, 필수]` — 혹시 문자열이면 필수 아님으로) */
function toTuple(entry: PatternEntry): CrimePatternTuple {
  return typeof entry === "string" ? [entry, 0] : entry
}

/** 감정물 레코드 → 문양 코드 위젯 4부위(경로는 store 가 이미 붙여 둠 — 다시 변환하지 않는다) */
export function zonesOf(crime: Crime): CrimeZones {
  return {
    top: (crime.top ?? []).map(toTuple),
    mid: (crime.mid ?? []).map(toTuple),
    bottom: (crime.bottom ?? []).map(toTuple),
    outline: (crime.outline ?? []).map(toTuple),
  }
}

/** 문양 한 칸 → 아이콘(이름 + 그림 경로). crime 튜플 · shoe 문자열 둘 다 — 이름만 뽑아 경로를 한 번 붙인다 */
function iconOf(entry: PatternEntry): PatternIconItem {
  const stripped = stripPatternPath(entry)
  const name = typeof stripped === "string" ? stripped : stripped[0]
  return { name, src: insertPatternPath(name) as string }
}

/** 4부위 문양 → 정밀 대조 아이콘 묶음 */
export function zonePatternsOf(source: Partial<Record<(typeof ZONES)[number], readonly PatternEntry[]>> | undefined): ZonePatterns {
  return Object.fromEntries(ZONES.map((z) => [z, (source?.[z] ?? []).map(iconOf)])) as unknown as ZonePatterns
}
