/**
 * 화면에 표시하지 않고 이미지의 원본(자연) 픽셀 크기만 실측한다.
 *
 * 쓰임새 두 가지:
 *  1) RGB 모드에서 `sx,sy`(Shoerinsics 좌표계)를 표시 중인 RGB 이미지(`shoes_images/B`)
 *     좌표계로 정규화할 기준(source) 크기 — `footprint-transform.ts`의 `normalizeShoePoint`.
 *  2) 대응 박스를 "밑창 대비 같은 비율"로 맞출 때 필요한 두 이미지의 기준 폭
 *     (현장 ROI 폭 ↔ 신발 이미지 폭).
 *
 * 신발마다 크기가 달라(예: 300x773 vs 300x756) 하드코딩하지 않고 매번 실측한다.
 *
 * 요청 모드는 CORS로 통일한다 — 같은 URL을 표시/크롭에서도 CORS로 가져오므로,
 * 모드가 엇갈리면 브라우저가 no-cors 캐시 응답을 cors 요청에 재사용하며 차단한다
 * (`crop-image.ts`의 `loadCorsImage`/`corsPartitionedUrl` 주석 참조). 이 훅은 캔버스를
 * 쓰지 않으므로, CORS를 주지 않는 서버에서는 일반 모드로 폴백한다.
 */
import { useEffect, useState } from "react"

import { corsPartitionedUrl } from "../lib/crop-image"
import type { NaturalSize } from "../lib/overlay-geometry"

export interface UseImageNaturalSizeParams {
  /** 측정할 이미지 URL(파티션 처리는 이 훅이 수행한다). 빈 값이면 측정하지 않는다. */
  src: string
  /** false면 측정하지 않는다(필요 없는 모드에서 불필요한 요청을 막는다). */
  enabled?: boolean
}

export function useImageNaturalSize({
  src,
  enabled = true,
}: UseImageNaturalSizeParams): NaturalSize | null {
  const [size, setSize] = useState<NaturalSize | null>(null)

  useEffect(() => {
    if (!enabled || !src) {
      setSize(null)
      return
    }
    let cancelled = false
    const url = corsPartitionedUrl(src)

    const load = (useCors: boolean) => {
      const img = new Image()
      if (useCors) img.crossOrigin = "anonymous"
      img.onload = () => {
        if (!cancelled) setSize({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.onerror = () => {
        if (!cancelled && useCors) load(false)
      }
      img.src = url
    }
    load(true)

    return () => {
      cancelled = true
    }
  }, [src, enabled])

  return size
}
