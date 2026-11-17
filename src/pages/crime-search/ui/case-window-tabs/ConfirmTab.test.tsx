import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"

import type { FeatureCode } from "@/entities/session"
import { useSessionStore } from "@/features/auth"
import { mswServer } from "@/test/msw-server"

import { ConfirmTab } from "./ConfirmTab"

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
afterEach(() => {
  mswServer.resetHandlers()
  useSessionStore.setState({ user: null, status: "loading" })
})
afterAll(() => mswServer.close())

const NO = "00089-26-0080"

function login(features: FeatureCode[], userId = "exm_req") {
  useSessionStore
    .getState()
    .setUser({ userId, userNm: "감정관", userSe: "USER", features, passwordChangeRequired: false })
}

const EXAMINER: FeatureCode[] = ["CRIME_SEARCH", "EXAM_DECIDE", "CROSS_REVIEW", "CASE_STATUS_VIEW"]

const row = (no: number, extra: Record<string, unknown> = {}) => ({
  no,
  aprthng_no: `${NO}_${no}`,
  kind: "shoe",
  thumb_url: `/crime_images/${NO}_${no}.png`,
  aprthng_sttus: "SEARCHED",
  search_no: 7000 + no,
  judgement: null,
  opinion_cn: null,
  exam_id: null,
  exam_round: null,
  exam_sttus: null,
  row_version: null,
  shoe: null,
  more_targets: 0,
  note: null,
  ...extra,
})

function confirmBody(over: Record<string, unknown> = {}) {
  return {
    rqest_id: 41,
    rqest_sttus: "IN_EXAM",
    flow_stage: 2,
    rows: [
      row(1, {
        exam_id: 11,
        exam_round: 1,
        exam_sttus: "DRAFT",
        row_version: 3,
        shoe: { ftwr_id: "00758", search_no: 7001, score: 89.5, pattern_score: null, ranking: 1, confirmed: false },
      }),
      row(2, { judgement: "notFound", exam_id: 12, exam_round: 1, exam_sttus: "CONFIRMED", row_version: 2 }),
    ],
    cross_review: null,
    locked_reason: null,
    ...over,
  }
}

function useHandlers(confirm: () => Record<string, unknown>, extra: Parameters<typeof mswServer.use> = []) {
  mswServer.use(
    http.get("*/requests", ({ request }) => {
      expect(new URL(request.url).searchParams.get("no")).toBe(NO)
      return HttpResponse.json({ items: [{ rqest_id: 41, apprsl_reqest_no: NO }], next_cursor: null })
    }),
    http.get("*/requests/:id/confirm", () => HttpResponse.json(confirm())),
    http.get("*/requests/:id/reviewers", () =>
      HttpResponse.json([{ user_id: "exm_rv", user_nm: "김검증", org_nm: "과학수사과" }])
    ),
    ...extra
  )
}

function renderTab(onOpenImage?: (no: string, tab: "search" | "compare") => void) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
      <div className="h-[700px]">
        <ConfirmTab aprthngNo={NO} onOpenImage={onOpenImage} />
      </div>
    </QueryClientProvider>
  )
}

describe("ConfirmTab — 결과 확인(G1) · 판정(G2) · 교차 검증(H1 · H2 · H5)", () => {
  it("불러오는 중 → 실패하면 확인 못 함(빈 목록으로 덮지 않음)", async () => {
    login(EXAMINER)
    mswServer.use(
      http.get("*/requests", () => HttpResponse.json({ items: [{ rqest_id: 41, apprsl_reqest_no: NO }], next_cursor: null })),
      http.get("*/requests/:id/confirm", () => HttpResponse.json({ detail: "x" }, { status: 503 })),
      http.get("*/requests/:id/reviewers", () => HttpResponse.json([]))
    )
    renderTab()
    expect(screen.getByText("판정 목록을 불러오는 중")).toBeInTheDocument()
    expect(await screen.findByText("판정 목록을 확인 못 함")).toBeInTheDocument()
  })

  it("감정번호로 찾은 의뢰가 없으면 확인할 이미지 없음", async () => {
    login(EXAMINER)
    mswServer.use(http.get("*/requests", () => HttpResponse.json({ items: [], next_cursor: null })))
    renderTab()
    expect(await screen.findByText("확인할 이미지가 없습니다")).toBeInTheDocument()
  })

  it("줄을 그리고, 판정 단추는 줄의 판정 번호 · 판 번호를 기대값으로 G2", async () => {
    login(EXAMINER)
    let body: unknown = null
    let confirms = 0
    useHandlers(
      () => {
        confirms += 1
        return confirmBody()
      },
      [
        http.put("*/crime/:no/examination", async ({ request, params }) => {
          expect(params.no).toBe(`${NO}_1`)
          body = await request.json()
          return HttpResponse.json({ exam_id: 11, exam_round: 1, exam_sttus: "CONFIRMED", img_sttus: "발견", row_version: 4,
            rqest_sttus: "IN_EXAM" })
        }),
      ]
    )
    renderTab()
    const first = await screen.findByRole("group", { name: `${NO}_1 판정` })
    expect(within(first).getByText("00758")).toBeInTheDocument()
    expect(within(first).getByText("89.5")).toBeInTheDocument()
    fireEvent.click(within(first).getByRole("button", { name: "발견" }))
    await waitFor(() => expect(body).toEqual({ result: "found", opinionCn: null, expectedExamId: 11, rowVersion: 3 }))
    await waitFor(() => expect(confirms).toBeGreaterThan(1)) // 저장 뒤 다시 읽음
  })

  it("판정이 없는 장은 기대값 둘 다 null, 서버 409 문구는 알림 + 다시 읽기", async () => {
    login(EXAMINER)
    let body: unknown = null
    useHandlers(
      () => confirmBody({ rows: [row(3)] }),
      [
        http.put("*/crime/:no/examination", async ({ request }) => {
          body = await request.json()
          return HttpResponse.json({ detail: "다른 사람이 먼저 고쳤습니다" }, { status: 409 })
        }),
      ]
    )
    renderTab()
    const r = await screen.findByRole("group", { name: `${NO}_3 판정` })
    fireEvent.click(within(r).getByRole("button", { name: "불발견" }))
    await waitFor(() => expect(body).toEqual({ result: "notFound", opinionCn: null, expectedExamId: null, rowVersion: null }))
  })

  it("모든 장 판정 뒤 검증자를 골라 교차 검증 요청(H2), 감정서로는 준비 중으로 잠김", async () => {
    login(EXAMINER)
    let body: unknown = null
    useHandlers(
      () =>
        confirmBody({
          rows: [row(1, { judgement: "unable", exam_id: 11, exam_round: 1, exam_sttus: "CONFIRMED", row_version: 2 })],
        }),
      [
        http.post("*/requests/:id/cross-review", async ({ request, params }) => {
          expect(params.id).toBe("41")
          body = await request.json()
          return HttpResponse.json({ step_id: 5, rqest_sttus: "CROSS_REVIEW", row_version: 4 })
        }),
      ]
    )
    renderTab()
    fireEvent.click(await screen.findByRole("button", { name: "김검증 · 과학수사과" }))
    const request = screen.getByRole("button", { name: "교차 검증 요청" })
    await waitFor(() => expect(request).toBeEnabled())
    fireEvent.click(request)
    await waitFor(() => expect(body).toEqual({ reviewerId: "exm_rv" }))
    const report = screen.getByRole("button", { name: "감정서로" })
    expect(report).toBeDisabled()
    expect(report).toHaveAttribute("title", "감정서 화면 준비 중입니다")
  })

  it("교차 검증 중: 판정 잠김(잠금 사유) · 요청자에게 회수(H5) 단추", async () => {
    login(EXAMINER, "exm_req")
    let withdrawn: unknown = null
    useHandlers(
      () =>
        confirmBody({
          rqest_sttus: "CROSS_REVIEW",
          rows: [row(1, { judgement: "unable", exam_id: 11, exam_round: 1, exam_sttus: "CONFIRMED", row_version: 2 })],
          cross_review: { step_id: 5, sttus: "requested", result_code: null, reviewer_id: "exm_rv", reviewer_nm: "김검증",
            requested_by: "exm_req" },
          locked_reason: "교차 검증 중입니다 — 검증자 화면 준비 중(요청자 · 관리자는 회수할 수 있습니다)",
        }),
      [
        http.post("*/review-steps/:id/withdraw", async ({ request, params }) => {
          expect(params.id).toBe("5")
          withdrawn = await request.json()
          return HttpResponse.json({ result_code: "WITHDRAWN", rqest_sttus: "IN_EXAM" })
        }),
      ]
    )
    renderTab()
    const r = await screen.findByRole("group", { name: `${NO}_1 판정` })
    expect(within(r).getByRole("button", { name: "감정불능" })).toBeDisabled()
    expect(screen.getByText("김검증")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "회수" }))
    await waitFor(() => expect(withdrawn).toEqual({ reasonCn: null }))
  })

  it("요청자가 아닌 감정관에게는 회수 단추가 없다", async () => {
    login(EXAMINER, "someone_else")
    useHandlers(() =>
      confirmBody({
        rqest_sttus: "CROSS_REVIEW",
        cross_review: { step_id: 5, sttus: "requested", result_code: null, reviewer_id: "exm_rv", reviewer_nm: "김검증",
          requested_by: "exm_req" },
        locked_reason: "교차 검증 중",
      })
    )
    renderTab()
    await screen.findByRole("group", { name: `${NO}_1 판정` })
    expect(screen.queryByRole("button", { name: "회수" })).not.toBeInTheDocument()
  })

  it("보기 전용(EXAM_VIEW)은 판정 단추가 잠기고 검증자 후보를 부르지 않는다", async () => {
    login(["EXAM_VIEW", "CASE_STATUS_VIEW"])
    mswServer.use(
      http.get("*/requests", () => HttpResponse.json({ items: [{ rqest_id: 41, apprsl_reqest_no: NO }], next_cursor: null })),
      http.get("*/requests/:id/confirm", () => HttpResponse.json(confirmBody()))
    ) // reviewers 를 부르면 onUnhandledRequest: error 로 실패
    renderTab()
    const r = await screen.findByRole("group", { name: `${NO}_2 판정` })
    expect(within(r).getByRole("button", { name: "불발견" })).toBeDisabled()
  })

  it("열기 단추는 판정 전 = 검색 결과, 발견 = 정밀 대조", async () => {
    login(EXAMINER)
    const open = vi.fn()
    useHandlers(() => confirmBody())
    renderTab(open)
    fireEvent.click(await screen.findByRole("button", { name: "_1 열기" }))
    expect(open).toHaveBeenCalledWith(`${NO}_1`, "search")
  })
})
