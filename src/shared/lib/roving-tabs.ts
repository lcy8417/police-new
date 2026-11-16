import type * as React from "react"

// 탭 줄 키보드(WAI-ARIA 탭 패턴): 고른 탭만 Tab 순서에 들고(roving tabIndex), ← → · Home · End 로 옮긴다.
// UnderlineTabs(1회차 검수)와 같은 규칙을 다른 탭 줄(열린 사건 탭 · 문양 종류 탭 — 2회차 검수)이 같이 쓴다.

/** 누른 키로 옮겨 갈 탭 번호(처리하지 않는 키면 -1) */
export function rovingIndex(key: string, at: number, count: number): number {
  if (count === 0) return -1
  if (key === "ArrowRight") return (at + 1) % count
  if (key === "ArrowLeft") return (at - 1 + count) % count
  if (key === "Home") return 0
  if (key === "End") return count - 1
  return -1
}

/**
 * 탭 단추의 keydown — 옮겨 갈 탭이 있으면 기본 동작을 막고, 그 탭을 고른 뒤(onPick) 같은 tablist 의 그 탭으로 초점을 옮긴다.
 * 처리했으면 true
 */
export function handleRovingKey(event: React.KeyboardEvent<HTMLElement>, at: number, count: number, onPick: (index: number) => void): boolean {
  const to = rovingIndex(event.key, at, count)
  if (to < 0) return false
  event.preventDefault()
  onPick(to)
  const list = event.currentTarget.closest('[role="tablist"]')
  list?.querySelectorAll<HTMLElement>('[role="tab"]')[to]?.focus()
  return true
}
