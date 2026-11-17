import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"

import { FEATURES, type SessionUser } from "@/entities/session"
import { useSessionStore } from "@/features/auth"
import { mswServer } from "@/test/msw-server"
import { ScasAppShell } from "@/widgets/app-shell"

import { CasesPage } from "./CasesPage"

// 탭 본문은 계약 값만 확인한다 — 실제 탭 본문의 API 호출은 CaseWindowTabBody 테스트 몫
vi.mock("./case-window-tab-body", () => ({
  CaseWindowTabBody: (props: {
    aprthngNo: string
    imageNo: string | null
    tab: string
    onSelectImage: (no: string) => void
    onOpenImageTab: (no: string, tab: "search" | "compare" | "edit") => void
  }) => (
    <div data-testid="tab-body">
      {props.aprthngNo}|{props.imageNo}|{props.tab}
      <button type="button" onClick={() => props.onSelectImage("05019-24-0017_2")}>
        둘째 장 고르기
      </button>
      <button type="button" onClick={() => props.onOpenImageTab("05019-24-0017_2", "compare")}>
        둘째 장 정밀 대조 열기
      </button>
    </div>
  ),
}))

const analyst: SessionUser = {
  userId: "kim01",
  userNm: "김감정",
  userSe: "USER",
  features: [FEATURES.CRIME_SEARCH, FEATURES.SHOE_VIEW, FEATURES.EXAM_DECIDE, FEATURES.CRIME_REGISTER],
  roles: ["EXAMINER"],
  passwordChangeRequired: false,
}

const listItem = (no: string, rqestId: number, extra: Record<string, unknown> = {}) => ({
  rqest_id: rqestId,
  apprsl_reqest_no: no,
  rqest_round: 1,
  data_src_se: "APP",
  rqest_sttus: "IN_EXAM",
  crime_nm: "주거침입",
  rqest_org_id: 7,
  rqest_org_nm: "종로경찰서",
  frst_regist_dt: "2026-11-12T10:00:00+09:00",
  aprthng_cnt: 2,
  scas_case_no: null,
  doc_no: null,
  suspect_exst_at: null,
  flow_stage: 2,
  thumb_url: `/crime_images/${no}_1.png`,
  image_cnt: { shoe: 2, tire: 0 },
  progress: { registered: 1, searched: 1, confirmed: 0 },
  results: { found: 0, not_found: 0, unable: 0 },
  cross_reviewer_nm: null,
  ...extra,
})

// 서버 순서 = 최근 등록 먼저. 0021 은 접수 대기(REQUESTED)
const ITEMS = [
  listItem("05019-24-0017", 41),
  listItem("05019-24-0021", 42, { crime_nm: "절도", rqest_sttus: "REQUESTED", flow_stage: 0, rqest_org_nm: "중부경찰서" }),
]

const detailImage = (no: string, n: number) => ({
  aprthng_no: `${no}_${n}`,
  apprsl_reqest_no: no,
  pick_dt: null,
  pick_place: null,
  pick_mth_code: null,
  ftwr_tire_se: null,
  no: n,
  kind: "shoe",
  aprthng_sttus: "REGISTERED",
  img_sttus: "등록",
  thumb_url: null,
  working_file_id: null,
  has_original: false,
  row_version: 1,
})

const detail = (rqestId: number, no: string, crimeNm: string) => ({
  rqest_id: rqestId,
  data_src_se: "APP",
  apprsl_reqest_no: no,
  rqest_sttus: "IN_EXAM",
  crime_nm: crimeNm,
  rqest_org_nm: "종로경찰서",
  frst_regist_dt: "2026-11-12T10:00:00+09:00",
  row_version: 1,
  flow_stage: 2,
  flow: [
    { name: "접수", state: "done" },
    { name: "1차 작업", state: "done" },
    { name: "검색·판정", state: "now" },
    { name: "교차 검증", state: "todo" },
    { name: "감정서", state: "todo" },
  ],
  images: [detailImage(no, 1), detailImage(no, 2)],
  cross_review: null,
  report: null,
  info_blanks: 0,
})

const SHOES = [
  { ftwr_id: "00758", modl_nm: "크록스", brand_code: "B0038", makr_code: null, colct_year: "2019", image: "/shoes_images/B/00758.png", top: ["s21b"], mid: [], bottom: [], outline: [] },
]

function LocationProbe() {
  const { pathname, search } = useLocation()
  return <div data-testid="location">{`${pathname}${search}`}</div>
}

function renderAt(path = "/cases") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<ScasAppShell />}>
            <Route path="/cases" element={<CasesPage />} />
          </Route>
        </Routes>
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const location = () => new URL(`http://x${screen.getByTestId("location").textContent ?? ""}`)

/** 받은 A1 요청 주소(거르기 확인) · 옛 전체 목록 요청 수 */
let listUrls: string[] = []
let crimeListCalls = 0

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({ matches: false, media: query, addEventListener: () => {}, removeEventListener: () => {} }) as unknown as MediaQueryList
  )
  useSessionStore.getState().setUser(analyst)
  listUrls = []
  crimeListCalls = 0
  mswServer.use(
    http.get("*/requests", ({ request }) => {
      const url = new URL(request.url)
      listUrls.push(url.search)
      const no = url.searchParams.get("no")
      const q = url.searchParams.get("q")
      const items = no ? ITEMS.filter((i) => i.apprsl_reqest_no === no) : q ? ITEMS.filter((i) => i.crime_nm.includes(q)) : ITEMS
      return HttpResponse.json({ items, next_cursor: null })
    }),
    http.get("*/requests/:id", ({ params }) =>
      HttpResponse.json(params.id === "42" ? detail(42, "05019-24-0021", "절도") : detail(41, "05019-24-0017", "주거침입"))
    ),
    http.get("*/crime/", () => {
      crimeListCalls += 1
      return HttpResponse.json([])
    }),
    http.get("*/codes/:group", () => HttpResponse.json([{ code: "7", code_nm: "종로경찰서", upper_code: null }])),
    http.get("*/shoes/count", () => HttpResponse.json({ count: SHOES.length })),
    http.get("*/shoes/stages", () =>
      HttpResponse.json({
        stages: [
          { key: "pattern", count: 0 },
          { key: "group", count: 0 },
          { key: "approve", count: 0 },
          { key: "approved", count: 0 },
        ],
        backlog: { month: "2026-11", total: 0, parts: [] },
        today_approved: 0,
      })
    ),
    http.get("*/shoes/", () => HttpResponse.json(SHOES))
  )
})
afterEach(() => {
  vi.unstubAllGlobals()
  mswServer.resetHandlers()
  useSessionStore.setState({ user: null, status: "loading" })
})
afterAll(() => mswServer.close())

describe("CasesPage — 새 사건관리 목록(서버 A1 · A2)", () => {
  it("A1 행을 그대로 보이고(단계 알약 · 진행 숫자), 옛 전체 목록(GET /crime/)은 부르지 않는다", async () => {
    renderAt()
    const table = await screen.findByRole("table", { name: "사건 목록" })
    expect(within(table).getByText("05019-24-0017")).toBeInTheDocument()
    expect(within(table).getByText("검색·판정")).toBeInTheDocument()
    expect(within(table).getByText("접수 대기")).toBeInTheDocument()
    expect(crimeListCalls).toBe(0)
  })

  it("바로 찾기 · 칩은 서버 거르기(A1 q · flow)로", async () => {
    renderAt()
    const table = await screen.findByRole("table", { name: "사건 목록" })
    fireEvent.change(screen.getByRole("searchbox", { name: "감정번호 · 사건명 바로 찾기" }), { target: { value: "절도" } })
    await waitFor(() => expect(within(table).queryByText("05019-24-0017")).toBeNull())
    expect(listUrls.some((s) => new URLSearchParams(s).get("q") === "절도")).toBe(true)

    fireEvent.click(screen.getByRole("button", { name: /접수 대기/ }))
    await waitFor(() => expect(listUrls.some((s) => new URLSearchParams(s).get("flow") === "REQUESTED")).toBe(true))
  })

  it("조회 실패는 「결과 없음」으로 덮지 않고 다시 시도를 보인다", async () => {
    mswServer.use(http.get("*/requests", () => HttpResponse.json({ detail: "서버 오류" }, { status: 500 })))
    renderAt()
    expect(await screen.findByText("사건 목록을 확인하지 못했습니다")).toBeInTheDocument()
  })

  it("행을 누르면 사건 창(머리 · 흐름 · 이미지 = A2)이 열리고 탭 본문에 사건 번호 · 첫 장 감정물 번호를 넘긴다", async () => {
    renderAt()
    const table = await screen.findByRole("table", { name: "사건 목록" })
    fireEvent.click(within(table).getByText("05019-24-0017"))

    const body = await screen.findByTestId("tab-body")
    expect(body).toHaveTextContent("05019-24-0017|05019-24-0017_1|info")
    expect(location().searchParams.get("open")).toBe("05019-24-0017")
    expect(location().searchParams.get("tab")).toBe("info")

    // 탭 본문이 감정물 번호 전체로 이미지를 고르면 주소 img 는 이미지 번호
    fireEvent.click(within(body).getByRole("button", { name: "둘째 장 고르기" }))
    await waitFor(() => expect(location().searchParams.get("img")).toBe("2"))
    expect(screen.getByTestId("tab-body")).toHaveTextContent("05019-24-0017|05019-24-0017_2|info")
  })

  it("[검수] 이미지와 탭을 함께 바꾸면(결과 확인 「열기」) 한 번에 — 탭만 바뀌고 이미지가 그대로 남지 않는다", async () => {
    renderAt("/cases?open=05019-24-0017&img=1&tab=confirm")
    const body = await screen.findByTestId("tab-body")
    fireEvent.click(within(body).getByRole("button", { name: "둘째 장 정밀 대조 열기" }))
    await waitFor(() => expect(location().searchParams.get("tab")).toBe("compare"))
    expect(location().searchParams.get("img")).toBe("2")
    expect(screen.getByTestId("tab-body")).toHaveTextContent("05019-24-0017|05019-24-0017_2|compare")
  })

  it("주소로 바로 열어도 같은 창(문양 코드 탭)", async () => {
    renderAt("/cases?open=05019-24-0021&img=1&tab=pattern")
    expect(await screen.findByTestId("tab-body")).toHaveTextContent("05019-24-0021|05019-24-0021_1|pattern")
    expect(screen.getByRole("dialog", { name: "05019-24-0021 절도 사건 창" })).toBeInTheDocument()
  })

  it("접수 대기 행의 「접수」 = A4(POST /requests/{id}/receive)", async () => {
    let received: string | null = null
    mswServer.use(
      http.post("*/requests/:id/receive", ({ params }) => {
        received = String(params.id)
        return HttpResponse.json({ rqest_sttus: "RECEIVED", row_version: 2 })
      })
    )
    renderAt()
    await screen.findByRole("table", { name: "사건 목록" })
    fireEvent.click(screen.getByRole("button", { name: "접수" }))
    await waitFor(() => expect(received).toBe("42"))
  })

  it("「+ 등록」 → 새 사건 등록 창(?new=1)", async () => {
    renderAt()
    await screen.findByRole("table", { name: "사건 목록" })
    fireEvent.click(screen.getByRole("button", { name: "등록" }))
    expect(await screen.findByRole("dialog", { name: "사건 등록" })).toBeInTheDocument()
    expect(location().searchParams.get("new")).toBe("1")
  })

  it("위 막대 「신발 DB」 → 같은 자리 패널에 실제 신발 목록, 승인 단추는 없다", async () => {
    renderAt()
    await screen.findByRole("table", { name: "사건 목록" })
    fireEvent.click(screen.getByRole("link", { name: "신발 DB" }))
    const panel = await screen.findByRole("dialog", { name: "신발 DB" })
    expect(await within(panel).findByText("00758")).toBeInTheDocument()
    expect(within(panel).queryByRole("button", { name: "승인" })).toBeNull()
    expect(location().searchParams.get("shoe")).toBe("1")
  })

  it("신발 조회 권한이 없으면 신발 DB 단추 · 패널이 없다", async () => {
    useSessionStore.getState().setUser({ ...analyst, features: [FEATURES.CRIME_SEARCH] })
    renderAt("/cases?shoe=1")
    await screen.findByRole("table", { name: "사건 목록" })
    expect(screen.queryByRole("link", { name: "신발 DB" })).toBeNull()
    expect(screen.queryByRole("dialog", { name: "신발 DB" })).toBeNull()
  })

  it("신발 권한만 있으면 사건 목록 자리에 안내, 신발 패널은 열려 있다(목록 API 를 부르지 않음)", async () => {
    useSessionStore.getState().setUser({ ...analyst, features: [FEATURES.SHOE_VIEW], roles: [] })
    renderAt("/cases")
    expect(await screen.findByText(/사건 보기 권한이 없습니다/)).toBeInTheDocument()
    expect(await screen.findByRole("dialog", { name: "신발 DB" })).toBeInTheDocument()
    expect(listUrls).toHaveLength(0)
  })
})
