import { describe, expect, it, vi } from "vitest"
import { fireEvent, render } from "@testing-library/react"

import type { ImageSearchResultItem, SearchResultScreenProps } from "../model/types"
import { SearchWindow } from "./SearchWindow"

// 사건 창 검색 결과 — 카드 두 번 누름 = 정밀 대조(11/17 사용자 「검색결과 더블 클릭하면 바로 정밀 대조 나오게는 못하나?」).
// 첫 누름이 본 위치를 올려 「여기까지 봤음」 줄이 옮겨 가면(본 것 거르기면 카드가 빠지면) 카드가 밀려
// 두 번째 누름이 옆 카드에 떨어진다 — 그래도 첫 누름의 카드를 연다.

const RESULTS: ImageSearchResultItem[] = Array.from({ length: 8 }, (_, i) => ({
  ftwrId: `0${100 + i}`,
  image: `/shoes_images/B/0${100 + i}.png`,
  similarity: 90 - i,
}))

function renderWindow(over: Partial<SearchResultScreenProps> = {}) {
  const props: SearchResultScreenProps = {
    status: "ready",
    onRetry: vi.fn(),
    isAdmin: false,
    features: ["CRIME_SEARCH", "EXAM_DECIDE"],
    imageNo: "05019-24-0017_2",
    sceneImage: "/scene.png",
    results: RESULTS,
    totalCount: RESULTS.length,
    page: 1,
    pageSize: RESULTS.length,
    onPageChange: vi.fn(),
    imageMode: "이진화보기",
    onImageModeChange: vi.fn(),
    onOpenResult: vi.fn(),
    inWindow: true,
    showPlus: false,
    columns: 5,
    onFocusChange: vi.fn(),
    ...over,
  }
  const view = render(
    <div className="h-[800px]">
      <SearchWindow {...props} />
    </div>
  )
  const card = (rank: number) => view.container.querySelector(`[data-result-card][data-rank="${rank}"]`) as HTMLElement
  return { props, card, view }
}

describe("SearchWindow — 카드 두 번 누름 = 정밀 대조", () => {
  it.each([1, 3, 5])("%i개 보기: 같은 카드를 두 번 누르면 그 카드로 정밀 대조(한 번 누름은 고름만)", (per) => {
    const { props, card } = renderWindow({ columns: per as 1 | 3 | 5 })
    fireEvent.click(card(3), { detail: 1 })
    expect(props.onFocusChange).toHaveBeenLastCalledWith(3)
    expect(props.onOpenResult).not.toHaveBeenCalled()
    fireEvent.click(card(3), { detail: 2 })
    fireEvent.doubleClick(card(3))
    expect(props.onOpenResult).toHaveBeenCalledTimes(1)
    expect(props.onOpenResult).toHaveBeenCalledWith(RESULTS[2], 3)
  })

  it("첫 누름 뒤 카드가 밀려 두 번째 누름이 옆 카드에 떨어져도 첫 카드를 연다(고름도 그대로)", () => {
    const { props, card } = renderWindow()
    fireEvent.click(card(4), { detail: 1 })
    // 「여기까지 봤음」 줄이 옮겨 가 카드 5 가 손 밑으로 — 두 번째 누름 · 두 번 누름이 5 에 떨어짐
    fireEvent.click(card(5), { detail: 2 })
    fireEvent.doubleClick(card(5))
    expect(props.onFocusChange).toHaveBeenCalledTimes(1)
    expect(props.onFocusChange).toHaveBeenLastCalledWith(4)
    expect(props.onOpenResult).toHaveBeenCalledWith(RESULTS[3], 4)
  })

  it("본 것 거르기 · 「여기까지 봤음」 줄 위에 떨어진 두 번 누름도 첫 카드로", () => {
    const { props, card, view } = renderWindow({ seen: { upTo: 2, at: "11-17 10:00" } })
    fireEvent.click(card(2), { detail: 1 })
    const line = view.container.querySelector("[data-seen-line]") as HTMLElement
    fireEvent.doubleClick(line)
    expect(props.onOpenResult).toHaveBeenCalledWith(RESULTS[1], 2)
  })

  it("★ 단추 · 오래된 첫 누름은 정밀 대조로 가지 않는다 · Enter 는 그대로 정밀 대조", () => {
    const now = vi.spyOn(Date, "now")
    now.mockReturnValue(1_000)
    const { props, card, view } = renderWindow()
    fireEvent.click(card(1), { detail: 1 })
    const star = view.container.querySelector("[data-star]") as HTMLElement
    fireEvent.doubleClick(star)
    expect(props.onOpenResult).not.toHaveBeenCalled()
    now.mockReturnValue(5_000)
    fireEvent.doubleClick(card(1))
    expect(props.onOpenResult).not.toHaveBeenCalled()
    now.mockRestore()
    fireEvent.keyDown(card(6), { key: "Enter" })
    expect(props.onOpenResult).toHaveBeenCalledWith(RESULTS[5], 6)
  })

  it("고르기 전 바닥 줄에 두 번 누름 안내", () => {
    const { view } = renderWindow()
    expect(view.container).toHaveTextContent("두 번 누르면 바로 정밀 대조")
  })
})
