import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"

import type { Crime } from "@/entities/crime"
import { CaseExplorerPanel } from "./CaseExplorerPanel"

function crime(overrides: Partial<Crime>): Crime {
  return { top: [], mid: [], bottom: [], outline: [], ...overrides }
}

const CRIMES: Crime[] = [
  crime({
    aprthngNo: "05019-24-0017_5",
    apprslReqestNo: "05019-24-0017",
    crimeNm: "야간 주거침입",
    rqestGrfcNm: "서울경찰청",
    pickDt: "2024-01-29T05:31:00",
    pickMthCode: "FT001",
    processSttus: 0,
  }),
  crime({
    aprthngNo: "07001-24-0102_1",
    apprslReqestNo: "07001-24-0102",
    crimeNm: "차량 절도",
    rqestGrfcNm: "부산경찰청",
    pickDt: "2024-02-03T10:00:00",
    pickMthCode: "FT002",
    processSttus: 1,
  }),
  crime({
    aprthngNo: "07001-24-0103_2",
    apprslReqestNo: "07001-24-0103",
    crimeNm: "상가 침입",
    rqestGrfcNm: "부산경찰청",
    pickDt: null,
    pickMthCode: null,
  }),
]

function renderPanel() {
  return render(
    <CaseExplorerPanel
      crimeData={CRIMES}
      currentCrimeData={CRIMES[0]}
      aprthngNo={CRIMES[0].aprthngNo!}
      onSelect={vi.fn()}
    />
  )
}

/** 목록 카드(상세 보기 버튼 aria-label)에서 보이는 감정물 번호 목록을 뽑는다. */
function visibleCaseNumbers(): string[] {
  return screen
    .queryAllByRole("button", { name: /상세 보기$/ })
    .map((button) => button.getAttribute("aria-label")!.replace(/^감정물 | 상세 보기$/g, ""))
}

function openFilters() {
  fireEvent.click(screen.getByRole("button", { name: /필터/ }))
}

describe("CaseExplorerPanel — SCAS 필드 기반 검색·필터", () => {
  it("CaseExplorerPanel filters by rqestGrfcNm — 의뢰관서 select가 rqestGrfcNm으로 거른다", () => {
    renderPanel()
    openFilters()

    const select = screen.getByLabelText("의뢰관서") as HTMLSelectElement
    // 옵션은 rqestGrfcNm의 distinct 값(빈 값 제외)이다.
    const options = within(select)
      .getAllByRole("option")
      .map((option) => option.textContent)
    expect(options).toEqual(["전체", "서울경찰청", "부산경찰청"])

    fireEvent.change(select, { target: { value: "부산경찰청" } })
    expect(visibleCaseNumbers()).toEqual(["07001-24-0102_1", "07001-24-0103_2"])
  })

  it("채취 방법 코드 select가 pickMthCode로 거른다", () => {
    renderPanel()
    openFilters()

    fireEvent.change(screen.getByLabelText("채취 방법 코드"), { target: { value: "FT002" } })
    expect(visibleCaseNumbers()).toEqual(["07001-24-0102_1"])
  })

  it("채취 일시 입력은 분 단위 공백 형식으로도 서버 형식(T 구분)과 일치한다", () => {
    renderPanel()
    openFilters()

    fireEvent.change(screen.getByLabelText("채취 일시"), {
      target: { value: "2024-01-29 05:31" },
    })
    expect(visibleCaseNumbers()).toEqual(["05019-24-0017_5"])
  })

  it("통합 검색어는 감정물 번호·감정의뢰번호·사건명을 부분일치로 찾는다", () => {
    renderPanel()
    const keyword = screen.getByPlaceholderText("감정물 번호·감정의뢰번호·사건명 검색")

    fireEvent.change(keyword, { target: { value: "07001-24-0103" } })
    expect(visibleCaseNumbers()).toEqual(["07001-24-0103_2"])

    fireEvent.change(keyword, { target: { value: "절도" } })
    expect(visibleCaseNumbers()).toEqual(["07001-24-0102_1"])
  })

  it("상세 시트에 감정물 번호·감정의뢰번호·채취 일시·채취 방법 코드를 표시한다", () => {
    renderPanel()
    fireEvent.click(screen.getByRole("button", { name: "감정물 07001-24-0102_1 상세 보기" }))

    const sheet = screen.getByRole("dialog")
    expect(within(sheet).getByText("감정물 번호")).toBeInTheDocument()
    expect(within(sheet).getByText("07001-24-0102_1")).toBeInTheDocument()
    expect(within(sheet).getByText("감정의뢰번호")).toBeInTheDocument()
    expect(within(sheet).getByText("07001-24-0102")).toBeInTheDocument()
    expect(within(sheet).getByText("채취 일시")).toBeInTheDocument()
    expect(within(sheet).getByText("채취 방법 코드")).toBeInTheDocument()
    expect(within(sheet).getByText("FT002")).toBeInTheDocument()
  })
})
