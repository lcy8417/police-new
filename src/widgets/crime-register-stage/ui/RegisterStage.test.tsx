import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"

import { FEATURES, type SessionUser } from "@/entities/session"
import { useSessionStore } from "@/features/auth"
import { mswServer } from "@/test/msw-server"
import { TooltipProvider } from "@/shared/ui/tooltip"

import { RegisterStage } from "./RegisterStage"

const REGISTER_ONLY: SessionUser = {
  userId: "kim01",
  userNm: "김수사",
  userSe: "USER",
  features: [FEATURES.CRIME_REGISTER],
  passwordChangeRequired: false,
}

// jsdom에는 ResizeObserver가 없어 이미지 편집 오버레이 훅 마운트가 실패한다 — no-op 폴리필.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver =
  globalThis.ResizeObserver ?? (ResizeObserverStub as unknown as typeof ResizeObserver)

/** 파일을 고르면 먼저 가는 원본 올리기(POST /files/original) 기본 응답. 테스트마다 덮어쓸 수 있다. */
const ORIGINAL_FILE_ID = 42

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
beforeEach(() => {
  mswServer.use(
    http.post("*/files/original", () =>
      HttpResponse.json({ fileId: ORIGINAL_FILE_ID, sha256: "ab".repeat(32) })
    )
  )
})
afterEach(() => {
  mswServer.resetHandlers()
  useSessionStore.setState({ user: null, status: "loading" })
})
afterAll(() => mswServer.close())

function renderStage(onExit = vi.fn(), mutationCache?: MutationCache) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    mutationCache,
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
async function uploadImage(name = "scene.png") {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')
  if (!input) throw new Error("파일 입력칸이 없습니다")
  const file = new File(["fake-png"], name, { type: "image/png" })
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

  it("등록 후 사건 목록 새로고침은 사건 조회 권한이 있을 때만", async () => {
    let listCalls = 0
    mswServer.use(
      http.post("*/crime/register", () =>
        new HttpResponse(new Uint8Array([137, 80, 78, 71]), {
          headers: { "Content-Type": "image/png" },
        })
      ),
      http.get("*/crime/", () => {
        listCalls += 1
        return HttpResponse.json([])
      })
    )
    const submit = async () => {
      const { onExit } = renderStage()
      await uploadImage()
      fill("감정의뢰번호", "05019-24-0017")
      fill("감정물 순번", "5")
      fireEvent.click(screen.getByRole("button", { name: "저장" }))
      await waitFor(() => expect(onExit).toHaveBeenCalled())
    }

    // 사건 등록만 가진 사용자 → 목록을 부르지 않음(부르면 403)
    useSessionStore.getState().setUser({ ...REGISTER_ONLY })
    await submit()
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(listCalls).toBe(0)
    cleanup()

    // 사건 조회도 가진 사용자 → 목록 새로고침
    useSessionStore.getState().setUser({ ...REGISTER_ONLY, features: [FEATURES.CRIME_REGISTER, FEATURES.CRIME_SEARCH] })
    await submit()
    await waitFor(() => expect(listCalls).toBe(1))
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

const PNG_RESPONSE = () =>
  new HttpResponse(new Uint8Array([137, 80, 78, 71]), { headers: { "Content-Type": "image/png" } })

describe("RegisterStage — 원본 먼저 올리기(설계서 §5-E)", () => {
  it("파일을 고르는 순간 원본을 올리고, 등록 요청에 그 fileId를 originalFileId로", async () => {
    const calls: string[] = []
    let hasFileField = false
    let registerBody: Record<string, unknown> | undefined
    mswServer.use(
      http.post("*/files/original", async ({ request }) => {
        calls.push("original")
        hasFileField = (await request.formData()).has("file")
        return HttpResponse.json({ fileId: 42, sha256: "ab".repeat(32) })
      }),
      http.post("*/crime/register", async ({ request }) => {
        calls.push("register")
        registerBody = (await request.json()) as Record<string, unknown>
        return PNG_RESPONSE()
      })
    )
    const { onExit } = renderStage()

    await uploadImage("현장 원본.png")
    // 저장을 누르기 전에 이미 원본이 올라가 있다(multipart `file`).
    await waitFor(() => expect(calls).toEqual(["original"]))
    expect(hasFileField).toBe(true)

    fill("감정의뢰번호", "05019-24-0017")
    fill("감정물 순번", "5")
    fireEvent.click(screen.getByRole("button", { name: "저장" }))

    await waitFor(() => expect(onExit).toHaveBeenCalled())
    expect(calls).toEqual(["original", "register"])
    expect(registerBody?.originalFileId).toBe(42)
    expect(screen.queryByText("원본 보관 실패 — 작업본만 저장됩니다")).not.toBeInTheDocument()
  })

  it("원본이 아직 올라가는 중이면 끝날 때까지 기다렸다가 등록한다", async () => {
    let release: () => void = () => {}
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    let registerBody: Record<string, unknown> | undefined
    mswServer.use(
      http.post("*/files/original", async () => {
        await gate
        return HttpResponse.json({ fileId: 77, sha256: "ab".repeat(32) })
      }),
      http.post("*/crime/register", async ({ request }) => {
        registerBody = (await request.json()) as Record<string, unknown>
        return PNG_RESPONSE()
      })
    )
    const { onExit } = renderStage()

    await uploadImage()
    fill("감정의뢰번호", "05019-24-0017")
    fireEvent.click(screen.getByRole("button", { name: "저장" }))
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(registerBody).toBeUndefined()

    release()
    await waitFor(() => expect(onExit).toHaveBeenCalled())
    expect(registerBody?.originalFileId).toBe(77)
  })

  it("원본 올리기가 실패하면 안내를 화면 안에 남기고 등록은 originalFileId 없이 진행", async () => {
    let registerBody: Record<string, unknown> | undefined
    mswServer.use(
      http.post("*/files/original", () =>
        HttpResponse.json({ detail: "파일이 너무 큽니다(최대 50MB)" }, { status: 413 })
      ),
      http.post("*/crime/register", async ({ request }) => {
        registerBody = (await request.json()) as Record<string, unknown>
        return PNG_RESPONSE()
      })
    )
    const { onExit } = renderStage()

    await uploadImage()
    const notice = await screen.findByRole("status", { name: "원본 보관" })
    expect(notice).toHaveTextContent("원본 보관 실패 — 작업본만 저장됩니다")
    expect(notice).toHaveTextContent("파일이 너무 큽니다(최대 50MB)")

    fill("감정의뢰번호", "05019-24-0017")
    fireEvent.click(screen.getByRole("button", { name: "저장" }))

    await waitFor(() => expect(onExit).toHaveBeenCalled())
    expect(registerBody).toBeDefined()
    expect(registerBody).not.toHaveProperty("originalFileId")
  })

  it("다른 파일을 다시 고르면 앞 파일의 원본 번호는 보내지 않는다", async () => {
    let registerBody: Record<string, unknown> | undefined
    let originalCalls = 0
    mswServer.use(
      // 첫 파일은 늦게 성공, 다시 고른 파일은 바로 실패(요청 순서로 구분).
      http.post("*/files/original", async () => {
        originalCalls += 1
        if (originalCalls === 1) {
          await new Promise((resolve) => setTimeout(resolve, 60))
          return HttpResponse.json({ fileId: 1, sha256: "ab".repeat(32) })
        }
        return HttpResponse.json({ detail: "이미지 파일이 아닙니다" }, { status: 400 })
      }),
      http.post("*/crime/register", async ({ request }) => {
        registerBody = (await request.json()) as Record<string, unknown>
        return PNG_RESPONSE()
      })
    )
    const { onExit } = renderStage()

    await uploadImage("first.png")
    await uploadImage("second.png")
    expect(
      await screen.findByText("원본 보관 실패 — 작업본만 저장됩니다", { exact: false })
    ).toBeInTheDocument()
    await new Promise((resolve) => setTimeout(resolve, 100))

    fill("감정의뢰번호", "05019-24-0017")
    fireEvent.click(screen.getByRole("button", { name: "저장" }))

    await waitFor(() => expect(onExit).toHaveBeenCalled())
    expect(registerBody).not.toHaveProperty("originalFileId")
  })

  it("등록이 원본 번호를 거절(400)하면 원본 실패 안내로 바꾸고, 다시 저장은 원본 없이", async () => {
    const bodies: Record<string, unknown>[] = []
    mswServer.use(
      http.post("*/crime/register", async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>)
        if (bodies.length === 1) {
          return HttpResponse.json(
            { detail: "이미 다른 감정물에 연결된 원본 파일입니다" },
            { status: 400 }
          )
        }
        return PNG_RESPONSE()
      })
    )
    const { onExit } = renderStage()

    await uploadImage()
    fill("감정의뢰번호", "05019-24-0017")
    fireEvent.click(screen.getByRole("button", { name: "저장" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("이미 다른 감정물에 연결된 원본 파일입니다")
    expect(screen.getByRole("status", { name: "원본 보관" })).toHaveTextContent(
      "원본 보관 실패 — 작업본만 저장됩니다"
    )
    expect(bodies[0].originalFileId).toBe(ORIGINAL_FILE_ID)

    fireEvent.click(screen.getByRole("button", { name: "저장" }))
    await waitFor(() => expect(onExit).toHaveBeenCalled())
    expect(bodies[1]).not.toHaveProperty("originalFileId")
  })

  it.each([
    [403, "다른 관서의 의뢰입니다"],
    [403, "소속 관서가 지정되지 않아 등록할 수 없습니다"],
    [409, "SCAS 과거 사건 번호입니다"],
  ])("등록 %i 「%s」는 토스트가 아니라 등록 화면 안에", async (status, detail) => {
    const toastedMeta: unknown[] = []
    const cache = new MutationCache({
      onError: (_error, _variables, _context, mutation) => {
        if (mutation.meta?.inlineError !== true) toastedMeta.push(mutation.meta)
      },
    })
    mswServer.use(
      http.post("*/crime/register", () => HttpResponse.json({ detail }, { status })),
      // 403이면 공용 요청 함수가 권한 재확인 이벤트를 낸다(이 화면만 띄운 테스트에는 구독자가 없음).
      http.get("*/auth/me", () => HttpResponse.json({}, { status: 200 }))
    )
    const { onExit } = renderStage(vi.fn(), cache)

    await uploadImage()
    fill("감정의뢰번호", "05019-24-0017")
    fireEvent.click(screen.getByRole("button", { name: "저장" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(detail)
    expect(toastedMeta).toEqual([])
    expect(onExit).not.toHaveBeenCalled()
  })
})
