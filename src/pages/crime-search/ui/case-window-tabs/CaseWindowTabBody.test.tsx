import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { http, HttpResponse } from "msw"

import { useCrimeStore } from "@/entities/crime"
import type { FeatureCode } from "@/entities/session"
import { useSessionStore } from "@/features/auth"
import { mswServer } from "@/test/msw-server"

import { CaseWindowTabBody, type CaseWindowTabKey } from "./index"

// 이미지 처리(services/api — 무변환 계층)만 목. 나머지는 서버 B 단계 API 를 MSW 로(A1 no= · A2 · B3 · C1 · D2 · G1 · A3 · A8)
const api = vi.hoisted(() => ({
  imageLoad: vi.fn(async () => "data:image/png;base64,SCENE"),
  imageSearch: vi.fn(async () => ({
    result: [
      { ftwrId: "00758", image: "/shoes_images/B/00758.png", similarity: 0.7 },
      { ftwrId: "01234", image: "/shoes_images/B/01234.png", similarity: 0.5 },
    ],
    total: 2,
  })),
}))
vi.mock("@/services/api", async (orig) => ({
  ...(await orig<typeof import("@/services/api")>()),
  imageLoad: api.imageLoad,
  imageSearch: api.imageSearch,
}))

// jsdom 에는 ResizeObserver 가 없다(PatternCanvas · 편집 캔버스)
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver ?? (ResizeObserverStub as unknown as typeof ResizeObserver)

beforeAll(() => mswServer.listen({ onUnhandledRequest: "error" }))
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())

const CASE_NO = "05019-24-0017"

const image = (no: number, extra: Record<string, unknown> = {}) => ({
  aprthng_no: `${CASE_NO}_${no}`,
  apprsl_reqest_no: CASE_NO,
  pick_dt: "2024-07-24T09:12:00+09:00",
  pick_place: no === 2 ? "현관 앞" : "거실",
  pick_mth_code: "전사판",
  aprthng_knd_code: null,
  pickman_clss_code: null,
  pickman_nm: null,
  makr_code: null,
  brand_code: null,
  cl_code: null,
  swing_se: null,
  heel_exst_at: null,
  vhcle_cl_code: null,
  vhcle_code: null,
  ftwr_tire_se: null,
  frst_regist_dt: "2026-11-10T09:00:00+09:00",
  frst_register_id: "u1",
  no,
  kind: "shoe",
  aprthng_sttus: "SEARCHED",
  img_sttus: "검색됨",
  thumb_url: `/crime_images/${CASE_NO}_${no}.png`,
  working_file_id: 4,
  has_original: true,
  row_version: 1,
  ...extra,
})

function detail(over: Record<string, unknown> = {}) {
  return {
    rqest_id: 41,
    data_src_se: "APP",
    apprsl_reqest_no: CASE_NO,
    rqest_round: 1,
    rqest_org_id: 7,
    rqest_org_etc_nm: null,
    occrrnc_org_id: null,
    process_org_id: null,
    scas_case_no: "SC-1",
    doc_no: "문서-9",
    crime_se_code: null,
    crime_nm: "주거침입 절도",
    crime_begin_dt: null,
    crime_end_dt: null,
    crime_adres: null,
    crime_place_code: null,
    crime_smry_cn: null,
    victim_nm: null,
    victim_brthy: null,
    suspect_exst_at: "N",
    arrest_sttus_code: null,
    rqest_charger_nm: null,
    ftwr_tire_se: null,
    rm: null,
    rqest_sttus: "RECEIVED",
    frst_regist_dt: "2026-11-10T09:00:00+09:00",
    frst_register_id: "u1",
    last_updt_dt: null,
    last_updusr_id: null,
    row_version: 3,
    rqest_org_nm: "종로경찰서",
    occrrnc_org_nm: null,
    process_org_nm: null,
    flow_stage: 1,
    flow: null,
    images: [image(1), image(2)],
    cross_review: null,
    report: null,
    info_blanks: 0,
    ...over,
  }
}

const EDITS = { original: null, working_file_id: 4, current_file_id: 4, legacy: false, items: [] }

function serve(over: Record<string, unknown> = {}) {
  mswServer.use(
    http.get("*/requests", () => HttpResponse.json({ items: [{ rqest_id: 41, apprsl_reqest_no: CASE_NO }], next_cursor: null })),
    http.get("*/requests/:id", () => HttpResponse.json(detail(over))),
    http.get("*/crime/:no/edits", () => HttpResponse.json(EDITS))
  )
}

function login(features: FeatureCode[], roles: string[] = ["EXAMINER"]) {
  useSessionStore.setState({
    user: { userId: "analyst", userNm: "감정관", userSe: "USER", features, roles, passwordChangeRequired: false },
    status: "authenticated",
  } as never)
}

/** 사건 창 사건 정보 탭의 「현장 이미지 정보」 쪽으로 */
const openImageInfo = () => fireEvent.click(screen.getByRole("tab", { name: /현장 이미지 정보/ }))

function renderTab(tab: CaseWindowTabKey, imageNo: string | null = `${CASE_NO}_2`) {
  const onSelectTab = vi.fn()
  const onSelectImage = vi.fn()
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
      <div className="h-[800px]">
        <CaseWindowTabBody aprthngNo={CASE_NO} imageNo={imageNo} tab={tab} onSelectTab={onSelectTab} onSelectImage={onSelectImage} />
      </div>
    </QueryClientProvider>
  )
  return { onSelectTab, onSelectImage }
}

describe("CaseWindowTabBody — 사건 창 탭 본문(의뢰 상세 A2 · 전역 store 안 씀)", () => {
  beforeEach(() => {
    login(["CRIME_SEARCH", "CRIME_REGISTER", "EXAM_DECIDE"])
    vi.clearAllMocks()
  })

  it("옛 전역 store 가 비어 있어도 A2 로 그린다 — 읽는 동안은 불러오는 중", async () => {
    serve()
    useCrimeStore.setState({ crimeData: [] })
    renderTab("info")
    expect(screen.getByText("사건을 불러오는 중…")).toBeInTheDocument()
    expect(await screen.findByDisplayValue("주거침입 절도")).toBeInTheDocument()
    expect(screen.getByDisplayValue("문서-9")).toBeInTheDocument()
    openImageInfo()
    expect(screen.getByDisplayValue("현관 앞")).toBeInTheDocument()
  })

  it("사건 정보: 고칠 수 있으면 저장 한 번에 사건 칸(A3) → 바뀐 장 칸(A8) 순서로, 기대 판 번호를 싣는다", async () => {
    serve()
    const calls: [string, unknown][] = []
    mswServer.use(
      http.put("*/requests/:id", async ({ request, params }) => {
        calls.push([`A3 ${String(params.id)}`, await request.json()])
        return HttpResponse.json({ row_version: 4 })
      }),
      http.put("*/crime/:no/info", async ({ request, params }) => {
        calls.push([`A8 ${String(params.no)}`, await request.json()])
        return HttpResponse.json({ row_version: 2 })
      })
    )
    renderTab("info")
    fireEvent.change(await screen.findByDisplayValue("주거침입 절도"), { target: { value: "야간 주거침입" } })
    openImageInfo()
    fireEvent.change(screen.getByDisplayValue("현관 앞"), { target: { value: "현관 계단" } })
    fireEvent.click(screen.getByRole("button", { name: "저장" }))
    await waitFor(() => expect(calls).toHaveLength(2))
    expect(calls).toEqual([
      ["A3 41", { rowVersion: 3, crimeNm: "야간 주거침입" }],
      [`A8 ${CASE_NO}_2`, { rowVersion: 1, pickPlace: "현관 계단" }],
    ])
  })

  it("사건 정보: 409 면 서버 문구를 폼 위 오류 줄에", async () => {
    serve()
    mswServer.use(http.put("*/requests/:id", () => HttpResponse.json({ detail: "다른 사람이 먼저 고쳤습니다" }, { status: 409 })))
    renderTab("info")
    fireEvent.change(await screen.findByDisplayValue("주거침입 절도"), { target: { value: "x" } })
    fireEvent.click(screen.getByRole("button", { name: "저장" }))
    expect(await screen.findByText("다른 사람이 먼저 고쳤습니다")).toBeInTheDocument()
  })

  it("사건 정보: 수사관은 접수된 사건을 고칠 수 없다(저장 줄 없음 · 읽기 전용)", async () => {
    login(["CASE_STATUS_VIEW", "CRIME_REGISTER"], [])
    serve()
    renderTab("info")
    expect(await screen.findByDisplayValue("주거침입 절도")).toHaveAttribute("readonly")
    expect(screen.queryByRole("button", { name: "저장" })).toBeNull()
  })

  it("이미지 편집: 창 모드 1차 편집 + 서버 편집 이력 칸(B3)", async () => {
    serve()
    renderTab("edit")
    expect(await screen.findByRole("region", { name: "편집 이력" })).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "이미지 편집" })).toHaveAttribute("data-slot", "image-edit-window")
  })

  it("정밀 대조: 검색 결과에서 신발을 고르기 전이면 안내", async () => {
    serve()
    renderTab("compare")
    expect(await screen.findByText("검색 결과 탭에서 대조할 신발을 고르세요.")).toBeInTheDocument()
  })

  it("결과 확인: 줄 끝 「열기」가 그 이미지 · 탭(판정 전 = 검색 결과)으로", async () => {
    serve()
    mswServer.use(
      http.get("*/requests/:id/confirm", () =>
        HttpResponse.json({
          rqest_id: 41,
          rqest_sttus: "IN_EXAM",
          flow_stage: 2,
          rows: [
            {
              no: 2,
              aprthng_no: `${CASE_NO}_2`,
              kind: "shoe",
              thumb_url: null,
              aprthng_sttus: "SEARCHED",
              search_no: 7002,
              judgement: null,
              opinion_cn: null,
              exam_id: null,
              exam_round: null,
              exam_sttus: null,
              row_version: null,
              shoe: null,
              more_targets: 0,
              note: null,
            },
          ],
          cross_review: null,
          locked_reason: null,
        })
      ),
      http.get("*/requests/:id/reviewers", () => HttpResponse.json([]))
    )
    const { onSelectImage, onSelectTab } = renderTab("confirm")
    fireEvent.click(await screen.findByRole("button", { name: "_2 열기" }))
    expect(onSelectImage).toHaveBeenCalledWith(`${CASE_NO}_2`)
    expect(onSelectTab).toHaveBeenCalledWith("search")
  })

  it("검색 결과(기록 없음): 서버 문양(C1)의 필수만 실어 한 번 검색하고, 0~1 유사도를 퍼센트로", async () => {
    serve()
    mswServer.use(
      http.get("*/crime/:no", () => HttpResponse.json([])),
      http.get("*/crime/:no/patterns", () =>
        HttpResponse.json({
          top: [["s21b", 1]],
          mid: [["n32_04", 0]],
          bottom: [],
          outline: [],
          meta: { top: {}, mid: {}, bottom: {}, outline: {} },
          sole_text: null,
          extracted_raw: null,
          row_version: 1,
        })
      )
    )
    renderTab("search")
    await waitFor(() => expect(api.imageSearch).toHaveBeenCalledTimes(1))
    const call = api.imageSearch.mock.calls[0] as unknown as [{ aprthngNo: string; body: Record<string, unknown>; page: number }]
    expect(call[0].aprthngNo).toBe(`${CASE_NO}_2`)
    expect(call[0].body).toMatchObject({ image: "data:image/png;base64,SCENE", top: ["s21b"], mid: [] })
    expect(await screen.findByText("70%")).toBeInTheDocument()
    await new Promise((r) => setTimeout(r, 350))
    expect(api.imageSearch).toHaveBeenCalledTimes(1)
  })

  it("검색 결과(기록 없음): 카드는 썸네일 · lazy, 이진화 ↔ 원본 토글은 다시 검색하지 않고 그림 폴더만 바꾼다", async () => {
    serve()
    mswServer.use(http.get("*/crime/:no", () => HttpResponse.json([])))
    renderTab("search")
    await waitFor(() => expect(api.imageSearch).toHaveBeenCalledTimes(1))
    const card = await screen.findByAltText("신발 00758 밑창")
    // 기본 5개 보기(196px 칸) · 이진화보기(B 폴더) → 썸네일, 화면 밖이면 나중에 받기
    expect(card).toHaveAttribute("src", "/shoes_thumbs/00758.webp")
    expect(card).toHaveAttribute("loading", "lazy")
    expect(card).toHaveAttribute("decoding", "async")
    // 썸네일이 없으면(404) 원본으로 저절로
    fireEvent.error(card)
    await waitFor(() => expect(screen.getByAltText("신발 00758 밑창")).toHaveAttribute("src", "/shoes_images/B/00758.png"))
    fireEvent.click(screen.getByRole("button", { name: "원본" }))
    await waitFor(() =>
      expect(screen.getByAltText("신발 01234 밑창")).toHaveAttribute("src", "/shoes_images/Shoerinsics/01234.png")
    )
    await new Promise((r) => setTimeout(r, 350))
    expect(api.imageSearch).toHaveBeenCalledTimes(1) // 토글은 화면 전용 — 검색 POST 반복 없음(예전에는 다시 나감)
  })

  it("없는 사건이면 찾을 수 없음", async () => {
    mswServer.use(http.get("*/requests", () => HttpResponse.json({ items: [], next_cursor: null })))
    renderTab("pattern")
    expect(await screen.findByText("사건을 찾을 수 없습니다.")).toBeInTheDocument()
  })
})
