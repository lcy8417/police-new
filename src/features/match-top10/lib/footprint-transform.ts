/**
 * [CORRECTION 3b] 정렬 폴리곤 크롭 + 좌우 반전을 반영한 족적(현장) 표시 좌표 순수
 * 함수 모음. `overlay-geometry.ts`(원본↔표시 스케일)와 짝을 이루는 sibling —
 * 이 파일은 "원본 픽셀 좌표계 안에서" 크롭 오프셋 차감·미러링·Shoerinsics↔RGB
 * 좌표 정규화를 담당하고, 최종 표시 스케일은 여전히 `overlay-geometry.ts`의
 * `scaleBoxToDisplay`가 맡는다(두 변환은 합성해서 쓴다: crop/normalize → scale).
 *
 * DOM 접근 없는 순수 함수로 격리해 vitest 경계값으로 검증한다(overlay-geometry.ts와
 * 동일 관례 — 표시 이미지가 좌표 산출에 쓰인 이미지와 다른 순간 오버레이가 조용히
 * 어긋나는 지뢰이므로).
 */

import type { NaturalSize } from "./overlay-geometry"

/** 원본 픽셀 좌표계의 축정렬 사각 영역(crop 오프셋 + 크기). */
export interface PixelRect {
  left: number
  top: number
  width: number
  height: number
}

/**
 * 정렬 폴리곤(정점 배열, `저장 현장 이미지 좌표계`)의 축정렬 경계상자를 구한다.
 * 빈 배열이면 0크기 사각형을 반환해(크래시 대신) 호출부가 "크롭 없음"으로 안전하게
 * 폴백할 수 있게 한다.
 */
export function boundingBoxOfPolygon(
  points: readonly (readonly [number, number])[]
): PixelRect {
  if (points.length === 0) return { left: 0, top: 0, width: 0, height: 0 }

  let minX = points[0][0]
  let maxX = points[0][0]
  let minY = points[0][1]
  let maxY = points[0][1]
  for (const [x, y] of points) {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  return { left: minX, top: minY, width: maxX - minX, height: maxY - minY }
}

/**
 * 원본 픽셀 좌표점(현장측 대응점 `fx,fy` 등)을 크롭된 이미지의 로컬 좌표로
 * 환산한다 — 먼저 크롭 원점(left/top)을 빼고, `flipHorizontal`이면 크롭 폭
 * 기준으로 x를 미러링한다(y는 불변). 오버레이 박스가 크롭+미러된 표시 이미지
 * 위에서도 원래 문양 위에 정확히 앉으려면 이 변환을 거쳐야 한다.
 */
export function applySceneCropTransform(
  point: readonly [number, number],
  crop: Pick<PixelRect, "left" | "top" | "width">,
  flipHorizontal: boolean
): [number, number] {
  const localX = point[0] - crop.left
  const localY = point[1] - crop.top
  const x = flipHorizontal ? crop.width - localX : localX
  return [x, localY]
}

/** 중심점 + 한 변 크기(정사각)를 크롭 영역(left/top/width/height)으로 환산한다. */
export function centerToCropRegion(
  center: readonly [number, number],
  size: number
): PixelRect {
  return { left: center[0] - size / 2, top: center[1] - size / 2, width: size, height: size }
}

/**
 * [CORRECTION 3b] Shoerinsics 좌표계(`sx,sy`가 정의된 공간)의 점을 대상 표시
 * 이미지(RGB `shoes_images/B` 등)의 원본 픽셀 좌표계로 정규화한다 — 상대
 * 0..1 좌표로 만든 뒤 대상 크기를 곱한다. `source === target`이면 항등 변환이라
 * 스케치/이진 모드(표시 이미지가 곧 Shoerinsics)에서 별도 분기 없이 같은
 * 코드 경로가 그대로 통한다.
 */
export function normalizeShoePoint(
  point: readonly [number, number],
  source: NaturalSize,
  target: NaturalSize
): [number, number] {
  const rx = source.width > 0 ? target.width / source.width : 0
  const ry = source.height > 0 ? target.height / source.height : 0
  return [point[0] * rx, point[1] * ry]
}

/**
 * 박스 한 변(size, Shoerinsics 픽셀 기준)을 대상 이미지 축척으로 정규화한다.
 * 폭 축 비율을 대표값으로 쓴다 — Shoerinsics·B 두 이미지의 가로/세로 비율 차이가
 * 무시할 만큼 작다는 실측(0.05%)에 기반한다(정확한 종횡비 불일치가 있는 신발이
 * 나오면 이 가정을 재검증해야 한다).
 */
export function normalizeShoeBoxSize(
  size: number,
  source: NaturalSize,
  target: NaturalSize
): number {
  return source.width > 0 ? size * (target.width / source.width) : 0
}

/**
 * 신발측 박스 한 변을 "밑창 대비 현장측과 같은 비율"이 되도록 환산한다.
 *
 * 백엔드 계약(REQ-MATCH-005)은 현장측 박스 96px만 정의한다 — `box_image`가 실제로 그
 * 크기로 잘린 영역이다. 신발측 박스는 백엔드가 주지 않는 프런트 장식인데, 같은 96을
 * 그대로 쓰면 두 좌표계의 축척이 달라 밑창을 덮는 비율이 어긋난다(실측: 현장 ROI
 * 386.5px 기준 24.8% vs Shoerinsics 300px 기준 32.0% — 1.29배).
 *
 * 두 이미지는 같은 밑창을 다른 해상도로 담으므로, 기준 폭의 비율만큼 곱해 상대 크기를
 * 맞춘다. 기준 폭을 아직 모르면(측정 전) 원래 크기를 그대로 돌려 기존 동작을 유지한다.
 */
export function soleParityBoxSize(
  sceneBoxSize: number,
  shoeWidth: number,
  sceneRefWidth: number
): number {
  if (!(shoeWidth > 0) || !(sceneRefWidth > 0)) return sceneBoxSize
  return sceneBoxSize * (shoeWidth / sceneRefWidth)
}
