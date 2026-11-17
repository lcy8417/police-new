import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"

import { FEATURES, type FeatureCode, type SessionUser } from "@/entities/session"
import { useSessionStore } from "@/features/auth"
import { mswServer } from "@/test/msw-server"

import { ShoeDbPanelContainer } from "./ShoeDbPanelContainer"

// 신발 DB 패널 실제 페이지 — 서버 J1 · J2 · J3 · J6 · J7 · J8 · C3 을 MSW 로(묶음 ④)

const user = (features: FeatureCode[]): SessionUser => ({
  userId: "kim01",
  userNm: "김신발",
  userSe: "USER",
  features: [FEATURES.SHOE_VIEW, ...features],
  passwordChangeRequired: false,
})

const dto = (ftwrId: string, extra: Record<string, unknown> = {}) => ({
  ftwr_id: ftwrId,
  modl_nm: "운동화",
  brand_code: "B0038",
  makr_code: null,
  colct_place: null,
  colct_year: "2026",
  ftwr_group_id: null,
  ftwr_group_nm: null,
  sexdstn_se: null,
  swing_se: null,
  ftwr_size: null,
  image: `/shoes_images/B/${ftwrId}.png`,
  top: [],
  mid: [],
  bottom: [],
  outline: [],
  regist_org_nm: "가 경찰서",
  frst_regist_dt: "2026-11-17T09:00:00+09:00",
  approved: false,
  confm_de: null,
  work_status: ["문양 대기"],
  in_search_index: false,
  ...extra,
})

const STAGES = {
  stages: [
    { key: "pattern", count: 4 },
    { key: "group", count: 1 },
    { key: "approve", count: 2 },
    { key: "approved", count: 9 },
  ],
  backlog: { month: "2026-11", total: 3, parts: [{ key: "pattern", count: 2 }, { key: "group", count: 0 }, { key: "approve", count: 1 }] },
  today_approved: 5,
}

let listQueries: string[] = []
let shoes: Record<string, ReturnType<typeof dto>> = {}

function renderPanel(props: Partial<{ ftwrId: string | null; isNew: boolean }> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const handlers = { onOpenShoe: vi.fn(), onNewShoe: vi.fn(), onBackToList: vi.fn() }
  render(
    <QueryClientProvider client={client}>
      <ShoeDbPanelContainer ftwrId={props.ftwrId ?? null} isNew={props.isNew ?? false} {...handlers} />
    </QueryClientProvider>,
  )
  return handlers
}

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    (query: string) => ({ matches: false, media: query, addEventListener: () => {}, removeEventListener: () => {} }) as unknown as MediaQueryList,
  )
  listQueries = []
  shoes = {
    "00758": dto("00758"),
    "00901": dto("00901", { top: ["s21b"], work_status: ["승인 대기"], in_search_index: true }),
  }
  mswServer.use(
    http.get("*/shoes/", ({ request }) => {
      listQueries.push(new URL(request.url).search)
      return HttpResponse.json(Object.values(shoes))
    }),
    http.get("*/shoes/count", () => HttpResponse.json({ count: Object.keys(shoes).length })),
    http.get("*/shoes/stages", () => HttpResponse.json(STAGES)),
    http.get("*/shoes/:id", ({ params }) => {
      const s = shoes[String(params.id)]
      return s ? HttpResponse.json(s) : HttpResponse.json({ detail: "해당 신발 정보가 없습니다." }, { status: 404 })
    }),
  )
})
afterEach(() => {
  vi.unstubAllGlobals()
  mswServer.resetHandlers()
  useSessionStore.setState({ user: null, status: "loading" })
})
afterAll(() => mswServer.close())

describe("신발 DB 패널 — 목록(J1 · J2 · J8)", () => {
  it("실제 목록 · 카드 작업 상태 · 작업 단계 줄(오늘 승인 n/50)", async () => {
    useSessionStore.getState().setUser(user([]))
    renderPanel()
    expect(await screen.findByText("00758")).toBeInTheDocument()
    expect(screen.getAllByText("문양 대기").length).toBeGreaterThan(0)
    const stageLine = await screen.findByRole("list", { name: "작업 단계" })
    expect(stageLine).toHaveTextContent("승인 대기2")
    expect(stageLine).toHaveTextContent("오늘 승인5/50")
    // 보기 권한만 — 등록 단추 없음
    expect(screen.queryByRole("button", { name: "등록" })).toBeNull()
  })

  it("작업 단계 칩 → 서버 거르기 stage(하나만)", async () => {
    useSessionStore.getState().setUser(user([]))
    renderPanel()
    await screen.findByText("00758")
    fireEvent.click(await screen.findByRole("button", { name: /승인 대기/ }))
    await waitFor(() => expect(listQueries.at(-1)).toBe("?page=0&stage=approve"))
  })

  it("상세 조건 「조회」 → 승인 · 문양 입력 거르기를 서버로", async () => {
    useSessionStore.getState().setUser(user([]))
    renderPanel()
    await screen.findByText("00758")
    fireEvent.click(screen.getByRole("button", { name: /필터/ }))
    fireEvent.click(screen.getByRole("radio", { name: "미승인" }))
    fireEvent.click(screen.getByRole("radio", { name: "미입력" }))
    fireEvent.click(screen.getByRole("button", { name: "조회" }))
    await waitFor(() => expect(listQueries.at(-1)).toBe("?page=0&approval=no&pattern_input=out"))
  })
})

describe("신발 DB 패널 — 편집 판 분업(J3 · J6 · J7 · C3)", () => {
  it("문양 입력 담당: AI 추출 → 저장 = J6(문양만), 기본정보 · 그림 · 승인은 없다", async () => {
    useSessionStore.getState().setUser(user([FEATURES.SHOE_PATTERN]))
    let saved: unknown = null
    mswServer.use(
      http.post("*/crime/shoes/patterns_extract", () => HttpResponse.json({ top: ["s21b"], mid: [["s32l", 0.8]], bottom: [], outline: ["s10h"] })),
      http.put("*/shoes/:id/patterns", async ({ request }) => {
        saved = await request.json()
        return HttpResponse.json({ message: "ok" })
      }),
    )
    renderPanel({ ftwrId: "00758" })
    await screen.findByRole("region", { name: "신발 00758 편집" })
    expect(screen.getByText("검색 후보 아님(배치 반영 전)")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "승인" })).toBeNull()
    expect(screen.queryByRole("button", { name: "이미지 교체" })).toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "AI 문양 추출" }))
    expect(await screen.findByText("AI 제안 2")).toBeInTheDocument() // 윤곽은 AI 제안에 넣지 않는다
    fireEvent.click(screen.getByRole("button", { name: "저장" }))
    await waitFor(() => expect(saved).toEqual({ top: ["s21b"], mid: ["s32l"], bottom: [], outline: [] }))
  })

  it("승인 담당: 문양 있는 신발 승인 = J7, 문양 없으면 꺼짐", async () => {
    useSessionStore.getState().setUser(user([FEATURES.SHOE_APPROVE]))
    const approved: string[] = []
    mswServer.use(
      http.post("*/shoes/:id/approve", ({ params }) => {
        approved.push(String(params.id))
        return HttpResponse.json({ approved: true, confm_de: "20261117", confmer_id: "kim01" })
      }),
    )
    renderPanel({ ftwrId: "00901" })
    await screen.findByRole("region", { name: "신발 00901 편집" })
    const approve = screen.getByRole("button", { name: "승인" })
    expect(approve).toBeEnabled()
    expect(screen.queryByRole("button", { name: "저장" })).toBeNull()
    fireEvent.click(approve)
    await waitFor(() => expect(approved).toEqual(["00901"]))
  })

  it("승인 담당 — 문양 없는 신발은 승인 꺼짐", async () => {
    useSessionStore.getState().setUser(user([FEATURES.SHOE_APPROVE]))
    renderPanel({ ftwrId: "00758" })
    await screen.findByRole("region", { name: "신발 00758 편집" })
    expect(screen.getByRole("button", { name: "승인" })).toBeDisabled()
  })

  it("승인된 신발: 「승인됨 · 문양 잠김」, 문양 입력 · AI 추출 꺼짐", async () => {
    shoes["00901"] = dto("00901", { top: ["s21b"], approved: true, confm_de: "20261117", work_status: [] })
    useSessionStore.getState().setUser(user([FEATURES.SHOE_EDIT, FEATURES.SHOE_APPROVE]))
    renderPanel({ ftwrId: "00901" })
    await screen.findByRole("region", { name: "신발 00901 편집" })
    expect(screen.getByText("승인됨 · 문양 잠김")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "AI 문양 추출" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "승인" })).toBeDisabled()
    // 등록 담당은 기본정보는 고칠 수 있다(서버 J5 — 문양이 같으면 통과)
    expect(screen.getByRole("button", { name: "저장" })).toBeInTheDocument()
  })

  it("저장 실패(409) 문구를 편집 판에 그대로", async () => {
    useSessionStore.getState().setUser(user([FEATURES.SHOE_PATTERN]))
    mswServer.use(
      http.post("*/crime/shoes/patterns_extract", () => HttpResponse.json({ top: ["s21b"], mid: [], bottom: [], outline: [] })),
      http.put("*/shoes/:id/patterns", () => HttpResponse.json({ detail: "승인된 신발의 문양은 고칠 수 없습니다" }, { status: 409 })),
    )
    renderPanel({ ftwrId: "00758" })
    await screen.findByRole("region", { name: "신발 00758 편집" })
    fireEvent.click(screen.getByRole("button", { name: "AI 문양 추출" }))
    await screen.findByText("AI 제안 1")
    fireEvent.click(screen.getByRole("button", { name: "저장" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("승인된 신발의 문양은 고칠 수 없습니다")
  })

  it("새 등록: 그림 없이 저장하면 화면이 먼저 막는다", async () => {
    useSessionStore.getState().setUser(user([FEATURES.SHOE_EDIT]))
    renderPanel({ isNew: true })
    await screen.findByRole("region", { name: "신발 등록" })
    fireEvent.change(screen.getByRole("textbox", { name: "신발ID" }), { target: { value: "N0001" } })
    fireEvent.click(screen.getByRole("button", { name: "저장" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("바닥 그림을 등록하세요")
  })
})
