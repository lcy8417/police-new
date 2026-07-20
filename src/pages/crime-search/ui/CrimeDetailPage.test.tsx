import { afterEach, describe, expect, it } from "vitest"
import { render, screen, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { useCrimeStore, type Crime } from "@/entities/crime"
import { CrimeDetailPage } from "./CrimeDetailPage"

// jsdom에는 ResizeObserver가 없어 PatternCanvas 마운트가 실패한다 — no-op 폴리필
// (ShoeWorkbench.reset.test.tsx와 동일 패턴).
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver =
  globalThis.ResizeObserver ?? (ResizeObserverStub as unknown as typeof ResizeObserver)

const CRIME_NUMBER = "2024-100"

function baseCrime(overrides: Partial<Crime> = {}): Crime {
  return {
    crimeNumber: CRIME_NUMBER,
    image: "data:image/png;base64,AAAA",
    top: [],
    mid: [],
    bottom: [],
    outline: [],
    ...overrides,
  }
}

function renderCrimeDetailPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/search/${CRIME_NUMBER}`]}>
        <Routes>
          <Route path="/search/:crimeNumber" element={<CrimeDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

/**
 * AC-SCENE-016(v0.2.0): 통합 추출란(ExtractedPatternList)과 문양 팔레트
 * (PatternPalette)는 상호 배타적으로 렌더되어서는 안 되며, 추출 성공 여부와
 * 무관하게 둘 다 항상 DOM에 존재해야 한다(D2 번복 — v0.1.0의 "대체" 삼항
 * 분기는 폐기됨).
 */
describe("CrimeDetailPage — 팔레트·통합 추출란 동시 렌더 (AC-SCENE-016)", () => {
  afterEach(() => {
    useCrimeStore.setState({ crimeData: [] })
  })

  it("추출 이후(extractedRaw 비어있지 않음) 상태에서도 팔레트가 함께 렌더된다", () => {
    useCrimeStore.setState({
      crimeData: [
        baseCrime({
          extractedRaw: [
            { code: "s21b", score: 0.91 },
            { code: "s21c", score: 0.55 },
          ],
        }),
      ],
    })

    renderCrimeDetailPage()

    // 통합 추출란 헤더 + 문양 리스트(팔레트) 헤더가 동시에 존재한다.
    expect(screen.getByText("통합 추출란")).toBeInTheDocument()
    expect(screen.getByText("문양 리스트")).toBeInTheDocument()
    // 통합 추출란은 실제 추출 결과 항목을 드래그 가능한 버튼으로 렌더한다.
    const extractedButton = screen.getByRole("button", { name: /s21c/ })
    expect(extractedButton).toHaveAttribute("draggable", "true")
  })

  it("추출 이전(extractedRaw 없음) 상태에서도 통합 추출란·팔레트가 동시에 렌더된다", () => {
    useCrimeStore.setState({ crimeData: [baseCrime()] })

    renderCrimeDetailPage()

    // 팔레트는 추출 이전에도 항상 존재한다(v0.1.0의 "대체" 동작으로 회귀하지 않음).
    expect(screen.getByText("문양 리스트")).toBeInTheDocument()
    // 통합 추출란도 빈 상태 안내와 함께 동시에 마운트되어 있다(둘 다 항상 렌더).
    expect(screen.getByText("통합 추출란")).toBeInTheDocument()
    expect(screen.getByText("추출 결과가 없습니다")).toBeInTheDocument()
  })

  it("팔레트 문양도 통합 추출란과 마찬가지로 독립적인 드래그 소스로 동작한다", () => {
    useCrimeStore.setState({
      crimeData: [
        baseCrime({
          extractedRaw: [{ code: "s21b", score: 0.91 }],
        }),
      ],
    })

    renderCrimeDetailPage()

    const paletteSection = screen.getByText("문양 리스트").closest("section")!
    // 팔레트 썸네일 그리드가 draggable 항목을 렌더한다(무늬 종류가 기본 로드됨).
    const paletteButtons = within(paletteSection).getAllByRole("button")
    const thumbnailButtons = paletteButtons.filter((btn) =>
      btn.querySelector("img")
    )
    expect(thumbnailButtons.length).toBeGreaterThan(0)
    expect(thumbnailButtons[0]).toHaveAttribute("draggable", "true")
  })
})
