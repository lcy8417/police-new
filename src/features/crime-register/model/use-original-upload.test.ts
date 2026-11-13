import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { delay, http, HttpResponse } from "msw"

import { mswServer } from "@/test/msw-server"

import { useOriginalUpload } from "./use-original-upload"

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())

interface Plan {
  fileId?: number
  status?: number
  detail?: string
  /** true면 60ms 늦게 끝난다. */
  slow?: boolean
}

/**
 * 원본 올리기 처리기 — 요청이 들어온 순서대로 `plans`를 하나씩 쓴다. (테스트 환경의 FormData 변환이
 * 파일 이름을 지워 서버 쪽에서는 이름으로 구분할 수 없다.)
 */
function originalHandler(...plans: Plan[]) {
  let index = 0
  return http.post("*/files/original", async () => {
    const plan = plans[index++]
    if (plan.slow) await delay(60)
    if (plan.status) return HttpResponse.json({ detail: plan.detail }, { status: plan.status })
    return HttpResponse.json({ fileId: plan.fileId, sha256: "ab".repeat(32) })
  })
}

const png = (name: string) => new File(["bytes"], name, { type: "image/png" })

describe("useOriginalUpload — 고른 파일을 원본으로 먼저 올리기", () => {
  it("성공하면 fileId를 돌려준다", async () => {
    mswServer.use(originalHandler({ fileId: 7 }))
    const { result } = renderHook(() => useOriginalUpload())

    act(() => result.current.start(png("a.png")))
    expect(result.current.state.status).toBe("uploading")

    await waitFor(() => expect(result.current.state).toEqual({ status: "done", fileId: 7 }))
    await expect(result.current.resolveFileId()).resolves.toBe(7)
  })

  it("올리는 중에 묻으면 끝날 때까지 기다렸다가 fileId", async () => {
    mswServer.use(originalHandler({ fileId: 7, slow: true }))
    const { result } = renderHook(() => useOriginalUpload())

    act(() => result.current.start(png("a.png")))
    let resolved: number | null | undefined
    await act(async () => {
      resolved = await result.current.resolveFileId()
    })

    expect(resolved).toBe(7)
  })

  it("실패하면 서버 detail을 남기고 fileId는 null", async () => {
    mswServer.use(originalHandler({ status: 413, detail: "파일이 너무 큽니다(최대 50MB)" }))
    const { result } = renderHook(() => useOriginalUpload())

    act(() => result.current.start(png("big.png")))

    await waitFor(() =>
      expect(result.current.state).toEqual({ status: "failed", detail: "파일이 너무 큽니다(최대 50MB)" })
    )
    await expect(result.current.resolveFileId()).resolves.toBeNull()
  })

  it("다른 파일을 고르면 늦게 끝난 앞 파일의 번호가 이기지 않는다", async () => {
    mswServer.use(originalHandler({ fileId: 1, slow: true }, { fileId: 2 }))
    const { result } = renderHook(() => useOriginalUpload())

    act(() => result.current.start(png("first.png")))
    act(() => result.current.start(png("second.png")))

    await waitFor(() => expect(result.current.state).toEqual({ status: "done", fileId: 2 }))
    // 앞 파일 응답(60ms 뒤)이 도착한 뒤에도 그대로 2.
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(result.current.state).toEqual({ status: "done", fileId: 2 })
    await expect(result.current.resolveFileId()).resolves.toBe(2)
  })

  it("다시 고른 파일이 실패하면 앞 파일이 늦게 성공해도 fileId는 null", async () => {
    mswServer.use(
      originalHandler({ fileId: 1, slow: true }, { status: 400, detail: "이미지 파일이 아닙니다" })
    )
    const { result } = renderHook(() => useOriginalUpload())

    act(() => result.current.start(png("first.png")))
    act(() => result.current.start(png("second.png")))

    await waitFor(() => expect(result.current.state.status).toBe("failed"))
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(result.current.state).toEqual({ status: "failed", detail: "이미지 파일이 아닙니다" })
    await expect(result.current.resolveFileId()).resolves.toBeNull()
  })

  it("등록이 그 원본을 거절하면(400) 실패로 바꾸고 다음 등록은 원본 없이", async () => {
    mswServer.use(originalHandler({ fileId: 7 }))
    const { result } = renderHook(() => useOriginalUpload())

    act(() => result.current.start(png("a.png")))
    await waitFor(() => expect(result.current.state.status).toBe("done"))

    act(() => result.current.reject(7, "이미 다른 감정물에 연결된 원본 파일입니다"))

    expect(result.current.state).toEqual({
      status: "failed",
      detail: "이미 다른 감정물에 연결된 원본 파일입니다",
    })
    await expect(result.current.resolveFileId()).resolves.toBeNull()
  })

  it("reset하면 진행 중이던 결과도 버린다", async () => {
    mswServer.use(originalHandler({ fileId: 7, slow: true }))
    const { result } = renderHook(() => useOriginalUpload())

    act(() => result.current.start(png("a.png")))
    act(() => result.current.reset())

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(result.current.state).toEqual({ status: "idle" })
    await expect(result.current.resolveFileId()).resolves.toBeNull()
  })
})
