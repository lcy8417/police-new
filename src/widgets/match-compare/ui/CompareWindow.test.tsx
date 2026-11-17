import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"

import type { AlignEditControl } from "@/features/crime-align"

import type { MatchCompareScreenProps, ZonePatterns } from "../model/types"
import { CompareWindow } from "./CompareWindow"

// 사건 창 정밀 대조(창 모드):
//   ① 1:1 = 두 그림 사이 상 · 중 · 하 부위 문양 줄(현장 | 신발 · 같은 이름 = 일치 · 필수 표시) + 윤곽 한 줄, 1:3 · 1:5 = 예전 띠
//   ② 판 안 정렬 지정(alignEdit) — 정렬이 없을 때 · 「정렬 설정」을 누를 때 대화 상자 대신 같은 판에서

const icon = (name: string, essential = false) => ({ name, src: `/p/${name}.png`, ...(essential ? { essential } : {}) })
const CRIME: ZonePatterns = {
  top: [icon("n32_04", true), icon("n21_05")],
  mid: [icon("s21b")],
  bottom: [icon("t11")],
  outline: [],
}
const SHOE: ZonePatterns = {
  top: [icon("n32_04"), icon("w01")],
  mid: [icon("s21b")],
  bottom: [icon("x99")],
  outline: [icon("o1")],
}
const ALIGNED = { polygon: [[1, 1], [9, 1], [9, 9]] as [number, number][], arrow: [[5, 1], [5, 9]] as [number, number][], flipHorizontal: false }

function control(over: Partial<AlignEditControl> = {}): AlignEditControl {
  return {
    phase: "polygon",
    drawMode: "template",
    arrowStep: "toe",
    pointCount: 12,
    flip: false,
    canClose: false,
    canSave: false,
    saving: false,
    onDrawMode: vi.fn(),
    onClose: vi.fn(),
    onUndo: vi.fn(),
    onRestart: vi.fn(),
    onRedoArrow: vi.fn(),
    onFlip: vi.fn(),
    onCancel: vi.fn(),
    ...over,
  }
}

function renderWindow(over: Partial<MatchCompareScreenProps> = {}) {
  const props: MatchCompareScreenProps = {
    status: "ready",
    onRetry: vi.fn(),
    isAdmin: false,
    features: ["CRIME_SEARCH", "EXAM_DECIDE"],
    ranking: 3,
    alignment: ALIGNED,
    matches: [],
    crimeImage: { rgb: "/c.png", sketch: "/c-s.png", width: 260, height: 480 },
    shoeImage: { rgb: "/s.png", sketch: "/s-s.png", width: 400, height: 1056 },
    caseInfo: { aprthngNo: "05019-24-0017_2", rqestGrfcNm: null, crimeNm: null, pickDt: null, pickPlace: null },
    shoeInfo: { ftwrId: "00758", makrCode: null, brandCode: null, modlNm: null, colctYear: null, ftwrGroupNm: null },
    crimePatterns: CRIME,
    shoePatterns: SHOE,
    alignmentSlot: <div data-testid="align-slot" />,
    onSaveAlignment: vi.fn(),
    onConfirmTarget: vi.fn(),
    onClose: vi.fn(),
    showPlus: false,
    inWindow: true,
    compareCount: "1:1",
    onCompareCountChange: vi.fn(),
    ...over,
  }
  const view = render(
    <div className="h-[800px]">
      <CompareWindow {...props} />
    </div>
  )
  return { props, ...view }
}

describe("CompareWindow — 1:1 부위별 문양(11/17 「각각 상 중 하 위치에 각각 좌 우 매칭 및 선택한 문양」)", () => {
  it("유류 | 상 · 중 · 하 줄 | 발견 순서, 줄마다 현장 · 신발 문양 목록 · 판정 글자 · 같은 문양 수", () => {
    renderWindow()
    const stage = document.querySelector("[data-zone-stage]") as HTMLElement
    const order = Array.from(stage.children).map((c) => (c.querySelector("[data-compare-pane]") as HTMLElement | null)?.dataset.comparePane ?? c.getAttribute("aria-label"))
    expect(order).toEqual(["crime", "상 · 중 · 하 부위 문양", "shoe"])
    const rail = screen.getByRole("region", { name: "상 · 중 · 하 부위 문양" })

    const top = within(rail).getByRole("region", { name: "상 부위 문양" })
    // 상: 현장 2 중 1 이 신발에도 — 일부(글자 · 표식)
    expect(top.querySelector("[data-zone-verdict]")).toHaveTextContent("△일부")
    expect(top).toHaveTextContent("1/2")
    const crimeTop = within(top).getByRole("list", { name: "상 현장 문양" })
    const shoeTop = within(top).getByRole("list", { name: "상 신발 문양" })
    expect(crimeTop.querySelectorAll('[data-match="y"]')).toHaveLength(1)
    expect(shoeTop.querySelectorAll('[data-match="y"]')).toHaveLength(1)
    expect(shoeTop.querySelectorAll('[data-match="n"]')).toHaveLength(1)
    // 고른(필수) 문양 표시
    expect(within(crimeTop).getByText("필수")).toBeInTheDocument()
    expect(crimeTop.querySelector('[data-essential="true"]')).toHaveTextContent("양쪽 일치")

    expect(within(rail).getByRole("region", { name: "중 부위 문양" }).querySelector("[data-zone-verdict]")).toHaveTextContent("✓일치")
    expect(within(rail).getByRole("region", { name: "하 부위 문양" }).querySelector("[data-zone-verdict]")).toHaveTextContent("✕다름")
    // 윤곽은 아래 한 줄 — 현장 문양이 없으면 「문양 없음」
    const outline = screen.getByRole("region", { name: "윤곽 부위 문양" })
    expect(outline.querySelector("[data-zone-verdict]")).toHaveTextContent("문양 없음")
    // 1:1 에는 예전 띠 없음 · 두 그림에 상 · 중 · 하 구역 선(3등분)
    expect(screen.queryByRole("region", { name: "상 · 중 · 하 문양 비교" })).toBeNull()
    expect(document.querySelectorAll("[data-zone-lines]")).toHaveLength(2)
  })

  it("1:3 · 1:5 는 예전 상 · 중 · 하 띠 그대로(부위 줄 없음)", () => {
    const candidates = ["00758", "01234", "05555"].map((ftwrId, i) => ({ ftwrId, rank: i + 1, similarity: 80, rgb: "/r.png", sketch: "/s.png" }))
    renderWindow({ compareCount: "1:3", candidates, onCandidateChange: vi.fn(), ranking: 1 })
    expect(screen.getByRole("region", { name: "상 · 중 · 하 문양 비교" })).toBeInTheDocument()
    expect(screen.queryByRole("region", { name: "상 · 중 · 하 부위 문양" })).toBeNull()
    expect(screen.queryByRole("region", { name: "윤곽 부위 문양" })).toBeNull()
  })
})

describe("CompareWindow — 판 안 정렬 지정(11/17 「영역만 여기서 바로」 · 「정렬 설정 누르면 저기서 바로」)", () => {
  it("정렬이 없으면 빈 판 대신 유류 칸에 정렬 캔버스 · 발견 칸에 참고 그림, 막대 · 단계 · 안내 한 줄", () => {
    const edit = control()
    renderWindow({ alignment: null, alignEdit: edit })
    expect(screen.queryByText("정렬(ROI + 방향)이 아직 없습니다")).toBeNull()
    const left = screen.getByRole("region", { name: "유류 이미지 — 영역 지정" })
    expect(within(left).getByTestId("align-slot")).toBeInTheDocument()
    expect(within(screen.getByRole("region", { name: "발견 이미지 — 참고" })).getByRole("img", { name: "발견 이미지 00758" })).toHaveAttribute("src", "/s.png")
    const steps = screen.getByRole("list", { name: "정렬 단계" })
    expect(within(steps).getAllByRole("listitem")[0]).toHaveAttribute("aria-current", "step")
    expect(screen.getByText(/틀 안쪽을 끌어 옮기고 점을 끌어 모양을 맞추세요/)).toBeInTheDocument()
    // 그리기 방식 — 같은 방식을 다시 누르면 지우지 않는다
    const bar = screen.getByRole("toolbar", { name: "정렬 도구" })
    fireEvent.click(within(bar).getByRole("button", { name: "밑창 틀" }))
    expect(edit.onDrawMode).not.toHaveBeenCalled()
    fireEvent.click(within(bar).getByRole("button", { name: "사각형" }))
    expect(edit.onDrawMode).toHaveBeenCalledWith("rect")
    fireEvent.click(within(bar).getByRole("button", { name: "다시 그리기" }))
    expect(edit.onRestart).toHaveBeenCalled()
    fireEvent.click(within(bar).getByRole("button", { name: "좌우 반전" }))
    expect(edit.onFlip).toHaveBeenCalled()
    expect(within(bar).queryByRole("button", { name: "취소" })).toBeNull()
    expect(within(bar).getByRole("button", { name: "정렬 저장" })).toBeDisabled()
    expect(screen.queryByRole("dialog", { name: "정렬 설정" })).toBeNull()
  })

  it("점 찍기: 영역 닫기 · 마지막 점 단추, 점 수에 따른 안내", () => {
    const edit = control({ drawMode: "scratch", pointCount: 4, canClose: true })
    renderWindow({ alignment: null, alignEdit: edit })
    const bar = screen.getByRole("toolbar", { name: "정렬 도구" })
    fireEvent.click(within(bar).getByRole("button", { name: "영역 닫기" }))
    expect(edit.onClose).toHaveBeenCalled()
    fireEvent.click(within(bar).getByRole("button", { name: "마지막 점" }))
    expect(edit.onUndo).toHaveBeenCalled()
    expect(screen.getByText(/점 4개 — 첫 점\(초록 고리\)을 누르거나 두 번 누름 · Enter 로 영역을 닫으세요/)).toBeInTheDocument()
  })

  it("방향 단계 · 저장 대기 — 방향 다시, 영역 + 방향이 있으면 정렬 저장(권한 없으면 잠김)", () => {
    const edit = control({ phase: "review", arrowStep: "complete", canSave: true })
    const { props, unmount } = renderWindow({ alignment: null, alignEdit: edit })
    const bar = screen.getByRole("toolbar", { name: "정렬 도구" })
    expect(within(screen.getByRole("list", { name: "정렬 단계" })).getAllByRole("listitem")[2]).toHaveAttribute("aria-current", "step")
    fireEvent.click(within(bar).getByRole("button", { name: "방향 다시" }))
    expect(edit.onRedoArrow).toHaveBeenCalled()
    fireEvent.click(within(bar).getByRole("button", { name: "정렬 저장" }))
    expect(props.onSaveAlignment).toHaveBeenCalledTimes(1)
    unmount()
    renderWindow({ alignment: null, alignEdit: edit, features: ["EXAM_VIEW"] })
    expect(within(screen.getByRole("toolbar", { name: "정렬 도구" })).getByRole("button", { name: "정렬 저장" })).toBeDisabled()
  })

  it("정렬이 있으면 「정렬 설정」 = 같은 판 안 고치기(대화 상자 없음) — 취소는 저장본으로 · 저장하면 대조 판으로", () => {
    const edit = control({ phase: "review", arrowStep: "complete", canSave: true })
    const { props } = renderWindow({ alignEdit: edit })
    expect(screen.getByRole("region", { name: "상 · 중 · 하 부위 문양" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "정렬 설정" }))
    expect(screen.queryByRole("dialog", { name: "정렬 설정" })).toBeNull()
    expect(screen.getByTestId("align-slot")).toBeInTheDocument()
    expect(screen.queryByRole("toolbar", { name: "대조 도구" })).toBeNull()
    // 고치는 동안 ← → 로 후보를 넘기지 않는다(그리던 것이 날아감)
    fireEvent.click(within(screen.getByRole("toolbar", { name: "정렬 도구" })).getByRole("button", { name: "취소" }))
    expect(edit.onCancel).toHaveBeenCalled()
    expect(screen.getByRole("toolbar", { name: "대조 도구" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "정렬 설정" }))
    fireEvent.click(within(screen.getByRole("toolbar", { name: "정렬 도구" })).getByRole("button", { name: "정렬 저장" }))
    expect(props.onSaveAlignment).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("region", { name: "상 · 중 · 하 부위 문양" })).toBeInTheDocument()
  })

  it("1:3 에서 「정렬 설정」을 누르면 1:1 로 돌려 판 안 지정", () => {
    const candidates = ["00758", "01234", "05555"].map((ftwrId, i) => ({ ftwrId, rank: i + 1, similarity: 80, rgb: "/r.png", sketch: "/s.png" }))
    const { props } = renderWindow({ compareCount: "1:3", candidates, onCandidateChange: vi.fn(), ranking: 1, alignEdit: control() })
    fireEvent.click(screen.getByRole("button", { name: "정렬 설정" }))
    expect(props.onCompareCountChange).toHaveBeenCalledWith("1:1")
  })

  it("고치는 동안 ← → 후보 넘기기 꺼짐", () => {
    const onCandidateChange = vi.fn()
    const candidates = ["00758", "01234"].map((ftwrId, i) => ({ ftwrId, rank: i + 1, similarity: 80, rgb: "/r.png", sketch: "/s.png" }))
    renderWindow({ alignment: null, alignEdit: control(), candidates, onCandidateChange, ranking: 1 })
    fireEvent.keyDown(window, { key: "ArrowRight" })
    expect(onCandidateChange).not.toHaveBeenCalled()
  })

  it("alignEdit 가 없으면 예전 대화 상자", () => {
    renderWindow()
    fireEvent.click(screen.getByRole("button", { name: "정렬 설정" }))
    expect(screen.getByRole("dialog", { name: "정렬 설정" })).toBeInTheDocument()
  })
})
