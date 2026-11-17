import * as React from "react"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"

import type { FeatureCode } from "@/entities/session"
import { useSessionStore } from "@/features/auth"
import { mswServer } from "@/test/msw-server"

import { targetKey, useTargetsBinding } from "./use-targets-binding"

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

const item = (search_no: number, ftwr_id: string, excluded = false) => ({
  search_no, ftwr_id, rank_no: 1, similarity: 88, pattern_score: null, excluded, from: "search",
})
const list = (...items: ReturnType<typeof item>[]) => ({ exam_id: 3, exam_sttus: "DRAFT", row_version: 2, items })

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe("useTargetsBinding — 확인대상 ★(E2 · E3 · E4)", () => {
  it("뺀 기록은 빼고 지금 확인대상만 키 집합으로", async () => {
    login(["CRIME_SEARCH", "EXAM_DECIDE"])
    mswServer.use(http.get("*/crime/:no/targets", () => HttpResponse.json(list(item(7, "00758"), item(7, "00759", true)))))
    const { result } = renderHook(() => useTargetsBinding(NO), { wrapper })
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect([...result.current.targets]).toEqual([targetKey(7, "00758")])
    expect(result.current.canToggle).toBe(true)
  })

  it("없으면 E3(POST · from), 있으면 E4(DELETE)", async () => {
    login(["CRIME_SEARCH", "EXAM_DECIDE"])
    const calls: string[] = []
    let posted: unknown = null
    mswServer.use(
      http.get("*/crime/:no/targets", () => HttpResponse.json(list(item(7, "00758")))),
      http.post("*/crime/:no/targets", async ({ request }) => {
        posted = await request.json()
        calls.push("POST")
        return HttpResponse.json(list(item(7, "00758"), item(7, "00777")))
      }),
      http.delete("*/crime/:no/targets/:s/:f", ({ params }) => {
        calls.push(`DELETE ${params.s}/${params.f}`)
        return HttpResponse.json(list())
      })
    )
    const { result } = renderHook(() => useTargetsBinding(NO), { wrapper })
    await waitFor(() => expect(result.current.ready).toBe(true))
    act(() => result.current.toggleTarget(7, "00777", "compare"))
    await waitFor(() => expect(posted).toEqual({ searchNo: 7, ftwrId: "00777", from: "compare" }))
    await waitFor(() => expect(result.current.canToggle).toBe(true))
    act(() => result.current.toggleTarget(7, "00758", "search"))
    await waitFor(() => expect(calls).toContain("DELETE 7/00758"))
  })

  it("서버 거절 문구를 error 로(교차 검증 중 409)", async () => {
    login(["CRIME_SEARCH", "EXAM_DECIDE"])
    mswServer.use(
      http.get("*/crime/:no/targets", () => HttpResponse.json(list())),
      http.post("*/crime/:no/targets", () => HttpResponse.json({ detail: "교차 검증이 시작된 사건입니다" }, { status: 409 }))
    )
    const { result } = renderHook(() => useTargetsBinding(NO), { wrapper })
    await waitFor(() => expect(result.current.ready).toBe(true))
    act(() => result.current.toggleTarget(7, "00758", "search"))
    await waitFor(() => expect(result.current.error).toBe("교차 검증이 시작된 사건입니다"))
  })

  it("보기 전용(EXAM_VIEW)은 읽기만 — ★를 바꿀 수 없다", async () => {
    login(["EXAM_VIEW"])
    mswServer.use(http.get("*/crime/:no/targets", () => HttpResponse.json(list(item(7, "00758")))))
    const { result } = renderHook(() => useTargetsBinding(NO), { wrapper })
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.canToggle).toBe(false)
    act(() => result.current.toggleTarget(7, "00758", "search")) // 요청이 나가면 onUnhandledRequest 로 실패
  })

  it("확인대상을 볼 권한이 없으면 부르지 않고 준비 전", () => {
    login(["CASE_STATUS_VIEW"])
    const { result } = renderHook(() => useTargetsBinding(NO), { wrapper })
    expect(result.current.ready).toBe(false)
    expect(result.current.canToggle).toBe(false)
  })
})
