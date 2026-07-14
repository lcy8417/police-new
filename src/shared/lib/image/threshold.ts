/**
 * 이진화(임계값) 관련 순수 헬퍼 — DOM 없음, 단위 테스트 대상.
 *
 * `/crimeRegister`의 픽셀 조정에서 승격되어 여러 슬라이스가 공유한다
 * (FSD에서 features↔features import가 금지되므로 shared로 올림).
 *
 * `thresholdByte`는 **OpenCV `THRESH_*`의 정확한 의미**(strict `>`, maxval=255)를
 * 따른다 — 서버 이진화(OpenCV)와 클라이언트 미리보기·검색 정합을 맞추기 위함.
 */

/** 숫자를 반올림한 뒤 0..255 범위의 단일 바이트로 clamp한다. */
export function clampByte(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)))
}

/**
 * 256개 항목의 감마 룩업 테이블: `out = 255 * (i/255) ** (1/gamma)`.
 * gamma > 1이면 중간톤을 끌어올리고(희미한 먼지 지문), gamma < 1이면 더 어둡게 만든다.
 * 양 끝값은 고정(0→0, 255→255)이며, gamma = 1은 항등 램프다.
 */
export function buildGammaLut(gamma: number): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(256)
  const inv = 1 / gamma
  for (let i = 0; i < 256; i++) lut[i] = clampByte(255 * (i / 255) ** inv)
  return lut
}

/** RGB 트리플렛(각각 0..255)의 Rec.601 휘도(luma). */
export function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/**
 * 이진화 모드 — OpenCV `THRESH_*`에 1:1 대응.
 * standard=BINARY, standard_inv=BINARY_INV, trunc=TRUNC,
 * tozero=TOZERO, tozero_inv=TOZERO_INV.
 */
export type ThresholdMode = "standard" | "standard_inv" | "trunc" | "tozero" | "tozero_inv"

/**
 * 전역 임계값을 그레이 레벨에 적용한다. **OpenCV `THRESH_*`의 정확한 의미**를 따르며
 * 경계 판정은 strict `>`(maxval=255)다 — 서버 이진화(OpenCV)와 검색 정합을 맞추기 위함.
 *
 * - standard(BINARY):      `gray > t ? 255 : 0`
 * - standard_inv(BINARY_INV): `gray > t ? 0 : 255`
 * - trunc(TRUNC):          `gray > t ? t : gray`
 * - tozero(TOZERO):        `gray > t ? gray : 0`
 * - tozero_inv(TOZERO_INV):  `gray > t ? 0 : gray`
 */
export function thresholdByte(gray: number, threshold: number, mode: ThresholdMode): number {
  const over = gray > threshold
  switch (mode) {
    case "standard":
      return over ? 255 : 0
    case "standard_inv":
      return over ? 0 : 255
    case "trunc":
      return over ? threshold : gray
    case "tozero":
      return over ? gray : 0
    case "tozero_inv":
      return over ? 0 : gray
  }
}
