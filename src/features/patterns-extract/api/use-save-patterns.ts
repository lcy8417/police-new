import { useMutation, useQueryClient } from "@tanstack/react-query"

import { patternKeys, type ServerCardStatus, type ServerPatternCount, type ServerWeightLevel } from "@/entities/crime"
import type { PatternZone } from "@/entities/pattern"
import { apiSend } from "@/shared/api"

/**
 * 문양 + 카드 덧붙임 저장 — 서버 C2 `PUT /crime/{aprthng_no}` 확장(B 단계 설계서 2026-11-17 §3-3 · §4-3).
 * 본문: 옛 칸 `top · mid · bottom · outline`(이름 튜플 — 확인 전 제안은 넣지 않는다) · `extracted_raw` + 새 `meta` · `soleText` · `rowVersion`
 * (`meta`를 보내면 `rowVersion` 필수 — 다르면 409 「다른 사람이 먼저 고쳤습니다」). 응답 `{ message, row_version }`.
 * 저장이 끝나면 C1 을 다시 읽는다(서버 판 번호 · 값이 정본).
 */

/** 카드 덧붙임 한 칸(요청 — camel) */
export interface CardMetaBody {
  status: ServerCardStatus
  confidence?: number | null
  doubtful?: boolean
  weight?: ServerWeightLevel | null
  manual?: boolean
  count?: ServerPatternCount | null
  sortOrdr?: number
  aiRunId?: number | null
}

export interface SavePatternsBody {
  top: [string, 0 | 1][]
  mid: [string, 0 | 1][]
  bottom: [string, 0 | 1][]
  outline: [string, 0 | 1][]
  extracted_raw: { code: string; score: number }[] | null
  meta: Partial<Record<PatternZone, Record<string, CardMetaBody>>>
  soleText: string | null
  rowVersion: number
}

export interface SavePatternsResult {
  message: string
  rowVersion: number
}

export async function savePatterns(aprthngNo: string, body: SavePatternsBody): Promise<SavePatternsResult> {
  const response = await apiSend(`/crime/${encodeURIComponent(aprthngNo)}`, "PUT", body)
  const data = (await response.json()) as { message: string; row_version: number }
  return { message: data.message, rowVersion: data.row_version }
}

/**
 * 문양 저장 뮤테이션 열쇠 — 탭을 떠나며 한 저장(그 탭은 이미 사라짐)이 아직 끝나지 않았는지 다시 연 탭이 `useIsMutating` 으로 본다
 * (끝나기 전 값 · 판 번호로 고치기 시작하면 다음 저장이 409 — [버그] 혼자 쓰는데 「다른 사람이 먼저 고쳤습니다」)
 */
export const patternSaveKey = (aprthngNo: string) => ["crime", aprthngNo, "patterns", "save"] as const

/** 문양 저장 뮤테이션 — 실패 문구는 부르는 쪽이 그 자리 알림으로(전역 토스트 끔) */
export function useSavePatterns(aprthngNo: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: patternSaveKey(aprthngNo),
    mutationFn: (body: SavePatternsBody) => savePatterns(aprthngNo, body),
    meta: { inlineError: true },
    onSettled: () => {
      // 확정 판정이 있던 장은 서버가 「다시 판정」으로 내린다 — 의뢰(목록 · 상세 · 결과 확인)도 다시 읽게(기다리지 않음)
      void queryClient.invalidateQueries({ queryKey: ["request"] })
      return queryClient.invalidateQueries({ queryKey: patternKeys.detail(aprthngNo) })
    },
  })
}
