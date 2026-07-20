import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"

import { mswServer } from "@/test/msw-server"
import type { MatchCorrespondence } from "@/entities/match"
import { MatchCorrespondenceViewer } from "./MatchCorrespondenceViewer"

// jsdom에는 ResizeObserver가 없다 — no-op 폴리필(AlignmentCaptureCanvas.test.tsx와 동일 관례).
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
beforeAll(() => {
  globalThis.ResizeObserver =
    globalThis.ResizeObserver ?? (ResizeObserverStub as unknown as typeof ResizeObserver)
  mswServer.listen({ onUnhandledRequest: "error" })
})
afterEach(() => {
  mswServer.resetHandlers()
  vi.unstubAllGlobals()
})
afterAll(() => mswServer.close())

/** naturalWidth/Height + getBoundingClientRect를 스텁하고 load 이벤트를 발생시킨다. */
function stubImageLoad(
  img: HTMLImageElement,
  natural: { width: number; height: number },
  display: { width: number; height: number }
) {
  Object.defineProperty(img, "naturalWidth", { value: natural.width, configurable: true })
  Object.defineProperty(img, "naturalHeight", { value: natural.height, configurable: true })
  Object.defineProperty(img, "complete", { value: true, configurable: true })
  img.getBoundingClientRect = () =>
    ({
      width: display.width,
      height: display.height,
      left: 0,
      top: 0,
      right: display.width,
      bottom: display.height,
      x: 0,
      y: 0,
      toJSON() {},
    }) as DOMRect
  fireEvent.load(img)
}

function makeMatch(i: number): MatchCorrespondence {
  return {
    fx: 100 + i * 10,
    fy: 200 + i * 10,
    sx: 50 + i * 5,
    sy: 60 + i * 5,
    score: 0.9 - i * 0.05,
    box: { cx: 100 + i * 10, cy: 200 + i * 10, size: 96 },
    box_image: `data:image/png;base64,CROP${i}`,
  }
}

/** 정렬 GET을 기본으로 폴리곤 없음(레거시 폴백 경로)으로 스텁한다 — 개별 테스트가
 * 필요하면 `mswServer.use(...)`로 덮어쓴다. */
function stubNoAlignment() {
  mswServer.use(
    http.get("*/crime/*/alignment", () =>
      HttpResponse.json({ polygon: null, arrow: null, flipHorizontal: false })
    )
  )
}

/** 기본 측정값(원본 400x400, 표시 200x200) — 박스 오버레이가 렌더되도록 두 이미지의
 * load 이벤트를 즉시 발생시킨다(jsdom은 실제 이미지를 로드하지 않으므로 명시 스텁 필요).
 * 정렬 조회가 비동기이므로 이미지가 나타날 때까지 기다린다(폴리곤 없음 폴백 경로). */
async function renderViewer(count = 3) {
  stubNoAlignment()
  const matches = Array.from({ length: count }, (_, i) => makeMatch(i))
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
      <MatchCorrespondenceViewer crimeNumber="2024-100" modelNumber="SHOE-1" matches={matches} />
    </QueryClientProvider>
  )
  const sceneImg = await screen.findByAltText("족적 현장 이미지")
  const shoeImg = screen.getByAltText(/신발 이미지/) as HTMLImageElement
  stubImageLoad(sceneImg as HTMLImageElement, { width: 400, height: 400 }, { width: 200, height: 200 })
  stubImageLoad(shoeImg, { width: 400, height: 400 }, { width: 200, height: 200 })
  return matches
}

describe("MatchCorrespondenceViewer — 족적↔신발 대응 뷰어 레이아웃", () => {
  it("족적(현장)·신발(등록) 전체 이미지를 각각 렌더한다(alt 텍스트 확인)", async () => {
    await renderViewer(3)
    expect(screen.getByAltText("족적 현장 이미지")).toBeInTheDocument()
    expect(screen.getByAltText(/신발 이미지 \(등록 모델 SHOE-1\)/)).toBeInTheDocument()
  })

  it("기본 모드(RGB)에서 현장 이미지 src는 crime_images, 신발 이미지 src는 shoes_images/B를 가리킨다", async () => {
    await renderViewer(2)
    const base = import.meta.env.VITE_API_URL ?? ""
    expect(screen.getByAltText("족적 현장 이미지")).toHaveAttribute(
      "src",
      `${base}/crime_images/2024-100.png`
    )
    expect(screen.getByAltText(/신발 이미지/)).toHaveAttribute(
      "src",
      `${base}/shoes_images/B/SHOE-1.png`
    )
  })

  it("[CORRECTION 3a] 스케치·이진 모드로 전환하면 현장은 crime_outlines, 신발은 shoes_images/Shoerinsics를 가리킨다", async () => {
    await renderViewer(2)
    const base = import.meta.env.VITE_API_URL ?? ""

    fireEvent.click(screen.getByRole("button", { name: "스케치·이진" }))

    await waitFor(() =>
      expect(screen.getByAltText("족적 현장 이미지")).toHaveAttribute(
        "src",
        `${base}/crime_outlines/2024-100.png`
      )
    )
    expect(screen.getByAltText(/신발 이미지/)).toHaveAttribute(
      "src",
      `${base}/shoes_images/Shoerinsics/SHOE-1.png`
    )
  })

  it("대응마다 족적·신발 양쪽에 번호 박스를 렌더한다(matches.length * 2)", async () => {
    await renderViewer(4)
    const boxes = screen.getAllByRole("button", { name: /대응 \d+번 박스/ })
    expect(boxes).toHaveLength(8)
  })

  it("박스를 클릭하면 반대편 이미지의 같은 번호 박스도 함께 선택 강조된다(양방향 연동)", async () => {
    await renderViewer(3)

    const rank2Buttons = screen.getAllByRole("button", { name: "대응 2번 박스" })
    expect(rank2Buttons).toHaveLength(2) // 족적측 1개 + 신발측 1개

    fireEvent.click(rank2Buttons[0])

    for (const btn of screen.getAllByRole("button", { name: "대응 2번 박스" })) {
      expect(btn).toHaveAttribute("aria-pressed", "true")
    }
    for (const btn of screen.getAllByRole("button", { name: "대응 1번 박스" })) {
      expect(btn).toHaveAttribute("aria-pressed", "false")
    }
    // [CORRECTION 2] 우측 목록의 같은 순위 행도 함께 선택 강조된다.
    expect(screen.getByRole("button", { name: "대응 2번 행 선택" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
  })

  it("호버는 잠금(locked)을 덮어써 임시로 대응을 강조하지만, 마우스가 벗어나면 잠금 선택으로 복귀한다", async () => {
    await renderViewer(3)
    const rank3Scene = screen.getAllByRole("button", { name: "대응 3번 박스" })[0]

    fireEvent.mouseEnter(rank3Scene)
    expect(screen.getByRole("button", { name: "대응 3번 행 선택" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )

    fireEvent.mouseLeave(rank3Scene)
    // 클릭으로 잠근 적이 없으므로 기본 선택(1위)으로 복귀한다.
    expect(screen.getByRole("button", { name: "대응 1번 행 선택" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
  })

  it("측정된 표시 크기·원본 크기로 박스 오버레이의 표시 좌표(left/top/width/height)를 정확히 계산한다", async () => {
    await renderViewer(1)
    const sceneFigure = screen.getByTestId("match-scene-image")
    const img = within(sceneFigure).getByAltText("족적 현장 이미지") as HTMLImageElement

    // 원본 1000x1000, 표시 500x500 → scale 0.5. makeMatch(0).fx=100,fy=200, box.size=96.
    stubImageLoad(img, { width: 1000, height: 1000 }, { width: 500, height: 500 })

    const box = within(sceneFigure).getByRole("button", { name: "대응 1번 박스" })
    expect(box).toHaveStyle({ width: "48px", height: "48px" })
    // 표시 중심 = (50,100) → left = 50-24=26, top = 100-24=76.
    expect(box).toHaveStyle({ left: "26px", top: "76px" })
  })

  // 회귀 방지: `scaleBoxToDisplay`가 돌려주는 left/top은 "이미지 좌상단 기준"이다.
  // 예전에는 박스를 <figure>(가운데 정렬 flex 컨테이너) 기준으로 절대배치해, 세로로 긴
  // 신발 이미지가 figure보다 좁게 렌더되면 좌우 여백의 절반만큼 박스가 통째로 밀려
  // 검은 배경 위에 찍혔다. 박스의 offset parent는 이미지를 감싼 래퍼여야 한다.
  it("박스의 offset parent는 figure가 아니라 이미지를 감싼 래퍼다(좌우 여백만큼 밀리지 않도록)", async () => {
    const matches = await renderViewer(3)

    for (const [testId, alt] of [
      ["match-scene-image", "족적 현장 이미지"],
      ["match-shoe-image", /신발 이미지/],
    ] as const) {
      const figure = screen.getByTestId(testId)
      const img = within(figure).getByAltText(alt as string | RegExp)
      const wrapper = img.parentElement!

      // 래퍼는 figure 자신이 아니며(한 겹 더 안쪽), position:relative 기준이 된다.
      expect(wrapper).not.toBe(figure)
      expect(wrapper.className).toContain("relative")
      // 모든 번호 박스가 그 래퍼 안에 있다 — 즉 이미지와 같은 좌표 기준을 공유한다.
      expect(within(wrapper).getAllByRole("button", { name: /대응 \d+번 박스/ })).toHaveLength(
        matches.length
      )
    }
  })

  it("이미지 로드 실패 시 대체 안내를 표시하고 박스를 렌더하지 않는다", async () => {
    await renderViewer(1)
    const sceneFigure = screen.getByTestId("match-scene-image")
    const img = within(sceneFigure).getByAltText("족적 현장 이미지")

    fireEvent.error(img)

    expect(within(sceneFigure).getByText("이미지 없음")).toBeInTheDocument()
    expect(within(sceneFigure).queryByRole("button", { name: /대응/ })).toBeNull()
  })
})

describe("MatchCorrespondenceViewer — [CORRECTION 2] 우측 목록이 top-10 전체를 짝으로 비교한다", () => {
  it("우측에 DetailPanel(단일 선택) 대신 여러 행의 목록이 렌더된다", async () => {
    await renderViewer(3)
    expect(screen.getByRole("button", { name: "대응 1번 행 선택" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "대응 2번 행 선택" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "대응 3번 행 선택" })).toBeInTheDocument()
  })

  it("각 행에 족적 크롭(box_image)이 렌더된다", async () => {
    await renderViewer(2)
    expect(screen.getByAltText("대응 1번 족적 크롭")).toHaveAttribute(
      "src",
      "data:image/png;base64,CROP0"
    )
    expect(screen.getByAltText("대응 2번 족적 크롭")).toHaveAttribute(
      "src",
      "data:image/png;base64,CROP1"
    )
  })

  it("각 행에 순위별 score(%)가 표시된다", async () => {
    await renderViewer(2)
    expect(screen.getByText("90%")).toBeInTheDocument() // makeMatch(0).score=0.9
    expect(screen.getByText("85%")).toBeInTheDocument() // makeMatch(1).score=0.85
  })
})

describe("MatchCorrespondenceViewer — [CORRECTION 3b] 정렬 폴리곤 크롭 + 좌우 반전", () => {
  const POLYGON = [
    [100, 200],
    [300, 200],
    [300, 500],
    [100, 500],
  ]

  it("정렬 폴리곤이 있으면 정렬 조회가 끝날 때까지 로딩 표시를 보인 뒤 크롭된 이미지를 표시한다", async () => {
    mswServer.use(
      http.get("*/crime/*/alignment", () =>
        HttpResponse.json({ polygon: POLYGON, arrow: [[100, 350], [300, 350]], flipHorizontal: false })
      )
    )
    const matches = [makeMatch(0)]
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={qc}>
        <MatchCorrespondenceViewer crimeNumber="2024-100" modelNumber="SHOE-1" matches={matches} />
      </QueryClientProvider>
    )

    // 정렬 조회 + 캔버스 크롭(jsdom은 Image.decode 미지원 → 크롭 실패 → 원본 폴백)이
    // 끝나면 최종적으로 이미지(로딩 아님)가 나타난다.
    await waitFor(() => expect(screen.getByAltText("족적 현장 이미지")).toBeInTheDocument())
  })

  it("정렬 폴리곤이 없으면(레거시 폴백) 크롭 없이 원본 이미지를 그대로 보여준다", async () => {
    await renderViewer(1)
    const base = import.meta.env.VITE_API_URL ?? ""
    expect(screen.getByAltText("족적 현장 이미지")).toHaveAttribute(
      "src",
      `${base}/crime_images/2024-100.png`
    )
  })
})
