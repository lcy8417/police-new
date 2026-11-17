import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { useCrimeStore, type Crime } from "@/entities/crime"
import { useSessionStore } from "@/features/auth"

import { CaseWindowTabBody, type CaseWindowTabKey } from "./index"

// 서버 호출은 모두 목 — 이미지 처리(services/api) · 문양 저장(PUT)
const api = vi.hoisted(() => ({
  imageLoad: vi.fn(async () => "data:image/png;base64,SCENE"),
  imageSearch: vi.fn(async () => ({
    result: [
      { ftwrId: "00758", image: "/shoes_images/B/00758.png", similarity: 0.7 },
      { ftwrId: "01234", image: "/shoes_images/B/01234.png", similarity: 0.5 },
    ],
    total: 2,
  })),
  patternsExtract: vi.fn(),
  putCrimePatterns: vi.fn(async (_aprthngNo: string, _data: unknown) => new Response(null, { status: 200 })),
}))
vi.mock("@/services/api", async (orig) => ({
  ...(await orig<typeof import("@/services/api")>()),
  imageLoad: api.imageLoad,
  imageSearch: api.imageSearch,
  patternsExtract: api.patternsExtract,
}))
vi.mock("@/entities/crime", async (orig) => ({
  ...(await orig<typeof import("@/entities/crime")>()),
  putCrimePatterns: api.putCrimePatterns,
}))

// jsdom 에는 ResizeObserver 가 없다(PatternCanvas · 편집 캔버스)
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver ?? (ResizeObserverStub as unknown as typeof ResizeObserver)

const CASE_NO = "05019-24-0017"

function crime(seq: string, extra: Partial<Crime> = {}): Crime {
  return {
    aprthngNo: `${CASE_NO}_${seq}`,
    apprslReqestNo: CASE_NO,
    crimeNm: "주거침입 절도",
    rqestGrfcNm: "서울경찰청",
    pickDt: "2024-07-24T09:12:00",
    pickPlace: "서울 종로구",
    image: "data:image/png;base64,AAAA",
    top: [["/src/assets/Patterns/전체/s21b.png", 1]],
    mid: [["/src/assets/Patterns/전체/n32_04.png", 0]],
    bottom: [],
    outline: [],
    ...extra,
  }
}

function renderTab(tab: CaseWindowTabKey, imageNo: string | null = "2") {
  const onSelectTab = vi.fn()
  const onSelectImage = vi.fn()
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
      <div className="h-[800px]">
        <CaseWindowTabBody aprthngNo={CASE_NO} imageNo={imageNo} tab={tab} onSelectTab={onSelectTab} onSelectImage={onSelectImage} />
      </div>
    </QueryClientProvider>
  )
  return { onSelectTab, onSelectImage }
}

describe("CaseWindowTabBody — 사건 창 탭 본문(실제 API 연결)", () => {
  beforeEach(() => {
    useCrimeStore.setState({ crimeData: [crime("1"), crime("2", { crimeNm: "둘째 장 사건" })] })
    useSessionStore.setState({
      user: { userId: "analyst", userNm: "감정관", userSe: "USER", features: ["CRIME_SEARCH", "CRIME_REGISTER"], passwordChangeRequired: false },
      status: "authenticated",
    } as never)
    vi.clearAllMocks()
  })
  afterEach(() => {
    useCrimeStore.setState({ crimeData: [] })
  })

  it("사건 정보: 고른 장(_2)의 값을 보이고, 수정 API 가 없어 저장 단추가 없다", () => {
    renderTab("info")
    expect(screen.getByDisplayValue("둘째 장 사건")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /저장/ })).toBeNull()
  })

  it("store 가 비었으면 불러오는 중", () => {
    useCrimeStore.setState({ crimeData: [] })
    renderTab("pattern")
    expect(screen.getByText("사건을 불러오는 중…")).toBeInTheDocument()
  })

  it("이미지 편집: 창 모드 1차 편집(편집 이력 칸 없음)", () => {
    renderTab("edit")
    const editRegion = screen.getByRole("region", { name: "이미지 편집" })
    expect(editRegion).toHaveAttribute("data-slot", "image-edit-window")
    expect(screen.getByAltText(`${CASE_NO}_2 편집 이미지`)).toBeInTheDocument()
    expect(screen.queryByText(/편집 이력/)).toBeNull()
  })

  it("정밀 대조: 검색 결과에서 신발을 고르기 전이면 안내", () => {
    renderTab("compare")
    expect(screen.getByText("검색 결과 탭에서 대조할 신발을 고르세요.")).toBeInTheDocument()
  })

  it("결과 확인 탭은 판정 API 가 없어 「준비 중」", () => {
    renderTab("confirm")
    expect(screen.getByText("결과 확인(판정)은 준비 중입니다.")).toBeInTheDocument()
  })

  it("문양 코드: 실제 PatternCanvas 를 슬롯에 넣고, 검색 이력 탭은 숨기며, 「검색」은 문양 저장(PUT) 뒤 검색 결과 탭으로", async () => {
    const { onSelectTab } = renderTab("pattern")
    expect(screen.getByRole("region", { name: "문양 코딩" })).toBeInTheDocument()
    // PatternCanvas(현장 이미지 img — 추출이 이 src 를 읽는다)가 작업판 슬롯 안에 있다
    const sceneImg = document.querySelector<HTMLImageElement>('[data-slot="pattern-workbench"] img[src="data:image/png;base64,AAAA"]')
    expect(sceneImg).not.toBeNull()
    expect(screen.queryByRole("tab", { name: /검색 이력/ })).toBeNull()
    expect(screen.getByRole("tab", { name: /문양 목록/ })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "검색" }))
    await waitFor(() => expect(onSelectTab).toHaveBeenCalledWith("search"))
    expect(api.putCrimePatterns).toHaveBeenCalledTimes(1)
    expect(api.putCrimePatterns.mock.calls[0][0]).toBe(`${CASE_NO}_2`)
  })

  it("검색 결과: 필수 문양만 실어 한 번 검색하고(settled 게이트), 0~1 유사도를 퍼센트로 보인다", async () => {
    renderTab("search")
    await waitFor(() => expect(api.imageSearch).toHaveBeenCalledTimes(1))
    const call = api.imageSearch.mock.calls[0] as unknown as [{ aprthngNo: string; body: Record<string, unknown>; page: number }]
    expect(call[0].aprthngNo).toBe(`${CASE_NO}_2`)
    expect(call[0].page).toBe(0)
    // 필수(1)인 s21b 만, 필수 아닌 n32_04 는 빠진다
    expect(call[0].body).toMatchObject({ image: "data:image/png;base64,SCENE", top: ["s21b"], mid: [] })
    expect(await screen.findByText("70%")).toBeInTheDocument()
    // 디바운스가 지나도 같은 조건이면 다시 나가지 않는다(이중 요청 없음)
    await new Promise((r) => setTimeout(r, 350))
    expect(api.imageSearch).toHaveBeenCalledTimes(1)
  })
})
