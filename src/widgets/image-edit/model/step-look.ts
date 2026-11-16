import { cn } from "@/shared/lib/utils"

import type { ImageEditHistoryEntry } from "./types"

/**
 * 편집 이력 n 단계까지 한 일로 만든 가짜 모습(진열 — 실제로는 서버가 단계별 그림을 준다). 받은 원본 그림에 거는 고정 클래스만 돌려준다.
 * 회전(좌로면 -4°) · 자르기(1.22배) · 좌우반전 · 이진화(흑백 · 대비). 0 = 받은 원본 그대로.
 */
export function stepLook(history: readonly ImageEditHistoryEntry[], upTo: number): string {
  const done = history.filter((h) => h.no <= upTo).map((h) => h.label)
  const rotLeft = done.some((l) => l.includes("좌로") && l.includes("회전"))
  const rot = rotLeft || done.some((l) => l.includes("회전") || l.includes("기울기"))
  const crop = done.some((l) => l.includes("자르기"))
  const flip = done.some((l) => l.includes("좌우반전"))
  const bin = done.some((l) => l.includes("이진화"))
  return cn(
    rot && (rotLeft ? "-rotate-[4deg]" : "rotate-[4deg]"),
    crop && flip ? "-scale-x-[1.22] scale-y-[1.22]" : crop ? "scale-[1.22]" : flip ? "-scale-x-100" : "",
    bin && "grayscale contrast-200"
  )
}
