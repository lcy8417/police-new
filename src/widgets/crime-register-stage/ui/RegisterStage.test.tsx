import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"

import { mswServer } from "@/test/msw-server"
import { TooltipProvider } from "@/shared/ui/tooltip"

import { RegisterStage } from "./RegisterStage"

// jsdom에는 ResizeObserver가 없어 이미지 편집 오버레이 훅 마운트가 실패한다 — no-op 폴리필.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver =
  globalThis.ResizeObserver ?? (ResizeObserverStub as unknown as typeof ResizeObserver)

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())

function renderStage(onExit = vi.fn()) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={qc}>
      <TooltipProvider>
        <RegisterStage onExit={onExit} />
      </TooltipProvider>
    </QueryClientProvider>
  )
  return { onExit }
}

/** 증거 이미지를 업로드한다 — jsdom에서는 resize가 실패해 원본 data URL이 그대로 들어간다. */
async function uploadImage() {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')
  if (!input) throw new Error("파일 입력칸이 없습니다")
  const file = new File(["fake-png"], "scene.png", { type: "image/png" })
  fireEvent.change(input, { target: { files: [file] } })
  await waitFor(() => expect(screen.getAllByRole("img").length).toBeGreaterThan(0))
}

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

describe("RegisterStage", () => {
  it("sends aprthngNo", async () => {
    let captured: Record<string, unknown> | undefined
    mswServer.use(
      http.post("*/crime/register", async ({ request }) => {
        captured = (await request.json()) as Record<string, unknown>
        return new HttpResponse(new Uint8Array([137, 80, 78, 71]), {
          headers: { "Content-Type": "image/png" },
        })
      }),
      // 등록 성공 후 store refetch(GET /crime)
      http.get("*/crime", () => HttpResponse.json([]))
    )
    const { onExit } = renderStage()

    await uploadImage()
    fill("감정의뢰번호", "05019-24-0017")
    fill("감정물 순번", "5")
    fill("채취 일시", "2024-01-29 05:31")
    fill("채취 장소", "서울 종로구")
    fill("채취 방법 코드", "FT001")
    fill("사건명", "절도")
    fill("의뢰관서", "서울청")

    // 조합된 감정물 번호 미리보기
    expect(screen.getByText("05019-24-0017_5")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "저장" }))

    await waitFor(() => expect(onExit).toHaveBeenCalled())
    expect(captured).toMatchObject({
      aprthngNo: "05019-24-0017_5",
      apprslReqestNo: "05019-24-0017",
      pickDt: "2024-01-29 05:31",
      pickPlace: "서울 종로구",
      pickMthCode: "FT001",
      crimeNm: "절도",
      rqestGrfcNm: "서울청",
    })
    expect(typeof captured?.image).toBe("string")
    expect(String(captured?.image)).not.toMatch(/^data:/)
  })

  it("shows server detail", async () => {
    mswServer.use(
      http.post("*/crime/register", () =>
        HttpResponse.json({ detail: "이미 등록된 번호입니다" }, { status: 409 })
      )
    )
    const { onExit } = renderStage()

    await uploadImage()
    fill("감정의뢰번호", "05019-24-0017")
    fill("감정물 순번", "5")
    fireEvent.click(screen.getByRole("button", { name: "저장" }))

    expect(await screen.findByText("이미 등록된 번호입니다")).toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveTextContent("이미 등록된 번호입니다")
    expect(onExit).not.toHaveBeenCalled()
  })

  it("검증 실패면 서버로 보내지 않고 한국어 메시지를 보인다", async () => {
    let called = false
    mswServer.use(
      http.post("*/crime/register", () => {
        called = true
        return HttpResponse.json({})
      })
    )
    renderStage()

    await uploadImage()
    fill("감정의뢰번호", "05019/24")
    fireEvent.click(screen.getByRole("button", { name: "저장" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "번호는 영문·숫자·-·_만 쓸 수 있습니다"
    )
    expect(called).toBe(false)
  })

  it("이미지가 없으면 이미지 안내를 보인다", async () => {
    renderStage()
    fill("감정의뢰번호", "05019-24-0017")
    fireEvent.click(screen.getByRole("button", { name: "저장" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("현장 이미지를 등록하세요")
  })

  it("입력칸에 설계서 최대 길이를 건다", () => {
    renderStage()
    expect(screen.getByLabelText("감정의뢰번호")).toHaveAttribute("maxLength", "20")
    expect(screen.getByLabelText("채취 장소")).toHaveAttribute("maxLength", "200")
    expect(screen.getByLabelText("채취 방법 코드")).toHaveAttribute("maxLength", "8")
    expect(screen.getByLabelText("사건명")).toHaveAttribute("maxLength", "300")
    expect(screen.getByLabelText("의뢰관서")).toHaveAttribute("maxLength", "300")
    expect(screen.getByLabelText("감정물 순번")).toHaveValue("1")
    expect(screen.getByLabelText("채취 일시")).toHaveAttribute("placeholder", "YYYY-MM-DD HH:mm")
  })
})
