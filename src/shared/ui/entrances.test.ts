// @vitest-environment node
import { ESLint } from "eslint"
import { describe, expect, it } from "vitest"

import { createConfig } from "../../../eslint.config.js"

const eslint = new ESLint({ cwd: process.cwd() })

const IMPORT_RULE = "no-restricted-imports"
const SYNTAX_RULE = "no-restricted-syntax"

// 실제 목록에 있는 기존 파일(scripts/ui/ui-legacy.txt — d6987ae 시점 파일).
const LEGACY_FILE = "src/features/auth/ui/AuthFields.tsx"
// 목록에 없는 새 파일.
const NEW_FILE = "src/features/x/ui/A.tsx"

async function lint(code: string, filePath: string, ruleId: string, engine: ESLint = eslint) {
  const [result] = await engine.lintText(code, { filePath })
  return result.messages.filter((m) => m.ruleId === ruleId)
}

const ROOT_IMPORT = 'import { Button } from "@/shared/ui"\nexport const a = Button\n'

describe("부품 출입구 가져오기 검사", () => {
  it("기존 화면(레거시 목록)의 루트 출입구 가져오기는 경고", async () => {
    const msgs = await lint(ROOT_IMPORT, LEGACY_FILE, IMPORT_RULE)
    expect(msgs.map((m) => m.severity)).toEqual([1])
  })

  it("레거시 목록에 없는 새 파일은 오류", async () => {
    const msgs = await lint(ROOT_IMPORT, NEW_FILE, IMPORT_RULE)
    expect(msgs.map((m) => m.severity)).toEqual([2])
  })

  it("진열 화면은 오류", async () => {
    const msgs = await lint(ROOT_IMPORT, "src/pages/dev/parts/A.tsx", IMPORT_RULE)
    expect(msgs.map((m) => m.severity)).toEqual([2])
  })

  it("전환 완료 목록에 오른 레거시 파일은 오류(전환이 이긴다)", async () => {
    // 실제 목록을 바꾸지 않고 같은 설정 함수에 목록만 넣어 본다.
    const engine = new ESLint({
      cwd: process.cwd(),
      overrideConfigFile: true,
      overrideConfig: createConfig({ legacyFiles: [LEGACY_FILE], convertedGlobs: [LEGACY_FILE] }),
    })
    const imports = await lint(ROOT_IMPORT, LEGACY_FILE, IMPORT_RULE, engine)
    expect(imports.map((m) => m.severity)).toEqual([2])
    const raw = await lint("export const A = () => <button>x</button>\n", LEGACY_FILE, SYNTAX_RULE, engine)
    expect(raw.map((m) => m.severity)).toEqual([2])
  })

  it("출입구 안쪽 파일 가져오기 금지", async () => {
    const msgs = await lint(
      'import { Button } from "@/shared/ui/kit/Button"\nexport const a = Button\n',
      "src/pages/dev/parts/A.tsx",
      IMPORT_RULE,
    )
    expect(msgs.map((m) => m.severity)).toEqual([2])
  })

  it("출입구 가져오기는 통과", async () => {
    const msgs = await lint(
      'import { Button } from "@/shared/ui/kit"\nexport const a = Button\n',
      "src/pages/dev/parts/A.tsx",
      IMPORT_RULE,
    )
    expect(msgs).toHaveLength(0)
  })

  it("shadcn button · input 가져오기는 「경로만 바꾸지 말 것」 안내 한 줄(같은 등급)", async () => {
    for (const mod of ["@/shared/ui/button", "@/shared/ui/input"]) {
      const code = `import * as M from "${mod}"\nexport const a = M\n`
      const legacy = await lint(code, LEGACY_FILE, IMPORT_RULE)
      expect(legacy.map((m) => m.severity), mod).toEqual([1])
      expect(legacy[0].message, mod).toContain("경로만 바꾸지 말고 화면을 옮길 때 교체")
      const fresh = await lint(code, NEW_FILE, IMPORT_RULE)
      expect(fresh.map((m) => m.severity), mod).toEqual([2])
      expect(fresh[0].message, mod).toContain("kit의 Button/Field는 다른 부품입니다")
    }
  })

  it("전환 완료 파일의 날것 button 금지", async () => {
    const msgs = await lint(
      "export const A = () => <button>x</button>\n",
      "src/pages/dev/parts/A.tsx",
      SYNTAX_RULE,
    )
    expect(msgs.map((m) => m.severity)).toEqual([2])
    expect(msgs[0].message).toContain("@/shared/ui/kit")
  })

  it("전환 완료 목록 밖 파일의 날것 button 은 검사하지 않는다", async () => {
    const msgs = await lint("export const A = () => <button>x</button>\n", NEW_FILE, SYNTAX_RULE)
    expect(msgs).toHaveLength(0)
  })
})
