import * as React from "react"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"

import type { FeatureCode } from "@/entities/session"
import { useSessionStore } from "@/features/auth"
import { mswServer } from "@/test/msw-server"

import { useCompareTarget } from "./use-compare-target"

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
afterEach(() => {
  mswServer.resetHandlers()
  useSessionStore.setState({ user: null, status: "loading" })
})
afterAll(() => mswServer.close())

const NO = "00089-26-0080_1"

function login(features: FeatureCode[]) {
  useSessionStore.getState().setUser({ userId: "u1", userNm: "감정관", userSe: "USER", features, passwordChangeRequired: false })
}

const item = (search_no: number, ftwr_id: string) => ({
  search_no, ftwr_id, rank_no: 1, similarity: 88, pattern_score: null, excluded: false, from: "search",
})
const list = (...items: ReturnType<typeof item>[]) => ({ exam_id: 3, exam_sttus: "DRAFT", row_version: 2, items })

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe("useCompareTarget — 정밀 대조 「확인대상」(E3 from compare) 뒤에 결과 확인으로", () => {
  it("[검수] 확인대상이 아니면 E3(POST from=compare)로 저장한 뒤 true", async () => {
    login(["CRIME_SEARCH", "EXAM_DECIDE"])
    let posted: unknown = null
    mswServer.use(
      http.get("*/crime/:no/targets", () => HttpResponse.json(list())),
      http.post("*/crime/:no/targets", async ({ request }) => {
        posted = await request.json()
        return HttpResponse.json(list(item(7, "00758")))
      })
    )
    const { result } = renderHook(() => useCompareTarget(NO), { wrapper })
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.canConfirm).toBe(true)
    await expect(result.current.confirm({ ftwrId: "00758", rank: 1, similarity: 88, searchNo: 7 })).resolves.toEqual({ ok: true })
    expect(posted).toEqual({ searchNo: 7, ftwrId: "00758", from: "compare" })
  })

  it("이미 확인대상이면 다시 보내지 않고(빼지 않음) true", async () => {
    login(["CRIME_SEARCH", "EXAM_DECIDE"])
    mswServer.use(http.get("*/crime/:no/targets", () => HttpResponse.json(list(item(7, "00758"))))) // POST 오면 onUnhandledRequest
    const { result } = renderHook(() => useCompareTarget(NO), { wrapper })
    await waitFor(() => expect(result.current.ready).toBe(true))
    await expect(result.current.confirm({ ftwrId: "00758", rank: 1, similarity: 88, searchNo: 7 })).resolves.toEqual({ ok: true })
  })

  it("검색 기록 없는 후보 · 서버 거절은 안내 문구와 함께 false", async () => {
    login(["CRIME_SEARCH", "EXAM_DECIDE"])
    mswServer.use(
      http.get("*/crime/:no/targets", () => HttpResponse.json(list())),
      http.post("*/crime/:no/targets", () => HttpResponse.json({ detail: "교차 검증 중인 사건입니다" }, { status: 409 }))
    )
    const { result } = renderHook(() => useCompareTarget(NO), { wrapper })
    await waitFor(() => expect(result.current.ready).toBe(true))
    const none = await result.current.confirm({ ftwrId: "00758", rank: 1, similarity: 88 })
    expect(none.ok).toBe(false)
    expect(none.ok === false && none.message).toMatch(/검색 기록/)
    const refused = await result.current.confirm({ ftwrId: "00758", rank: 1, similarity: 88, searchNo: 7 })
    expect(refused).toEqual({ ok: false, message: "교차 검증 중인 사건입니다" })
  })

  it("판정 권한(EXAM_DECIDE)이 없으면 확인대상을 정할 수 없다", async () => {
    login(["CRIME_SEARCH"])
    mswServer.use(http.get("*/crime/:no/targets", () => HttpResponse.json(list())))
    const { result } = renderHook(() => useCompareTarget(NO), { wrapper })
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.canConfirm).toBe(false)
  })
})
