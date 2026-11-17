import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"

import { mswServer } from "@/test/msw-server"

import { fetchCodes, fetchPatternKinds } from "./code-api"

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())

describe("코드표 A7 · 문양 종류 사전 C4", () => {
  it("A7 응답 snake → camel", async () => {
    mswServer.use(
      http.get("*/codes/:group", ({ params }) => {
        expect(params.group).toBe("FT011")
        return HttpResponse.json([{ code: "FT011001", code_nm: "사진", upper_code: null }])
      }),
    )
    expect(await fetchCodes("FT011")).toEqual([{ code: "FT011001", codeNm: "사진", upperCode: null }])
  })

  it("C4 이름 키는 변환하지 않는다", async () => {
    mswServer.use(http.get("*/codes/pattern-kinds", () => HttpResponse.json({ n32_04: "선", s10a: "윤곽" })))
    expect(await fetchPatternKinds()).toEqual({ n32_04: "선", s10a: "윤곽" })
  })
})
