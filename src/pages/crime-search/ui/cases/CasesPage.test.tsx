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

// 탭 본문(갈래 ④)은 계약 값만 확인한다 — 실제 탭 본문의 API 호출은 ④ 테스트 몫
vi.mock("./case-window-tab-body", () => ({
  CaseWindowTabBody: (props: { aprthngNo: string; imageNo: string | null; tab: string; onSelectImage: (no: string) => void }) => (
    <div data-testid="tab-body">
      {props.aprthngNo}|{props.imageNo}|{props.tab}
      <button type="button" onClick={() => props.onSelectImage("05019-24-0017_2")}>
        둘째 장 고르기
      </button>
    </div>
  ),
}))

const analyst: SessionUser = {
  userId: "kim01",
  userNm: "김감정",
  userSe: "USER",
  features: [FEATURES.CRIME_SEARCH, FEATURES.SHOE_VIEW],
  passwordChangeRequired: false,
}

const crime = (aprthngNo: string, extra: Record<string, unknown> = {}) => ({
  aprthng_no: aprthngNo,
  apprsl_reqest_no: aprthngNo.replace(/_\d+$/, ""),
  crime_nm: "주거침입",
  rqest_grfc_nm: "종로경찰서",
  frst_regist_dt: "2026-11-10T09:00:00",
  top: [],
  mid: [],
  bottom: [],
  outline: [],
  ...extra,
})

// 서버 순서 = 최근 등록 먼저. 0017 사건은 이미지 2장(_2, _1 순서로 와도 순번 순서로 묶는다)
const CRIMES = [
  crime("05019-24-0017_2", { frst_regist_dt: "2026-11-12T10:00:00" }),
  crime("05019-24-0021_1", { crime_nm: "절도", rqest_grfc_nm: "중부경찰서" }),
  crime("05019-24-0017_1", { frst_regist_dt: "2026-11-11T10:00:00" }),
]

const SHOES = [
  { ftwr_id: "00758", modl_nm: "크록스", brand_code: "B0038", makr_code: null, colct_year: "2019", image: "/shoes_images/B/00758.png", top: ["s21b"], mid: [], bottom: [], outline: [] },
  { ftwr_id: "00901", modl_nm: "운동화", brand_code: "B0100", makr_code: null, colct_year: "2020", image: "/shoes_images/B/00901.png", top: [], mid: [], bottom: [], outline: [] },
]

function LocationProbe() {
  const { pathname, search } = useLocation()
  return <div data-testid="location">{`${pathname}${search}`}</div>
}

function renderAt(path = "/cases") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
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

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({ matches: false, media: query, addEventListener: () => {}, removeEventListener: () => {} }) as unknown as MediaQueryList
  )
  useSessionStore.getState().setUser(analyst)
  mswServer.use(
    http.get("*/crime/", () => HttpResponse.json(CRIMES)),
    http.get("*/shoes/count", () => HttpResponse.json({ count: SHOES.length })),
    http.get("*/shoes/", () => HttpResponse.json(SHOES))
  )
})
afterEach(() => {
  vi.unstubAllGlobals()
  mswServer.resetHandlers()
  useSessionStore.setState({ user: null, status: "loading" })
})
afterAll(() => mswServer.close())

describe("CasesPage — 새 사건관리 목록(실제 GET /crime/)", () => {
  it("감정물을 감정의뢰번호로 묶어 사건 행으로 보이고, 위 막대에 건수 · 바로 찾기가 있다", async () => {
    renderAt()
    const table = await screen.findByRole("table", { name: "사건 목록" })
    expect(within(table).getByText("05019-24-0017")).toBeInTheDocument()
    expect(within(table).getByText("05019-24-0021")).toBeInTheDocument()
    // 사건 2건(감정물 3장)
    expect(screen.getByText("2건")).toBeInTheDocument()

    fireEvent.change(screen.getByRole("searchbox", { name: "감정번호 · 사건명 바로 찾기" }), { target: { value: "절도" } })
    await waitFor(() => expect(within(table).queryByText("05019-24-0017")).toBeNull())
    expect(within(table).getByText("05019-24-0021")).toBeInTheDocument()
  })

  it("조회 실패는 「결과 없음」으로 덮지 않고 다시 시도를 보인다", async () => {
    mswServer.use(http.get("*/crime/", () => HttpResponse.json({ detail: "서버 오류" }, { status: 500 })))
    renderAt()
    expect(await screen.findByText("사건 목록을 확인하지 못했습니다")).toBeInTheDocument()
  })

  it("행을 누르면 사건 창이 열리고 탭 본문에 사건 번호 · 첫 장 감정물 번호를 넘긴다(주소 open · img · tab)", async () => {
    renderAt()
    const table = await screen.findByRole("table", { name: "사건 목록" })
    fireEvent.click(within(table).getByText("05019-24-0017"))

    const body = await screen.findByTestId("tab-body")
    expect(body).toHaveTextContent("05019-24-0017|05019-24-0017_1|info")
    expect(location().searchParams.get("open")).toBe("05019-24-0017")
    expect(location().searchParams.get("img")).toBe("1")
    expect(location().searchParams.get("tab")).toBe("info")

    // 탭 본문이 감정물 번호 전체로 이미지를 고르면 주소 img 는 순번
    fireEvent.click(within(body).getByRole("button", { name: "둘째 장 고르기" }))
    await waitFor(() => expect(location().searchParams.get("img")).toBe("2"))
    expect(screen.getByTestId("tab-body")).toHaveTextContent("05019-24-0017|05019-24-0017_2|info")
  })

  it("주소로 바로 열어도 같은 창(문양 코드 탭)", async () => {
    renderAt("/cases?open=05019-24-0021&img=1&tab=pattern")
    expect(await screen.findByTestId("tab-body")).toHaveTextContent("05019-24-0021|05019-24-0021_1|pattern")
    expect(screen.getByRole("dialog", { name: "05019-24-0021 절도 사건 창" })).toBeInTheDocument()
  })

  it("위 막대 「신발 DB」 → 같은 자리 패널에 실제 신발 목록(서버 50개씩), 승인 단추는 없다", async () => {
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
})
