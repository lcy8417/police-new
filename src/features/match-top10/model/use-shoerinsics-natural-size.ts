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
    const img = new Image()
    img.onload = () => {
      if (!cancelled) setSize({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.src = `${base}/shoes_images/Shoerinsics/${modelNumber}.png`
    return () => {
      cancelled = true
    }
  }, [modelNumber, enabled])

  return size
}
