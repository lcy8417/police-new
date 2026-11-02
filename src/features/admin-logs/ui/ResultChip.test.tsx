import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"

import { ResultChip } from "./ResultChip"

describe("ResultChip — 기능 기록 결과 칩", () => {
  it("ResultChip labels", () => {
    render(
      <>
        <ResultChip result="SUCCESS" />
        <ResultChip result="FAIL" />
        <ResultChip result="DENIED" />
      </>
    )
    expect(screen.getByText("성공")).toHaveClass("text-[#2DD4BF]")
    expect(screen.getByText("실패")).toHaveClass("text-[#EF4444]")
    expect(screen.getByText("권한 없음")).toHaveClass("text-[#F59E0B]")
  })
})
