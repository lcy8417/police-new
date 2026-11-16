import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { MOCK_ACTIONS, MOCK_LOG_USERS, MOCK_SESSIONS, MOCK_TIMELINES } from "./mock-cases"

import { AdminLogsScreen, type AdminLogsScreenProps } from "@/widgets/admin-logs-screen"


const base = (over: Partial<AdminLogsScreenProps> = {}): AdminLogsScreenProps => ({
  status: "ready",
  onRetry: vi.fn(),
  isAdmin: true,
  tab: "sessions",
  onTabChange: vi.fn(),
  filters: { userId: "", from: "", to: "", result: "", actionCode: "" },
  onFiltersChange: vi.fn(),
  onResetFilters: vi.fn(),
  users: MOCK_LOG_USERS,
  actions: MOCK_ACTIONS,
  sessions: MOCK_SESSIONS,
  events: [],
  timelines: MOCK_TIMELINES,
  onRetryTimeline: vi.fn(),
  expandedSessionIds: [],
  onToggleSession: vi.fn(),
  page: 1,
  onPageChange: vi.fn(),
  ...over,
})

describe("AdminLogsScreen 펼침(제어형) · 쪽 넘김", () => {
  it("행을 누르면 onToggleSession(id, true) 로 알리고 스스로는 펼치지 않는다", () => {
    const onToggleSession = vi.fn()
    render(<AdminLogsScreen {...base({ onToggleSession })} />)
    fireEvent.click(screen.getAllByRole("button", { name: "기능 기록 펼치기" })[0])
    expect(onToggleSession).toHaveBeenCalledWith("sess-0001", true)
    expect(screen.queryByRole("list", { name: "이 로그인의 기능 기록" })).toBeNull()
  })

  it("expandedSessionIds 에 든 세션은 타임라인이 보이고 누르면 접으라고 알린다", () => {
    const onToggleSession = vi.fn()
    render(<AdminLogsScreen {...base({ expandedSessionIds: ["sess-0001"], onToggleSession })} />)
    expect(within(screen.getByRole("list", { name: "이 로그인의 기능 기록" })).getAllByText("성공").length).toBeGreaterThan(0)
    fireEvent.click(screen.getAllByRole("button", { name: "기능 기록 펼치기" })[0])
    expect(onToggleSession).toHaveBeenCalledWith("sess-0001", false)
  })

  it("빈 뒤쪽 쪽에서도 쪽 넘김이 남아 이전으로 돌아갈 수 있다", () => {
    const onPageChange = vi.fn()
    render(<AdminLogsScreen {...base({ status: "empty", sessions: [], page: 2, onPageChange })} />)
    expect(screen.getByText("결과 없음")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /이전/ }))
    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it("첫 쪽이 빈 결과면 쪽 넘김은 없다", () => {
    render(<AdminLogsScreen {...base({ status: "empty", sessions: [], page: 1 })} />)
    expect(screen.queryByRole("button", { name: /다음/ })).toBeNull()
  })
})
