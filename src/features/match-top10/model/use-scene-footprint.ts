/**
 * [CORRECTION 3b] 족적(현장) 표시 이미지를 정렬 폴리곤의 경계상자로 크롭하고,
 * `flipHorizontal`이면 좌우 반전해서 보여준다 — 실제 매칭이 사용한 정합 상태를
 * 그대로 반영한다("정렬 설정이 실제로 매칭에 쓰인 값을 정의하므로").
 *
 * 정렬(polygon/flipHorizontal)은 기존 `entities/alignment`의 `fetchAlignment`를
 * 그대로 재사용한다(같은 queryKey — `AlignmentGate`가 이미 조회했다면 캐시 재사용,
 * 새 엔드포인트를 추가하지 않는다). 폴리곤이 없으면(예: 데이터 도착 경쟁 상태)
 * 원본 이미지를 그대로 보여주는 안전한 폴백으로 내려간다(크롭 전 레거시 동작과 동일).
 */
import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { alignmentKeys, fetchAlignment } from "@/entities/alignment"

import { cropImageToDataUrl } from "../lib/crop-image"
import { boundingBoxOfPolygon, type PixelRect } from "../lib/footprint-transform"

export interface UseSceneFootprintParams {
  crimeNumber: string
  modelNumber: string
  /** 크롭 대상 원본 이미지 URL(모드에 따라 crime_images 원본 또는 crime_outlines). */
  sourceSrc: string
}

export interface UseSceneFootprint {
  /** 최종 표시 src — 폴리곤이 있으면 크롭(+미러)된 data URL, 준비 전이면 null. */
  src: string | null
  /** 크롭 영역(원본 픽셀 좌표계) — null이면 크롭 미적용(오버레이도 원본 좌표 그대로). */
  crop: PixelRect | null
  flipHorizontal: boolean
  /** 정렬 조회 + (있다면) 크롭 생성까지 끝났는지. */
  isReady: boolean
}

export function useSceneFootprint({
  crimeNumber,
  modelNumber,
  sourceSrc,
}: UseSceneFootprintParams): UseSceneFootprint {
  const alignmentQuery = useQuery({
    queryKey: alignmentKeys.detail(crimeNumber, modelNumber),
    queryFn: () => fetchAlignment({ crimeNumber, modelNumber }),
    enabled: Boolean(crimeNumber && modelNumber),
  })

  const polygon = alignmentQuery.data?.polygon ?? null
  const flipHorizontal = Boolean(alignmentQuery.data?.flipHorizontal)
  const hasPolygon = Boolean(polygon && polygon.length >= 3)
  const crop = hasPolygon ? boundingBoxOfPolygon(polygon!) : null

  const cacheKey = crop
    ? `${sourceSrc}|${crop.left}|${crop.top}|${crop.width}|${crop.height}|${flipHorizontal}`
    : null

  const [resolved, setResolved] = useState<{ key: string; src: string | null } | null>(null)

  useEffect(() => {
    if (!crop || !cacheKey) return
    let cancelled = false
    cropImageToDataUrl(sourceSrc, crop, { flipHorizontal })
      .then((dataUrl) => {
        if (!cancelled) setResolved({ key: cacheKey, src: dataUrl })
      })
      .catch(() => {
        // 크롭 실패(디코드 오류 등) — 미적용 폴백(원본 그대로)과 동일하게 취급한다.
        if (!cancelled) setResolved({ key: cacheKey, src: null })
      })
    return () => {
      cancelled = true
    }
  }, [cacheKey, crop, sourceSrc, flipHorizontal])

  if (alignmentQuery.isLoading) {
    return { src: null, crop: null, flipHorizontal, isReady: false }
  }

  if (!hasPolygon) {
    return { src: sourceSrc, crop: null, flipHorizontal, isReady: true }
  }

  const cropDone = resolved?.key === cacheKey
  if (!cropDone) {
    return { src: null, crop, flipHorizontal, isReady: false }
  }
  if (!resolved?.src) {
    // 크롭 시도가 실패로 끝남 — 완전한 미적용 폴백(원본, crop=null)으로 통일한다.
    return { src: sourceSrc, crop: null, flipHorizontal, isReady: true }
  }
  return { src: resolved.src, crop, flipHorizontal, isReady: true }
}
