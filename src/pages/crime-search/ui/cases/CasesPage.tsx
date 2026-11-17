import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useSearchParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  confirmKeys,
  useRequestDetail,
  useRequestIdByNo,
  useRequestList,
  type RequestListFilters,
  type RequestListItem,
} from "@/entities/request"
import { FEATURES } from "@/entities/session"
import { CASE_VIEW_FEATURES, hasAnyFeature, hasFeature, isAdmin, useSessionStore } from "@/features/auth"
import { useReceiveRequest } from "@/features/case-info"
import { ApiError, backendMediaUrl } from "@/shared/api"
import { useDebouncedValue } from "@/shared/lib"
import type { ScreenStatus } from "@/shared/lib/screen-status"
import { BoardFrame, ListNote, type FilterGroup } from "@/shared/ui/kit"
import { CaseWindowFrame, WindowHead, WorkTabAdd } from "@/shared/ui/panel"
import { usePageHeader } from "@/widgets/app-shell"
import { CaseListScreen, type CaseListRowHeight } from "@/widgets/case-list"
import { CaseWindow, type CaseWindowTab } from "@/widgets/case-window"

import {
  itemMatches,
  pickDetailImage,
  stageLabelOf,
  toCaseListRow,
  toWindowImages,
  toWindowStages,
  windowTabMarks,
} from "../../model/case-rows"
import {
  MAX_OPEN_CASES,
  OPEN_CASES_FULL,
  closeCaseTab,
  openCaseWindow,
  readCaseWindow,
  readOpenTabs,
  stepCaseWindow,
  writeCaseWindow,
  type CaseWindowQuery,
} from "../../model/case-window-query"
import { CaseWindowTabBody } from "./case-window-tab-body"
import { RegisterWindow } from "./RegisterWindow"
import { ShoeDbPanelContainer } from "./ShoeDbPanelContainer"

// 새 사건관리 `/cases`(화면 이식 계획 §1 · §4 ⓪). 시안 S01 조립을 실제 값으로:
//  - 목록 = 서버 A1 `GET /requests`(서버 거르기 · 키셋 쪽 — 전체 건수 · 칩 건수 없음). 기본 최근 한 달 · 앱 사건.
//  - 행을 누르면 사건 창(머리 · 흐름 · 왼쪽 이미지 = A2 `GET /requests/{id}`), 탭 본문은 `CaseWindowTabBody`.
//  - 행 끝 「접수」 = A4(접수 대기 의뢰). 「+ 등록」 = 새 사건 등록 창(`?new=1`, 사건복사 `&copy=<감정번호>`).
//  - 위 막대 「신발 DB」 = 같은 자리 슬라이드 패널(`?shoe=1`, 신발 `&ftwr=<id>`, 새 신발 `&shoeNew=1`).
//  - 사건 보기 권한 없이 신발 권한만 있으면 목록 자리에 안내, 신발 패널은 열어 둔다.
// 전역 사건 store(`useCrimeStore` — `GET /crime/` 전체)는 쓰지 않는다(이식 계획 §5 R1).

const PAGE_SIZE_DEFAULT = 20
/** 서버에서 한 번에 받는 행 수(화면 쪽보다 크게 — 쪽을 넘길 때마다 부르지 않게) */
const SERVER_LIMIT = 50

/** 진행 상태 칩 → 의뢰 상태(A1 `flow`) */
const FLOW_OPTIONS = [
  { value: "REQUESTED", label: "접수 대기" },
  { value: "RECEIVED", label: "1차 작업" },
  { value: "IN_EXAM", label: "검색·판정" },
  { value: "CROSS_REVIEW", label: "교차 검증" },
  { value: "REPORT_DRAFT", label: "감정서" },
  { value: "SENT", label: "완료" },
]

interface QuickValues {
  flow: string[]
  progress: string[]
  mine: string[]
}
const EMPTY_QUICK: QuickValues = { flow: [], progress: [], mine: [] }

/** 조회 실패를 확인한 시각 「시:분」(KST) */
function kstClock(ms: number): string {
  return new Date(ms + 9 * 60 * 60 * 1000).toISOString().slice(11, 16)
}

/** 서버 거절 문구(없으면 기본 문구) */
function errorText(error: unknown, fallback: string): string {
  return error instanceof ApiError && error.detail ? error.detail : fallback
}

export function CasesPage() {
  const user = useSessionStore((s) => s.user)
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()

  const canView = user ? hasAnyFeature(user, CASE_VIEW_FEATURES) : false
  const canRegister = hasFeature(user, FEATURES.CRIME_REGISTER)
  const canShoe = hasFeature(user, FEATURES.SHOE_VIEW)

  // ── 거르기(서버) ──
  const [query, setQuery] = useState("")
  const [quickValues, setQuickValues] = useState<QuickValues>(EMPTY_QUICK)
  const debouncedQuery = useDebouncedValue(query.trim(), 300)
  const filters = useMemo<RequestListFilters>(
    () => ({
      q: debouncedQuery,
      flow: quickValues.flow,
      unsearched: quickValues.progress.includes("unsearched"),
      awaiting: quickValues.progress.includes("awaiting"),
      mine: quickValues.mine.length > 0,
      limit: SERVER_LIMIT,
    }),
    [debouncedQuery, quickValues]
  )
  const listQuery = useRequestList(filters, canView)
  const items = useMemo<RequestListItem[]>(() => listQuery.data?.pages.flatMap((p) => p.items) ?? [], [listQuery.data])

  // 목록이 이미 준 의뢰 번호는 감정번호 → 의뢰 번호 찾기(A1 `no=`)를 다시 부르지 않게 캐시에 넣어 둔다
  useEffect(() => {
    for (const it of items) {
      if (queryClient.getQueryData(confirmKeys.idByNo(it.apprslReqestNo)) === undefined) {
        queryClient.setQueryData(confirmKeys.idByNo(it.apprslReqestNo), it.rqestId)
      }
    }
  }, [items, queryClient])

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT)
  const [rowHeight, setRowHeight] = useState<CaseListRowHeight>("보통")
  const [addQuery, setAddQuery] = useState("")

  const pageItems = items.slice((page - 1) * pageSize, page * pageSize)
  const rows = pageItems.map((it) => toCaseListRow(it, backendMediaUrl))
  const hasNext = items.length > page * pageSize || Boolean(listQuery.hasNextPage)
  const changePage = (next: number) => {
    setPage(next)
    if (next * pageSize > items.length && listQuery.hasNextPage && !listQuery.isFetchingNextPage) {
      void listQuery.fetchNextPage()
    }
  }

  const filtered =
    debouncedQuery !== "" || quickValues.flow.length + quickValues.progress.length + quickValues.mine.length > 0
  const status: ScreenStatus = listQuery.isPending
    ? "loading"
    : listQuery.isError
      ? "error"
      : items.length === 0
        ? // 조건이 있으면 위젯이 「조건에 맞는 항목 없음 · 조건 지우기」를 보이게 ready 로
          filtered
          ? "ready"
          : "empty"
        : page * pageSize > items.length && listQuery.isFetchingNextPage
          ? "loading"
          : "ready"

  // 위 막대: 바로 찾기(서버 `q`) — 렌더마다 새 객체면 막대가 매번 다시 올라가므로 묶어 둔다
  const barSearch = useMemo(
    () => ({
      value: query,
      // 거르기를 바꾸면 첫 쪽부터
      onChange: (q: string) => {
        setQuery(q)
        setPage(1)
      },
      label: "감정번호 · 사건명 바로 찾기",
      placeholder: "감정번호·사건명·SCAS·문서번호 바로 찾기",
    }),
    [query]
  )
  usePageHeader({ meta: null, search: canView ? barSearch : undefined })

  // ── 접수(A4) ──
  const receive = useReceiveRequest()
  const [receiving, setReceiving] = useState<string | null>(null)
  const handleReceive = (no: string) => {
    const item = items.find((i) => i.apprslReqestNo === no)
    if (!item || receive.isPending) return
    setReceiving(no)
    receive.mutate(item.rqestId, {
      onSuccess: () => toast.success(`${no} 접수했습니다.`),
      onError: (e) => toast.error(errorText(e, "접수하지 못했습니다.")),
      onSettled: () => setReceiving(null),
    })
  }

  // ── 신발 DB 패널 ──
  const shoeOpen = canShoe && (params.get("shoe") === "1" || !canView)
  const setShoeParams = (patch: { ftwr?: string | null; shoeNew?: boolean; close?: boolean }) => {
    const next = new URLSearchParams(params)
    if (patch.close) {
      next.delete("shoe")
      next.delete("ftwr")
      next.delete("shoeNew")
    } else {
      next.set("shoe", "1")
      if (patch.ftwr) next.set("ftwr", patch.ftwr)
      else next.delete("ftwr")
      if (patch.shoeNew) next.set("shoeNew", "1")
      else next.delete("shoeNew")
    }
    setParams(next)
  }

  // ── 새 사건 등록 창(`?new=1`) ──
  const registerOpen = canRegister && !shoeOpen && params.get("new") === "1"
  const openRegister = (copyFrom?: string) => {
    const next = writeCaseWindow(params, null)
    next.set("new", "1")
    if (copyFrom) next.set("copy", copyFrom)
    else next.delete("copy")
    setParams(next)
  }
  const closeRegister = () => {
    const next = new URLSearchParams(params)
    next.delete("new")
    next.delete("copy")
    setParams(next)
  }

  // ── 사건 창(상태는 주소 — case-window-query.ts) ──
  const win = shoeOpen || registerOpen || !canView ? null : readCaseWindow(params)
  const listedId = win ? items.find((i) => i.apprslReqestNo === win.open)?.rqestId : undefined
  const idQuery = useRequestIdByNo(win && listedId === undefined ? win.open : "")
  const rqestId = win ? (listedId ?? idQuery.data ?? null) : null
  const detailQuery = useRequestDetail(rqestId)
  const detail = detailQuery.data && detailQuery.data.apprslReqestNo === win?.open ? detailQuery.data : undefined

  const setWindow = (next: CaseWindowQuery | null, clearTabs = false) => setParams(writeCaseWindow(params, next, clearTabs))
  const closeWindow = () => {
    const next = writeCaseWindow(params, null)
    if (win) next.set("tabs", win.tabs.join(","))
    setParams(next)
  }
  const openWindow = (no: string, tab: CaseWindowTab) => {
    const next = openCaseWindow(win?.tabs ?? readOpenTabs(params), no, { tab, img: null })
    if (next === null) {
      toast(OPEN_CASES_FULL)
      return
    }
    setWindow(next)
  }

  let caseWindow: ReactNode = null
  if (win) {
    const item = items.find((i) => i.apprslReqestNo === win.open)
    const images = detail ? toWindowImages(detail, backendMediaUrl) : []
    const picked = detail ? pickDetailImage(detail, win.img) : null
    const img = picked ? String(picked.no) : null
    // ‹ › = 지금 목록(이 쪽) 순서의 앞 · 뒤 사건
    const at = pageItems.findIndex((i) => i.apprslReqestNo === win.open)
    const prev = at > 0 ? pageItems[at - 1] : undefined
    const nextItem = at >= 0 ? pageItems[at + 1] : undefined
    const step = (target: RequestListItem | undefined) => {
      if (target) setWindow(stepCaseWindow(win, target.apprslReqestNo, null))
    }

    const needleAdd = addQuery.trim().toLowerCase()
    const full = win.tabs.length >= MAX_OPEN_CASES
    const caseHits = items.filter((i) => itemMatches(i, needleAdd)).slice(0, 6)
    const tabAdd = (
      <WorkTabAdd
        label="탭 추가"
        query={addQuery}
        onQueryChange={setAddQuery}
        searchLabel="사건 찾기"
        placeholder="감정번호 · 사건명 · 의뢰관서"
        groups={[
          {
            key: "case",
            title: needleAdd === "" ? "사건 열기 · 목록 앞쪽" : `사건 찾기 ${caseHits.length}건`,
            empty: "맞는 사건이 없습니다",
            items: caseHits.map((i) => {
              const opened = win.tabs.includes(i.apprslReqestNo)
              return {
                id: i.apprslReqestNo,
                label: i.apprslReqestNo,
                sub: [i.crimeNm, i.rqestOrgNm, i.frstRegistDt.slice(0, 10)].filter(Boolean).join(" · "),
                end: opened ? "열림" : undefined,
                disabled: full && !opened,
                reason: OPEN_CASES_FULL,
              }
            }),
          },
          {
            key: "feature",
            title: "기능 열기",
            items: [
              ...(canShoe ? [{ id: "shoe", label: "신발 DB", sub: "신발 찾기 · 등록 · 문양 편집(패널)" }] : []),
              ...(canRegister ? [{ id: "register", label: "사건 등록", sub: "새 사건 · 현장 이미지 올리기" }] : []),
            ],
            empty: "열 수 있는 기능이 없습니다",
          },
        ]}
        note={full ? OPEN_CASES_FULL : `사건 탭은 ${MAX_OPEN_CASES}개까지 · 지금 ${win.tabs.length}개`}
        onPick={(group, id) => {
          setAddQuery("")
          if (group === "case") openWindow(id, win.tab)
          else if (id === "shoe") setShoeParams({})
          else openRegister()
        }}
      />
    )

    // 탭 본문 — 상세를 읽는 동안 · 못 찾음 · 실패
    const missing = (listedId === undefined && idQuery.isSuccess && idQuery.data === null) || detailQuery.isError
    const body = missing ? (
      <ListNote className="text-center">사건을 찾을 수 없습니다</ListNote>
    ) : !detail ? (
      <ListNote role="status" className="text-center">
        사건을 불러오는 중…
      </ListNote>
    ) : (
      <CaseWindowTabBody
        key={`${win.open}|${picked?.aprthngNo ?? ""}`}
        aprthngNo={win.open}
        imageNo={picked?.aprthngNo ?? null}
        tab={win.tab}
        onSelectTab={(tab) => setWindow({ ...win, tab })}
        onSelectImage={(no) => {
          const hit = pickDetailImage(detail, no)
          if (hit) setWindow({ ...win, img: String(hit.no) })
        }}
        // 이미지 + 탭을 한 번의 주소 갱신으로(두 번 부르면 같은 옛 주소에서 시작해 이미지가 덮였다 — [검수])
        onOpenImageTab={(no, tab) => {
          const hit = pickDetailImage(detail, no)
          setWindow(hit ? { ...win, img: String(hit.no), tab } : { ...win, tab })
        }}
      />
    )
    const statusOnly = !isAdmin(user ?? undefined) && !hasFeature(user, FEATURES.CRIME_SEARCH) && !hasFeature(user, FEATURES.EXAM_VIEW)

    caseWindow = (
      <CaseWindow
        tabAdd={tabAdd}
        summary={{
          aprthngNo: win.open,
          caseName: detail?.crimeNm ?? item?.crimeNm ?? "",
          requestOffice: detail?.rqestOrgNm ?? item?.rqestOrgNm ?? "",
          registeredAt: (detail?.frstRegistDt ?? item?.frstRegistDt ?? "").slice(0, 10),
          imageCount: detail ? images.length : (item?.aprthngCnt ?? 0),
          stageLabel: detail && detail.flow === null ? stageLabelOf(null) : undefined,
        }}
        stages={detail ? toWindowStages(detail) : undefined}
        tabMarks={detail ? windowTabMarks(detail, images, img) : undefined}
        menu={canRegister ? [{ label: "사건복사", onSelect: () => openRegister(win.open) }] : undefined}
        images={images}
        selectedImage={img}
        tab={win.tab}
        visibleTabs={statusOnly ? ["info"] : undefined}
        openCases={win.tabs.map((no) => ({
          aprthngNo: no,
          caseName: (no === win.open ? detail?.crimeNm : undefined) ?? items.find((i) => i.apprslReqestNo === no)?.crimeNm ?? "",
        }))}
        openCasesFull={full ? OPEN_CASES_FULL : undefined}
        prevOff={!prev}
        nextOff={!nextItem}
        onClose={closeWindow}
        onPrev={() => step(prev)}
        onNext={() => step(nextItem)}
        onSelectImage={(no) => setWindow({ ...win, img: no })}
        onSelectTab={(tab) => setWindow({ ...win, tab })}
        onSelectOpenCase={(no) => {
          if (no !== win.open) openWindow(no, win.tab)
        }}
        onCloseOpenCase={(no) => {
          const after = closeCaseTab(win, no, () => null)
          setWindow(after, after === null)
        }}
        onConfirmResult={() => setWindow({ ...win, tab: "confirm" })}
      >
        {body}
      </CaseWindow>
    )
  }

  const shoePanel = shoeOpen ? (
    <CaseWindowFrame
      label="신발 DB"
      onClose={() => setShoeParams({ close: true })}
      head={<WindowHead mark="신" title="신발 DB" onClose={() => setShoeParams({ close: true })} />}
    >
      <ShoeDbPanelContainer
        ftwrId={params.get("ftwr")}
        isNew={params.get("shoeNew") === "1" && hasFeature(user, FEATURES.SHOE_EDIT)}
        onOpenShoe={(id) => setShoeParams({ ftwr: id })}
        onNewShoe={() => setShoeParams({ shoeNew: true })}
        onBackToList={() => setShoeParams({})}
      />
    </CaseWindowFrame>
  ) : null

  const registerPanel = registerOpen ? (
    // 머리 줄은 S02 등록 화면이 그린다(제목 · 닫기) — 창 머리를 겹치지 않는다
    <CaseWindowFrame label="사건 등록" onClose={closeRegister}>
      <RegisterWindow
        key={params.get("copy") ?? ""}
        copyFrom={params.get("copy")}
        onClose={closeRegister}
        onRegistered={(no) => {
          const next = new URLSearchParams(params)
          next.delete("new")
          next.delete("copy")
          const opened = openCaseWindow(readOpenTabs(next), no, { tab: "info", img: null })
          setParams(opened ? writeCaseWindow(next, opened) : next)
        }}
      />
    </CaseWindowFrame>
  ) : null

  // 신발 권한만 있는 사람(사건 보기 권한 없음) — 목록 자리에 안내, 신발 패널은 위에서 열어 둔다
  if (!canView) {
    return (
      <>
        <BoardFrame className="mt-0">
          <ListNote role="status" className="text-center">
            사건 보기 권한이 없습니다 — 신발 DB 패널만 쓸 수 있습니다
          </ListNote>
        </BoardFrame>
        {shoePanel}
      </>
    )
  }

  const quickGroups: FilterGroup[] = [
    { key: "flow", label: "진행 상태", value: quickValues.flow, options: FLOW_OPTIONS },
    {
      key: "progress",
      label: "장 진행",
      value: quickValues.progress,
      options: [
        { value: "unsearched", label: "검색 안 한 장" },
        { value: "awaiting", label: "결과 확인 전" },
      ],
    },
    { key: "mine", label: "담당", value: quickValues.mine, options: [{ value: "mine", label: "내 담당만" }] },
  ]

  return (
    <>
      <CaseListScreen
        status={status}
        errorAt={listQuery.isError ? kstClock(listQuery.errorUpdatedAt) : undefined}
        onRetry={() => void listQuery.refetch()}
        isAdmin={user ? isAdmin(user) : false}
        features={user?.features ?? []}
        rows={rows}
        hasNext={hasNext}
        page={page}
        pageSize={pageSize}
        onPageChange={changePage}
        onOpenCase={(no) => openWindow(no, "info")}
        onRegister={() => openRegister()}
        // 「검색」 = 첫 이미지의 문양 코드 탭(검색은 거기서 한다)
        onSearchCase={(no) => openWindow(no, "pattern")}
        onConfirmCase={(no) => openWindow(no, "confirm")}
        onReceive={handleReceive}
        receivingCase={receiving}
        showPlus={false}
        stageColumn
        selectedCase={win?.open ?? null}
        quick={{
          query,
          onQueryChange: barSearch.onChange,
          groups: quickGroups,
          onGroupChange: (key, values) => {
            setQuickValues((prev) => ({ ...prev, [key]: values }))
            setPage(1)
          },
          onClear: () => {
            setQuery("")
            setQuickValues(EMPTY_QUICK)
            setPage(1)
          },
          resultCount: items.length,
          total: null,
        }}
        onPageSizeChange={(n) => {
          setPageSize(n)
          setPage(1)
        }}
        rowHeight={rowHeight}
        onRowHeightChange={setRowHeight}
      />
      {caseWindow}
      {registerPanel}
      {shoePanel}
    </>
  )
}
