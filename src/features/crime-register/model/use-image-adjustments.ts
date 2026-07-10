import { useCallback, useMemo, useState } from "react"

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
  /** True when any field is non-neutral (drives the "초기화" affordance). */
  isAdjusted: boolean
  /** Burn the current adjustments into a base64 image; a no-op when neutral. */
  bake: (base64: string) => Promise<string>
}

/**
 * Non-destructive visibility adjustments (밝기/대비/감마/임계값/반전/흑백) for the
 * evidence image. Values live in state and drive a live CSS `filter` preview;
 * pixels are only re-baked at commit time via `bake` (before the image is sent
 * to the server), so dragging a slider never degrades the source image.
 *
 * Deliberately separate from `useImageEditor`'s `EditorMode`: crop/calibration
 * are mutually-exclusive overlay modes, whereas these adjustments are always-on
 * continuous parameters — an analyst raises contrast *while* cropping.
 */
export function useImageAdjustments(): ImageAdjustments {
  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS)

  const setAdjustment = useCallback(
    <K extends keyof Adjustments>(key: K, value: Adjustments[K]) => {
      setAdjustments((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const resetAdjustments = useCallback(() => setAdjustments(DEFAULT_ADJUSTMENTS), [])

  const cssFilter = useMemo(() => buildCssFilter(adjustments), [adjustments])
  const isAdjusted = useMemo(() => !isIdentityAdjustments(adjustments), [adjustments])

  const bake = useCallback(
    (base64: string) => bakePixelAdjustments(base64, adjustments),
    [adjustments]
  )

  return { adjustments, setAdjustment, resetAdjustments, cssFilter, isAdjusted, bake }
}
