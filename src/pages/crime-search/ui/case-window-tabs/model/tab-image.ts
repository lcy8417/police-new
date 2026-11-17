import { useQuery } from "@tanstack/react-query"

import { editFileUrl, useEditHistory, type Crime } from "@/entities/crime"
import type { RequestDetail, RequestImage } from "@/entities/request"
import { resolveImageToDataUrl } from "@/shared/lib"

// 탭 본문이 받는 이미지 한 장(`Crime` 모양 — 탭들이 원래 받던 값)을 서버 의뢰 상세(A2)로 만든다.
// 옛 전역 store(`useCrimeStore` — `GET /crime/` 전체)는 읽지 않는다(이식 계획 §5 R1). 문양은 탭이 C1 으로 읽으므로 비워 둔다.

/** A2 감정물 → 탭 이미지 값. `editImage` = 편집본 data URL(없으면 null) */
export function toTabImage(detail: RequestDetail, img: RequestImage, editImage: string | null): Crime {
  return {
    aprthngNo: img.aprthngNo,
    apprslReqestNo: detail.apprslReqestNo,
    pickDt: img.pickDt,
    pickPlace: img.pickPlace,
    pickMthCode: img.pickMthCode,
    crimeNm: detail.crimeNm,
    rqestGrfcNm: detail.rqestOrgNm,
    // 현장 그림(루트 기준) — 볼 수 없는 사람 · 과거 사건은 null
    image: img.thumbUrl,
    editImage,
    top: [],
    mid: [],
    bottom: [],
    outline: [],
    frstRegistDt: img.frstRegistDt ?? undefined,
  }
}

/**
 * 편집본(B3 지금 편집본이 작업본과 다를 때) data URL — 문양 추출 · 검색 본문 `image` 로 보내야 해서 data URL 로 받는다.
 * `enabled` 가 false(사건 정보 · 결과 확인 탭, 사진을 못 보는 사람)면 부르지 않는다.
 */
export function useEditImage(aprthngNo: string, enabled: boolean): { editImage: string | null; ready: boolean } {
  const history = useEditHistory(enabled ? aprthngNo : "")
  const current = history.data?.currentFileId ?? null
  const edited = current !== null && current !== (history.data?.workingFileId ?? null)
  const image = useQuery({
    queryKey: ["crime", aprthngNo, "edit-image", current] as const,
    queryFn: () => resolveImageToDataUrl(editFileUrl(current as number)),
    enabled: enabled && edited,
    staleTime: Infinity,
  })
  const ready = !enabled || history.isError || (history.isSuccess && (!edited || image.isSuccess || image.isError))
  return { editImage: edited ? (image.data ?? null) : null, ready }
}
