/**
 * `/crimeRegister`에서 법과학 신발자국(족적) 가시성을 위한 픽셀 단위 이미지 조정.
 * 두 계층으로 나뉜다:
 *
 *  1. **순수 헬퍼** (`buildCssFilter`, `buildGammaLut`, `luminance`,
 *     `binarizeByte`, `clampByte`, `isIdentityAdjustments`) — DOM 없음, 단위 테스트됨.
 *  2. **캔버스 베이크** (`bakePixelAdjustments`) — 오프스크린 캔버스를 통해
 *     조정값을 실제 이미지에 구워 넣으며, `rotateImage`
 *     (`utils/get-input-change.js`)의 템플릿을 그대로 따른다: `new Image` → 오프스크린 캔버스 →
 *     `toDataURL`. 엔드투엔드로 검증되었으나 단위 테스트는 되어 있지 않다(jsdom에는
 *     실제 2d 래스터 백엔드가 없음).
 *
 * 설계: brightness/contrast/invert/grayscale는 CSS `filter` 함수로 표현 가능하므로
 * 실시간 미리보기와 베이크(즉 `ctx.filter`) 양쪽을 모두 구동한다.
 * gamma와 threshold는 CSS로 표현할 수 없으므로 베이크 시에만
 * `getImageData`/`putImageData`를 통해 픽셀 단위로 적용된다.
 *
 * 이진화 원시 헬퍼(`luminance`/`buildGammaLut`/`clampByte`/`thresholdByte`)는
 * 여러 슬라이스가 공유하도록 `shared/lib/image`로 승격되었다. 이 파일은 그 정본을
 * 재사용하며, `Adjustments`/`buildCssFilter`/`isIdentityAdjustments`는 이 슬라이스
 * 도메인이므로 여기 남긴다.
 */

import { buildGammaLut, clampByte, luminance, thresholdByte } from "@/shared/lib/image/threshold"

// 하위 호환을 위한 재노출(외부·테스트가 이 슬라이스에서 계속 import).
export { buildGammaLut, clampByte, luminance }

export interface Adjustments {
  /** -100..100 → CSS `brightness(100 + v %)`. 0 = 중립값. */
  brightness: number
  /** -100..100 → CSS `contrast(100 + v %)`. 0 = 중립값. */
  contrast: number
  /** 0.2..3.0 감마값. 1 = 중립값. CSS로 표현 불가 → 캔버스 LUT 사용. */
  gamma: number
  /** null = 꺼짐, 그 외에는 0..255 전역 이진화 임계값(캔버스에서만 적용). */
  threshold: number | null
  /** true일 때 CSS `invert(1)`. */
  invert: boolean
  /** true일 때 CSS `grayscale(1)`. */
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

/** 모든 필드가 중립 기본값일 때 true(이 경우 베이크는 no-op이 됨). */
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
 * 실시간 `<img>` 미리보기를 위한 CSS `filter` 문자열. CSS로 표현 가능한
 * 조정값만 여기 포함되며, gamma/threshold는 별도로 미리보기용 베이크가 이루어진다.
 * 값이 비지 않도록 항상 brightness+contrast를 함께 내보낸다.
 */
export function buildCssFilter(a: Adjustments): string {
  const parts = [`brightness(${100 + a.brightness}%)`, `contrast(${100 + a.contrast}%)`]
  if (a.grayscale) parts.push("grayscale(1)")
  if (a.invert) parts.push("invert(1)")
  return parts.join(" ")
}

/**
 * 전역 임계값: 그레이 레벨을 완전한 흰색 또는 완전한 검은색으로 매핑한다.
 * shared `thresholdByte`의 standard(BINARY) 모드에 위임한다 — 서버(OpenCV) 정합을 위해
 * 경계 판정은 strict `>`로 통일(과거 이 슬라이스의 `>=`에서 변경, 경계 픽셀 1개 값만 다름).
 */
export function binarizeByte(gray: number, threshold: number): number {
  return thresholdByte(gray, threshold, "standard")
}

/**
 * `adjustments`를 `base64`에 구워 넣어 새 PNG data URL을 반환한다. CSS로 표현 가능한
 * 필터는 `ctx.filter`를 통해 적용되고, gamma와 threshold는 이후 픽셀 단위로 적용된다.
 * 아무것도 조정되지 않았다면 입력을 그대로 반환한다.
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

  // CSS로 표현 가능한 필터(brightness/contrast/grayscale/invert)를 굽는다.
  ctx.filter = buildCssFilter(a)
  ctx.drawImage(img, 0, 0)
  ctx.filter = "none"

  // gamma + threshold는 CSS로 표현할 수 없음 → 픽셀 단위 처리.
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
