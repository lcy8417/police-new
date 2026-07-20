/**
 * 밑창 형상 템플릿 폴리곤 생성(REQ-ALIGN-017, v0.6.0 CHANGE 3).
 *
 * 정렬 대상은 항상 신발 밑창이므로, 빈 캔버스에서 처음부터 클릭해 그리게 하는
 * 대신 밑창 형상에 가까운 폴리곤을 현장 이미지 위에 기본으로 오버레이한다.
 * 사용자는 이 템플릿을 드래그로 맞춰 나간다(전체 이동 + 정점별 조정, REQ-ALIGN-018).
 *
 * 정확한 형상·정점 수·초기 배치 수식은 HOW이므로(spec.md §F) 여기서 확정한다 —
 * 12개 정점의 대칭 다각형으로 앞굽(뾰족)→볼(가장 넓음)→아치(좁아짐)→뒤꿈치(둥근
 * 바닥)를 흉내낸다. 저장되는 것은 최종 폴리곤 좌표뿐이므로(템플릿 기원은 기록하지
 * 않음) 이 형상 자체가 계약값은 아니다 — 합리적 기본값일 뿐이다.
 */
import { MIN_POLYGON_POINTS, type Point } from "./alignment-geometry";

/**
 * 밑창 실루엣의 정규화 정점(중심 기준 상대 좌표, x∈[-1,1] · y∈[-1,1]).
 * y는 위(-1, 앞굽/toe)에서 아래(+1, 뒤꿈치/heel)로 증가한다 — 이미지 좌표계와 동일한 방향.
 * 12점이며 MIN_POLYGON_POINTS(3) 계약을 처음부터 만족한다.
 */
const NORMALIZED_SOLE_OUTLINE: readonly Point[] = [
  [0, -1.0], // 앞굽 끝
  [0.55, -0.85], // 앞굽 어깨(우)
  [0.72, -0.55], // 볼(우) — 가장 넓은 지점
  [0.62, -0.15], // 아치(우)
  [0.68, 0.25], // 뒤꿈치 어깨(우)
  [0.45, 0.75], // 뒤꿈치 하단(우)
  [0, 1.0], // 뒤꿈치 바닥
  [-0.45, 0.75], // 뒤꿈치 하단(좌)
  [-0.68, 0.25], // 뒤꿈치 어깨(좌)
  [-0.62, -0.15], // 아치(좌)
  [-0.72, -0.55], // 볼(좌)
  [-0.55, -0.85], // 앞굽 어깨(좌)
];

/** 밑창 폭이 차지하는 현장 이미지 폭의 비율(합리적 기본값 — 계약값 아님). */
const SOLE_HALF_WIDTH_RATIO = 0.18;
/** 밑창 길이(앞굽→뒤꿈치)가 차지하는 현장 이미지 높이의 비율. */
const SOLE_HALF_HEIGHT_RATIO = 0.33;

/**
 * 현장 이미지(`저장 현장 이미지 좌표계`) 중앙에, 이미지 크기에 비례한 밑창 모양
 * 템플릿 폴리곤을 생성한다(REQ-ALIGN-017). 항상 {@link MIN_POLYGON_POINTS} 이상의
 * 정점을 반환하며, 모든 좌표가 (0..naturalWidth, 0..naturalHeight) 범위 안에 있다.
 */
export function createSoleTemplatePolygon(
  naturalWidth: number,
  naturalHeight: number
): Point[] {
  const cx = naturalWidth / 2;
  const cy = naturalHeight / 2;
  const halfW = naturalWidth * SOLE_HALF_WIDTH_RATIO;
  const halfH = naturalHeight * SOLE_HALF_HEIGHT_RATIO;

  return NORMALIZED_SOLE_OUTLINE.map(([rx, ry]) => {
    const x = clamp(cx + rx * halfW, 0, naturalWidth);
    const y = clamp(cy + ry * halfH, 0, naturalHeight);
    return [x, y] as Point;
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export { MIN_POLYGON_POINTS };
