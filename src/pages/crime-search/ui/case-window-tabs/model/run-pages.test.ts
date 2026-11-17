import { describe, expect, it } from "vitest"

import { runPagesState } from "./run-pages"

const page = (n: number, total: number | null) => ({ items: Array.from({ length: n }, (_, i) => i), total })

describe("runPagesState — 이력 결과 쪽(D4)의 전체 수 · 더 받기", () => {
  it("받은 쪽이 꽉 차면 서버 전체 수 그대로 · 더 받을 수 있음", () => {
    expect(runPagesState([page(50, 250), page(50, 250)])).toEqual({ total: 250, exhausted: false })
  })

  it("[검수] 201위 이후 다시 계산에서 빈 쪽이 오면(그새 필수 통과 후보가 줄어듦) 받은 줄 수가 전체 — 더 받기 멈춤", () => {
    expect(runPagesState([page(50, 250), page(50, 250), page(50, 250), page(50, 250), page(0, 250)])).toEqual({
      total: 200,
      exhausted: true,
    })
  })

  it("아직 못 받은 쪽은 무시 · 첫 쪽 전 · 옛 이력(null)", () => {
    expect(runPagesState([page(50, 250), undefined])).toEqual({ total: 250, exhausted: false })
    expect(runPagesState([undefined])).toEqual({ total: 0, exhausted: false })
    expect(runPagesState([page(0, null)])).toEqual({ total: 0, exhausted: false })
  })
})
