import { apiSend } from "@/shared/api"

/** 신발 문양 4부위 — 이름 문자열 배열(사건 문양 `[이름, 필수]` 튜플과 다름, docs/pattern-data-model.md §2) */
export interface ShoeZoneNames {
  top: string[]
  mid: string[]
  bottom: string[]
  outline: string[]
}

/** J7 응답 `{ approved, confm_de, confmer_id }`(snake 그대로 받고 여기서 camel 로) */
export interface ShoeApproveResult {
  approved: true
  /** 승인일자 `YYYYMMDD`(KST) */
  confmDe: string
  confmerId: string
}

/**
 * PUT /shoes/:ftwrId/patterns — 문양 입력(J6, 분업 `SHOE_PATTERN` 또는 `SHOE_EDIT`). 메타데이터는 그대로 둔다.
 * 승인된 신발이면 409 「승인된 신발의 문양은 고칠 수 없습니다」(`ApiError.detail`).
 */
export async function saveShoePatterns(ftwrId: string, zones: ShoeZoneNames): Promise<void> {
  await apiSend(`/shoes/${encodeURIComponent(ftwrId)}/patterns`, "PUT", {
    top: zones.top,
    mid: zones.mid,
    bottom: zones.bottom,
    outline: zones.outline,
  })
}

/**
 * POST /shoes/:ftwrId/approve — 승인(J7, 분업 `SHOE_APPROVE`). 이미 승인 · 문양 없음은 409(`ApiError.detail`).
 */
export async function approveShoe(ftwrId: string): Promise<ShoeApproveResult> {
  const res = await apiSend(`/shoes/${encodeURIComponent(ftwrId)}/approve`, "POST")
  const data = (await res.json()) as { approved: true; confm_de: string; confmer_id: string }
  return { approved: data.approved, confmDe: data.confm_de, confmerId: data.confmer_id }
}
