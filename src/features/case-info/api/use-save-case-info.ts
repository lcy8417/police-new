import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiSend } from "@/shared/api"
import { convertKeysToCamelCase } from "@/shared/lib"

/**
 * 사건 정보 「저장」 일괄 — A3 `PUT /requests/{rqest_id}`(사건 칸) + 바뀐 장마다 A8 `PUT /crime/{aprthng_no}/info`
 * (감정물 칸), 순서대로(잠금 §1-③). 하나라도 실패(409 동시 수정 · 403 접수 뒤 수사관)하면 거기서 멈추고 다시 읽는다.
 * 보낸 칸만 고친다(빈 글자 = 지움). 기대 판 번호(`rowVersion`)는 필수 — 사건 상세(A2)의 `rowVersion` · `images[].rowVersion`.
 */

/** 사건(의뢰) 칸 — camel 이름(서버 `schemas/requests.RequestUpdate`) */
export interface RequestFieldChanges {
  rqestOrgEtcNm?: string | null
  occrrncOrgId?: number | null
  processOrgId?: number | null
  scasCaseNo?: string | null
  docNo?: string | null
  crimeSeCode?: string | null
  crimeNm?: string | null
  crimeBeginDt?: string | null
  crimeEndDt?: string | null
  crimeAdres?: string | null
  crimePlaceCode?: string | null
  crimeSmryCn?: string | null
  victimNm?: string | null
  victimBrthy?: string | null
  suspectExstAt?: "Y" | "N" | null
  arrestSttusCode?: string | null
  rqestChargerNm?: string | null
  ftwrTireSe?: string | null
  rm?: string | null
}

/** 감정물(현장 이미지) 칸 — camel 이름(서버 `schemas/exam.AprthngInfoUpdate`). `pickDt` = `YYYY-MM-DD HH:mm` */
export interface ImageFieldChanges {
  pickDt?: string | null
  pickPlace?: string | null
  pickMthCode?: string | null
  aprthngKndCode?: string | null
  pickmanClssCode?: string | null
  pickmanNm?: string | null
  makrCode?: string | null
  brandCode?: string | null
  clCode?: string | null
  swingSe?: string | null
  heelExstAt?: string | null
  vhcleClCode?: string | null
  vhcleCode?: string | null
  ftwrTireSe?: string | null
}

export interface SaveCaseInfoInput {
  rqestId: number
  /** 사건 칸 바뀐 것 — 없으면(빈 객체 · null) A3 를 부르지 않는다 */
  request: { rowVersion: number; changes: RequestFieldChanges } | null
  /** 바뀐 장마다 */
  images: readonly { aprthngNo: string; rowVersion: number; changes: ImageFieldChanges }[]
}

export interface SaveCaseInfoResult {
  /** 새 의뢰 판 번호(A3 를 안 불렀으면 null) */
  requestRowVersion: number | null
  /** 감정물 번호 → 새 판 번호 */
  imageRowVersions: Record<string, number>
}

/** A3 → A8(순서대로). 실패하면 그 자리에서 `ApiError` 를 던진다(앞서 끝난 저장은 남는다 — 다시 읽어 보인다) */
export async function saveCaseInfo(input: SaveCaseInfoInput): Promise<SaveCaseInfoResult> {
  const out: SaveCaseInfoResult = { requestRowVersion: null, imageRowVersions: {} }
  if (input.request && Object.keys(input.request.changes).length > 0) {
    const res = await apiSend(`/requests/${encodeURIComponent(input.rqestId)}`, "PUT", {
      rowVersion: input.request.rowVersion,
      ...input.request.changes,
    })
    out.requestRowVersion = convertKeysToCamelCase<{ rowVersion: number }>(await res.json()).rowVersion
  }
  for (const img of input.images) {
    if (Object.keys(img.changes).length === 0) continue
    const res = await apiSend(`/crime/${encodeURIComponent(img.aprthngNo)}/info`, "PUT", {
      rowVersion: img.rowVersion,
      ...img.changes,
    })
    out.imageRowVersions[img.aprthngNo] = convertKeysToCamelCase<{ rowVersion: number }>(await res.json()).rowVersion
  }
  return out
}

/** 사건 정보 저장 뮤테이션 — 끝나면(성공 · 실패) 의뢰 쿼리를 다시 읽는다(409면 남이 바꾼 지금 값으로) */
export function useSaveCaseInfo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveCaseInfo,
    meta: { inlineError: true },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["request"] }),
  })
}
