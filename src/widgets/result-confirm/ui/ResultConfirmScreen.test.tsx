import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { ResultConfirmScreenProps } from "../model/types"
import { ResultConfirmScreen } from "./ResultConfirmScreen"

const base: ResultConfirmScreenProps = {
  status: "ready",
  onRetry: () => {},
  isAdmin: false,
  features: ["CRIME_SEARCH"],
  caseSummary: { apprslReqestNo: "00001-25-0646", crimeNm: "주거침입", rqestGrfcNm: "대구청" },
  blocks: [
    {
      aprthngNo: "00001-25-0646_1",
      sceneImage: "scene.png",
      history: [],
      target: { ftwrId: "00758", image: "shoe.png", ranking: 1, similarity: 84.12 },
    },
  ],
  judgements: { "00001-25-0646_1": "found" },
  onJudgementChange: () => {},
  onSaveJudgement: () => {},
  // 1차 지금 기능 검사 — 신규 기능(+α · 시안 역할 잠금)을 끈 운영 연결 모양
  showPlus: false,
}

describe("ResultConfirmScreen", () => {
  it("저장 시 onSaveJudgement({ aprthngNo, ftwrId, ranking, result }) — 신발 ID 문자열 그대로", () => {
    const onSaveJudgement = vi.fn()
    render(<ResultConfirmScreen {...base} onSaveJudgement={onSaveJudgement} />)
    fireEvent.click(screen.getByRole("button", { name: "결과확인완료" }))
    expect(onSaveJudgement).toHaveBeenCalledWith({ aprthngNo: "00001-25-0646_1", ftwrId: "00758", ranking: 1, result: "found" })
  })

  it("라디오를 누르면 onJudgementChange(이미지 번호, 값)", () => {
    const onJudgementChange = vi.fn()
    render(<ResultConfirmScreen {...base} judgements={{}} onJudgementChange={onJudgementChange} />)
    fireEvent.click(screen.getByRole("radio", { name: /불발견/ }))
    expect(onJudgementChange).toHaveBeenCalledWith("00001-25-0646_1", "notFound")
  })

  it("유사도 69.99 는 「70%」", () => {
    render(
      <ResultConfirmScreen
        {...base}
        blocks={[{ ...base.blocks[0], target: { ...base.blocks[0].target!, similarity: 69.99 } }]}
      />
    )
    expect(screen.getByText("70%")).toBeInTheDocument()
  })

  it("신규 기능을 켜면 시안 역할대로 — 판정 확정(EXAM_DECIDE)이 없으면 결과확인완료가 없고 라디오가 잠긴다", () => {
    render(<ResultConfirmScreen {...base} showPlus features={["CRIME_SEARCH"]} />)
    expect(screen.queryByRole("button", { name: "결과확인완료" })).toBeNull()
    screen.getAllByRole("radio").forEach((r) => expect(r).toBeDisabled())
    expect(screen.getAllByRole("radio").map((r) => r.textContent?.replace(/[◉○]\s*/, ""))).toEqual(["발견", "불발견", "감정불능"])
  })

  it("신규 기능을 켜고 판정 확정 권한이 있으면 저장 묶음은 1차 그대로", () => {
    const onSaveJudgement = vi.fn()
    render(<ResultConfirmScreen {...base} showPlus features={["CRIME_SEARCH", "EXAM_DECIDE"]} onSaveJudgement={onSaveJudgement} />)
    fireEvent.click(screen.getByRole("button", { name: "결과확인완료" }))
    expect(onSaveJudgement).toHaveBeenCalledWith({ aprthngNo: "00001-25-0646_1", ftwrId: "00758", ranking: 1, result: "found" })
  })

  it("권한이 없으면 라디오 · 저장이 잠긴다", () => {
    render(<ResultConfirmScreen {...base} features={["SHOE_VIEW"]} />)
    screen.getAllByRole("radio").forEach((r) => expect(r).toBeDisabled())
    expect(screen.getByRole("button", { name: "결과확인완료" })).toBeDisabled()
  })
})
