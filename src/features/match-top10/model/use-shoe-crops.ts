/**
 * [CORRECTION 2] 대응 목록(top-10)의 각 행에 쓸 "신발측 크롭"을 클라이언트에서
 * 생성한다. 백엔드는 `box_image`(족적/현장측 크롭)만 주므로, 신발측은 sx,sy를
 * 중심으로 한 고정 크기 박스를 Shoerinsics 이미지에서 직접 크롭한다 — `sx,sy`가
 * 정의된 좌표계가 바로 Shoerinsics이므로(REQ-MATCH-002), 정규화 없이 그 이미지에서
 * 크롭하면 좌표 오차가 없다(RGB/스케치 비교 모드와 무관하게 항상 Shoerinsics 사용).
 *
 * 같은 신발 이미지 하나를 한 번만 로드해 N개 대응을 모두 크롭한다
 * (`cropImageRegionsToDataUrls` — 디코드 반복 방지).
 */
import { useEffect, useState } from "react"

import type { MatchCorrespondence } from "@/entities/match"

import { cropImageRegionsToDataUrls } from "../lib/crop-image"
import { centerToCropRegion } from "../lib/footprint-transform"

export interface UseShoeCropsParams {
  modelNumber: string
  matches: MatchCorrespondence[]
}

/** index별 크롭 data URL. 아직 준비되지 않았거나 크롭 실패한 항목은 undefined. */
export type ShoeCropsResult = (string | undefined)[]

export function useShoeCrops({ modelNumber, matches }: UseShoeCropsParams): ShoeCropsResult {
  const [crops, setCrops] = useState<ShoeCropsResult>([])

  // matches 배열의 identity가 아니라 "무엇이 크롭 대상인지"로 재계산을 판단한다
  // (score/좌표가 바뀌면 다시 크롭해야 하므로 sx,sy,box.size를 키에 반영).
  const signature = matches.map((m) => `${m.sx},${m.sy},${m.box.size}`).join(";")

  useEffect(() => {
    if (!modelNumber || matches.length === 0) {
      setCrops([])
      return
    }
    let cancelled = false
    const base = import.meta.env.VITE_API_URL ?? ""
    const shoeImageSrc = `${base}/shoes_images/Shoerinsics/${modelNumber}.png`
    const regions = matches.map((m) => centerToCropRegion([m.sx, m.sy], m.box.size))

    cropImageRegionsToDataUrls(shoeImageSrc, regions)
      .then((dataUrls) => {
        if (!cancelled) setCrops(dataUrls)
      })
      .catch(() => {
        // 크롭 실패 — 행별로 "이미지 없음" 폴백이 보이도록 undefined로 채운다.
        if (!cancelled) setCrops(new Array(matches.length).fill(undefined))
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- signature가 matches 내용 변경을 대표한다.
  }, [modelNumber, signature])

  return crops
}
