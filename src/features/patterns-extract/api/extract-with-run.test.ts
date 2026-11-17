import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"

import { mswServer } from "@/test/msw-server"

import { extractCrimeWithRun, extractShoeWithRun, ExtractError } from "./extract-with-run"
import { savePatterns } from "./use-save-patterns"

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())

describe("extract-with-run — C3 본문은 옛 모양, 실행 번호는 헤더", () => {
  it("현장: 배열 본문 그대로 + X-AI-Run-Id, 경계선 좌표는 보내지 않는다", async () => {
    let body: Record<string, unknown> | undefined
    mswServer.use(
      http.post("*/crime/:no/patterns_extract", async ({ request, params }) => {
        expect(params.no).toBe("05019-24-0017_1")
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json([{ code: "n32_04", score: 0.93 }], { headers: { "X-AI-Run-Id": "41" } })
      }),
    )
    const res = await extractCrimeWithRun("05019-24-0017_1", "05019-24-0017_1")
    expect(res).toEqual({ extracted: [{ code: "n32_04", score: 0.93 }], runId: 41 })
    expect(body).toEqual({ image: "05019-24-0017_1", type: "crime" })
  })

  it("헤더가 없으면(옛 서버) 실행 번호 null", async () => {
    mswServer.use(http.post("*/crime/:no/patterns_extract", () => HttpResponse.json([])))
    expect((await extractCrimeWithRun("A_1", "data:image/png;base64,AAAA")).runId).toBeNull()
  })

  it("신발: 4부위 본문 + 정수 좌표를 그대로", async () => {
    let body: Record<string, unknown> | undefined
    mswServer.use(
      http.post("*/crime/:no/patterns_extract", async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ top: [["s21b", 0.9]], mid: [], bottom: [], outline: [] }, { headers: { "X-AI-Run-Id": "7" } })
      }),
    )
    const res = await extractShoeWithRun("00758", "00758", { line_ys: [10, 20], render_size: [100, 200] })
    expect(res.runId).toBe(7)
    expect(res.zones.top).toEqual([["s21b", 0.9]])
    expect(body).toEqual({ image: "00758", type: "shoes", line_ys: [10, 20], render_size: [100, 200] })
  })

  it("실패는 ExtractError(상태 코드)", async () => {
    mswServer.use(http.post("*/crime/:no/patterns_extract", () => new HttpResponse(null, { status: 409 })))
    await expect(extractCrimeWithRun("A_1", "A_1")).rejects.toBeInstanceOf(ExtractError)
  })
})

describe("savePatterns — C2 확장 본문 · 판 번호", () => {
  it("PUT /crime/{no} 에 이름 튜플 · meta · soleText · rowVersion 을 싣고 row_version 을 읽는다", async () => {
    let body: Record<string, unknown> | undefined
    mswServer.use(
      http.put("*/crime/:no", async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ message: "ok", row_version: 5 })
      }),
    )
    const res = await savePatterns("A_1", {
      top: [["n32_04", 1]],
      mid: [],
      bottom: [],
      outline: [],
      extracted_raw: null,
      meta: { top: { n32_04: { status: "ai", confidence: 0.93, weight: null, manual: false, sortOrdr: 0 } } },
      soleText: "NIKE",
      rowVersion: 4,
    })
    expect(res).toEqual({ message: "ok", rowVersion: 5 })
    expect(body).toMatchObject({ top: [["n32_04", 1]], rowVersion: 4, soleText: "NIKE" })
  })

  it("409 는 ApiError(서버 문구)", async () => {
    mswServer.use(http.put("*/crime/:no", () => HttpResponse.json({ detail: "다른 사람이 먼저 고쳤습니다" }, { status: 409 })))
    await expect(
      savePatterns("A_1", { top: [], mid: [], bottom: [], outline: [], extracted_raw: null, meta: {}, soleText: null, rowVersion: 1 }),
    ).rejects.toMatchObject({ status: 409, detail: "다른 사람이 먼저 고쳤습니다" })
  })
})
