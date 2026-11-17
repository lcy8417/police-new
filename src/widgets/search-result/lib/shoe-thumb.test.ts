import { describe, expect, it } from "vitest"

import { shoeThumbUrl } from "./shoe-thumb"

describe("shoeThumbUrl — 신발 원본(B) 주소 → 썸네일 주소", () => {
  it("B 폴더 PNG 만 /shoes_thumbs/<ID>.webp 로(앞의 서버 주소는 그대로)", () => {
    expect(shoeThumbUrl("/shoes_images/B/00758.png")).toBe("/shoes_thumbs/00758.webp")
    expect(shoeThumbUrl("https://srv:8000/shoes_images/B/00758.png")).toBe("https://srv:8000/shoes_thumbs/00758.webp")
    expect(shoeThumbUrl("/shoes_images/B/A.1%20x.png")).toBe("/shoes_thumbs/A.1%20x.webp") // ID 의 . · 인코딩 그대로
  })

  it("이진(Shoerinsics) · 측면 · 다른 그림은 null(원본 그대로)", () => {
    expect(shoeThumbUrl("/shoes_images/Shoerinsics/00758.png")).toBeNull()
    expect(shoeThumbUrl("/shoes_images/S/00758.png")).toBeNull()
    expect(shoeThumbUrl("/crime_images/x.png")).toBeNull()
    expect(shoeThumbUrl("data:image/png;base64,AAAA")).toBeNull()
    expect(shoeThumbUrl("/shoes_images/B/00758.png?v=2")).toBeNull()
  })
})
