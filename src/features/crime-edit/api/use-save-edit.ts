import { useMutation, useQueryClient } from "@tanstack/react-query"

import { editHistoryKeys, type EditOp } from "@/entities/crime/api/edit-history-api"
import { apiSend, stripDataUrlPrefix } from "@/shared/api"
import { convertKeysToCamelCase, resolveImageToDataUrl } from "@/shared/lib"

/**
 * 편집 단계 저장(B4) · 되돌리기(B5) 뮤테이션 — B 단계 설계서 §3-7 · §4-2.
 * 도구 「확인」 1번 = B4 1건. `srcFileId` = 화면이 본 지금 파일(B3 `currentFileId`, 옛 감정물이면 null) — 다르면 409
 * 「다른 사람이 먼저 고쳤습니다」. 성공 · 실패 모두 편집 이력(B3)을 다시 읽는다(409면 남이 바꾼 지금 상태로).
 * 실패는 `ApiError`(서버 한국어 `detail`) — 탭이 알림으로 보인다(전역 토스트는 끔: `meta.inlineError`).
 */

const editsPath = (aprthngNo: string) => `/crime/${encodeURIComponent(aprthngNo)}/edits`

export interface SaveEditStepInput {
  /** 편집 전 파일(B3 `currentFileId`). null = 작업본 없는 옛 감정물 첫 편집(서버가 소급 등록) */
  srcFileId: number | null
  /** 결과 이미지 — data URL · 접두어 없는 base64 · 서버 이미지 주소 모두(보내기 전 data URL 로 통일 후 접두어 제거) */
  image: string
  /** 한 일(`op` = crop · rotate · calibrate · background · inpaint · threshold · denoise · flip) */
  ops: EditOp[]
}

export interface SaveEditStepResult {
  editId: number
  srcFileId: number
  resultFileId: number
  sha256: string
  width: number | null
  height: number | null
  /** 확정 판정이 있어 「다시 판정」이 된 판정 번호(없으면 null) */
  supersededExamId: number | null
}

export interface RevertEditInput {
  /** 지금 파일(B3 `currentFileId`) */
  srcFileId: number
  /** 되돌아갈 편집 번호(0 = 받은 작업본까지) */
  toEditId: number
}

export interface RevertEditResult {
  editId: number
  srcFileId: number
  resultFileId: number
  sha256: string
  supersededExamId: number | null
}

/** POST /crime/{no}/edits */
export async function saveEditStep(aprthngNo: string, input: SaveEditStepInput): Promise<SaveEditStepResult> {
  const dataUrl = await resolveImageToDataUrl(input.image)
  const res = await apiSend(editsPath(aprthngNo), "POST", {
    srcFileId: input.srcFileId,
    image: stripDataUrlPrefix(dataUrl),
    ops: input.ops,
  })
  return convertKeysToCamelCase<SaveEditStepResult>(await res.json())
}

/** POST /crime/{no}/edits/revert */
export async function revertEdit(aprthngNo: string, input: RevertEditInput): Promise<RevertEditResult> {
  const res = await apiSend(`${editsPath(aprthngNo)}/revert`, "POST", {
    srcFileId: input.srcFileId,
    toEditId: input.toEditId,
  })
  return convertKeysToCamelCase<RevertEditResult>(await res.json())
}

/** 편집 단계 저장(B4). 끝나면(성공 · 실패) 편집 이력을 다시 읽고 나서 끝난다 — 다음 단계가 새 `currentFileId` 를 보게 */
export function useSaveEditStep(aprthngNo: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveEditStepInput) => saveEditStep(aprthngNo, input),
    meta: { inlineError: true },
    onSettled: () => queryClient.invalidateQueries({ queryKey: editHistoryKeys.list(aprthngNo) }),
  })
}

/** 되돌리기(B5). 끝나면 편집 이력을 다시 읽는다 */
export function useRevertEdit(aprthngNo: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RevertEditInput) => revertEdit(aprthngNo, input),
    meta: { inlineError: true },
    onSettled: () => queryClient.invalidateQueries({ queryKey: editHistoryKeys.list(aprthngNo) }),
  })
}
