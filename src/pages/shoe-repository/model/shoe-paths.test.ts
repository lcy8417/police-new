import { describe, expect, it } from "vitest"

import {
  shoeEditModePath,
  shoeEditPath,
  shoeRegisterNewPath,
  shoeRepositoryPath,
} from "./shoe-paths"

describe("shoe-paths", () => {
  it("keeps leading zero", () => {
    expect(shoeRepositoryPath("00758")).toBe("/shoesRepository/00758")
    expect(shoeEditModePath("00758")).toBe("/shoesRepository/00758?mode=edit")
    expect(shoeEditPath("00758")).toBe("/shoesEdit/00758")
  })

  it("ftwrId가 없으면 목록 루트로 간다", () => {
    expect(shoeRepositoryPath()).toBe("/shoesRepository")
    expect(shoeRepositoryPath("")).toBe("/shoesRepository")
  })

  it("ftwrId를 encodeURIComponent로 감싼다", () => {
    expect(shoeRepositoryPath("a/b")).toBe("/shoesRepository/a%2Fb")
    expect(shoeEditModePath("a#b")).toBe("/shoesRepository/a%23b?mode=edit")
  })

  it("신규 등록 경로는 고정이다", () => {
    expect(shoeRegisterNewPath()).toBe("/shoesRepository?mode=new")
  })
})
