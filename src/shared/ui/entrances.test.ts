// @vitest-environment node
import { ESLint } from "eslint"
import { describe, expect, it } from "vitest"

const eslint = new ESLint({ cwd: process.cwd() })

const IMPORT_RULE = "no-restricted-imports"
const SYNTAX_RULE = "no-restricted-syntax"

async function lint(code: string, filePath: string, ruleId: string) {
  const [result] = await eslint.lintText(code, { filePath })
  return result.messages.filter((m) => m.ruleId === ruleId)
}

describe("부품 출입구 가져오기 검사", () => {
  it("기존 화면의 루트 출입구 가져오기는 경고", async () => {
    const msgs = await lint(
      'import { Button } from "@/shared/ui"\nexport const a = Button\n',
      "src/features/x/ui/A.tsx",
      IMPORT_RULE,
    )
    expect(msgs.map((m) => m.severity)).toEqual([1])
  })

  it("진열 화면은 오류", async () => {
    const msgs = await lint(
      'import { Button } from "@/shared/ui"\nexport const a = Button\n',
      "src/pages/dev/parts/A.tsx",
      IMPORT_RULE,
    )
    expect(msgs.map((m) => m.severity)).toEqual([2])
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

  it("전환 완료 파일의 날것 button 금지", async () => {
    const msgs = await lint(
      "export const A = () => <button>x</button>\n",
      "src/pages/dev/parts/A.tsx",
      SYNTAX_RULE,
    )
    expect(msgs.map((m) => m.severity)).toEqual([2])
    expect(msgs[0].message).toContain("@/shared/ui/kit")
  })

  it("전환 전 파일의 날것 button 은 검사하지 않는다", async () => {
    const msgs = await lint(
      "export const A = () => <button>x</button>\n",
      "src/features/x/ui/A.tsx",
      SYNTAX_RULE,
    )
    expect(msgs).toHaveLength(0)
  })
})
