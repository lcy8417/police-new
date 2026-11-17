import { describe, expect, it } from "vitest"

import { stripPatternPath } from "@/entities/pattern"

import { PALETTE_KIND_ORDER, paletteOf, patternKinds } from "./palette"

// 빌드(운영)에서는 glob 값(default)이 `/assets/<이름>-<해시>.png` · `data:` 로 바뀌어
// 문양 이름에 해시가 붙었다(`n21_02-CSnegBcJ`). 팔레트는 늘 소스 경로를 돌려줘야 한다.
describe("paletteOf", () => {
  it("종류마다 소스 경로(/src/assets/Patterns/<폴더>/<이름>.png)를 돌려준다", () => {
    for (const kind of PALETTE_KIND_ORDER) {
      const paths = paletteOf(kind)
      expect(paths.length).toBeGreaterThan(0)
      for (const p of paths) expect(p).toMatch(/^\/src\/assets\/Patterns\/[^/]+\/[^/]+\.png$/)
    }
  })

  it("경로에서 뽑은 이름은 해시 없는 문양 이름이다", () => {
    const names = PALETTE_KIND_ORDER.flatMap((k) => paletteOf(k).map((p) => stripPatternPath(p) as string))
    // 문양 파일 이름은 영문 · 숫자 · `_` 만 — 빌드 해시(`-CSnegBcJ`)나 data: 글자가 섞이면 안 된다
    for (const n of names) expect(n).toMatch(/^[A-Za-z0-9_]+$/)
    expect(Object.keys(patternKinds())).toContain("n21_02")
  })
})
