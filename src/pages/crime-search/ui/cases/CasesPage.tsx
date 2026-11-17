import { useMemo, useState, type ReactNode } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { useCrimeListQuery } from "@/entities/crime"
import { FEATURES } from "@/entities/session"
import { hasFeature, isAdmin, useSessionStore } from "@/features/auth"
import { sceneImageUrl } from "@/features/crime-align"
import type { ScreenStatus } from "@/shared/lib/screen-status"
import { CaseWindowFrame, WindowHead, WorkTabAdd } from "@/shared/ui/panel"
import { usePageHeader } from "@/widgets/app-shell"
import { CaseListScreen, type CaseListRowHeight } from "@/widgets/case-list"
import { CaseWindow, type CaseWindowTab } from "@/widgets/case-window"

import { caseMatches, groupCrimes, imageNoFromPick, toCaseListRow, toWindowImages, type CaseGroup } from "../../model/case-groups"
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
import { ShoeDbPanelContainer } from "./ShoeDbPanelContainer"

// 새 사건관리 `/cases`(화면 이식 계획 §1 · §4 ⓪ — 옛 `/search` 와 나란히). 시안 S01(`pages/dev/screens/s01`) 조립을 실제 값으로:
//  - 목록 = `GET /crime/`(감정물 단위)를 감정의뢰번호로 묶은 사건 행(`case-groups.ts`). 서버 쪽 나누기가 없어 화면이 쪽을 나눈다.
//  - 행을 누르면 사건 창(`CaseWindow` — 작업 탭 줄 · 머리 · 이미지 목록), 탭 본문은 갈래 ④ `CaseWindowTabBody`.
//  - 위 막대 「신발 DB」 = 같은 자리 슬라이드 패널(`?shoe=1`, 신발 `&ftwr=<id>`, 새 신발 `&shoeNew=1`).
// 서버에 없는 것(진행 단계 · 결과 · 빠른 보기 칩 · 검증요청 · 사진 추가 · 사건복사)은 숨긴다(showPlus=false · 넘기지 않음).

const PAGE_SIZE_DEFAULT = 20

/** 조회 실패를 확인한 시각 「시:분」(KST) */
function kstClock(ms: number): string {
  return new Date(ms + 9 * 60 * 60 * 1000).toISOString().slice(11, 16)
}

export function CasesPage() {
  const user = useSessionStore((s) => s.user)
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const listQuery = useCrimeListQuery()

  const groups = useMemo(() => groupCrimes(listQuery.data ?? []), [listQuery.data])
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT)
  const [rowHeight, setRowHeight] = useState<CaseListRowHeight>("보통")
  const [addQuery, setAddQuery] = useState("")

  const canRegister = hasFeature(user, FEATURES.CRIME_REGISTER)
  const canShoe = hasFeature(user, FEATURES.SHOE_VIEW)

  const needle = query.trim().toLowerCase()
  const matched = useMemo(() => groups.filter((g) => caseMatches(g, needle)), [groups, needle])
  const pageGroups = matched.slice((page - 1) * pageSize, page * pageSize)
  const rows = pageGroups.map((g) => toCaseListRow(g, sceneImageUrl))

  const status: ScreenStatus = listQuery.isPending
    ? "loading"
    : listQuery.isError
      ? "error"
      : groups.length === 0
        ? "empty"
        : "ready"

  // 위 막대: 바로 찾기(목록 거르기) · 건수 — 렌더마다 새 객체면 막대가 매번 다시 올라가므로 묶어 둔다
  const barSearch = useMemo(
    () => ({
      value: query,
      onChange: (q: string) => {
        setQuery(q)
        setPage(1)
      },
      label: "감정번호 · 사건명 바로 찾기",
      placeholder: "감정번호·사건명·의뢰관서 바로 찾기",
    }),
    [query]
  )
  const total = listQuery.data ? groups.length : null
  const meta = useMemo(() => (total === null ? null : <span className="font-code tabular-nums">{total}건</span>), [total])
  usePageHeader({ meta, search: barSearch })

  // ── 신발 DB 패널 ──
  const shoeOpen = params.get("shoe") === "1" && canShoe
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

  // ── 사건 창(상태는 주소 — case-window-query.ts) ──
  const win = shoeOpen ? null : readCaseWindow(params)
  const groupOf = (no: string): CaseGroup | undefined => groups.find((g) => g.caseNo === no)
  const firstImage = (no: string) => groupOf(no)?.images[0]?.no ?? null
  const setWindow = (next: CaseWindowQuery | null, clearTabs = false) => setParams(writeCaseWindow(params, next, clearTabs))
  const closeWindow = () => {
    const next = writeCaseWindow(params, null)
    if (win) next.set("tabs", win.tabs.join(","))
    setParams(next)
  }
  const openWindow = (no: string, tab: CaseWindowTab, img?: string | null) => {
    const next = openCaseWindow(win?.tabs ?? readOpenTabs(params), no, { tab, img: img ?? firstImage(no) })
    if (next === null) {
      toast(OPEN_CASES_FULL)
      return
    }
    setWindow(next)
  }

  const openGroup = win ? groupOf(win.open) : undefined
  let caseWindow: ReactNode = null
  if (win && openGroup) {
    const images = toWindowImages(openGroup, sceneImageUrl)
    const img = win.img && openGroup.images.some((i) => i.no === win.img) ? win.img : (openGroup.images[0]?.no ?? null)
    const imageRef = openGroup.images.find((i) => i.no === img) ?? null
    // ‹ › = 지금 목록(걸러진 · 이 쪽) 순서의 앞 · 뒤 사건
    const at = pageGroups.findIndex((g) => g.caseNo === win.open)
    const prev = at > 0 ? pageGroups[at - 1] : undefined
    const nextGroup = at >= 0 ? pageGroups[at + 1] : undefined
    const step = (target: CaseGroup | undefined) => {
      if (target) setWindow(stepCaseWindow(win, target.caseNo, firstImage(target.caseNo)))
    }

    const needleAdd = addQuery.trim().toLowerCase()
    const full = win.tabs.length >= MAX_OPEN_CASES
    const caseHits = groups.filter((g) => caseMatches(g, needleAdd)).slice(0, 6)
    const tabAdd = (
      <WorkTabAdd
        label="탭 추가"
        query={addQuery}
        onQueryChange={setAddQuery}
        searchLabel="사건 찾기"
        placeholder="감정번호 · 사건명 · 의뢰관서 · 이미지 번호"
        groups={[
          {
            key: "case",
            title: needleAdd === "" ? "사건 열기 · 목록 앞쪽" : `사건 찾기 ${caseHits.length}건`,
            empty: "맞는 사건이 없습니다",
            items: caseHits.map((g) => {
              const opened = win.tabs.includes(g.caseNo)
              return {
                id: g.caseNo,
                label: g.caseNo,
                sub: [g.caseName, g.requestOffice, g.registeredAt].filter(Boolean).join(" · "),
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
          else navigate("/crimeRegister")
        }}
      />
    )

    caseWindow = (
      <CaseWindow
        tabAdd={tabAdd}
        summary={{
          aprthngNo: openGroup.caseNo,
          caseName: openGroup.caseName,
          requestOffice: openGroup.requestOffice,
          registeredAt: openGroup.registeredAt,
          imageCount: images.length,
        }}
        images={images}
        selectedImage={img}
        tab={win.tab}
        openCases={win.tabs.map((no) => ({ aprthngNo: no, caseName: groupOf(no)?.caseName ?? "" }))}
        openCasesFull={full ? OPEN_CASES_FULL : undefined}
        prevOff={!prev}
        nextOff={!nextGroup}
        onClose={closeWindow}
        onPrev={() => step(prev)}
        onNext={() => step(nextGroup)}
        onSelectImage={(no) => setWindow({ ...win, img: no })}
        onSelectTab={(tab) => setWindow({ ...win, tab })}
        onSelectOpenCase={(no) => {
          if (no !== win.open) openWindow(no, win.tab)
        }}
        onCloseOpenCase={(no) => {
          const after = closeCaseTab(win, no, firstImage)
          setWindow(after, after === null)
        }}
        onConfirmResult={() => setWindow({ ...win, tab: "confirm" })}
      >
        <CaseWindowTabBody
          key={`${openGroup.caseNo}|${img ?? ""}`}
          aprthngNo={openGroup.caseNo}
          imageNo={imageRef?.aprthngNo ?? null}
          tab={win.tab}
          onSelectTab={(tab) => setWindow({ ...win, tab })}
          onSelectImage={(picked) => {
            const no = imageNoFromPick(openGroup, picked)
            if (no) setWindow({ ...win, img: no })
          }}
        />
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

  return (
    <>
      <CaseListScreen
        status={status}
        errorAt={listQuery.isError ? kstClock(listQuery.errorUpdatedAt) : undefined}
        onRetry={() => void listQuery.refetch()}
        isAdmin={user ? isAdmin(user) : false}
        features={user?.features ?? []}
        rows={rows}
        total={matched.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onOpenCase={(no) => openWindow(no, "info")}
        onRegister={() => navigate("/crimeRegister")}
        // 「검색」 = 첫 이미지의 문양 코드 탭(검색은 거기서 한다)
        onSearchCase={(no) => openWindow(no, "pattern")}
        onConfirmCase={(no) => openWindow(no, "confirm")}
        showPlus={false}
        selectedCase={win?.open ?? null}
        quick={{
          query,
          onQueryChange: barSearch.onChange,
          groups: [],
          onGroupChange: () => {},
          onClear: () => barSearch.onChange(""),
          resultCount: matched.length,
          total: groups.length,
        }}
        onPageSizeChange={(n) => {
          setPageSize(n)
          setPage(1)
        }}
        rowHeight={rowHeight}
        onRowHeightChange={setRowHeight}
      />
      {caseWindow}
      {shoePanel}
    </>
  )
}
