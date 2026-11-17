import { http, HttpResponse } from "msw"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"

import { fetchEditHistory } from "@/entities/crime/api/edit-history-api"
import { ApiError } from "@/shared/api"
import { mswServer } from "@/test/msw-server"

import { revertEdit, saveEditStep } from "./use-save-edit"

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())

describe("편집 이력 API(B3 · B4 · B5)", () => {
  it("B3 응답을 camelCase 로", async () => {
    mswServer.use(
      http.get("*/crime/N-1_1/edits", () =>
        HttpResponse.json({
          original: { file_id: 3, sha256: "a".repeat(64), width: 10, height: 8 },
          working_file_id: 4,
          current_file_id: 9,
          legacy: false,
          items: [
            {
              edit_id: 1, ops: [{ op: "revert", toEditId: 0 }], src_file_id: 4, result_file_id: 9, sha256: "b".repeat(64),
              width: 10, height: 8, actor_id: "u1", actor_nm: "감정관", occurred_dt: "2026-11-17T14:03:05+09:00", revert_of: 0,
            },
          ],
        })
      )
    )
    const h = await fetchEditHistory("N-1_1")
    expect(h.original).toEqual({ fileId: 3, sha256: "a".repeat(64), width: 10, height: 8 })
    expect(h.currentFileId).toBe(9)
    expect(h.items[0]).toMatchObject({ editId: 1, resultFileId: 9, revertOf: 0, ops: [{ op: "revert", toEditId: 0 }] })
  })

  it("B4 본문 = srcFileId · 접두어 없는 이미지 · ops", async () => {
    let body: unknown = null
    mswServer.use(
      http.post("*/crime/N-1_1/edits", async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({
          edit_id: 7, src_file_id: 4, result_file_id: 11, sha256: "c".repeat(64), width: 1, height: 1, superseded_exam_id: null,
        })
      })
    )
    const res = await saveEditStep("N-1_1", { srcFileId: null, image: "data:image/png;base64,QUJD", ops: [{ op: "crop" }] })
    expect(body).toEqual({ srcFileId: null, image: "QUJD", ops: [{ op: "crop" }] })
    expect(res).toMatchObject({ editId: 7, resultFileId: 11, supersededExamId: null })
  })

  it("그새 다른 편집 409 는 서버 문구 그대로 ApiError", async () => {
    mswServer.use(
      http.post("*/crime/N-1_1/edits/revert", () => HttpResponse.json({ detail: "다른 사람이 먼저 고쳤습니다" }, { status: 409 }))
    )
    const err = await revertEdit("N-1_1", { srcFileId: 4, toEditId: 0 }).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).status).toBe(409)
    expect((err as ApiError).message).toBe("다른 사람이 먼저 고쳤습니다")
  })
})
