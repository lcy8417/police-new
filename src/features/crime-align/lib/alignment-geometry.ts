/**
 * 정렬 캔버스(폴리곤 ROI + 방향 화살표)의 좌표 수학 순수 함수 모음.
 *
 * SPEC-ALIGN-SETUP-001 REQ-ALIGN-004/006/013/013a: 표시(display) 좌표 ↔
 * `저장 현장 이미지 좌표계`(`static/crime_images/<n>.png`, 등록 시 ≤1000px 리사이즈
 * 적용 후 저장본 — REQ-ALIGN-002) 좌표 환산. 참조(`footprint_system/frontend/annotate.html`)의
 * `scale = img.width / dispW` 규칙과 동일한 결과를 산출해야 한다(AC-ALIGN-016). 여기서
 * `img.width`는 항상 정렬 캔버스가 로드한 저장 현장 이미지의 `naturalWidth`다
 * (REQ-ALIGN-002b: 캔버스 소스는 원본/편집 토글과 무관하게 고정).
 *
 * `features/crime-edit/lib/polygon-geometry.ts`(배경제거/인페인팅 폴리곤)와 달리 좌표를
 * **정수로 반올림하지 않는다** — REQ-ALIGN-013a: 정수 절삭 시 왕복 오차 상한이
 * `0.5 × scale`가 되어 `scale > 2`에서 REQ-ALIGN-013의 1px 허용치를 구조적으로
 * 초과한다. 이 lib은 float을 그대로 보존한다.
 */

/** 좌표 1점 — `[x, y]` 튜플. 표시 좌표·`저장 현장 이미지 좌표계` 좌표 양쪽에 재사용한다
 * (어느 좌표계인지는 각 함수의 파라미터/반환 이름이 명시한다). */
export type Point = readonly [number, number];

/** `getBoundingClientRect()`가 반환하는 rect 중 이 lib이 쓰는 필드. */
export interface RectLike {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/** 폴리곤 확정에 필요한 최소 정점 수(§F 계약값). */
export const MIN_POLYGON_POINTS = 3;

/** 방향 화살표에 필요한 정확한 점 수(toe→heel, §F 계약값). */
export const ARROW_POINTS = 2;

/**
 * `scale = img.naturalWidth / dispWidth` — 참조 규칙과 동일. `img`는 항상 저장 현장
 * 이미지(REQ-ALIGN-002b)이므로 naturalWidth가 곧 `저장 현장 이미지 좌표계`의 폭이다.
 */
export function computeScale(naturalWidth: number, dispWidth: number): number {
  return naturalWidth / dispWidth;
}

/** 클라이언트 좌표를 canvas-local 표시(display) 좌표로 변환한다(반올림 없음). */
export function toDisplayPoint(
  clientX: number,
  clientY: number,
  rect: Pick<RectLike, "left" | "top">
): Point {
  return [clientX - rect.left, clientY - rect.top];
}

/** 표시 좌표 1점을 `저장 현장 이미지 좌표계` 좌표로 환산한다(float 유지, 절삭 없음). */
export function toSavedPoint(point: Point, scale: number): Point {
  return [point[0] * scale, point[1] * scale];
}

/** `저장 현장 이미지 좌표계` 좌표 1점을 표시 좌표로 역환산한다(복원·렌더용). */
export function toDisplayFromSaved(point: Point, scale: number): Point {
  return [point[0] / scale, point[1] / scale];
}

/** 정점 배열 전체를 `저장 현장 이미지 좌표계`로 환산한다. */
export function toSavedPolygon(points: readonly Point[], scale: number): Point[] {
  return points.map((p) => toSavedPoint(p, scale));
}

/** 저장된 `저장 현장 이미지 좌표계` 정점 배열을 표시 좌표로 복원한다. */
export function toDisplayPolygon(points: readonly Point[], scale: number): Point[] {
  return points.map((p) => toDisplayFromSaved(p, scale));
}

/** 폴리곤 확정(닫기) 가능 여부 — 정점 3개 이상(Enter/더블클릭 닫기 전제, REQ-ALIGN-003). */
export function isPolygonClosable(points: readonly Point[]): boolean {
  return points.length >= MIN_POLYGON_POINTS;
}

/** 방향 화살표 확정 가능 여부 — 정확히 2점(toe→heel, REQ-ALIGN-005). */
export function isArrowComplete(points: readonly Point[]): boolean {
  return points.length === ARROW_POINTS;
}

/** "정렬 설정됨" 로컬 판정(REQ-ALIGN-007c) — 폴리곤 3점 이상 AND 화살표 정확히 2점. */
export function isAlignmentComplete(
  polygon: readonly Point[],
  arrow: readonly Point[]
): boolean {
  return isPolygonClosable(polygon) && isArrowComplete(arrow);
}

/** 서버 전송용 폴리곤/화살표 직렬화 — `[[x, y], ...]` 가변 배열(float 보존). */
export function serializePoints(points: readonly Point[]): number[][] {
  return points.map(([x, y]) => [x, y]);
}

/**
 * 폴리곤 전체를 `저장 현장 이미지 좌표계` 기준 (dx, dy)만큼 평행 이동한다
 * (전체 이동 드래그, REQ-ALIGN-018 ①). 형태(정점 간 상대 위치)는 그대로 유지된다.
 */
export function translatePolygon(points: readonly Point[], dx: number, dy: number): Point[] {
  return points.map(([x, y]) => [x + dx, y + dy] as Point);
}

/**
 * 지정한 인덱스의 정점만 새 `저장 현장 이미지 좌표계` 좌표로 교체한다
 * (정점별 조정 드래그, REQ-ALIGN-018 ②). 나머지 정점은 불변이다.
 */
export function moveVertex(points: readonly Point[], index: number, next: Point): Point[] {
  return points.map((p, i) => (i === index ? next : p));
}
