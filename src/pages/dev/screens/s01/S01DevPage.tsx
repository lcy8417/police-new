import * as React from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { FEATURES } from "@/entities/session"
import type { FilterGroup } from "@/shared/ui/kit"
import { CaseWindowFrame, WindowHead } from "@/shared/ui/panel"
import { CaseListScreen, type CaseListRow, type CaseListRowHeight } from "@/widgets/case-list"
import { CaseWindow, type CaseWindowTab } from "@/widgets/case-window"

import {
  DevScreenFrame,
  SCREEN_CASES,
  devScreen,
  oneOf,
  useDevCase,
  useDevNavigate,
  useDevPlus,
  useDevViewer,
  useRememberedState,
  type DevGo,
} from "../frame"
import { S02Content } from "../s02"
import { CaseWindowUpload } from "./CaseWindowUpload"
import { caseFlowOf, s02FactsOf, tabMarksOf } from "./case-flow"
import { S03Content } from "../s03"
import { S04Content } from "../s04"
import { S05Content } from "../s05"
import { S06Content } from "../s06"
import { S07Content } from "../s07"
import { S10Content } from "../s10"
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
} from "./case-window-query"
import { S01_LIVE_AT, S01_PAGE_SIZE, makeCaseImages, makeCaseRows, stageLabel } from "./mock-cases"

/** 사건 창 본문 탭 ↔ 진열 화면 주소(창 안 내용이 `go("/dev/s04")` 처럼 부르면 그 탭으로 바꾼다) */
const TAB_OF_PATH: Record<string, CaseWindowTab> = {
  "/dev/s02": "info",
  "/dev/s03": "edit",
  "/dev/s04": "pattern",
  "/dev/s05": "search",
  "/dev/s06": "compare",
  "/dev/s07": "confirm",
}

const info = devScreen("s01")

const isPageSize = oneOf<number>([10, 20, 50])
const isRowHeight = oneOf<CaseListRowHeight>(["보통", "촘촘"])

/** 빠른 찾기 칩 값(묶음 key → 고른 값들). 묶음 안은 「또는」, 묶음끼리는 「그리고」 */
type QuickValues = Record<string, string[]>
const EMPTY_QUICK: QuickValues = { view: [], progress: [], result: [], kind: [], mine: [] }

const resultKey = (r: CaseListRow) => (r.caseResult === "" ? "none" : r.caseResult)

// (r4 +α) 「빠른 보기」 — 옛 할 일 타일(결과 확인 전 · 이미지 미검색 · 교차 검증)을 뚜껑 칩으로 옮긴 것. 가짜 데이터 기준 정의:
//  결과 확인 전 = 아직 확인 안 된 장(등록 · 검색 단계 장)이 하나라도 있는 사건
//  이미지 미검색 = 검색을 안 한 장(등록 단계 장)이 하나라도 있는 사건
//  교차 검증 = 사건 진행 단계가 교차 검증(stage 1)인 사건
// 건수는 SCAS 조회 결과(matched) 안에서 그 조건에 맞는 사건 수를 센다 — 칩 수와 눌렀을 때 걸러지는 수가 같게.
// 보이는 칩은 옛 타일 규칙 그대로: 결과 확인 전 = 모두, 이미지 미검색 = 감정 판단(EXAM_DECIDE), 교차 검증 = CROSS_REVIEW.
const QUICK_VIEWS = [
  { value: "awaiting", label: "결과 확인 전", test: (r: CaseListRow) => r.progress.registered + r.progress.searched > 0 },
  { value: "unsearched", label: "이미지 미검색", test: (r: CaseListRow) => r.progress.registered > 0 },
  { value: "cross", label: "교차 검증", test: (r: CaseListRow) => r.stage === 1 },
] as const
type QuickView = (typeof QUICK_VIEWS)[number]["value"]
const viewTest = (v: string) => QUICK_VIEWS.find((q) => q.value === v)?.test ?? (() => true)

// S01 사건관리 진열 페이지: 가짜 값 · 이동 콜백만 위젯에 넘긴다. 입력 칸 · 쪽 · 조회 조건 · 빠른 찾기는 여기서 들고 있어 눌러 보면 바뀐다.
// 열 · 쪽당 행 · 행 높이는 이 브라우저에 기억한다(실패해도 기본값).
export function S01DevPage() {
  const devCase = useDevCase(SCREEN_CASES.s01,"ready")
  const viewer = useDevViewer()
  const plus = useDevPlus()
  const to = useDevNavigate()

  const allRows = React.useMemo(() => makeCaseRows(), [])
  const [page, setPage] = React.useState(1)
  const [query, setQuery] = React.useState("")
  const [quickValues, setQuickValues] = React.useState<QuickValues>(EMPTY_QUICK)
  const [pageSize, setPageSize] = useRememberedState<number>("s01", "pageSize", S01_PAGE_SIZE, isPageSize)
  const [rowHeight, setRowHeight] = useRememberedState<CaseListRowHeight>("s01", "rowHeight", "보통", isRowHeight)

  // 11/17 사용자 「상세 검색은 그냥 필터로 대체될 거 같은데」: SCAS 검색 양식은 뺐다 — 전체 사건 안에서 막대 찾기 · 뚜껑 칩으로만 거른다
  const matched = allRows

  // 빠른 찾기: 위 막대 「바로 찾기」 글자 + 뚜껑 칩
  const me = viewer.who.split(" ")[0]
  const needle = query.trim().toLowerCase()
  const anyOf = (key: string, test: (v: string) => boolean) => quickValues[key].length === 0 || quickValues[key].some(test)
  const quickMatched = matched.filter(
    (r) =>
      (needle === "" || [r.aprthngNo, r.docNo, r.caseName].some((t) => t.toLowerCase().includes(needle))) &&
      anyOf("view", (v) => viewTest(v)(r)) &&
      anyOf("progress", (v) => (v === "registered" ? r.progress.registered > 0 : v === "searched" ? r.progress.searched > 0 : r.progress.confirmed > 0)) &&
      anyOf("result", (v) => resultKey(r) === v) &&
      anyOf("kind", (v) => r.kind === v) &&
      anyOf("mine", () => r.author === me)
  )

  const can = (code: (typeof FEATURES)[keyof typeof FEATURES]) => viewer.isAdmin || viewer.features.includes(code)
  const shownViews: Record<QuickView, boolean> = {
    awaiting: true,
    unsearched: can(FEATURES.EXAM_DECIDE),
    cross: can(FEATURES.CROSS_REVIEW),
  }
  const views: FilterGroup = {
    key: "view",
    label: "빠른 보기",
    value: quickValues.view,
    options: QUICK_VIEWS.filter((q) => shownViews[q.value]).map((q) => ({
      value: q.value,
      label: q.label,
      count: matched.filter(q.test).length,
    })),
  }

  const groups: FilterGroup[] = [
    {
      key: "progress",
      label: "진행 상태",
      value: quickValues.progress,
      options: [
        { value: "registered", label: "등록됨" },
        { value: "searched", label: "검색됨" },
        { value: "confirmed", label: "확인됨" },
      ],
    },
    {
      key: "result",
      label: "사건결과",
      value: quickValues.result,
      options: [
        { value: "발견", label: "발견" },
        { value: "불발견", label: "불발견" },
        { value: "none", label: "결과 전" },
      ],
    },
    {
      key: "kind",
      label: "처리 구분",
      value: quickValues.kind,
      options: [
        { value: "현장", label: "현장" },
        { value: "대조", label: "대조" },
      ],
    },
    { key: "mine", label: "담당", value: quickValues.mine, options: [{ value: "mine", label: "내 담당만" }] },
  ]

  const pageRows = quickMatched.slice((page - 1) * pageSize, page * pageSize)
  // 사건이 없으면 「결과 없음」(케이스 전환과 같은 모양). 빠른 찾기 0건은 위젯이 따로 안내한다.
  const status = devCase === "ready" && matched.length === 0 ? "empty" : devCase

  // ── 사건 창(r4 — 행을 누르면 목록 위 오른쪽에 큰 창). 상태는 주소(query) 에 둔다 → case-window-query.ts ──
  const [params, setParams] = useSearchParams()
  // 신발 DB 슬라이드 패널(11/17 — 위 막대 「신발 DB」, `?shoe=1`). 열려 있으면 사건 창은 그 뒤에 숨는다(닫으면 다시 보임)
  const shoeOpen = params.get("shoe") === "1"
  const closeShoe = () => {
    const next = new URLSearchParams(params)
    next.delete("shoe")
    setParams(next)
  }
  const win = shoeOpen ? null : readCaseWindow(params)
  const rowOf = (no: string) => allRows.find((r) => r.aprthngNo === no)
  const imagesOf = (no: string) => {
    const row = rowOf(no)
    return row ? makeCaseImages(row) : []
  }
  const firstImage = (no: string) => imagesOf(no)[0]?.no ?? null
  const setWindow = (next: CaseWindowQuery | null, clearTabs = false) => setParams(writeCaseWindow(params, next, clearTabs))
  // 창 닫기(✕ · Esc · 가림막) — 열린 사건 탭 목록은 남긴다(주소에 open 만 있던 경우도 그 사건을 탭으로 남김)
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
  // 창 안 내용(S02–S07)이 다른 진열 화면으로 가려 하면 → 창 탭 바꾸기(사건관리로 = 창 닫기, 그 밖 화면은 그대로 이동)
  const windowGo: DevGo = (path, extra = {}) => {
    if (!win) return
    if (path === "/dev/s01") {
      closeWindow()
      return
    }
    const tab = TAB_OF_PATH[path]
    if (!tab) {
      to(path, extra)
      return
    }
    const img = extra.image ? (/_(\d+)$/.exec(extra.image)?.[1] ?? win.img) : win.img
    const next = writeCaseWindow(params, { ...win, tab, img })
    if (extra.ftwr) next.set("ftwr", extra.ftwr)
    if (extra.rank) next.set("rank", extra.rank)
    setParams(next)
  }

  const openRow = win ? rowOf(win.open) : undefined
  let caseWindow: React.ReactNode = null
  if (win && openRow) {
    const images = makeCaseImages(openRow)
    const img = win.img ?? images[0]?.no ?? null
    const imageNo = img ? `${win.open}_${img}` : undefined
    // ‹ › = 지금 목록(걸러진 · 이 쪽) 순서의 앞 · 뒤 사건. 목록에 없으면 둘 다 잠김
    const at = pageRows.findIndex((r) => r.aprthngNo === win.open)
    const prev = at > 0 ? pageRows[at - 1] : undefined
    const next = at >= 0 ? pageRows[at + 1] : undefined
    const step = (target: CaseListRow | undefined) => {
      if (target) setWindow(stepCaseWindow(win, target.aprthngNo, firstImage(target.aprthngNo)))
    }
    const key = `${win.open}|${win.tab === "confirm" ? "" : img}|${win.tab}`
    // 머리 흐름 한 줄 · 탭 표시 · S02 값 — 모두 이 사건 행(장수 · 진행 · 결과 · 단계)에서 만든다(case-flow.ts)
    const flow = caseFlowOf(openRow, images, plus)
    const canEdit = viewer.isAdmin || viewer.features.includes(FEATURES.CRIME_REGISTER)
    const body =
      win.tab === "info" ? (
        <S02Content
          key={key}
          devCase="ready"
          caseId={win.open}
          imageId={imageNo}
          go={windowGo}
          inWindow
          facts={s02FactsOf(openRow, flow, images.length, img)}
        />
      ) : win.tab === "edit" ? (
        <S03Content key={key} devCase="ready" imageNo={imageNo} go={windowGo} inWindow />
      ) : win.tab === "pattern" ? (
        <S04Content key={key} devCase="ready" imageNo={imageNo} go={windowGo} inWindow />
      ) : win.tab === "search" ? (
        <S05Content key={key} devCase="ready" imageNo={imageNo} go={windowGo} inWindow />
      ) : win.tab === "compare" ? (
        <S06Content key={key} devCase="ready" imageNo={imageNo} go={windowGo} inWindow />
      ) : (
        <S07Content key={key} devCase="ready" go={windowGo} />
      )
    caseWindow = (
      <CaseWindow
        summary={{
          aprthngNo: openRow.aprthngNo,
          caseName: openRow.caseName,
          requestOffice: openRow.requestOffice,
          registeredAt: openRow.registeredAt,
          imageCount: images.length,
          // 단계 띠를 주므로 머리 꼬리표의 단계 글자는 위젯이 그리지 않는다(같은 말 중복) — 목록 「사건 진행」 말은 그대로 넘긴다
          stageLabel: plus ? stageLabel(openRow.stage) : undefined,
        }}
        stages={flow.stages}
        tabMarks={tabMarksOf(flow, images, img)}
        menu={[
          ...(canEdit
            ? [
                {
                  label: "사건복사",
                  // 값은 그대로 두고 번호만 비운 새 등록(S02)으로
                  onSelect: () => {
                    toast("사건을 복사했습니다. 사건등록번호를 입력하세요")
                    to("/dev/s02", { copy: openRow.aprthngNo })
                  },
                },
              ]
            : []),
          ...(plus && canEdit ? [{ label: "수정", onSelect: () => toast("시안 — 기능 준비 중") }] : []),
        ]}
        railFooter={
          canEdit ? <CaseWindowUpload key={openRow.aprthngNo} aprthngNo={openRow.aprthngNo} imageCount={images.length} plus={plus} busy={flow.currentStage === 1} /> : undefined
        }
        images={images}
        selectedImage={img}
        tab={win.tab}
        openCases={win.tabs.map((no) => ({ aprthngNo: no, caseName: rowOf(no)?.caseName ?? "" }))}
        openCasesFull={win.tabs.length >= MAX_OPEN_CASES ? OPEN_CASES_FULL : undefined}
        prevOff={!prev}
        nextOff={!next}
        onClose={closeWindow}
        onPrev={() => step(prev)}
        onNext={() => step(next)}
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
        {body}
      </CaseWindow>
    )
  }

  const shoePanel = shoeOpen ? (
    <CaseWindowFrame
      label="신발 DB"
      onClose={closeShoe}
      head={<WindowHead mark="신" title="신발 DB" subtitle="신발 문양 관리" onClose={closeShoe} />}
    >
      <div className="p-4">
        <S10Content caseName="ready" />
      </div>
    </CaseWindowFrame>
  ) : null

  // 위 막대 제목 뒤: 전체 건수 · (+α) 갱신 시각
  const meta = (
    <>
      <span className="font-code tabular-nums">{allRows.length}건</span>
      {plus ? (
        <span className="inline-flex items-center gap-1">
          <i aria-hidden="true" className="size-1.5 rounded-full bg-ok" />
          {S01_LIVE_AT} 갱신
        </span>
      ) : null}
    </>
  )
  const handleQuery = (q: string) => {
    setQuery(q)
    setPage(1)
  }

  return (
    <DevScreenFrame
      screen={info.screen}
      title={info.title}
      cases={info.cases}
      meta={meta}
      search={{
        value: query,
        onChange: handleQuery,
        label: "감정번호 · 문서번호 바로 찾기",
        placeholder: "감정번호·문서번호·사건명 바로 찾기",
      }}
    >
      <CaseListScreen
        status={status}
        errorAt="09:12"
        onRetry={() => toast("다시 조회합니다(가짜 데이터 — 케이스를 ready 로 바꿔 보세요)")}
        isAdmin={viewer.isAdmin}
        features={viewer.features}
        rows={pageRows}
        total={quickMatched.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onOpenCase={(no) => openWindow(no, "info")}
        onRegister={() => to("/dev/s02")}
        // 「검색」 = 검색 안 한 첫 이미지의 검색 결과 탭, 「확인」 = 사건 단위 결과 확인 탭
        onSearchCase={(no) => openWindow(no, "search", imagesOf(no).find((i) => i.status === "등록")?.no)}
        onConfirmCase={(no) => openWindow(no, "confirm")}
        showPlus={plus}
        selectedCase={win?.open ?? null}
        onMockAction={() => toast("시안 — 기능 준비 중")}
        quick={{
          query,
          views,
          onQueryChange: handleQuery,
          groups,
          onGroupChange: (key, values) => {
            setQuickValues((prev) => ({ ...prev, [key]: values }))
            setPage(1)
          },
          onClear: () => {
            setQuery("")
            setQuickValues(EMPTY_QUICK)
            setPage(1)
          },
          resultCount: quickMatched.length,
          total: matched.length,
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
    </DevScreenFrame>
  )
}
