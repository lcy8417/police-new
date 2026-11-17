import { useQuery } from "@tanstack/react-query"

import { apiGet } from "@/shared/api"
import { convertKeysToCamelCase } from "@/shared/lib"

/**
 * 코드표 · 문양 종류 사전 — 서버 A7 `GET /codes/{code_group}` · C4 `GET /codes/pattern-kinds`(B 단계 설계서 2026-11-17 §4-1 · §4-3).
 * 로그인만 있으면 본다. 코드표는 CRUD 계층(snake → camel), 종류 사전은 키가 문양 이름이라 변환하지 않는다
 * (`n32_04` 는 변환해도 같지만 이름 키를 건드리지 않게 그대로 읽는다).
 */

/** 코드 한 줄(사용 중만, 정렬 순) */
export interface CodeItem {
  code: string
  codeNm: string
  upperCode: string | null
}

/** 문양 이름 → 종류(선 · 무늬 · 윤곽 · 다각 · 삼각 · 사각 · 원 · 항목) */
export type PatternKindMap = Record<string, string>

export const codeKeys = {
  group: (codeGroup: string) => ["codes", codeGroup] as const,
  patternKinds: () => ["codes", "pattern-kinds"] as const,
}

/** GET /codes/{code_group} — SCAS 코드(`FT…`) · 앱 코드 · 특별 그룹 `ORG`(관서) */
export async function fetchCodes(codeGroup: string): Promise<CodeItem[]> {
  return convertKeysToCamelCase<CodeItem[]>(await apiGet<unknown>(`/codes/${encodeURIComponent(codeGroup)}`))
}

/** GET /codes/pattern-kinds */
export async function fetchPatternKinds(): Promise<PatternKindMap> {
  return apiGet<PatternKindMap>("/codes/pattern-kinds")
}

/** 코드표 조회 — 잘 바뀌지 않으므로 한 번 읽으면 오래 쓴다 */
export function useCodes(codeGroup: string) {
  return useQuery({
    queryKey: codeKeys.group(codeGroup),
    queryFn: () => fetchCodes(codeGroup),
    enabled: codeGroup !== "",
    staleTime: 10 * 60 * 1000,
  })
}

/** 문양 종류 사전(가중치 R2) */
export function usePatternKinds() {
  return useQuery({
    queryKey: codeKeys.patternKinds(),
    queryFn: fetchPatternKinds,
    staleTime: Infinity,
  })
}
