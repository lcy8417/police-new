/**
 * 유사도 대응 뷰어의 좌표 스케일 순수 함수.
 *
 * 서버는 대응점·bbox를 **원본 픽셀**로 주는데(`query_*`=query.size, `ref_*`=ref.size),
 * 화면에서는 두 이미지를 임의 높이로 축소해 나란히 보인다. 따라서 표시 좌표 = 원본좌표
 * × (표시크기 / 원본크기)로 스케일해야 핀이 특징 위에 정확히 앉는다. `size=[height,
 * width]` 순서가 치명적이라(문양추출 좌표 계약과 동급 지뢰), DOM 접근 없는 순수 함수로
 * 격리해 vitest 경계값으로 검증한다.
 */

/** 원본 픽셀 크기 `[height, width]`. */
export type Size = readonly [number, number]
/** 좌표점 `[x, y]`. */
export type Point = readonly [number, number]
/** 박스 `[x, y, w, h]`. */
export type Bbox = readonly [number, number, number, number]
/** 화면 표시 크기 `[displayWidth, displayHeight]`. */
export type Display = readonly [number, number]

/**
 * 원본 크기 대비 표시 크기의 x/y 배율을 구한다. `size=[h, w]`이므로 x축은 width(size[1]),
 * y축은 height(size[0])가 분모다. 원본 크기가 0이면(미측정·빈 이미지) 0을 반환해
 * NaN/Infinity를 막는다.
 */
function scaleFactors(size: Size, display: Display): [number, number] {
  const [h, w] = size
  const [dispW, dispH] = display
  const sx = w > 0 ? dispW / w : 0
  const sy = h > 0 ? dispH / h : 0
  return [sx, sy]
}

/**
 * 원본 픽셀 좌표점을 표시 좌표로 스케일한다.
 * @param size 원본 `[height, width]`
 * @param display 표시 `[width, height]`
 * @param point 원본 `[x, y]`
 */
export function scalePoint(size: Size, display: Display, point: Point): [number, number] {
  const [sx, sy] = scaleFactors(size, display)
  return [point[0] * sx, point[1] * sy]
}

/**
 * 원본 픽셀 박스를 표시 좌표로 스케일한다(위치·크기 모두).
 * @param size 원본 `[height, width]`
 * @param display 표시 `[width, height]`
 * @param bbox 원본 `[x, y, w, h]`
 */
export function scaleBbox(
  size: Size,
  display: Display,
  bbox: Bbox
): [number, number, number, number] {
  const [sx, sy] = scaleFactors(size, display)
  const [x, y, w, h] = bbox
  return [x * sx, y * sy, w * sx, h * sy]
}
