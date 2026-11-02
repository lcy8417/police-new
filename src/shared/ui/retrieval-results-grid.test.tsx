import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { RetrievalResultsGrid, type RetrievalResultItem } from "./retrieval-results-grid"

// `imageSearch`(services/api.js)가 서버 `{ ftwr_id, similarity }`를 정규화한 형태.
const RESULTS: RetrievalResultItem[] = [
  { ftwrId: "00758", image: "/shoes_images/B/00758.png", similarity: 69.99 },
  { ftwrId: "01234", image: "/shoes_images/B/01234.png", similarity: 0.42 },
]

describe("RetrievalResultsGrid", () => {
  it("retrieval grid keys by ftwrId — 카드 제목·이미지 alt가 신발 ID(앞자리 0 보존)로 표시된다", () => {
    render(
      <RetrievalResultsGrid results={RESULTS} totalCount={2} page={0} onPageChange={vi.fn()} />
    )

    expect(screen.getByText("No. 00758")).toBeInTheDocument()
    expect(screen.getByText("No. 01234")).toBeInTheDocument()
    expect(screen.getByAltText("신발 이미지 00758")).toHaveAttribute(
      "src",
      "/shoes_images/B/00758.png"
    )
  })

  it("카드 클릭 시 ftwrId가 담긴 항목과 1-based 전체 순위를 넘긴다", () => {
    const onSelect = vi.fn()
    render(
      <RetrievalResultsGrid
        results={RESULTS}
        totalCount={52}
        page={1}
        pageSize={50}
        onPageChange={vi.fn()}
        onSelect={onSelect}
      />
    )

    fireEvent.click(screen.getByText("No. 01234"))
    expect(onSelect).toHaveBeenCalledWith(RESULTS[1], 52)
    expect(onSelect.mock.calls[0][0].ftwrId).toBe("01234")
  })
})
