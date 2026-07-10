/**
 * Free-angle rotation for the evidence image. `rotateImage` in
 * `utils/get-input-change.js` only handles 90° multiples; this generalises it
 * to any angle, growing the output canvas to the rotated bounding box so no
 * corner is clipped.
 */

/** Bounding-box size of a `w`×`h` rectangle rotated by `degrees` (pure). */
export function rotatedBounds(
  w: number,
  h: number,
  degrees: number
): { width: number; height: number } {
  const rad = (degrees * Math.PI) / 180
  const sin = Math.abs(Math.sin(rad))
  const cos = Math.abs(Math.cos(rad))
  return {
    width: Math.round(w * cos + h * sin),
    height: Math.round(w * sin + h * cos),
  }
}

/**
 * Rotate `base64` by `degrees`, returning a new PNG data URL sized to the
 * rotated bounding box. A no-op (returns the input) at whole turns.
 */
export async function rotateArbitrary(base64: string, degrees: number): Promise<string> {
  if (degrees % 360 === 0) return base64

  const img = new Image()
  img.src = base64
  await img.decode()

  const w = img.naturalWidth
  const h = img.naturalHeight
  const { width, height } = rotatedBounds(w, h, degrees)

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) return base64

  ctx.translate(width / 2, height / 2)
  ctx.rotate((degrees * Math.PI) / 180)
  ctx.drawImage(img, -w / 2, -h / 2)

  return canvas.toDataURL("image/png")
}
