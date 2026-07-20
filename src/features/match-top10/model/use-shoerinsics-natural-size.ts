/**
 * [CORRECTION 3b] 신발 Shoerinsics(이진) 이미지의 원본(자연) 픽셀 크기를 화면에
 * 표시하지 않고 측정만 한다 — RGB 모드에서 `sx,sy`(Shoerinsics 좌표계)를 실제
 * 표시 중인 RGB 이미지(`shoes_images/B`) 좌표계로 정규화하려면 기준(source) 크기가
 * 필요하다(`footprint-transform.ts`의 `normalizeShoePoint`). 302x756처럼 신발마다
 * 다를 수 있어(가정: "미래 이미지가 다를 수 있다") 하드코딩하지 않고 매번 실측한다.
 *
 * 스케치/이진 모드에서는 표시 이미지 자체가 Shoerinsics이므로 이 훅을 호출할
 * 필요가 없다(`enabled=false`로 스킵 — `normalizeShoePoint`가 source===target이면
 * 항등 변환이라 아예 정규화를 생략해도 결과가 같다).
 */
import { useEffect, useState } from "react"

import { corsPartitionedUrl } from "../lib/crop-image"
import type { NaturalSize } from "../lib/overlay-geometry"

export interface UseShoerinsicsNaturalSizeParams {
  modelNumber: string
  /** false면 측정하지 않는다(스케치/이진 모드처럼 정규화가 불필요할 때). */
  enabled: boolean
}

export function useShoerinsicsNaturalSize({
  modelNumber,
  enabled,
}: UseShoerinsicsNaturalSizeParams): NaturalSize | null {
  const [size, setSize] = useState<NaturalSize | null>(null)

  useEffect(() => {
    if (!enabled || !modelNumber) {
      setSize(null)
      return
    }
    let cancelled = false
    const base = import.meta.env.VITE_API_URL ?? ""
    // 스케치·이진 모드의 표시/크롭과 같은 CORS 파티션 URL을 써야 캐시 항목을 공유한다.
    const src = corsPartitionedUrl(`${base}/shoes_images/Shoerinsics/${modelNumber}.png`)

    // 스케치·이진 모드에서 같은 URL을 CORS 모드로 표시/크롭하므로, 이 측정용 로드도
    // 같은 모드로 맞춘다 — 모드가 엇갈리면 브라우저가 no-cors 캐시 응답을 cors 요청에
    // 재사용하며 CORS 오류를 낸다(crop-image.ts의 loadCorsImage와 동일한 이유).
    // 이 훅은 캔버스를 쓰지 않으므로, CORS가 없는 서버에서는 일반 모드로 폴백한다.
    const load = (useCors: boolean) => {
      const img = new Image()
      if (useCors) img.crossOrigin = "anonymous"
      img.onload = () => {
        if (!cancelled) setSize({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.onerror = () => {
        if (!cancelled && useCors) load(false)
      }
      img.src = src
    }
    load(true)

    return () => {
      cancelled = true
    }
  }, [modelNumber, enabled])

  return size
}
