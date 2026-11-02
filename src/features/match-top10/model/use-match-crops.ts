/**
 * 대응 목록(top-10) 각 행의 썸네일 크롭을 클라이언트에서 생성한다 — 족적(현장)측과
 * 신발(등록)측 **양쪽 공용**이다(이전 `use-shoe-crops`는 신발측 전용이었다).
 *
 * 공용화한 이유: 우측 "세부 대응 목록"이 좌측 큰 이미지의 RGB↔스케치·이진 토글을
 * 따라가야 하기 때문이다. 백엔드가 주는 `box_image`는 RGB 현장 이미지(`crime_images`)
 * 크롭 한 종류뿐이라, 스케치·이진 모드에서는 같은 좌표를 `crime_outlines`에서 다시
 * 크롭해야 한다. 신발측도 마찬가지로 모드에 따라 `Shoerinsics`(이진) 또는 `B`(RGB)에서
 * 크롭한다 — 후자는 좌표계가 달라 `normalizeFrom`으로 정규화한다.
 *
 * 좌표계 주의: 크롭 중심은 그 이미지의 원본 픽셀 좌표계 기준이다. 현장측 `box.cx,cy`는
 * `crime_images` 좌표계이며 `crime_outlines`는 백엔드 게이트 4가 (H,W) 일치를 보장하므로
 * 정규화 없이 그대로 쓴다. 신발측 `sx,sy`는 Shoerinsics 좌표계라 RGB(`B`)에서 크롭할
 * 때만 `normalizeFrom`이 필요하다.
 */
import { useEffect, useState } from "react"

import { cropImageCenterBoxesToDataUrls, type CenterBox } from "../lib/crop-image"
import type { NaturalSize } from "../lib/overlay-geometry"

export interface UseMatchCropsParams {
  /** 크롭 원본 이미지 URL. 빈 문자열이면 크롭하지 않는다. */
  src: string
  /** 대응별 크롭 기준(중심 + 정사각 한 변). */
  boxes: CenterBox[]
  /** `boxes` 좌표계가 `src` 이미지와 다를 때의 원본 좌표계(미지정이면 정규화 없음). */
  normalizeFrom?: NaturalSize | null
  /** false면 크롭하지 않고 빈 배열을 유지한다(모드상 필요 없을 때). */
  enabled?: boolean
}

/** index별 크롭 data URL. 아직 준비되지 않았거나 크롭 실패한 항목은 undefined. */
export type MatchCropsResult = (string | undefined)[]

export function useMatchCrops({
  src,
  boxes,
  normalizeFrom,
  enabled = true,
}: UseMatchCropsParams): MatchCropsResult {
  const [crops, setCrops] = useState<MatchCropsResult>([])

  // boxes 배열의 identity가 아니라 "무엇을 어디서 크롭하는지"로 재계산을 판단한다
  // (좌표·크기·원본·정규화 기준이 바뀔 때만 다시 크롭한다).
  const signature = boxes.map((b) => `${b.center[0]},${b.center[1]},${b.size}`).join(";")
  const normalizeKey = normalizeFrom ? `${normalizeFrom.width}x${normalizeFrom.height}` : ""

  useEffect(() => {
    if (!enabled || !src || boxes.length === 0) {
      setCrops([])
      return
    }
    let cancelled = false

    cropImageCenterBoxesToDataUrls(src, boxes, { normalizeFrom })
      .then((dataUrls) => {
        if (!cancelled) setCrops(dataUrls)
      })
      .catch(() => {
        // 크롭 실패 — 행별로 대체 표시가 나오도록 undefined로 채운다.
        if (!cancelled) setCrops(new Array(boxes.length).fill(undefined))
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- signature/normalizeKey가 boxes·normalizeFrom 내용 변경을 대표한다.
  }, [src, signature, normalizeKey, enabled])

  return crops
}
