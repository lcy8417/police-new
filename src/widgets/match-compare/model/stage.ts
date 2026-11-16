// 유류 | 발견 두 칸의 고정 배치(시안 S06: 유류 245 · 틈 10 · 발견 205 · 높이 340).
// 두 칸에 걸친 대응점 선을 한 SVG(viewBox = 이 배치)에 그리려면 칸 크기를 알아야 해서 고정한다.
export const STAGE = { crimeW: 245, gap: 10, shoeW: 205, h: 340 } as const
export const STAGE_W = STAGE.crimeW + STAGE.gap + STAGE.shoeW

/** 칸 안에 object-contain 으로 놓인 그림의 좌표 → 칸 좌표 */
export function containPoint(
  pane: { w: number; h: number },
  image: { width: number; height: number },
  x: number,
  y: number,
): [number, number] {
  const s = Math.min(pane.w / image.width, pane.h / image.height)
  const ox = (pane.w - image.width * s) / 2
  const oy = (pane.h - image.height * s) / 2
  return [ox + x * s, oy + y * s]
}

/** 칸 안 object-contain 배율 */
export function containScale(pane: { w: number; h: number }, image: { width: number; height: number }): number {
  return Math.min(pane.w / image.width, pane.h / image.height)
}

/** 현장(왼쪽 칸) 그림 좌표 → 무대 좌표 */
export function crimeToStage(image: { width: number; height: number }, x: number, y: number): [number, number] {
  return containPoint({ w: STAGE.crimeW, h: STAGE.h }, image, x, y)
}

/** 신발(오른쪽 칸) 그림 좌표 → 무대 좌표 */
export function shoeToStage(image: { width: number; height: number }, x: number, y: number): [number, number] {
  const [px, py] = containPoint({ w: STAGE.shoeW, h: STAGE.h }, image, x, y)
  return [STAGE.crimeW + STAGE.gap + px, py]
}
