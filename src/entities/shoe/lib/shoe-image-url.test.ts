import { describe, expect, it } from "vitest"

import { shoeImageUrl } from "./shoe-image-url"

const BASE = import.meta.env.VITE_API_URL ?? ""

describe("shoeImageUrl", () => {
  it("keeps leading zero", () => {
    expect(shoeImageUrl("00758", "S")).toBe(`${BASE}/shoes_images/S/00758.png`)
    expect(shoeImageUrl("00758", "S").endsWith("/shoes_images/S/00758.png")).toBe(true)
  })

  it("B·Shoerinsics 폴더를 고른다", () => {
    expect(shoeImageUrl("00758", "B")).toBe(`${BASE}/shoes_images/B/00758.png`)
    expect(shoeImageUrl("00758", "Shoerinsics")).toBe(
      `${BASE}/shoes_images/Shoerinsics/00758.png`
    )
  })

  it("ftwrId를 encodeURIComponent로 감싼다", () => {
    expect(shoeImageUrl("a/b", "B")).toBe(`${BASE}/shoes_images/B/a%2Fb.png`)
  })
})
