// 정밀 대조 「확인대상」(S06 · B 단계 §4-5 E3) — 지금 대조하는 신발을 그 검색의 확인대상으로 저장(from = compare)한 뒤
// 결과 확인으로 넘긴다([검수] — 예전엔 탭만 옮겨, ★를 먼저 찍지 않았으면 결과 확인에 신발이 없어 「발견」 판정을 못 했다).
// 이미 확인대상이면 다시 보내지 않는다(E3 · E4 토글이 아니라 「더하기만」 — 빼는 것은 검색 결과 ★).
import * as React from "react"

import { useTargets } from "@/entities/crime"
import { FEATURES } from "@/entities/session"
import { useToggleTarget } from "@/features/targets"
import { ApiError } from "@/shared/api"

import type { TabCompareCandidate } from "./tab-session"
import { targetKey } from "./use-targets-binding"
import { useViewer } from "./use-viewer"

export const MSG_NO_SEARCH_RECORD = "검색 기록이 없는 후보라 확인대상으로 정할 수 없습니다 — 문양 코드 탭에서 「검색」으로 기록을 남긴 뒤 고르세요"
const MSG_SAVE_FAILED = "확인대상을 저장하지 못했습니다. 다시 시도해 주세요."

export type CompareTargetResult = { ok: true } | { ok: false; message: string }

export interface CompareTarget {
  /** 확인대상 목록(E2)을 읽었나 */
  ready: boolean
  /** 정할 수 있나(판정 확정 권한 EXAM_DECIDE — 서버 E3 와 같음) */
  canConfirm: boolean
  /** 저장 중 */
  pending: boolean
  /** 확인대상으로 저장(없을 때만 E3) → 결과 */
  confirm: (target: TabCompareCandidate) => Promise<CompareTargetResult>
}

export function useCompareTarget(aprthngNo: string): CompareTarget {
  const viewer = useViewer()
  const canRead =
    viewer.isAdmin || viewer.features.includes(FEATURES.CRIME_SEARCH) || viewer.features.includes(FEATURES.EXAM_VIEW)
  const canConfirm = viewer.isAdmin || viewer.features.includes(FEATURES.EXAM_DECIDE)
  const query = useTargets(aprthngNo, canRead)
  const { mutateAsync, isPending } = useToggleTarget(aprthngNo)
  const items = query.data?.items

  const confirm = React.useCallback(
    async (target: TabCompareCandidate): Promise<CompareTargetResult> => {
      if (target.searchNo === undefined) return { ok: false, message: MSG_NO_SEARCH_RECORD }
      const key = targetKey(target.searchNo, target.ftwrId)
      if ((items ?? []).some((t) => !t.excluded && targetKey(t.searchNo, t.ftwrId) === key)) return { ok: true }
      try {
        await mutateAsync({ searchNo: target.searchNo, ftwrId: target.ftwrId, from: "compare", remove: false })
        return { ok: true }
      } catch (e) {
        return { ok: false, message: e instanceof ApiError && e.detail ? e.detail : MSG_SAVE_FAILED }
      }
    },
    [items, mutateAsync]
  )

  return { ready: query.isSuccess, canConfirm, pending: isPending, confirm }
}
