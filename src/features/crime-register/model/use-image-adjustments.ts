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
  /** Current adjustment values. */
  adjustments: Adjustments
  /** Set one field; others are preserved. */
  setAdjustment: <K extends keyof Adjustments>(key: K, value: Adjustments[K]) => void
  /** Restore every field to its neutral default. */
  resetAdjustments: () => void
  /** CSS `filter` string for the live `<img>` preview (memoised). */
  cssFilter: string
  /**
   * The source image with the *non-CSS* adjustments (gamma/threshold) baked in
   * for preview. Identical dimensions to `source`, so overlay/crop math is
   * unaffected. Equals `source` when gamma/threshold are neutral.
   */
  displayImage: string | null
  /** True when any field is non-neutral (drives the "초기화" affordance). */
  isAdjusted: boolean
  /** Burn the current adjustments into a base64 image; a no-op when neutral. */
  bake: (base64: string) => Promise<string>
}

/** Debounce (ms) before re-baking the gamma/threshold preview during a drag. */
const PREVIEW_DEBOUNCE = 120

/**
 * Non-destructive visibility adjustments (밝기/대비/감마/임계값/반전/흑백) for the
 * evidence image. Brightness/contrast/invert/grayscale ride a live CSS `filter`
 * (`cssFilter`) over the image; gamma/threshold — which CSS cannot express — are
 * preview-baked into `displayImage` off the `source`. Pixels are only committed
 * at save time via `bake`, so dragging a slider never degrades the source.
 *
 * Deliberately separate from `useImageEditor`'s `EditorMode`: crop/calibration
 * are mutually-exclusive overlay modes, whereas these adjustments are always-on
 * continuous parameters — an analyst raises contrast *while* cropping.
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

  // Preview-bake only the non-CSS adjustments (gamma/threshold) off the source.
  // Debounced so a slider drag doesn't re-bake on every intermediate value.
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
