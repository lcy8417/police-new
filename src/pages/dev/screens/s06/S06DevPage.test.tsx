import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { S06DevPage } from "./S06DevPage"

function Where() {
  const { pathname, search } = useLocation()
  return <p data-testid="where">{`${pathname}${search}`}</p>
}

const renderAt = (query: string) =>
  render(
    <MemoryRouter initialEntries={[`/dev/s06${query}`]}>
      <Routes>
        <Route path="/dev/s06" element={<S06DevPage />} />
        <Route path="/dev/s05" element={<Where />} />
        <Route path="/dev/s07" element={<Where />} />
      </Routes>
    </MemoryRouter>
  )

const pairs = (side: "crime" | "shoe") =>
  document.querySelector(`[data-part="PointPairs"][data-part-variant="${side}"]`) as SVGElement | null

const NO_ALIGN = "정렬(ROI+방향)이 설정되지 않았습니다. 먼저 정렬을 저장해 주세요."

describe("S06 상세 조회 · 정밀 대조 진열 페이지", () => {
  it("ready 케이스에 상세조회 머리 · 신발 번호 · Top-10 대응 박스를 양쪽에 그린다", () => {
    renderAt("?case=ready&ftwr=00758&rank=1")
    expect(screen.getByText("현장문양검색결과 상세조회")).toBeInTheDocument()
    expect(screen.getAllByText("No. 00758").length).toBeGreaterThan(0)
    expect(pairs("crime")!.querySelectorAll("[data-pair]")).toHaveLength(10)
    expect(pairs("shoe")!.querySelectorAll("[data-pair]")).toHaveLength(10)
  })

  it("버튼 줄은 SCAS 순서 그대로, 새 「정렬 설정」은 맨 끝(신규 기능 끔 — 1차 그대로)", () => {
    renderAt("?case=ready&as=admin&plus=0")
    const bar = document.querySelector('[data-part="ButtonBar"]') as HTMLElement
    expect(within(bar).getAllByRole("button").map((b) => b.textContent)).toEqual([
      "이전",
      "다음",
      "그룹등록",
      "확인대상",
      "프린트",
      "닫기",
      "정렬 설정",
    ])
  })

  it("대응 목록 행에 마우스를 올리면 양쪽 같은 번호 박스가 active", () => {
    renderAt("?case=ready")
    const row = document.querySelector('[data-pair-row="2"]') as HTMLElement
    fireEvent.mouseEnter(row)
    expect(pairs("crime")!.querySelector('[data-pair="2"]')).toHaveAttribute("data-active", "true")
    expect(pairs("shoe")!.querySelector('[data-pair="2"]')).toHaveAttribute("data-active", "true")
    expect(pairs("crime")!.querySelector('[data-pair="1"]')).not.toHaveAttribute("data-active")
    fireEvent.mouseLeave(row)
    expect(pairs("crime")!.querySelector("[data-active]")).toBeNull()
  })

  it("박스에 마우스를 올려도 목록과 반대쪽이 함께 강조된다", () => {
    renderAt("?case=ready")
    fireEvent.mouseEnter(pairs("shoe")!.querySelector('[data-pair="4"]') as Element)
    expect(pairs("crime")!.querySelector('[data-pair="4"]')).toHaveAttribute("data-active", "true")
    expect(document.querySelector('[data-pair-row="4"]')).toHaveAttribute("data-active", "true")
  })

  it("보기 방식 「RGB」 ↔ 「스케치·이진」 전환", () => {
    renderAt("?case=ready")
    const seg = screen.getByRole("group", { name: "보기 방식" })
    expect(within(seg).getByRole("button", { name: "RGB" })).toHaveAttribute("aria-pressed", "true")
    fireEvent.click(within(seg).getByRole("button", { name: "스케치·이진" }))
    expect(within(seg).getByRole("button", { name: "스케치·이진" })).toHaveAttribute("aria-pressed", "true")
    expect(document.querySelectorAll('[data-match-image][data-look="sketch"]')).toHaveLength(2)
  })

  it("no-alignment 케이스는 정렬 안내와 「정렬 설정하러 가기」를 보이고 대응 박스는 없다", () => {
    renderAt("?case=no-alignment")
    expect(screen.getByText(NO_ALIGN)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "정렬 설정하러 가기" })).toBeInTheDocument()
    expect(pairs("crime")).toBeNull()
  })

  it("정렬 설정 DialogShell 에서 저장하면 대응 매칭이 보인다", () => {
    renderAt("?case=no-alignment&as=analyst")
    fireEvent.click(screen.getByRole("button", { name: "정렬 설정하러 가기" }))
    const dialog = screen.getByRole("dialog")
    expect(dialog).toHaveAttribute("data-part", "DialogShell")
    expect(within(dialog).getByText("정렬 설정")).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole("button", { name: "정렬 저장" }))
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(screen.queryByText(NO_ALIGN)).toBeNull()
    expect(pairs("crime")).not.toBeNull()
  })

  it("「확인대상」은 S07 로, 「닫기」는 S05 로 간다(as 유지)", () => {
    const first = renderAt("?case=ready&ftwr=00758&rank=1&as=admin")
    fireEvent.click(screen.getByRole("button", { name: "확인대상" }))
    expect(screen.getByTestId("where")).toHaveTextContent("/dev/s07?ftwr=00758&as=admin")
    first.unmount()
    renderAt("?case=ready&as=admin")
    fireEvent.click(screen.getByRole("button", { name: "닫기" }))
    expect(screen.getByTestId("where")).toHaveTextContent("/dev/s05?as=admin")
  })

  it("loading 케이스는 aria-busy=\"true\"", () => {
    const { container } = renderAt("?case=loading")
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(pairs("crime")).toBeNull()
  })

  it("error 케이스는 「다시」 버튼이 있고 「결과 없음」이 없다", () => {
    renderAt("?case=error")
    expect(screen.getByRole("button", { name: "다시" })).toBeInTheDocument()
    expect(screen.queryByText(/결과 없음/)).toBeNull()
    expect(pairs("crime")).toBeNull()
  })

  it("readonly 보기에서 「확인대상」 · 「정렬 저장」이 disabled(신규 기능 끔 — 1차 그대로)", () => {
    renderAt("?case=no-alignment&as=readonly&plus=0")
    expect(screen.getByRole("button", { name: "확인대상" })).toBeDisabled()
    fireEvent.click(screen.getByRole("button", { name: "정렬 설정하러 가기" }))
    expect(within(screen.getByRole("dialog")).getByRole("button", { name: "정렬 저장" })).toBeDisabled()
  })

  it("?plus=0 이면 [data-plus] 가 하나도 없고 1차 내용(대응 박스 · 목록 · 표 · 문양)은 그대로", () => {
    renderAt("?case=ready&plus=0")
    expect(document.querySelectorAll("[data-plus]")).toHaveLength(0)
    expect(screen.queryByText(/AI 대응점/)).toBeNull()
    expect(screen.queryByText(/Inlier/)).toBeNull()
    expect(screen.queryByText(/AI가 미리 대조/)).toBeNull()
    expect(screen.queryByText("SCAS번호")).toBeNull()
    expect(pairs("crime")!.querySelectorAll("[data-pair]")).toHaveLength(10)
    expect(screen.getByRole("list", { name: "대응 목록" })).toBeInTheDocument()
    expect(screen.getByText("유류 이미지 문양")).toBeInTheDocument()
    expect(screen.getByText("이미지번호")).toBeInTheDocument()
  })
})

describe("S06 r2 — 시안 +α", () => {
  it("대표 +α 가 시안 문구로 보인다(대응점 39 · 일치 28 / 불일치 11 · AI 미리 대조 · 부위별 근거 · AI 의견)", () => {
    renderAt("?case=ready")
    expect(screen.getByText("AI 대응점 39")).toBeInTheDocument()
    const legend = document.querySelector("[data-pair-legend]") as HTMLElement
    expect(within(legend).getByText("28")).toBeInTheDocument()
    expect(within(legend).getByText("11")).toBeInTheDocument()
    expect(document.querySelectorAll("[data-pair-line]")).toHaveLength(39)
    expect(document.querySelectorAll('[data-pair-line][data-ok="false"]')).toHaveLength(11)
    expect(screen.getByText("AI가 미리 대조해 둠")).toBeInTheDocument()
    expect(screen.getByText("412↔398")).toBeInTheDocument()
    expect(screen.getByText("AI 의견 · 참고")).toBeInTheDocument()
    expect(screen.getByText("AI 정합 −4.0° 보정")).toBeInTheDocument()
    expect(document.querySelectorAll("[data-basis-zone]")).toHaveLength(3)
    expect(screen.getByText("헤링본 줄 9 ↔ 9줄 · 기울기 32° ↔ 31°")).toBeInTheDocument()
    expect(screen.getByText("대응 6/14")).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "종합 신뢰도 87%" })).toBeInTheDocument()
    // 사건 · 신발 정보 표의 SCAS 칸이 시안 순서로 채워진다
    expect(screen.getByText("전사판채취법")).toBeInTheDocument()
    expect(screen.getByText("용의자신발")).toBeInTheDocument()
  })

  it("버튼 줄: 감정관은 「닫기」 뒤 「근거 이미지 감정서에 첨부」, 맨 끝 「정렬 설정」", () => {
    renderAt("?case=ready&as=analyst")
    const bar = document.querySelector('[data-part="ButtonBar"]') as HTMLElement
    expect(within(bar).getAllByRole("button").map((b) => b.textContent)).toEqual([
      "이전",
      "다음",
      "그룹등록",
      "확인대상",
      "프린트",
      "닫기",
      "근거 이미지 감정서에 첨부",
      "정렬 설정",
    ])
  })

  it("확인 막대 「예」 → S07(판정)으로, 「아니오」 → 막대가 닫힌다", () => {
    const first = renderAt("?case=ready&ftwr=00758&as=analyst")
    const bar = document.querySelector("[data-confirm-bar]") as HTMLElement
    expect(within(bar).getByText("확인대상에 등록하시겠습니까?")).toBeInTheDocument()
    fireEvent.click(within(bar).getByRole("button", { name: "아니오" }))
    expect(document.querySelector("[data-confirm-bar]")).toBeNull()
    first.unmount()
    renderAt("?case=ready&ftwr=00758&as=analyst")
    fireEvent.click(within(document.querySelector("[data-confirm-bar]") as HTMLElement).getByRole("button", { name: "예" }))
    expect(screen.getByTestId("where")).toHaveTextContent("/dev/s07?ftwr=00758&as=analyst")
  })

  it("보는 사람 — 기술책임자는 그룹등록 · 확인대상 · 감정서 첨부 · 확인 막대가 없고 「읽기 전용」 안내", () => {
    renderAt("?case=ready&as=verifier")
    expect(screen.queryByRole("button", { name: "확인대상" })).toBeNull()
    expect(screen.queryByRole("button", { name: "그룹등록" })).toBeNull()
    expect(screen.queryByRole("button", { name: "근거 이미지 감정서에 첨부" })).toBeNull()
    expect(document.querySelector("[data-confirm-bar]")).toBeNull()
    expect(screen.getByText("기술책임자: 읽기 전용(결재 참고)")).toBeInTheDocument()
    expect(screen.queryByText("감정관: 확인대상·그룹등록·감정서 첨부")).toBeNull()
  })

  it("보는 사람 — 감정관은 감정관 안내, 수사관은 「이 팝업 없음」 안내", () => {
    const a = renderAt("?case=ready&as=analyst")
    expect(screen.getByText("감정관: 확인대상·그룹등록·감정서 첨부")).toBeInTheDocument()
    expect(screen.queryByText("기술책임자: 읽기 전용(결재 참고)")).toBeNull()
    a.unmount()
    renderAt("?case=ready&as=investigator")
    expect(screen.getByText("수사관: 이 팝업 없음 — 결재완료 감정서로만")).toBeInTheDocument()
  })

  it("정밀 대조 보기 「대응점 · 겹쳐 보기 · 히트맵」(기본 겹쳐 보기)과 접기", () => {
    renderAt("?case=ready")
    const seg = screen.getByRole("group", { name: "정밀 대조 보기" })
    expect(within(seg).getByRole("button", { name: "겹쳐 보기" })).toHaveAttribute("aria-pressed", "true")
    fireEvent.click(within(seg).getByRole("button", { name: "히트맵" }))
    expect(document.querySelector("[data-overlay-preview]")).toHaveAttribute("data-overlay-preview", "heat")
    fireEvent.click(screen.getByRole("button", { name: "덧붙임 · 접기 ▴" }))
    expect(screen.queryByText("AI가 미리 대조해 둠")).toBeNull()
  })

  it("움직임 줄이기: 움직임은 모두 motion-safe: 로만(훑기 선 · 실시간 점)", () => {
    renderAt("?case=ready")
    const animated = Array.from(document.querySelectorAll('[class*="animate-"]')).flatMap((el) =>
      String(el.getAttribute("class"))
        .split(/\s+/)
        .filter((c) => c.includes("animate-")),
    )
    expect(animated.length).toBeGreaterThan(0)
    expect(animated.every((c) => c.startsWith("motion-safe:"))).toBe(true)
    expect(document.querySelector('[data-match-image="crime"] [data-part="ScanOverlay"]')).not.toBeNull()
    expect(document.querySelector('[data-precision] [data-part="LiveDot"]')).not.toBeNull()
  })
})

// ── r3 편의: 비교 1:1 · 1:3 · 1:5 · 후보 넘기기 ──

const head = () => screen.getByRole("heading", { name: "현장문양검색결과 상세조회" }).parentElement as HTMLElement
const current = () => {
  const text = head().textContent ?? ""
  return text.match(/No\. (\S+?)#(\d+)/)?.slice(1, 3).join(" ") ?? text
}
const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms))
const pressKey = (key: string) => fireEvent.keyDown(window, { key })
const compareGroup = () => screen.getByRole("group", { name: "비교" })

describe("S06 r3 — 비교 개수 · 후보 넘기기", () => {
  beforeEach(() => window.localStorage.clear())

  it("기본 1:1 은 2차 대응점 배치 그대로, 1:3 · 1:5 는 현장 1장 + 후보 n장(지금 후보가 맨 앞)", () => {
    renderAt("?case=ready&ftwr=00758&rank=1")
    expect(within(compareGroup()).getByRole("button", { name: "1:1" })).toHaveAttribute("aria-pressed", "true")
    expect(document.querySelector("[data-pair-stage]")).not.toBeNull()
    expect(document.querySelector("[data-multi-stage]")).toBeNull()

    fireEvent.click(within(compareGroup()).getByRole("button", { name: "1:3" }))
    const stage = document.querySelector("[data-multi-stage]") as HTMLElement
    expect(stage).toHaveAttribute("data-multi-stage", "1:3")
    expect(within(stage).getByRole("img", { name: "유류 이미지" })).toBeInTheDocument()
    const tiles = stage.querySelectorAll("[data-candidate-tile]")
    expect(Array.from(tiles).map((t) => t.getAttribute("data-candidate-tile"))).toEqual(["00758", "305659", "281904"])
    expect(tiles[0]).toHaveAttribute("aria-current", "true")
    // 대응 박스 · 대응 목록은 1:1 에서만
    expect(document.querySelector("[data-pair-stage]")).toBeNull()
    expect(screen.queryByRole("list", { name: "대응 목록" })).toBeNull()

    fireEvent.click(within(compareGroup()).getByRole("button", { name: "1:5" }))
    expect(document.querySelectorAll("[data-multi-stage] [data-candidate-tile]")).toHaveLength(5)
  })

  it("후보 칸을 누르면 그 후보가 지금 후보가 된다", () => {
    renderAt("?case=ready&ftwr=00758&rank=1")
    fireEvent.click(within(compareGroup()).getByRole("button", { name: "1:3" }))
    fireEvent.click(screen.getByRole("button", { name: "후보 3위 281904 고르기" }))
    expect(current()).toBe("281904 3")
    expect(document.querySelector('[data-candidate-tile="281904"]')).toHaveAttribute("aria-current", "true")
  })

  it("← → · 이전/다음으로 앞 · 뒤 후보, 처음 후보에서 「이전」은 꺼짐", () => {
    renderAt("?case=ready&ftwr=00758&rank=1")
    expect(current()).toBe("00758 1")
    expect(screen.getByRole("button", { name: "이전" })).toBeDisabled()
    pressKey("ArrowRight")
    expect(current()).toBe("305659 2")
    fireEvent.click(screen.getByRole("button", { name: "다음" }))
    expect(current()).toBe("281904 3")
    pressKey("ArrowLeft")
    expect(current()).toBe("305659 2")
    fireEvent.click(screen.getByRole("button", { name: "이전" }))
    expect(current()).toBe("00758 1")
    // 신발정보 표도 지금 후보를 따른다
    expect(screen.getAllByText("00758").length).toBeGreaterThan(0)
  })

  it("1:3 · 1:5 기억 — 다시 열어도 그대로", () => {
    const first = renderAt("?case=ready")
    fireEvent.click(within(compareGroup()).getByRole("button", { name: "1:5" }))
    first.unmount()
    renderAt("?case=ready")
    expect(document.querySelector("[data-multi-stage]")).toHaveAttribute("data-multi-stage", "1:5")
  })

  describe("자동 넘기기", () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    const goAuto = () => fireEvent.click(within(screen.getByRole("group", { name: "이동 방식" })).getByRole("button", { name: "자동" }))

    it("n 초마다 다음 후보, 간격 바꾸면 즉시, Space 일시정지, 마지막 후보에서 멈춤", () => {
      renderAt("?case=ready&ftwr=00758&rank=1")
      goAuto()
      tick(2000)
      expect(current()).toBe("305659 2")
      fireEvent.click(within(screen.getByRole("group", { name: "넘기는 간격" })).getByRole("button", { name: "1초" }))
      tick(1000)
      expect(current()).toBe("281904 3")
      pressKey(" ")
      tick(5000)
      expect(current()).toBe("281904 3")
      pressKey(" ")
      for (let i = 0; i < 17; i++) tick(1000)
      expect(current()).toBe("300761 20")
      tick(1000)
      expect(screen.getByRole("button", { name: "재생" })).toBeInTheDocument()
      tick(3000)
      expect(current()).toBe("300761 20")
    })

    it("회귀: ← 를 먼저 누른 뒤 자동으로 바꿔도 후보를 건너뛰지 않는다", () => {
      renderAt("?case=ready&ftwr=305659&rank=2")
      pressKey("ArrowLeft")
      expect(current()).toBe("00758 1")
      goAuto()
      expect(current()).toBe("00758 1")
      tick(1999)
      expect(current()).toBe("00758 1")
      tick(1)
      expect(current()).toBe("305659 2")
    })

    it("회귀: 자동 중 첫 걸음 전에 ← 를 누르고 마우스를 올렸다 내려도 걸음이 더 생기지 않는다", () => {
      renderAt("?case=ready&ftwr=305659&rank=2")
      goAuto()
      pressKey("ArrowLeft")
      expect(current()).toBe("00758 1")
      const area = document.querySelector("[data-compare-area]") as HTMLElement
      fireEvent.mouseEnter(area)
      fireEvent.mouseLeave(area)
      expect(current()).toBe("00758 1")
      tick(1999)
      expect(current()).toBe("00758 1")
    })

    it("비교 그림에 마우스를 올리면 잠시 멈춘다 · 떠나면 타이머 0개", () => {
      const view = renderAt("?case=ready&ftwr=00758&rank=1")
      goAuto()
      const area = document.querySelector("[data-compare-area]") as HTMLElement
      fireEvent.mouseEnter(area)
      tick(6000)
      expect(current()).toBe("00758 1")
      fireEvent.mouseLeave(area)
      tick(2000)
      expect(current()).toBe("305659 2")
      expect(vi.getTimerCount()).toBeGreaterThan(0)
      view.unmount()
      expect(vi.getTimerCount()).toBe(0)
    })
  })
})
