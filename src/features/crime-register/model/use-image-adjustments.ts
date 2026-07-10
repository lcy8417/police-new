import { useCallback, useEffect, useMemo, useState } from "react"

import {
  type Adjustments,
  DEFAULT_ADJUSTMENTS,
  bakePixelAdjustments,
  buildCssFilter,
  isIdentityAdjustments,
} from "../lib/pixel-filters"

export type { Adjustments }

export interface ImageAdjustments {
  /** 현재 조정값. */
  adjustments: Adjustments
  /** 필드 하나를 설정한다; 나머지 필드는 유지된다. */
  setAdjustment: <K extends keyof Adjustments>(key: K, value: Adjustments[K]) => void
  /** 모든 필드를 중립 기본값으로 복원한다. */
  resetAdjustments: () => void
  /** 실시간 `<img>` 미리보기를 위한 CSS `filter` 문자열(메모이즈됨). */
  cssFilter: string
  /**
   * 미리보기를 위해 *CSS가 아닌* 조정값(gamma/threshold)이 구워진 원본 이미지.
   * `source`와 크기가 동일하므로 오버레이/크롭 계산에는 영향을 주지 않는다.
   * gamma/threshold가 중립값이면 `source`와 같다.
   */
  displayImage: string | null
  /** 어느 필드라도 중립값이 아니면 true("초기화" 어포던스를 구동함). */
  isAdjusted: boolean
  /** 현재 조정값을 base64 이미지에 구워 넣는다; 중립값이면 no-op. */
  bake: (base64: string) => Promise<string>
}

/** 드래그 중 gamma/threshold 미리보기를 다시 굽기 전 대기하는 디바운스 시간(ms). */
const PREVIEW_DEBOUNCE = 120

/**
 * 증거 이미지에 대한 비파괴 가시성 조정(밝기/대비/감마/임계값/반전/흑백). Brightness/
 * contrast/invert/grayscale는 이미지 위에 실시간 CSS `filter`(`cssFilter`)로 얹히고,
 * CSS로 표현할 수 없는 gamma/threshold는 `source`를 바탕으로 `displayImage`에
 * 미리보기용으로 구워진다. 픽셀은 `bake`를 통해 저장 시점에만 커밋되므로,
 * 슬라이더를 드래그해도 원본은 절대 손상되지 않는다.
 *
 * `useImageEditor`의 `EditorMode`와는 의도적으로 분리되어 있다: crop/calibration은
 * 상호 배타적인 오버레이 모드인 반면, 이 조정값들은 항상 켜져 있는 연속 파라미터다 —
 * 분석관은 크롭하는 *동안에도* 대비를 높일 수 있다.
 */
export function useImageAdjustments(source: string | null): ImageAdjustments {
  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS)
  const [displayImage, setDisplayImage] = useState<string | null>(source)

  const setAdjustment = useCallback(
    <K extends keyof Adjustments>(key: K, value: Adjustments[K]) => {
      setAdjustments((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const resetAdjustments = useCallback(() => setAdjustments(DEFAULT_ADJUSTMENTS), [])

  const cssFilter = useMemo(() => buildCssFilter(adjustments), [adjustments])
  const isAdjusted = useMemo(() => !isIdentityAdjustments(adjustments), [adjustments])

  // source를 바탕으로 CSS가 아닌 조정값(gamma/threshold)만 미리보기용으로 굽는다.
  // 슬라이더 드래그 중 모든 중간값마다 다시 굽지 않도록 디바운스 처리한다.
  const { gamma, threshold } = adjustments
  useEffect(() => {
    if (!source) {
      setDisplayImage(null)
      return
    }
    if (gamma === 1 && threshold === null) {
      setDisplayImage(source)
      return
    }
    let cancelled = false
    const timer = window.setTimeout(() => {
      bakePixelAdjustments(source, { ...DEFAULT_ADJUSTMENTS, gamma, threshold })
        .then((img) => !cancelled && setDisplayImage(img))
        .catch(() => !cancelled && setDisplayImage(source))
    }, PREVIEW_DEBOUNCE)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [source, gamma, threshold])

  const bake = useCallback(
    (base64: string) => bakePixelAdjustments(base64, adjustments),
    [adjustments]
  )

  return {
    adjustments,
    setAdjustment,
    resetAdjustments,
    cssFilter,
    displayImage,
    isAdjusted,
    bake,
  }
}
