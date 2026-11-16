import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { VIEWER_FIXTURE_RENDERS } from "./fixtures-viewer"
import { VIEWER_FIXTURES } from "./fixtures-viewer-meta"

describe("viewer 진열", () => {
  it("데이터와 그리기의 id 집합이 같다", () => {
    expect(Object.keys(VIEWER_FIXTURE_RENDERS).sort()).toEqual(VIEWER_FIXTURES.map((f) => f.id).sort())
  })

  it.each(VIEWER_FIXTURES)("$id 는 부품 루트에 id · 이름 · 변형이 붙는다", (f) => {
    const { container } = render(<div>{VIEWER_FIXTURE_RENDERS[f.id]()}</div>)
    const el = container.querySelector(`[data-part-id="${f.id}"]`)
    expect(el).not.toBeNull()
    expect(el).toHaveAttribute("data-part", f.part)
    if (f.variant) expect(el).toHaveAttribute("data-part-variant", f.variant)
  })
})
