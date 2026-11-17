// 확인대상 ★ 바인딩(잠금 파일 §2-4 · §3-2). 검색 결과(S05) · 정밀 대조(S06) 탭(묶음 ①)은 이 훅만 부르고,
// 실제 읽기 · 쓰기는 서버 E2 `GET` · E3 `POST` · E4 `DELETE /crime/{aprthng_no}/targets…`(묶음 ②).
// 확정 판정이 있는 장에서 ★를 바꾸면 서버가 「다시 판정」을 하고 결과 확인 탭도 다시 읽는다(features/targets).
import * as React from "react"

import { useTargets } from "@/entities/crime/api/targets-api"
import { FEATURES } from "@/entities/session"
import { useToggleTarget } from "@/features/targets/api/use-toggle-target"
import { ApiError } from "@/shared/api"

import { useViewer } from "./use-viewer"

/** 확인대상 하나의 키 — 검색번호 + 신발 ID(잠금 §2-1: 후보 식별 = 검색번호 + 신발 ID) */
export function targetKey(searchNo: number, ftwrId: string): string {
  return `${searchNo}:${ftwrId}`
}

export interface TargetsBinding {
  /** 어느 감정물의 확인대상인가(감정물 번호 전체) */
  aprthngNo: string
  /** 서버에서 확인대상을 읽었나 — false면(불러오는 중 · 실패 · 볼 권한 없음) ★ 단추를 잠그거나 숨긴다 */
  ready: boolean
  /** ★를 바꿀 수 있나(판정 확정 권한 EXAM_DECIDE + 읽기 끝 + 저장 중 아님) — false면 ★는 보기만 */
  canToggle: boolean
  /** 지금 확인대상(빼지 않은 것) 키 집합(`targetKey`) */
  targets: ReadonlySet<string>
  /** 마지막 ★ 저장 실패 문구(서버 한국어 `detail` — 교차 검증 중 · 접수 전 등). 없으면 null */
  error: string | null
  /** ★ 누름 — 있으면 빼고(E4) 없으면 더한다(E3). `from` = 검색 결과 ★ · 정밀 대조. canToggle 이 false면 아무것도 안 함 */
  toggleTarget: (searchNo: number, ftwrId: string, from: "search" | "compare") => void
}

const EMPTY: ReadonlySet<string> = new Set()

/** 확인대상 ★ 상태와 누름 처리 */
export function useTargetsBinding(aprthngNo: string): TargetsBinding {
  const viewer = useViewer()
  const canRead =
    viewer.isAdmin || viewer.features.includes(FEATURES.CRIME_SEARCH) || viewer.features.includes(FEATURES.EXAM_VIEW)
  const canWrite = viewer.isAdmin || viewer.features.includes(FEATURES.EXAM_DECIDE)
  const query = useTargets(aprthngNo, canRead)
  const mutation = useToggleTarget(aprthngNo)

  const targets = React.useMemo<ReadonlySet<string>>(() => {
    if (!query.data) return EMPTY
    return new Set(query.data.items.filter((t) => !t.excluded).map((t) => targetKey(t.searchNo, t.ftwrId)))
  }, [query.data])

  const ready = query.isSuccess
  const canToggle = ready && canWrite && !mutation.isPending
  const { mutate } = mutation
  const toggleTarget = React.useCallback(
    (searchNo: number, ftwrId: string, from: "search" | "compare") => {
      if (!canToggle) return
      mutate({ searchNo, ftwrId, from, remove: targets.has(targetKey(searchNo, ftwrId)) })
    },
    [canToggle, mutate, targets]
  )
  const error =
    mutation.error instanceof ApiError ? mutation.error.message : mutation.error ? "확인대상을 저장하지 못했습니다" : null

  return { aprthngNo, ready, canToggle, targets, error, toggleTarget }
}
