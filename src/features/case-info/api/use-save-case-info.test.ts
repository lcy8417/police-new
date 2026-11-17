import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { http, HttpResponse } from "msw"

import { ApiError } from "@/shared/api"
import { mswServer } from "@/test/msw-server"

import { receiveRequest } from "./use-receive"
import { saveCaseInfo } from "./use-save-case-info"

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())

describe("saveCaseInfo — A3 → 바뀐 장마다 A8(순서대로, 실패하면 멈춤)", () => {
  it("사건 칸 → 장 칸 순서로 보내고 새 판 번호를 모은다(빈 변경은 건너뜀)", async () => {
    const calls: [string, unknown][] = []
    mswServer.use(
      http.put("*/requests/:id", async ({ request, params }) => {
        calls.push([`A3 ${params.id}`, await request.json()])
        return HttpResponse.json({ row_version: 5 })
      }),
      http.put("*/crime/:no/info", async ({ request, params }) => {
        calls.push([`A8 ${params.no}`, await request.json()])
        return HttpResponse.json({ row_version: 2 })
      })
    )
    const out = await saveCaseInfo({
      rqestId: 41,
      request: { rowVersion: 4, changes: { docNo: "D-1", rm: null } },
      images: [
        { aprthngNo: "N_1", rowVersion: 1, changes: { pickPlace: "현관" } },
        { aprthngNo: "N_2", rowVersion: 1, changes: {} },
      ],
    })
    expect(calls).toEqual([
      ["A3 41", { rowVersion: 4, docNo: "D-1", rm: null }],
      ["A8 N_1", { rowVersion: 1, pickPlace: "현관" }],
    ])
    expect(out).toEqual({ requestRowVersion: 5, imageRowVersions: { N_1: 2 } })
  })

  it("409면 그 자리에서 멈추고 서버 문구를 ApiError 로", async () => {
    let a8 = 0
    mswServer.use(
      http.put("*/requests/:id", () => HttpResponse.json({ detail: "다른 사람이 먼저 고쳤습니다" }, { status: 409 })),
      http.put("*/crime/:no/info", () => {
        a8 += 1
        return HttpResponse.json({ row_version: 2 })
      })
    )
    const err = await saveCaseInfo({
      rqestId: 41,
      request: { rowVersion: 1, changes: { docNo: "x" } },
      images: [{ aprthngNo: "N_1", rowVersion: 1, changes: { pickPlace: "y" } }],
    }).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).detail).toBe("다른 사람이 먼저 고쳤습니다")
    expect(a8).toBe(0)
  })
})

describe("receiveRequest — A4", () => {
  it("POST /requests/{id}/receive", async () => {
    mswServer.use(http.post("*/requests/:id/receive", () => HttpResponse.json({ rqest_sttus: "RECEIVED", row_version: 2 })))
    expect(await receiveRequest(41)).toEqual({ rqestSttus: "RECEIVED", rowVersion: 2 })
  })
})
