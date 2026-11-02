import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { fetchCurrentShoes, fetchHistoryData } from "@/services/crud"
import { CrimeHistoryPage } from "./CrimeHistoryPage"

// 레거시 services 계층은 모듈 로드 시 VITE_API_URL을 읽고 fetch를 직접 호출한다 —
// 이 화면 테스트에서는 응답 모양(설계서 §4-1 이력 상세 camel 키)만 고정하면 되므로 모킹한다.
vi.mock("@/services/crud", () => ({
  fetchHistoryData: vi.fn(),
  fetchCurrentShoes: vi.fn(),
}))
vi.mock("@/services/api", () => ({
  imageSearch: vi.fn(async () => ({ result: [], total: 0 })),
}))

const APRTHNG_NO = "05019-24-0017_5"
const SEARCH_NO = 591656

/** `GET /crime/history/{search_no}` 응답을 camel 변환한 모양(서버 `get_history`). */
function historyDetail(mtchgId: string | null) {
  return {
    editImage: null,
    mtchgId,
    top: [["/src/assets/Patterns/전체/s21b.png", 1]],
    mid: [],
    bottom: [],
    outline: [],
    extractedRaw: null,
    pidinetOutline: null,
  }
}

function renderHistoryPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter
        initialEntries={[
          `/search/${encodeURIComponent(APRTHNG_NO)}/crimeHistory/${SEARCH_NO}?ranking=3`,
        ]}
      >
        <Routes>
          <Route
            path="/search/:aprthngNo/crimeHistory/:searchNo"
            element={<CrimeHistoryPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

function imageSrcs(): string[] {
  return screen.getAllByRole("img").map((img) => img.getAttribute("src") ?? "")
}

describe("CrimeHistoryPage — searchNo·mtchgId 기반 이력 화면", () => {
  afterEach(() => {
    vi.mocked(fetchHistoryData).mockReset()
    vi.mocked(fetchCurrentShoes).mockReset()
  })

  it("renders without matched shoe — mtchgId가 null이면 안내 문구를 보이고 신발을 조회하지 않는다", async () => {
    vi.mocked(fetchHistoryData).mockResolvedValue(historyDetail(null))

    renderHistoryPage()

    expect(await screen.findByText("매칭된 신발이 없습니다")).toBeInTheDocument()
    expect(fetchHistoryData).toHaveBeenCalledWith(String(SEARCH_NO))
    expect(fetchCurrentShoes).not.toHaveBeenCalled()
    // 신발 이미지 타일(바닥·측면)과 문양 비교 영역은 숨긴다.
    expect(screen.queryByText("바닥이미지")).not.toBeInTheDocument()
    expect(screen.queryByText("측면이미지")).not.toBeInTheDocument()
    expect(screen.queryByText("문양 비교")).not.toBeInTheDocument()
    expect(imageSrcs().some((src) => src.includes("/shoes_images/"))).toBe(false)
  })

  it("renders matched shoe images — mtchgId:'00758'이면 B·S 이미지 URL이 앞자리 0을 보존한다", async () => {
    vi.mocked(fetchHistoryData).mockResolvedValue(historyDetail("00758"))
    vi.mocked(fetchCurrentShoes).mockResolvedValue({
      ftwrId: "00758",
      top: ["s21b"],
      mid: [],
      bottom: [],
      outline: [],
    })

    renderHistoryPage()

    await waitFor(() =>
      expect(imageSrcs().some((src) => src.endsWith("/shoes_images/B/00758.png"))).toBe(true)
    )
    expect(fetchCurrentShoes).toHaveBeenCalledWith("00758")
    expect(screen.getByText("바닥이미지")).toBeInTheDocument()
    const srcs = imageSrcs()
    expect(srcs.some((src) => src.endsWith("/shoes_images/S/00758.png"))).toBe(true)
    // 현장 이미지 URL도 인코딩된 감정물 번호를 쓴다.
    expect(
      srcs.some((src) => src.endsWith(`/crime_images/${encodeURIComponent(APRTHNG_NO)}.png`))
    ).toBe(true)
    expect(screen.queryByText("매칭된 신발이 없습니다")).not.toBeInTheDocument()
    expect(screen.getByText("문양 비교")).toBeInTheDocument()
  })
})
