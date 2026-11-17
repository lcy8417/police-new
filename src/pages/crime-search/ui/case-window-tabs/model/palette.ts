import { stripPatternPath } from "@/entities/pattern"
import { getPatternsPath } from "@/utils/get-patterns-path"
import type { PaletteKind } from "@/widgets/pattern-code"

// 문양 목록(팔레트) — 지금 앱 경로 규칙 그대로: `utils/get-patterns-path.js` 의 Vite `import.meta.glob`(종류 폴더별 번들).
// 지금 앱 `usePatternManager.patternsKindSelect` 는 단추 글자(textContent)로 종류를 읽어 같은 표를 쓴다 — 여기서는 종류 이름으로 바로 꺼낸다.

/** 위젯 종류 탭 순서(윤곽 = 폴더 `윤곽선`) */
export const PALETTE_KIND_ORDER: readonly PaletteKind[] = ["무늬", "선", "윤곽", "다각", "삼각", "사각", "원", "항목"]

type GlobModules = Record<string, { default?: string } | string | undefined>
const table = getPatternsPath as unknown as Partial<Record<PaletteKind, GlobModules>>

/** 그 종류 문양 그림 경로들(지금 앱 `filesLoad` 와 같은 값) */
export function paletteOf(kind: PaletteKind): string[] {
  const modules = table[kind]
  if (!modules) return []
  return Object.values(modules)
    .map((m) => (typeof m === "string" ? m : m?.default))
    .filter((p): p is string => typeof p === "string")
}

/** 종류별 문양 수 */
export function paletteCounts(): Record<PaletteKind, number> {
  return Object.fromEntries(PALETTE_KIND_ORDER.map((k) => [k, paletteOf(k).length])) as Record<PaletteKind, number>
}

let kindsCache: Record<string, PaletteKind> | null = null

/** 문양 이름 → 종류(팔레트 폴더). 가중치 규칙 R2 · 목록 표시용 — 앞 종류가 이긴다 */
export function patternKinds(): Readonly<Record<string, PaletteKind>> {
  if (kindsCache) return kindsCache
  const out: Record<string, PaletteKind> = {}
  for (const kind of PALETTE_KIND_ORDER) {
    for (const path of paletteOf(kind)) {
      const name = stripPatternPath(path)
      const key = typeof name === "string" ? name : name[0]
      if (!(key in out)) out[key] = kind
    }
  }
  kindsCache = out
  return out
}
