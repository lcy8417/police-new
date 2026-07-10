/**
 * Pixel-level image adjustments for forensic shoeprint (족적) visibility on
 * `/crimeRegister`. Split into two tiers:
 *
 *  1. **Pure helpers** (`buildCssFilter`, `buildGammaLut`, `luminance`,
 *     `binarizeByte`, `clampByte`, `isIdentityAdjustments`) — no DOM, unit-tested.
 *  2. **Canvas bake** (`bakePixelAdjustments`) — burns the adjustments into a
 *     real image via an offscreen canvas, mirroring the `rotateImage`
 *     (`utils/get-input-change.js`) template: `new Image` → offscreen canvas →
 *     `toDataURL`. Verified end-to-end, not unit-tested (jsdom lacks a real 2d
 *     raster backend).
 *
 * Design: brightness/contrast/invert/grayscale are expressible as CSS `filter`
 * functions, so they drive the live preview AND the bake (via `ctx.filter`).
 * gamma and threshold have no CSS equivalent, so they are applied per-pixel
 * through `getImageData`/`putImageData` during the bake only.
 */

export interface Adjustments {
  /** -100..100 → CSS `brightness(100 + v %)`. 0 = neutral. */
  brightness: number
  /** -100..100 → CSS `contrast(100 + v %)`. 0 = neutral. */
  contrast: number
  /** 0.2..3.0 gamma. 1 = neutral. CSS cannot express this → canvas LUT. */
  gamma: number
  /** null = off, else 0..255 global binarization threshold (canvas only). */
  threshold: number | null
  /** CSS `invert(1)` when true. */
  invert: boolean
  /** CSS `grayscale(1)` when true. */
  grayscale: boolean
}

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  contrast: 0,
  gamma: 1,
  threshold: null,
  invert: false,
  grayscale: false,
}

/** True when every field is at its neutral default (a bake would be a no-op). */
export function isIdentityAdjustments(a: Adjustments): boolean {
  return (
    a.brightness === 0 &&
    a.contrast === 0 &&
    a.gamma === 1 &&
    a.threshold === null &&
    !a.invert &&
    !a.grayscale
  )
}

/**
 * The CSS `filter` string for the live `<img>` preview. Only the
 * CSS-expressible adjustments appear here; gamma/threshold are preview-baked
 * separately. Always emits brightness+contrast so the value is never empty.
 */
export function buildCssFilter(a: Adjustments): string {
  const parts = [`brightness(${100 + a.brightness}%)`, `contrast(${100 + a.contrast}%)`]
  if (a.grayscale) parts.push("grayscale(1)")
  if (a.invert) parts.push("invert(1)")
  return parts.join(" ")
}

/** Round + clamp a number into a single 0..255 byte. */
export function clampByte(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)))
}

/**
 * 256-entry gamma lookup table: `out = 255 * (i/255) ** (1/gamma)`.
 * gamma > 1 lifts mid-tones (faint dust prints), gamma < 1 deepens them.
 * Endpoints are fixed (0→0, 255→255); gamma = 1 is the identity ramp.
 */
export function buildGammaLut(gamma: number): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(256)
  const inv = 1 / gamma
  for (let i = 0; i < 256; i++) lut[i] = clampByte(255 * (i / 255) ** inv)
  return lut
}

/** Rec.601 luma of an RGB triplet (each 0..255). */
export function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/** Global threshold: a gray level maps to full white or full black. */
export function binarizeByte(gray: number, threshold: number): 0 | 255 {
  return gray >= threshold ? 255 : 0
}

/**
 * Burn `adjustments` into `base64`, returning a new PNG data URL. CSS-expressible
 * filters are applied through `ctx.filter`; gamma and threshold are applied
 * per-pixel afterwards. Returns the input unchanged when nothing is adjusted.
 */
export async function bakePixelAdjustments(base64: string, a: Adjustments): Promise<string> {
  if (isIdentityAdjustments(a)) return base64

  const img = new Image()
  img.src = base64
  await img.decode()

  const canvas = document.createElement("canvas")
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext("2d")
  if (!ctx) return base64

  // Bake the CSS-expressible filters (brightness/contrast/grayscale/invert).
  ctx.filter = buildCssFilter(a)
  ctx.drawImage(img, 0, 0)
  ctx.filter = "none"

  // gamma + threshold have no CSS equivalent → per-pixel pass.
  if (a.gamma !== 1 || a.threshold !== null) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const px = imageData.data
    const lut = a.gamma !== 1 ? buildGammaLut(a.gamma) : null
    const { threshold } = a
    for (let i = 0; i < px.length; i += 4) {
      let r = px[i]
      let g = px[i + 1]
      let b = px[i + 2]
      if (lut) {
        r = lut[r]
        g = lut[g]
        b = lut[b]
      }
      if (threshold !== null) {
        const v = binarizeByte(luminance(r, g, b), threshold)
        r = v
        g = v
        b = v
      }
      px[i] = r
      px[i + 1] = g
      px[i + 2] = b
    }
    ctx.putImageData(imageData, 0, 0)
  }

  return canvas.toDataURL("image/png")
}
