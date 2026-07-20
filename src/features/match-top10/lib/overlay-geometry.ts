/**
 * SPEC-MATCH-TOP10-001 대응 뷰어 오버레이의 좌표 스케일 순수 함수.
 *
 * 서버는 대응점을 각자의 **원본 픽셀 좌표계**로 준다 — `fx,fy`는
 * `저장 현장 이미지 좌표계`(`static/crime_images/<crime_number>.png`), `sx,sy`는
 * `신발 이진 이미지 좌표계`(`static/shoes_images/Shoerinsics/<model_number>.png`,
 * REQ-MATCH-002 신발측). 두 좌표계는 해상도가 다른 별개 공간이며 화면에서는
 * 두 이미지를 임의 크기로 표시하므로, 표시 좌표 = 원본좌표 × (표시크기/원본크기)로
 * 스케일해야 박스가 대응점 위에 정확히 앉는다. DOM 접근 없는 순수 함수로 격리해
 * vitest 경계값으로 검증한다(문양추출 좌표 계약·`crime-search/lib/match-geometry.ts`와
 * 동급 지뢰 — 표시 이미지가 좌표 산출에 쓰인 이미지와 다른 순간 오버레이가
 * 조용히 어긋난다).
 */

/** 이미지의 원본(자연) 픽셀 크기. */
export interface NaturalSize {
  width: number
  height: number
}

/** 이미지가 화면에 실제로 렌더된 크기(px). */
export interface DisplaySize {
  width: number
  height: number
}

/** 표시 좌표계의 사각 영역(left/top/width/height, px). */
export interface DisplayRect {
  left: number
  top: number
  width: number
  height: number
}

/** 원본 크기 대비 표시 크기의 x/y 배율. 원본 크기가 0이면(미측정) 0을 반환해 NaN/Infinity를 막는다. */
function scaleFactors(natural: NaturalSize, display: DisplaySize): [number, number] {
  const sx = natural.width > 0 ? display.width / natural.width : 0
  const sy = natural.height > 0 ? display.height / natural.height : 0
  return [sx, sy]
}

/** 원본 픽셀 좌표점(`[x, y]`)을 표시 좌표로 스케일한다. */
export function scalePointToDisplay(
  point: readonly [number, number],
  natural: NaturalSize,
  display: DisplaySize
): [number, number] {
  const [sx, sy] = scaleFactors(natural, display)
  return [point[0] * sx, point[1] * sy]
}

/**
 * 대응점을 중심으로 한 고정 크기 정사각 박스를 표시 좌표(left/top/width/height)로
 * 환산한다. 신발측 좌표(`sx,sy`)는 백엔드가 박스를 별도로 주지 않으므로(REQ-MATCH-005는
 * 현장측 `box:{cx,cy,size}`만 계약), 두 화면에 같은 시각 언어를 쓰기 위해 현장측과
 * 동일한 `boxSize`(계약값 96, `box.size`를 그대로 전달)를 신발측 오버레이에도
 * 적용한다 — 프런트 전용 장식 오버레이이며 백엔드 크롭 영역 자체와는 무관하다.
 */
export function scaleBoxToDisplay(
  center: readonly [number, number],
  boxSize: number,
  natural: NaturalSize,
  display: DisplaySize
): DisplayRect {
  const [sx, sy] = scaleFactors(natural, display)
  const [cx, cy] = scalePointToDisplay(center, natural, display)
  const width = boxSize * sx
  const height = boxSize * sy
  return { left: cx - width / 2, top: cy - height / 2, width, height }
}
