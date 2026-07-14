/**
 * 캔버스 이진화 재베이크 — 조정값을 실제 이미지에 구워 넣는다.
 *
 * `/crimeRegister`의 `bakePixelAdjustments`를 일반화해 여러 모드(`ThresholdMode`)를
 * 지원하도록 승격했다. `new Image` → 오프스크린 캔버스 → `toDataURL` 템플릿을 따르며
 * (`utils/get-input-change.js`의 `rotateImage`와 동일 계열), 출력 크기는 입력과 동일해
 * 오버레이/크롭 좌표가 불변한다.
 *
 * DOM(canvas)에 의존하므로 vitest 단위테스트 대상이 아니다(순수부는 `threshold.ts`가 커버).
 */

import { buildGammaLut, luminance, thresholdByte, type ThresholdMode } from "./threshold"

export interface BakeThresholdOptions {
  /** 이진화 임계값(0..255). */
  threshold: number
  /** 이진화 모드(OpenCV `THRESH_*` 의미). */
  mode: ThresholdMode
  /** 지정 시 이진화 이전에 적용할 감마값(생략·1이면 미적용). */
  gamma?: number
  /** 지정 시 drawImage 전에 적용할 CSS `filter` 문자열(brightness/contrast 등). */
  css?: string
}

/**
 * `opts`를 `dataUrl`에 구워 새 PNG data URL을 반환한다. CSS로 표현 가능한 필터(`css`)는
 * `ctx.filter`로, gamma와 threshold는 이후 픽셀 단위로 적용된다. 픽셀 루프는 gamma LUT를
 * 먼저 적용한 뒤 `thresholdByte(luminance(r,g,b), threshold, mode)`로 R=G=B를 설정하고
 * alpha는 유지한다. 캔버스 컨텍스트를 얻지 못하면 입력을 그대로 반환한다.
 */
export async function bakeThreshold(dataUrl: string, opts: BakeThresholdOptions): Promise<string> {
  const { threshold, mode, gamma, css } = opts

  const img = new Image()
  img.src = dataUrl
  await img.decode()

  const canvas = document.createElement("canvas")
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext("2d")
  if (!ctx) return dataUrl

  // CSS로 표현 가능한 필터(brightness/contrast/grayscale/invert)를 먼저 굽는다.
  if (css) ctx.filter = css
  ctx.drawImage(img, 0, 0)
  ctx.filter = "none"

  // gamma + threshold는 CSS로 표현할 수 없음 → 픽셀 단위 처리.
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const px = imageData.data
  const lut = gamma !== undefined && gamma !== 1 ? buildGammaLut(gamma) : null
  for (let i = 0; i < px.length; i += 4) {
    let r = px[i]
    let g = px[i + 1]
    let b = px[i + 2]
    if (lut) {
      r = lut[r]
      g = lut[g]
      b = lut[b]
    }
    const v = thresholdByte(luminance(r, g, b), threshold, mode)
    px[i] = v
    px[i + 1] = v
    px[i + 2] = v
    // alpha(px[i + 3])는 유지.
  }
  ctx.putImageData(imageData, 0, 0)

  return canvas.toDataURL("image/png")
}
