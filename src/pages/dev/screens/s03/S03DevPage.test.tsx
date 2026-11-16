import { fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { S03DevPage } from "./S03DevPage"

function Landing() {
  const { pathname, search } = useLocation()
  return <p data-testid="landing">{`${pathname}${search}`}</p>
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/dev/s03" element={<S03DevPage />} />
        <Route path="/dev/:id" element={<Landing />} />
      </Routes>
    </MemoryRouter>,
  )
}

// 도구 이름은 시안 r2 도구 줄 그대로(⬚ 자르기 · ⌖ 4점 각도 보정 · 📏 길이 측정 — 그림 글자는 읽지 않음) + 1차 덧붙임 4개
const TOOLS = ["자르기", "4점 각도 보정", "길이 측정", "배경제거", "접합장애물제거", "이진화", "노이즈제거"]
const SCAS_BOTTOM = ["처음상태", "평준화", "색상반전", "좌우반전", "밝게", "어둡게", "상하반전"]

/** a 가 b 보다 문서에서 앞에 있는가 */
const before = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)

describe("S03DevPage — 이미지 편집", () => {
  it("ready 케이스에 A 이미지 커팅의 SCAS 위 버튼 줄과 덧붙인 도구 줄을 그린다", () => {
    renderAt("/dev/s03?case=ready")
    const cutting = screen.getByRole("region", { name: "이미지 커팅" })
    const save = within(cutting).getByRole("button", { name: "저장" })
    for (const name of ["취소", "확인"]) expect(within(cutting).getByRole("button", { name })).toBeInTheDocument()

    const toolButtons = TOOLS.map((name) => within(cutting).getByRole("button", { name }))
    // 도구 줄은 SCAS 버튼(… 취소 · 확인 · 저장) 뒤에 덧붙이고, 순서는 표대로
    expect(before(save, toolButtons[0])).toBe(true)
    for (let i = 1; i < toolButtons.length; i++) expect(before(toolButtons[i - 1], toolButtons[i])).toBe(true)
  })

  it("SCAS 아래 버튼 줄은 이름 · 순서 그대로이고, 신규 끄기면 「되돌리기」를 맨 끝에 덧붙인다(1차 자리)", () => {
    renderAt("/dev/s03?case=ready&plus=0")
    const row = screen.getByRole("group", { name: "SCAS 아래 버튼 줄" })
    const names = within(row)
      .getAllByRole("button")
      .map((b) => b.textContent)
    expect(names).toEqual([...SCAS_BOTTOM, "되돌리기"])
  })

  it("신규 켜기면 「되돌리기」는 시안처럼 편집 이력 머리로 옮기고, 누르면 이력 한 줄이 빠진다", () => {
    renderAt("/dev/s03?case=ready")
    const row = screen.getByRole("group", { name: "SCAS 아래 버튼 줄" })
    expect(within(row).getAllByRole("button").map((b) => b.textContent)).toEqual(SCAS_BOTTOM)
    const history = screen.getByRole("region", { name: "편집 이력" })
    expect(within(history).getAllByRole("listitem")).toHaveLength(3)
    fireEvent.click(within(history).getByRole("button", { name: "되돌리기" }))
    expect(within(history).getAllByRole("listitem")).toHaveLength(2)
  })

  it("SCAS 버튼 중 지금 기능이 없는 것은 비활성이고 「준비 중」 안내가 붙는다", () => {
    renderAt("/dev/s03?case=ready")
    const row = screen.getByRole("group", { name: "SCAS 아래 버튼 줄" })
    const flip = within(row).getByRole("button", { name: "좌우반전" })
    expect(flip).toBeDisabled()
    expect(flip.closest("[title='준비 중']")).not.toBeNull()
  })

  it("이진화를 누르면 모드 5개 · 임계값 · 적용이 나온다", () => {
    renderAt("/dev/s03?case=ready")
    fireEvent.click(screen.getByRole("button", { name: "이진화" }))
    const modes = screen.getByRole("group", { name: "이진화 모드" })
    expect(within(modes).getAllByRole("button").map((b) => b.textContent)).toEqual([
      "이진(표준)",
      "이진(반전)",
      "절단",
      "제로화",
      "제로화(반전)",
    ])
    expect(screen.getByLabelText("이진화 임계값")).toBeInTheDocument()
    // AI 제안 칸에도 「적용」이 있어 도구 설정 줄 안에서 찾는다
    expect(within(screen.getByRole("group", { name: "도구 설정" })).getByRole("button", { name: "적용" })).toBeInTheDocument()
  })

  it("도구 버튼은 제어형이라 누르면 눌림 표시가 옮겨 간다", () => {
    renderAt("/dev/s03?case=ready")
    const measure = screen.getByRole("button", { name: "길이 측정" })
    expect(measure).toHaveAttribute("aria-pressed", "false")
    fireEvent.click(measure)
    expect(screen.getByRole("button", { name: "길이 측정" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText(/P1 · P2 = 1 cm/)).toBeInTheDocument()
  })

  it("캔버스 칸의 도구 장식은 누름을 막지 않는다(pointer-events-none)", () => {
    const { container } = renderAt("/dev/s03?case=ready")
    const crop = container.querySelector("[data-deco='crop-frame']")
    expect(crop).not.toBeNull()
    expect(crop!.closest(".pointer-events-none")).not.toBeNull()
  })

  it("B 이미지 뷰어(A 옆 나란히)에 보정 밝기 · 대비 · 감마 · 임계값 · 반전 · 흑백이 있고 값이 바뀐다", () => {
    renderAt("/dev/s03?case=ready")
    const viewer = screen.getByRole("region", { name: "이미지 뷰어" })
    for (const label of ["밝기", "대비", "감마", "임계값"]) {
      expect(within(viewer).getByLabelText(label)).toBeInTheDocument()
    }
    expect(within(viewer).getByRole("button", { name: "반전" })).toBeInTheDocument()
    expect(within(viewer).getByRole("button", { name: "흑백" })).toBeInTheDocument()

    fireEvent.change(within(viewer).getByLabelText("밝기"), { target: { value: "20" } })
    expect(within(viewer).getByLabelText("밝기")).toHaveValue(20)

    fireEvent.click(within(viewer).getByRole("button", { name: "반전" }))
    expect(within(viewer).getByRole("button", { name: "반전" })).toHaveAttribute("aria-pressed", "true")
    // 보기용이라 저장 버튼이 없다(시안 핀 7)
    expect(within(viewer).queryByRole("button", { name: "저장" })).toBeNull()
  })

  it("running 케이스에 노이즈제거 AiProgress가 돈다", () => {
    const { container } = renderAt("/dev/s03?case=running")
    const bar = screen.getByRole("progressbar", { name: "노이즈제거" })
    expect(bar.closest("[data-part='AiProgress']")).toHaveAttribute("data-part-variant", "running")
    expect(container.querySelector("[data-part='ScanOverlay']")).not.toBeNull()
  })

  it("denoise-failed 케이스는 AiProgress 「실패」와 「다시 실행」을 보이고, 누르면 다시 돈다", () => {
    const { container } = renderAt("/dev/s03?case=denoise-failed")
    const failed = container.querySelector("[data-part='AiProgress']")
    expect(failed).toHaveAttribute("data-part-variant", "failed")
    expect(within(failed as HTMLElement).getByText("실패")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "다시 실행" }))
    expect(container.querySelector("[data-part='AiProgress']")).toHaveAttribute("data-part-variant", "running")
  })

  it("불러오는 중 · 실패 때는 B 이미지 뷰어 창을 띄우지 않는다(시안처럼 ready 에서 A · B 두 창)", () => {
    for (const c of ["loading", "error"]) {
      const { unmount } = renderAt(`/dev/s03?case=${c}`)
      expect(screen.queryByRole("region", { name: "이미지 뷰어" })).toBeNull()
      unmount()
    }
    renderAt("/dev/s03?case=ready")
    expect(screen.getByRole("region", { name: "이미지 커팅" })).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "이미지 뷰어" })).toBeInTheDocument()
  })

  it("움직임 줄이기: AI 움직임 클래스는 motion-safe: 로만 걸린다", () => {
    const { container } = renderAt("/dev/s03?case=running")
    const animated = Array.from(container.querySelectorAll("[class*='animate-']"))
    expect(animated.length).toBeGreaterThan(0)
    for (const el of animated) {
      const bare = el
        .getAttribute("class")!
        .split(/\s+/)
        .filter((c) => c.startsWith("animate-"))
      expect(bare).toEqual([])
    }
  })

  it("loading 케이스는 aria-busy=\"true\"", () => {
    const { container } = renderAt("/dev/s03?case=loading")
    expect(container.querySelector("[aria-busy='true']")).not.toBeNull()
  })

  it("error 케이스는 「다시」 버튼이 있고 「결과 없음」이 없다", () => {
    renderAt("/dev/s03?case=error")
    expect(screen.getByRole("button", { name: "다시" })).toBeInTheDocument()
    expect(screen.queryByText(/결과 없음/)).toBeNull()
    expect(screen.getByText("확인 못 함")).toBeInTheDocument()
  })

  it("readonly 보기에서 「저장」 · 「확인」 · 도구 버튼이 disabled", () => {
    renderAt("/dev/s03?case=ready&as=readonly")
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "확인" })).toBeDisabled()
    for (const name of TOOLS) expect(screen.getByRole("button", { name })).toBeDisabled()
  })

  it("「저장」을 누르면 보는 사람을 유지한 채 S04로 간다", () => {
    renderAt("/dev/s03?case=ready&as=admin")
    fireEvent.click(screen.getByRole("button", { name: "저장" }))
    expect(screen.getByTestId("landing")).toHaveTextContent("/dev/s04?as=admin")
  })
})

describe("S03DevPage — 시안 r2 신규 기능 · 연출", () => {
  it("?plus=0 이면 [data-plus] 가 하나도 없고 1차 내용(A 커팅 · B 원본/보정 · 보정 칸)은 그대로 있다", () => {
    const { container } = renderAt("/dev/s03?case=ready&plus=0")
    expect(container.querySelectorAll("[data-plus]")).toHaveLength(0)
    const cutting = screen.getByRole("region", { name: "이미지 커팅" })
    for (const name of [...TOOLS, "취소", "확인", "저장", "맞춤", "100%"]) {
      expect(within(cutting).getByRole("button", { name })).toBeInTheDocument()
    }
    const viewer = screen.getByRole("region", { name: "이미지 뷰어" })
    expect(within(viewer).getByText("원본")).toBeInTheDocument()
    expect(within(viewer).getByText("보정")).toBeInTheDocument()
    for (const label of ["밝기", "대비", "감마", "임계값"]) expect(within(viewer).getByLabelText(label)).toBeInTheDocument()
    expect(screen.queryByText("AI 제안")).toBeNull()
    expect(screen.queryByText("발견 이미지 · 305659")).toBeNull()
    // 시안 목업 설명 줄(A · 1차 작업 / B · 2차 작업)도 신규 연출 — 끄면 없다
    expect(screen.queryByText(/A · 1차 작업 —/)).toBeNull()
    expect(screen.queryByText(/B · 2차 작업 —/)).toBeNull()
  })

  it("신규 켜기(기본)면 시안 목업 설명 줄 A · B 가 보인다", () => {
    renderAt("/dev/s03?case=ready")
    expect(screen.getByText("A · 1차 작업 — 사건관리 팝업에서 족윤적 이미지를 누를 때")).toBeInTheDocument()
    expect(screen.getByText("B · 2차 작업 — 검색 중 이미지를 두 번 누를 때")).toBeInTheDocument()
  })

  it("신규 켜기(기본)면 [data-plus] 가 있고 끄기와 달리 보인다", () => {
    const { container } = renderAt("/dev/s03?case=ready")
    expect(container.querySelectorAll("[data-plus]").length).toBeGreaterThan(0)
  })

  it("A 오른쪽 칸: AI 제안 3줄 · 원본 → 편집본 · 편집 이력 + 원본 해시(시안 문구 그대로)", () => {
    renderAt("/dev/s03?case=ready")
    const ai = screen.getByRole("region", { name: "AI 제안" })
    expect(within(ai).getByText("누르면 반영")).toBeInTheDocument()
    for (const [title, reason, action] of [
      ["기울기 맞추기", "족적 축 −4.2°", "맞추기"],
      ["족적만 자르기", "여백 6% 남김", "적용"],
      ["좌우반전", "전사판채취법 사진", "반전"],
    ]) {
      expect(within(ai).getByText(title)).toBeInTheDocument()
      expect(within(ai).getByText(reason)).toBeInTheDocument()
      expect(within(ai).getByRole("button", { name: action })).toBeEnabled()
    }
    expect(within(ai).getByRole("button", { name: "반전" })).toHaveAttribute("data-part-variant", "sm-warn")

    const ba = screen.getByRole("region", { name: "원본 → 편집본" })
    expect(within(ba).getByText("받은 그대로")).toBeInTheDocument()
    expect(within(ba).getByText("저장될 모습")).toBeInTheDocument()

    const history = screen.getByRole("region", { name: "편집 이력" })
    expect(within(history).getByText("좌로 4° 회전")).toBeInTheDocument()
    expect(within(history).getByText("자르기 1,088×2,964")).toBeInTheDocument()
    expect(within(history).getByText("좌우반전(전사판)")).toBeInTheDocument()
    expect(within(history).getByText("원본 보관 · SHA-256")).toBeInTheDocument()
    expect(within(history).getByText("9f3a 71c0 … 4be2 c21e")).toBeInTheDocument()
    expect(within(history).getByText("저장하면 편집본 해시와 이 이력이 사용 기록(S14)에 남습니다")).toBeInTheDocument()
  })

  it("AI 제안 「맞추기」를 누르면 편집 이력에 한 줄이 더해진다(진열 페이지 제어형)", () => {
    renderAt("/dev/s03?case=ready")
    const ai = screen.getByRole("region", { name: "AI 제안" })
    fireEvent.click(within(ai).getByRole("button", { name: "맞추기" }))
    const history = screen.getByRole("region", { name: "편집 이력" })
    expect(within(history).getAllByRole("listitem")).toHaveLength(4)
    expect(within(history).getByText("기울기 맞추기 −4.2° → 0°")).toBeInTheDocument()
  })

  it("A 캔버스 칸에 자 인식 · AI 족적 축 꼬리표가 있고, 시안처럼 사진 훑기 선이 돈다", () => {
    renderAt("/dev/s03?case=ready")
    const cutting = screen.getByRole("region", { name: "이미지 커팅" })
    expect(within(cutting).getByText("📏 자 인식 · 1 cm = 120 px")).toBeInTheDocument()
    expect(within(cutting).getByText("AI · 족적 축 −4.2°")).toBeInTheDocument()
    expect(cutting.querySelector("[data-part='ScanOverlay']")).not.toBeNull()
  })

  it("SCAS 아래 줄 「좌우반전」을 전사판 추천으로 주황 표시한다(비활성 · 준비 중은 그대로)", () => {
    renderAt("/dev/s03?case=ready")
    const flip = within(screen.getByRole("group", { name: "SCAS 아래 버튼 줄" })).getByRole("button", { name: "좌우반전" })
    expect(flip).toHaveAttribute("data-part-variant", "sm-warn")
    expect(flip).toBeDisabled()
  })

  it("B 뷰어: 유류 · 발견 이미지 두 장, 십자선 · ×4 돋보기, 보기 방식 나란히/겹쳐 보기/밀어서 비교", () => {
    renderAt("/dev/s03?case=ready")
    const viewer = screen.getByRole("region", { name: "이미지 뷰어" })
    expect(within(viewer).getByText("유류 이미지 · _2")).toBeInTheDocument()
    expect(within(viewer).getByText("발견 이미지 · 305659")).toBeInTheDocument()
    expect(within(viewer).getAllByText("십자선 함께 움직임").length).toBeGreaterThan(0)
    expect(viewer.querySelectorAll("[data-deco='crosshair']")).toHaveLength(2)
    expect(viewer.querySelector("[data-deco='loupe']")).not.toBeNull()
    for (const el of viewer.querySelectorAll("[data-deco]")) expect(el.closest(".pointer-events-none")).not.toBeNull()

    const modes = within(viewer).getByRole("group", { name: "보기 방식" })
    expect(within(modes).getAllByRole("button").map((b) => b.textContent)).toEqual(["나란히", "겹쳐 보기", "밀어서 비교"])
    fireEvent.click(within(modes).getByRole("button", { name: "겹쳐 보기" }))
    expect(viewer.querySelector("[data-part='CompareView']")).toHaveAttribute("data-part-variant", "overlay")
    fireEvent.click(within(modes).getByRole("button", { name: "밀어서 비교" }))
    expect(within(viewer).getByRole("slider", { name: "밀어서 비교" })).toBeInTheDocument()
    expect(within(viewer).getByRole("group", { name: "함께 확대 · 이동" })).toBeInTheDocument()
  })

  it("B 보정 칸은 시안 −[값]+ 모양이고, + 를 누르면 값이 오르고 켜진 보기가 칩으로 보인다", () => {
    renderAt("/dev/s03?case=ready")
    const viewer = screen.getByRole("region", { name: "이미지 뷰어" })
    fireEvent.click(within(viewer).getByRole("button", { name: "밝기 높이기" }))
    expect(within(viewer).getByLabelText("밝기")).toHaveValue(5)
    expect(within(viewer).getByText("밝기 +5")).toBeInTheDocument()
    fireEvent.click(within(viewer).getByRole("button", { name: "밝기 낮추기" }))
    expect(within(viewer).getByLabelText("밝기")).toHaveValue(0)
  })

  it("B 「✦ 이 화면 그대로 AI 문양 다시 추출 → S04」를 누르면 S04로 간다", () => {
    renderAt("/dev/s03?case=ready&as=analyst")
    fireEvent.click(screen.getByRole("button", { name: "✦ 이 화면 그대로 AI 문양 다시 추출 → S04" }))
    expect(screen.getByTestId("landing")).toHaveTextContent("/dev/s04?as=analyst")
  })

  it("보는 사람: 기술책임자는 「기술책임자 · 보기만」 칩이 보이고 「저장」 · AI 다시 추출이 잠긴다", () => {
    renderAt("/dev/s03?case=ready&as=verifier")
    expect(screen.getByText("기술책임자 · 보기만")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "✦ 이 화면 그대로 AI 문양 다시 추출 → S04" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "AI 보정 ▾ 이진화·노이즈 제거" })).toBeDisabled()
  })

  it("보는 사람: 감정관은 칩이 없고 모두 누를 수 있다 · 수사관은 저장은 되고 AI 다시 추출은 잠긴다", () => {
    const { unmount } = renderAt("/dev/s03?case=ready&as=analyst")
    expect(screen.queryByText("기술책임자 · 보기만")).toBeNull()
    expect(screen.getByRole("button", { name: "저장" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "✦ 이 화면 그대로 AI 문양 다시 추출 → S04" })).toBeEnabled()
    unmount()
    renderAt("/dev/s03?case=ready&as=investigator")
    expect(screen.queryByText("기술책임자 · 보기만")).toBeNull()
    expect(screen.getByRole("button", { name: "저장" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "✦ 이 화면 그대로 AI 문양 다시 추출 → S04" })).toBeDisabled()
  })

  it("움직임 줄이기: ready 의 AI 움직임(훑기 선 · 실시간 점)은 motion-safe: 로만 걸려 멈추면 끝난 모양이다", () => {
    const { container } = renderAt("/dev/s03?case=ready")
    const animated = Array.from(container.querySelectorAll("[class*='animate-']"))
    // (2회차 검수: 십자선 연동 표시는 AI 가 아니라 실시간 점을 뺐다 — 남은 AI 움직임만 센다)
    expect(animated.length).toBeGreaterThanOrEqual(2)
    for (const el of animated) {
      const bare = el
        .getAttribute("class")!
        .split(/\s+/)
        .filter((c) => c.startsWith("animate-"))
      expect(bare).toEqual([])
    }
    // 훑기 선의 멈춘 모양 = 안 보임(top-full · opacity-0)
    const scan = container.querySelector("[data-part='ScanOverlay']")!
    expect(scan.className).toContain("opacity-0")
    expect(scan.className).toContain("top-full")
  })
})
