// 사건 창 정밀 대조 「함께 확대」(11/17 사용자 「확대 찍어서, 중지하고, 거기랑 옆에 신발 어느 부위를 같이 확대 클릭해서 비교」).
// 한쪽 그림에서 찍은 자리를 다른 쪽 그림의 「같은 상 · 중 · 하 위치 비율」 자리로 옮긴다. 보기용 — 좌표 계약(PatternCanvas)과 상관없다.
// 점은 모두 그림 비율(0~1, 그림 왼쪽 위 기준)이다.

import type { ZoneLines } from "./types"

/** 그림 비율 점 */
export interface RatioPoint {
  /** 가로 비율(0~1) */
  x: number
  /** 세로 비율(0~1) */
  y: number
}

/** 비율 점을 옮길 때 쓰는 한 그림의 크기와 구역 선(없으면 그림 전체 비율 그대로) */
export interface LinkFrame {
  /** 좌표계 폭(px) */
  width: number
  /** 좌표계 높이(px) */
  height: number
  /** 상 · 중 · 하 구역 선(그 그림 좌표계) */
  zones?: ZoneLines
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/** 꺾인 직선 보간 — from 눈금의 값 v 를 to 눈금으로(양 끝 밖은 끝 구간을 늘려서) */
function piecewise(v: number, from: readonly number[], to: readonly number[]): number {
  const last = from.length - 1
  let i = 0
  while (i < last - 1 && v > from[i + 1]) i += 1
  const span = from[i + 1] - from[i]
  const t = span === 0 ? 0 : (v - from[i]) / span
  return to[i] + t * (to[i + 1] - to[i])
}

/**
 * 한 그림의 비율 점 → 다른 그림의 대응 비율 점. 두 그림 모두 구역 선이 있으면
 * 세로는 「맨 위 · 상|중 · 중|하 · 맨 아래」 눈금 사이 비율을, 가로는 밑창 좌우 끝 사이 비율을 같게 맞춘다.
 * 구역 선이 없으면 그림 비율 그대로.
 */
export function linkPoint(p: RatioPoint, from: LinkFrame, to: LinkFrame): RatioPoint {
  if (!from.zones || !to.zones) return { x: clamp01(p.x), y: clamp01(p.y) }
  const f = from.zones
  const t = to.zones
  const fy = [f.top, f.bounds[0], f.bounds[1], f.bottom]
  const ty = [t.top, t.bounds[0], t.bounds[1], t.bottom]
  const px = p.x * from.width
  const py = p.y * from.height
  const x = piecewise(px, f.x, t.x)
  const y = piecewise(py, fy, ty)
  return { x: clamp01(x / to.width), y: clamp01(y / to.height) }
}

/**
 * 상자 안에서 본 자리(px) → 회전 · 확대 전 그림 비율 점.
 * 그림은 상자 가운데 기준으로 `rotate`도 돌고, 확대(z배, 기준점 origin 비율) 중이면 그 안에서 다시 키워져 있다.
 */
export function viewToRatio(
  px: number,
  py: number,
  box: { width: number; height: number },
  rotate: number,
  zoom?: { origin: RatioPoint; scale: number } | null,
): RatioPoint {
  const { width: w, height: h } = box
  if (w <= 0 || h <= 0) return { x: 0, y: 0 }
  // 회전 되돌리기(가운데 기준, px 로)
  const rad = (-rotate * Math.PI) / 180
  const dx = px - w / 2
  const dy = py - h / 2
  const ux = w / 2 + dx * Math.cos(rad) - dy * Math.sin(rad)
  const uy = h / 2 + dx * Math.sin(rad) + dy * Math.cos(rad)
  let x = ux / w
  let y = uy / h
  // 확대 되돌리기: 보인 자리 q = o + (r − o)·z → r = o + (q − o)/z
  if (zoom && zoom.scale > 0) {
    x = zoom.origin.x + (x - zoom.origin.x) / zoom.scale
    y = zoom.origin.y + (y - zoom.origin.y) / zoom.scale
  }
  return { x: clamp01(x), y: clamp01(y) }
}

/** 이름 기준 부위 문양 맞춤 — 두 목록에 다 있는 이름 */
export function sharedNames(a: readonly { name: string }[], b: readonly { name: string }[]): Set<string> {
  const names = new Set(b.map((p) => p.name))
  return new Set(a.filter((p) => names.has(p.name)).map((p) => p.name))
}
