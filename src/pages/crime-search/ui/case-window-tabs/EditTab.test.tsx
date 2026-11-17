import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"

import type { Crime } from "@/entities/crime"
import { mswServer } from "@/test/msw-server"

import { EditTab } from "./EditTab"

// jsdom 에는 ResizeObserver 가 없다(편집 캔버스)
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver ?? (ResizeObserverStub as unknown as typeof ResizeObserver)

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())

const NO = "05019-24-0017_2"
const VIEWER = { isAdmin: false, features: ["CRIME_SEARCH", "CRIME_REGISTER"] as const }
const IMAGE: Crime = {
  aprthngNo: NO,
  apprslReqestNo: "05019-24-0017",
  image: "data:image/png;base64,SCENE",
  top: [],
  mid: [],
  bottom: [],
  outline: [],
} as Crime

const item = (edit_id: number, result_file_id: number, ops: unknown[], revert_of: number | null = null) => ({
  edit_id, ops, src_file_id: 4, result_file_id, sha256: "b".repeat(64), width: 10, height: 8,
  actor_id: "u1", actor_nm: "감정관", occurred_dt: "2026-11-17T14:03:05+09:00", revert_of,
})

function renderTab() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
      <div className="h-[800px]">
        <EditTab viewer={VIEWER} image={IMAGE} onCancel={vi.fn()} />
      </div>
    </QueryClientProvider>
  )
}

describe("EditTab — 편집 이력(B3) · 되돌리기(B5)", () => {
  it("이력을 읽는 동안 불러오는 중, 실패하면 확인 못 함", async () => {
    mswServer.use(http.get("*/crime/:no/edits", () => HttpResponse.json({ detail: "x" }, { status: 503 })))
    renderTab()
    expect(screen.getByText("이미지를 불러오는 중…")).toBeInTheDocument()
    expect(await screen.findByText("편집할 이미지를 불러오지 못했습니다.")).toBeInTheDocument()
  })

  it("단계마다 서버 그림 · 원본 해시를 보이고, 여기까지 되돌리기는 B5(새 줄)", async () => {
    let revertBody: unknown = null
    mswServer.use(
      http.get("*/crime/:no/edits", () =>
        HttpResponse.json({
          original: { file_id: 3, sha256: "9f3a71c0" + "0".repeat(48) + "4be2c21e", width: 10, height: 8 },
          working_file_id: 4,
          current_file_id: 9,
          legacy: false,
          items: [item(1, 8, [{ op: "threshold" }]), item(2, 9, [{ op: "crop" }])],
        })
      ),
      http.post("*/crime/:no/edits/revert", async ({ request }) => {
        revertBody = await request.json()
        return HttpResponse.json({ edit_id: 3, src_file_id: 9, result_file_id: 8, sha256: "b".repeat(64), superseded_exam_id: null })
      }),
      http.get("*/files/:id", () => new HttpResponse(new Uint8Array([137, 80, 78, 71]), { headers: { "Content-Type": "image/png" } }))
    )
    renderTab()
    expect(await screen.findByRole("region", { name: "편집 이력" })).toBeInTheDocument()
    expect(screen.getByText("9f3a 71c0 … 4be2 c21e")).toBeInTheDocument()
    const first = screen.getByRole("button", { name: "1단계 이진화 미리보기" })
    expect(first.querySelector("img")?.getAttribute("src")).toBe("/files/8")
    expect(screen.getByRole("button", { name: "2단계 자르기 미리보기" })).toBeInTheDocument()

    // 머리 「되돌리기」 = 바로 앞 줄(1단계)로
    fireEvent.click(screen.getByRole("button", { name: "되돌리기" }))
    await waitFor(() => expect(revertBody).toEqual({ srcFileId: 9, toEditId: 1 }))
  })

  it("옛 감정물(원본 · 작업본 없음)은 「원본 없음」, 되돌릴 것 없음", async () => {
    mswServer.use(
      http.get("*/crime/:no/edits", () =>
        HttpResponse.json({ original: null, working_file_id: null, current_file_id: null, legacy: true, items: [] })
      )
    )
    renderTab()
    expect(await screen.findByText(/원본 없음/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "되돌리기" })).toBeDisabled()
    expect(screen.getByAltText(`${NO} 편집 이미지`)).toHaveAttribute("src", "data:image/png;base64,SCENE")
  })
})
