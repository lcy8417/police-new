import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"

import { mswServer } from "@/test/msw-server"

import {
  extractShoePatterns,
  normalizeShoeExtract,
  SHOE_EXTRACT_LINE_YS,
  SHOE_EXTRACT_RENDER_SIZE,
  shoeExtractImage,
} from "./extract-shoe-patterns"
import { approveShoe, saveShoePatterns } from "./shoe-duty-api"

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())

describe("신발 AI 문양 추출(C3 type=shoes)", () => {
  it("좌표 계약 — line_ys · render_size 는 정수, [1, H-1] 안, 오름차순", () => {
    const [w, h] = SHOE_EXTRACT_RENDER_SIZE
    const [y0, y1] = SHOE_EXTRACT_LINE_YS
    for (const v of [w, h, y0, y1]) expect(Number.isInteger(v)).toBe(true)
    expect(y0).toBeGreaterThanOrEqual(1)
    expect(y1).toBeLessThanOrEqual(h - 1)
    expect(y0).toBeLessThan(y1)
  })

  it("image — 새 그림(data URL)은 그대로, 서버 그림은 신발 ID 문자열(앞자리 0 보존)", () => {
    expect(shoeExtractImage("data:image/png;base64,AAAA", "00758")).toBe("data:image/png;base64,AAAA")
    expect(shoeExtractImage("/shoes_images/B/00758.png", "00758")).toBe("00758")
    expect(shoeExtractImage(null, "00758")).toBe("00758")
  })

  it("응답 정리 — 이름 · [이름, 점수] 둘 다 이름으로, 부위 안 중복 제거", () => {
    expect(normalizeShoeExtract({ top: ["s21b", ["s32l", 0.9], "s21b"], mid: [], bottom: [["n32_04", 0.7]] })).toEqual({
      top: ["s21b", "s32l"],
      mid: [],
      bottom: ["n32_04"],
      outline: [],
    })
    expect(normalizeShoeExtract(null)).toEqual({ top: [], mid: [], bottom: [], outline: [] })
  })

  it("POST /crime/shoes/patterns_extract 본문", async () => {
    let body: unknown = null
    mswServer.use(
      http.post("*/crime/shoes/patterns_extract", async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ top: ["s21b"], mid: [], bottom: [], outline: [] })
      }),
    )
    expect(await extractShoePatterns("00758")).toEqual({ top: ["s21b"], mid: [], bottom: [], outline: [] })
    expect(body).toEqual({ image: "00758", type: "shoes", line_ys: [340, 670], render_size: [1000, 1000] })
  })
})

describe("분업 쓰기(J6 · J7)", () => {
  it("문양 입력 = PUT /shoes/:id/patterns 이름 배열(신발 문양은 문자열)", async () => {
    let seen: { path: string; body: unknown } | null = null
    mswServer.use(
      http.put("*/shoes/:id/patterns", async ({ request, params }) => {
        seen = { path: String(params.id), body: await request.json() }
        return HttpResponse.json({ message: "ok" })
      }),
    )
    await saveShoePatterns("00758", { top: ["s21b"], mid: [], bottom: ["n32_04"], outline: [] })
    expect(seen).toEqual({ path: "00758", body: { top: ["s21b"], mid: [], bottom: ["n32_04"], outline: [] } })
  })

  it("승인 409 는 서버 문구를 ApiError.detail 로", async () => {
    mswServer.use(
      http.post("*/shoes/:id/approve", () => HttpResponse.json({ detail: "문양을 입력한 뒤 승인할 수 있습니다" }, { status: 409 })),
    )
    await expect(approveShoe("00758")).rejects.toMatchObject({ status: 409, detail: "문양을 입력한 뒤 승인할 수 있습니다" })
  })

  it("승인 성공 → camel", async () => {
    mswServer.use(
      http.post("*/shoes/:id/approve", () => HttpResponse.json({ approved: true, confm_de: "20261117", confmer_id: "kim01" })),
    )
    expect(await approveShoe("00758")).toEqual({ approved: true, confmDe: "20261117", confmerId: "kim01" })
  })
})
