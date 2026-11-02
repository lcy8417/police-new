import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"

import type { Shoe } from "@/entities/shoe"
import { ShoeList } from "./ShoeList"

function shoe(overrides: Partial<Shoe> = {}): Shoe {
  return {
    ftwrId: "00758",
    ftwrGroupId: "G038",
    ftwrGroupNm: "crocs(크록스)-038",
    modlNm: "클래식 클로그",
    brandCode: "B0038",
    makrCode: "M001",
    colctPlace: "서울 종로구",
    colctYear: "2019",
    top: [],
    mid: [],
    bottom: [],
    outline: [],
    ...overrides,
  }
}

function renderList(shoes: Shoe[], onSelect = vi.fn()) {
  render(
    <ShoeList
      shoes={shoes}
      total={shoes.length}
      page={0}
      totalPages={1}
      selectedFtwrId=""
      isLoading={false}
      onSelect={onSelect}
      onPageChange={vi.fn()}
    />
  )
  return { onSelect }
}

describe("ShoeList", () => {
  it("ShoeList renders SCAS columns — 머리글 7개, 행 클릭 시 ftwrId(앞자리 0 보존)를 넘긴다", () => {
    const { onSelect } = renderList([shoe()])

    const headers = screen.getAllByRole("columnheader").map((th) => th.textContent)
    expect(headers).toEqual([
      "신발ID",
      "모델명",
      "그룹(상표)",
      "상표코드",
      "제조사코드",
      "수집처",
      "수집연도",
    ])

    const row = screen.getByText("00758").closest("tr")!
    const cells = within(row).getAllByRole("cell").map((td) => td.textContent)
    expect(cells).toEqual([
      "00758",
      "클래식 클로그",
      "crocs(크록스)-038",
      "B0038",
      "M001",
      "서울 종로구",
      "2019",
    ])

    // 페이지가 이 값으로 shoeEditModePath(ftwrId)를 만든다 — 숫자 변환 없이 "00758" 그대로.
    fireEvent.click(row)
    expect(onSelect).toHaveBeenCalledWith("00758")
  })

  it("renders null metadata as blank — null 메타데이터는 빈 칸으로 보인다", () => {
    renderList([
      shoe({
        ftwrId: "A1",
        ftwrGroupNm: null,
        modlNm: null,
        brandCode: null,
        makrCode: null,
        colctPlace: null,
        colctYear: null,
      }),
    ])

    const row = screen.getByText("A1").closest("tr")!
    const cells = within(row).getAllByRole("cell").map((td) => td.textContent)
    expect(cells).toEqual(["A1", "", "", "", "", "", ""])
    expect(row.textContent).not.toContain("null")
  })
})
