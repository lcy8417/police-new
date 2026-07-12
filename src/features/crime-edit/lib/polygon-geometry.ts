/**
 * 이미지 편집(배경제거 segmentation · 접합장애물제거 inpainting)의 폴리곤 좌표 수학 순수 함수 모음.
 *
 * 레거시 `src/components/EditMain.jsx`의 폴리곤 캡처/전송 로직에서 순수 계산 부분만 떼어냈다.
 * DOM/canvas 접근 없이 좌표 배열만 다루므로 vitest로 경계값을 검증할 수 있다.
 *
 * ── 좌표계 불변식 (백엔드 크래시 방지 — @docs/api-communication.md §4) ──
 * - 전송 좌표는 **표시(display) 픽셀**이다. 레거시는 오버레이 canvas의 `getBoundingClientRect()`로
 *   `[clientX-rect.left, clientY-rect.top]`를 캡처한다(`handleClick`).
 * - `render_size`도 **같은 표시 이미지 rect**(`.image-container > img`의 `getBoundingClientRect()`)의
 *   `[width, height]`로 보낸다(`handleRightClick`). 두 좌표계가 일치해야 서버가 render_size로
 *   native 픽셀에 정확히 매핑한다.
 * - 모든 좌표는 **정수**여야 한다(레거시는 반올림하지 않았으나, 소수 좌표는 백엔드 Pydantic이
 *   `int_from_float`(422)로 거절 → 여기서 `Math.round`로 강제).
 * - clamp로 이미지 밖 좌표를 막는다. 범위를 벗어나면 서버가 이미지 밖을 슬라이스 →
 *   `tile cannot extend outside image`(500)로 크래시.
 *
 * ── 표현(Point) 결정 ──
 * 레거시 EditMain은 점을 `[x, y]` **배열 튜플**로 push하고(`setPoints((prev)=>[...prev, [x,y]])`),
 * body에 `polygon: points`(= `[[x,y], ...]`)로 그대로 보낸다. Canvas.jsx도 `point[0]`/`point[1]`로
 * 그린다. 그래서 이 lib도 `Point = [number, number]` 튜플로 통일한다(레거시 body 형태를 그대로 재현).
 */

/** 폴리곤 정점 — 레거시 `[x, y]` 배열 표현을 그대로 보존한 튜플. */
export type Point = readonly [number, number];

/** `getBoundingClientRect()`가 반환하는 rect 중 이 lib이 쓰는 필드(DOMRect가 구조적으로 호환). */
export interface RectLike {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/** 폴리곤을 서버로 보낼 때 신뢰할 수 있는 최소 정점 수. 레거시 `points.length <= 2` 거절과 동일. */
export const MIN_POLYGON_POINTS = 3;

/**
 * 클라이언트 좌표를 canvas-local 좌표로 변환한다.
 * 레거시 `handleClick`의 `[e.clientX-rect.left, e.clientY-rect.top]`와 동일하되 **정수 반올림**을 강제한다
 * (소수 → 백엔드 422 방지, 위 불변식 참고).
 */
export function toCanvasPoint(
  clientX: number,
  clientY: number,
  rect: Pick<RectLike, "left" | "top">
): Point {
  return [Math.round(clientX - rect.left), Math.round(clientY - rect.top)];
}

/** 모든 정점 좌표를 정수로 반올림한다. */
export function roundPolygon(points: readonly Point[]): Point[] {
  return points.map(([x, y]) => [Math.round(x), Math.round(y)] as Point);
}

/**
 * 각 정점을 표시 이미지 범위 안으로 clamp한다: x∈[0, renderW], y∈[0, renderH].
 * 범위 근거: 전송 좌표와 `render_size`가 같은 표시 이미지 rect 기준이므로, 유효 좌표 범위는
 * 정확히 그 rect의 [0, width]·[0, height]다. 이 범위를 벗어나면 서버가 이미지 밖을 슬라이스 →
 * `tile cannot extend outside image`(500). (정수 입력이면 결과도 정수로 유지된다.)
 */
export function clampPolygon(
  points: readonly Point[],
  renderW: number,
  renderH: number
): Point[] {
  return points.map(([x, y]) => [
    Math.min(Math.max(x, 0), renderW),
    Math.min(Math.max(y, 0), renderH),
  ] as Point);
}

/**
 * 표시 이미지 rect에서 `render_size`를 산정한다.
 * 레거시 `handleRightClick`은 rect.width/height를 그대로 보냈으나, 좌표 정수 계약에 맞춰 반올림한다.
 * 반환 형태 `[width, height]`는 레거시 query param 순서(`render_size`=width, 그 다음 height)와 일치.
 */
export function computeRenderSize(
  rect: Pick<RectLike, "width" | "height">
): [number, number] {
  return [Math.round(rect.width), Math.round(rect.height)];
}

/** 폴리곤이 전송 가능한지(최소 3점). 레거시 `points.length <= 2` 거절 로직을 보존. */
export function isPolygonSubmittable(points: readonly Point[]): boolean {
  return points.length >= MIN_POLYGON_POINTS;
}

/**
 * 서버 전송용 폴리곤 형태로 직렬화한다.
 * 레거시 body의 `polygon: points`(= `[[x, y], ...]` 가변 배열)를 그대로 재현한다.
 */
export function serializePolygon(points: readonly Point[]): number[][] {
  return points.map(([x, y]) => [x, y]);
}

/** 마지막 정점을 제거한 새 배열을 반환한다(undo 편의). 빈 배열이면 그대로 복사본 반환. */
export function removeLastPoint(points: readonly Point[]): Point[] {
  return points.slice(0, -1);
}
