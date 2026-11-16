import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { DataGrid } from "./DataGrid"

interface Row {
  id: string
  no: string
  name: string
  n: number
}
const ROWS: Row[] = [
  { id: "a", no: "00001-25-0646", name: "침입절도", n: 3 },
  { id: "b", no: "00001-25-0649", name: "상해", n: 12 },
]
const COLUMNS = [
  { key: "no", header: "감정번호", render: (r: Row) => r.no },
  { key: "name", header: "사건명", wrap: true, render: (r: Row) => r.name },
  { key: "n", header: "건수", align: "right" as const, render: (r: Row) => r.n },
]

describe("DataGrid", () => {
  it("열 머리를 주어진 순서대로 그린다", () => {
    render(<DataGrid columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} partId="S01-33" />)
    const table = screen.getByRole("table")
    expect(table).toHaveAttribute("data-part", "DataGrid")
    expect(table).toHaveAttribute("data-part-id", "S01-33")
    const heads = screen.getAllByRole("columnheader").map((h) => h.textContent)
    expect(heads).toEqual(["감정번호", "사건명", "건수"])
  })

  it("행 클릭 시 그 행으로 콜백", () => {
    const onRowClick = vi.fn()
    render(<DataGrid columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} onRowClick={onRowClick} />)
    fireEvent.click(screen.getByText("상해"))
    expect(onRowClick).toHaveBeenCalledWith(ROWS[1])
  })

  it("선택 행만 aria-selected", () => {
    render(<DataGrid columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} selectedKey="b" />)
    const rows = screen.getAllByRole("row").slice(1)
    expect(rows[0]).not.toHaveAttribute("aria-selected", "true")
    expect(rows[1]).toHaveAttribute("aria-selected", "true")
  })

  it("행이 없으면 emptyText 한 칸", () => {
    render(<DataGrid columns={COLUMNS} rows={[]} rowKey={(r: Row) => r.id} emptyText="결과 없음" />)
    const cell = screen.getByText("결과 없음")
    expect(cell).toHaveAttribute("colspan", "3")
    expect(screen.getAllByRole("row")).toHaveLength(2)
  })

  it("오른쪽 정렬 열은 셀에 표시되고 셀 안 버튼 클릭은 행 콜백을 부르지 않는다", () => {
    const onRowClick = vi.fn()
    const onBtn = vi.fn()
    render(
      <DataGrid
        columns={[
          { key: "x", header: "동작", render: () => <button onClick={onBtn}>검색</button> },
          { key: "n", header: "건수", align: "right", render: (r: Row) => r.n },
        ]}
        rows={ROWS}
        rowKey={(r) => r.id}
        onRowClick={onRowClick}
      />
    )
    const row = screen.getAllByRole("row")[1]
    expect(within(row).getByText("3")).toHaveAttribute("data-align", "right")
    fireEvent.click(within(row).getByRole("button", { name: "검색" }))
    expect(onBtn).toHaveBeenCalled()
    expect(onRowClick).not.toHaveBeenCalled()
  })
})
