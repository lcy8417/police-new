import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"

import { mswServer } from "@/test/msw-server"
import { AlignmentGate } from "./AlignmentGate"

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
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())

function renderGate(crimeNumber: string, modelNumber: string, onProceed = () => {}) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <AlignmentGate crimeNumber={crimeNumber} modelNumber={modelNumber} onProceed={onProceed} />
    </QueryClientProvider>
  )
}

function stubImageLoad(img: HTMLImageElement, width = 400, height = 300) {
  Object.defineProperty(img, "naturalWidth", { value: width, configurable: true })
  Object.defineProperty(img, "naturalHeight", { value: height, configurable: true })
  img.getBoundingClientRect = () =>
    ({
      width: 200,
      height: 150,
      left: 0,
      top: 0,
      right: 200,
      bottom: 150,
      x: 0,
      y: 0,
      toJSON() {},
    }) as DOMRect
  fireEvent.load(img)
}

describe("AlignmentGate — 필수 게이트(REQ-ALIGN-001a: 스킵 경로 부재)", () => {
  beforeEach(() => {
    mswServer.use(
      http.get("*/crime/*/alignment", () =>
        HttpResponse.json({ polygon: null, arrow: null, flipHorizontal: false })
      )
    )
  })

  it("건너뛰기/스킵/나중에 류의 버튼이 존재하지 않는다", async () => {
    renderGate("2024-100", "SHOE-1")
    await waitFor(() => expect(screen.queryByText("정렬 정보를 불러오는 중…")).toBeNull())

    for (const forbidden of [/건너뛰기/, /스킵/, /skip/i, /나중에/]) {
      expect(screen.queryByText(forbidden)).toBeNull()
    }
  })

  it("미설정 상태에서는 '다음 단계로' 버튼이 비활성화된다", async () => {
    renderGate("2024-100", "SHOE-1")
    await waitFor(() => expect(screen.queryByText("정렬 정보를 불러오는 중…")).toBeNull())

    const proceedButton = screen.getByRole("button", { name: /다음 단계로/ })
    expect(proceedButton).toBeDisabled()
  })

  it("이미지 로드 시 밑창 템플릿이 자동으로 채워져 '다음: 방향 지정'이 곧바로 활성화된다(AC-ALIGN-026)", async () => {
    renderGate("2024-100", "SHOE-1")
    await waitFor(() => expect(screen.queryByText("정렬 정보를 불러오는 중…")).toBeNull())

    const img = screen.getByAltText("정렬용 저장 현장 이미지") as HTMLImageElement
    stubImageLoad(img)

    const nextButton = screen.getByRole("button", { name: /다음: 방향 지정/ })
    expect(nextButton).not.toBeDisabled()
  })

  it("템플릿 → 방향 지정(앞굽/뒤꿈치) → 저장 → 다음 단계로 전체 흐름이 동작한다", async () => {
    mswServer.use(
      http.post("*/crime/2024-100/alignment", async ({ request }) => {
        const body = (await request.json()) as {
          polygon: number[][]
          arrow: number[][]
          flipHorizontal: boolean
        }
        return HttpResponse.json(body)
      })
    )
    let proceeded = false
    renderGate("2024-100", "SHOE-1", () => {
      proceeded = true
    })
    await waitFor(() => expect(screen.queryByText("정렬 정보를 불러오는 중…")).toBeNull())

    const img = screen.getByAltText("정렬용 저장 현장 이미지") as HTMLImageElement
    stubImageLoad(img)

    fireEvent.click(screen.getByRole("button", { name: /다음: 방향 지정/ }))
    expect(screen.getByText(/앞굽\(toe\)을 클릭하세요/)).toBeInTheDocument()

    const surface = screen.getByTestId("alignment-surface")
    fireEvent.click(surface, { clientX: 5, clientY: 5 })
    expect(screen.getByText(/뒤꿈치\(heel\)를 클릭하세요/)).toBeInTheDocument()
    fireEvent.click(surface, { clientX: 15, clientY: 15 })

    const saveButton = screen.getByRole("button", { name: /^저장$/ })
    await waitFor(() => expect(saveButton).not.toBeDisabled())
    fireEvent.click(saveButton)

    const proceedButton = screen.getByRole("button", { name: /다음 단계로/ })
    await waitFor(() => expect(proceedButton).not.toBeDisabled())

    fireEvent.click(proceedButton)
    expect(proceeded).toBe(true)
  })

  it("'처음부터 그리기'를 누르면 템플릿이 비워지고 클릭 그리기로 전환된다(REQ-ALIGN-017)", async () => {
    renderGate("2024-100", "SHOE-1")
    await waitFor(() => expect(screen.queryByText("정렬 정보를 불러오는 중…")).toBeNull())
    const img = screen.getByAltText("정렬용 저장 현장 이미지") as HTMLImageElement
    stubImageLoad(img)

    fireEvent.click(screen.getByRole("button", { name: /처음부터 그리기/ }))
    // 템플릿이 비워졌으므로 방향 지정으로 넘어갈 수 없다(3점 미만).
    expect(screen.getByRole("button", { name: /다음: 방향 지정/ })).toBeDisabled()

    const surface = screen.getByTestId("alignment-surface")
    fireEvent.click(surface, { clientX: 10, clientY: 10 })
    fireEvent.click(surface, { clientX: 30, clientY: 10 })
    fireEvent.click(surface, { clientX: 30, clientY: 30 })
    expect(screen.getByRole("button", { name: /다음: 방향 지정/ })).not.toBeDisabled()
  })

  it("좌우 반전 토글이 눌리면 aria-pressed와 안내 배너가 반영된다(REQ-ALIGN-020a)", async () => {
    renderGate("2024-100", "SHOE-1")
    await waitFor(() => expect(screen.queryByText("정렬 정보를 불러오는 중…")).toBeNull())

    const flipButton = screen.getByRole("button", { name: /좌우 반전/ })
    expect(flipButton).toHaveAttribute("aria-pressed", "false")
    fireEvent.click(flipButton)
    expect(flipButton).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByText(/반전 미리보기/)).toBeInTheDocument()
  })
})

describe("AlignmentGate — 복원(REQ-ALIGN-008/020b)", () => {
  it("저장된 정렬 + 반전 상태를 복원하고 review 단계로 진입한다", async () => {
    mswServer.use(
      http.get("*/crime/2024-200/alignment", () =>
        HttpResponse.json({
          polygon: [
            [10, 10],
            [50, 10],
            [50, 40],
          ],
          arrow: [
            [20, 20],
            [40, 30],
          ],
          flipHorizontal: true,
        })
      )
    )
    renderGate("2024-200", "SHOE-9")
    await waitFor(() => expect(screen.queryByText("정렬 정보를 불러오는 중…")).toBeNull())

    expect(screen.getByRole("button", { name: /다음 단계로/ })).not.toBeDisabled()
    expect(screen.getByRole("button", { name: /좌우 반전/ })).toHaveAttribute("aria-pressed", "true")
  })
})

// ─── 직전 정렬 이어받기(같은 사건, 다른 신발) ───
// 폴리곤·화살표는 `저장 현장 이미지 좌표계`에만 정의된 값이라 후보 신발이 바뀌어도
// 동일하다. 새 후보를 열 때마다 재작도하게 만들지 않는 것이 이 기능의 목적이다.
describe("AlignmentGate — 직전 정렬 이어받기", () => {
  const POLY = [
    [10, 10],
    [110, 10],
    [110, 210],
    [10, 210],
  ]
  const ARROW = [
    [60, 20],
    [60, 200],
  ]

  it("이 쌍에 저장본이 없으면 같은 사건의 직전 정렬을 이어받아 자동 저장한다", async () => {
    let saved: unknown = null
    mswServer.use(
      http.get("*/crime/*/alignment/latest", () =>
        HttpResponse.json({ polygon: POLY, arrow: ARROW, flipHorizontal: true, modelNumber: "PREV-1" })
      ),
      http.get("*/crime/*/alignment", () =>
        HttpResponse.json({ polygon: null, arrow: null, flipHorizontal: false })
      ),
      http.post("*/crime/*/alignment", async ({ request }) => {
        saved = await request.json()
        return HttpResponse.json({ polygon: POLY, arrow: ARROW, flipHorizontal: true })
      })
    )
    renderGate("2024-300", "SHOE-NEW")
    const img = await screen.findByAltText("정렬용 저장 현장 이미지")
    stubImageLoad(img as HTMLImageElement)

    // 이어받은 정렬이 이 쌍으로 자동 저장된다 -> 게이트 통과 가능 상태가 된다.
    await waitFor(() => expect(saved).not.toBeNull())
    expect(saved).toMatchObject({ polygon: POLY, arrow: ARROW, flipHorizontal: true })
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /다음 단계로/ })).not.toBeDisabled()
    )
  })

  it("이 쌍에 저장본이 있으면 이어받지 않고 저장본을 복원한다(복원 우선)", async () => {
    let posted = false
    const OWN = [
      [1, 1],
      [50, 1],
      [50, 50],
    ]
    mswServer.use(
      http.get("*/crime/*/alignment/latest", () =>
        HttpResponse.json({ polygon: POLY, arrow: ARROW, flipHorizontal: true, modelNumber: "PREV-1" })
      ),
      http.get("*/crime/*/alignment", () =>
        HttpResponse.json({ polygon: OWN, arrow: ARROW, flipHorizontal: false })
      ),
      http.post("*/crime/*/alignment", () => {
        posted = true
        return HttpResponse.json({ polygon: OWN, arrow: ARROW, flipHorizontal: false })
      })
    )
    renderGate("2024-301", "SHOE-OWN")
    const img = await screen.findByAltText("정렬용 저장 현장 이미지")
    stubImageLoad(img as HTMLImageElement)

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /다음 단계로/ })).not.toBeDisabled()
    )
    expect(posted).toBe(false) // 저장본이 있으므로 이어받기 저장이 일어나지 않는다
  })

  // 회귀 방지: 배포 순서상 프런트가 먼저 올라가면 /latest가 404다. 그때도 정렬 화면은
  // 정상 동작해야 한다(밑창 템플릿 시드). 예전에는 조회 대기 가드에 걸려 캔버스가 빈 채로 멈췄다.
  it("/latest가 없는 구버전 백엔드(404)에서도 밑창 템플릿이 정상 시드된다", async () => {
    mswServer.use(
      http.get("*/crime/*/alignment/latest", () => new HttpResponse(null, { status: 404 })),
      http.get("*/crime/*/alignment", () =>
        HttpResponse.json({ polygon: null, arrow: null, flipHorizontal: false })
      )
    )
    renderGate("2024-302", "SHOE-X")
    const img = await screen.findByAltText("정렬용 저장 현장 이미지")
    stubImageLoad(img as HTMLImageElement)

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /다음: 방향 지정/ })).not.toBeDisabled()
    )
  })

  // 회귀 방지(핵심): 이미지 로드가 /latest 응답보다 먼저 끝나는 경합.
  // 예전에는 시드가 이미지 로드 콜백에서 1회만 실행돼, 그 시점에 조회가 진행 중이면
  // 조기 반환한 뒤 다시 호출되지 않아 캔버스가 빈 채로 영영 멈췄다.
  it("이미지가 /latest 응답보다 먼저 로드돼도 결국 템플릿이 시드된다", async () => {
    mswServer.use(
      http.get("*/crime/*/alignment/latest", async () => {
        await new Promise((r) => setTimeout(r, 300)) // 이미지 로드보다 늦게 응답
        return HttpResponse.json({ polygon: null, arrow: null, flipHorizontal: false, modelNumber: null })
      }),
      http.get("*/crime/*/alignment", () =>
        HttpResponse.json({ polygon: null, arrow: null, flipHorizontal: false })
      )
    )
    renderGate("2024-303", "SHOE-RACE")
    const img = await screen.findByAltText("정렬용 저장 현장 이미지")
    stubImageLoad(img as HTMLImageElement) // 조회가 아직 진행 중인 시점에 로드 완료

    await waitFor(
      () => expect(screen.getByRole("button", { name: /다음: 방향 지정/ })).not.toBeDisabled(),
      { timeout: 3000 }
    )
  })
})
