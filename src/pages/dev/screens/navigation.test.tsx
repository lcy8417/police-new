import { fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { S01DevPage } from "./s01"
import { S02DevPage } from "./s02"

// 화면 간 이동 연결 점검(Task 11 Step 1): 좌측 메뉴 → 신발 · 관리 화면, 사건 상세 → 이미지 편집.
// 나머지 고리(S01→S02, S02→S04, S03→S04, S04→S05, S05→S06, S06→S07)는 각 진열 페이지 테스트가 본다.
function Where() {
  const { pathname, search } = useLocation()
  return <p data-testid="where">{pathname + search}</p>
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/dev/s01" element={<S01DevPage />} />
        <Route path="/dev/s02" element={<S02DevPage />} />
        <Route path="/dev/*" element={<Where />} />
      </Routes>
    </MemoryRouter>
  )
}

describe("화면 간 이동", () => {
  it("S02 「이미지 커팅 열기」는 /dev/s03 으로 이동하고 보는 사람을 유지한다", () => {
    renderAt("/dev/s02?id=00001-25-0649&case=ready&as=analyst")
    fireEvent.click(screen.getByRole("button", { name: "이미지 커팅 열기" }))
    expect(screen.getByTestId("where").textContent).toMatch(/^\/dev\/s03\?.*as=analyst/)
  })

  // 11/17: 위 막대 「신발 DB」 = 사건관리 위 슬라이드 패널(`?shoe=1`) — Esc · ✕ 로 닫는다
  it("S01 막대 「신발 DB」는 페이지를 옮기지 않고 신발 DB 패널을 열고, ✕ 로 닫는다", () => {
    renderAt("/dev/s01?as=analyst")
    fireEvent.click(screen.getByRole("link", { name: "신발 DB" }))
    expect(screen.queryByTestId("where")).toBeNull()
    const panel = screen.getByRole("dialog", { name: "신발 DB" })
    expect(within(panel).queryByRole("button", { name: "앞 사건" })).toBeNull()
    fireEvent.click(within(panel).getByRole("button", { name: "창 닫기" }))
    expect(screen.queryByRole("dialog", { name: "신발 DB" })).toBeNull()
  }, 15_000)

  it("관리자 막대 「관리 ▾ › 사용자 관리」는 /dev/s13 으로 이동한다", () => {
    renderAt("/dev/s01?as=admin")
    fireEvent.keyDown(screen.getByRole("button", { name: "관리" }), { key: "Enter" })
    fireEvent.click(screen.getByRole("menuitem", { name: "사용자 관리" }))
    expect(screen.getByTestId("where").textContent).toBe("/dev/s13?as=admin")
  })
})
