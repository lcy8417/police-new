import { describe, expect, it } from "vitest"
import { partAttrs } from "./part-attrs"

describe("partAttrs", () => {
  it("값이 있는 키만 data-part-* 로 낸다", () => {
    expect(partAttrs("Button", { variant: "pri", id: "S01-03" })).toEqual({
      "data-part": "Button",
      "data-part-variant": "pri",
      "data-part-id": "S01-03",
    })
  })

  it("옵션이 없으면 data-part 만 낸다", () => {
    expect(partAttrs("Card")).toEqual({ "data-part": "Card" })
  })

  it("state 도 값이 있으면 낸다", () => {
    expect(partAttrs("Tab", { state: "on" })).toEqual({
      "data-part": "Tab",
      "data-part-state": "on",
    })
  })
})
