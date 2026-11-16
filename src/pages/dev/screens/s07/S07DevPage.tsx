import { useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import { toast } from "sonner"

import type { CrimeHistoryRow } from "@/entities/crime"
import { toKstIso } from "@/shared/lib/kst"
import {
  ConfirmWindow,
  ResultConfirmScreen,
  type BlockViewCount,
  type ConfirmImageBlock,
  type ConfirmRow,
  type Judgement,
} from "@/widgets/result-confirm"

import {
  DevScreenFrame,
  SCREEN_CASES,
  devScreen,
  isStringListRecord,
  oneOf,
  useDevCase,
  useDevNavigate,
  useDevPlus,
  useDevViewer,
  useRememberedState,
  useWorkState,
  CASE_CROSS_REQUESTED_FIELD,
  CASE_JUDGEMENTS_FIELD,
  liveJudgement,
  type CaseJudgementPick,
  type DevGo,
} from "../frame"
import type { S07Facts } from "../s01/case-flow"
import { fakePhotoUrl } from "../mock-assets/FakePhoto"
import { fakeSoleUrl } from "../mock-assets/FakeSole"
import { samplePhotoUrl, sampleSoleUrl } from "../mock-assets/sample-images"
import type { ZoneTriple } from "../mock-assets/fake-art"
import {
  CASE_SUMMARY,
  INITIAL_COMPLETED,
  makeBlocks,
  makeConfirmInsight,
  NEXT_SEARCH_NO,
  OTHER_ZONES,
  REVIEWERS,
  S07_DEFAULT_FTWR,
  S07_ERROR_AT,
} from "./mock-cases"

const info = devScreen("s07")
const BLOCK_COUNTS: readonly BlockViewCount[] = [1, 3, 5]

// 이미지마다 다른 가짜 사진 무늬 · 기울기(시안 S07 BLOCKS)
const SCENE: readonly { zones: ZoneTriple; rotate: number }[] = [
  { zones: ["herring", "grid", "tri"], rotate: -4 },
  { zones: ["dots", "grid", "lines"], rotate: 3 },
  { zones: ["grid", "grid", "lines"], rotate: -7 },
]

const LABEL: Record<Judgement, string> = { found: "발견", notFound: "불발견", unable: "감정불능" }
const PLUS_NOT_READY = "시안 — 기능 준비 중"

// S07 검색결과 확인 진열 페이지. 판정 값 · 이력 · 결과확인완료 · 교차 검증자는 여기서 들고(제어형), 「결과확인완료」를 누르면
// 지금 앱처럼 이력 한 줄(발견 = 매칭 신발 ID, 그 밖 = 매칭 없음)을 쌓고 알림을 띄운다. `?ftwr=`는 S06 「확인대상」에서 넘어온다.
export function S07DevPage() {
  const activeCase = useDevCase(SCREEN_CASES.s07, "ready")
  return (
    <DevScreenFrame screen={info.screen} title={info.title} cases={info.cases}>
      <S07Content devCase={activeCase} />
    </DevScreenFrame>
  )
}

export interface S07ContentProps {
  devCase: (typeof SCREEN_CASES.s07)[number]
  /** 화면 옮기기(없으면 진열 주소 이동) — 사건 창은 탭 바꾸기로 받는다 */
  go?: DevGo
  /** 사건 창 안(R6) — 사건 전체 판정 한 화면(위젯 ConfirmWindow). `facts` 와 같이 준다 */
  inWindow?: boolean
  /** 사건 창에서 연 그 사건 값(S01 `s07FactsOf` — 목록 행 · 이미지 목록에서 만든 판정 줄 · 교차 검증 상태) */
  facts?: S07Facts
}

/**
 * S07 틀 없는 내용 — 진열 페이지와 사건 창(사건 단위 「결과 확인」 탭)이 같이 쓴다.
 * 사건 창(`inWindow` + `facts`)은 그 사건 값으로 이미지별 판정 줄을 그리고, 단독 진열은 시안 0646 블록 그대로다.
 */
export function S07Content(props: S07ContentProps) {
  return props.inWindow && props.facts ? (
    <S07WindowContent devCase={props.devCase} facts={props.facts} go={props.go} />
  ) : (
    <S07StandaloneContent {...props} />
  )
}

/** 사건 창 결과 확인 — 판정은 누르면 바로 저장(진열용 알림), 교차 검증 요청 · 감정서로 */
function S07WindowContent({ devCase, facts, go }: { devCase: S07ContentProps["devCase"]; facts: S07Facts; go?: DevGo }) {
  const nav = useDevNavigate()
  const to = go ?? nav
  const viewer = useDevViewer()
  // 판정 · 교차 검증 요청은 탭을 옮겨도 남는다(사건 창 보관함 — 사건 단위, 1회차 검수)
  const [picked, setPicked] = useWorkState<Record<string, CaseJudgementPick>>(CASE_JUDGEMENTS_FIELD, {})
  const [requested, setRequested] = useWorkState(CASE_CROSS_REQUESTED_FIELD, false)
  const [reviewer, setReviewer] = useWorkState<string | null>("s07.reviewer", null)
  // 발견 판정은 그때의 확인대상에 묶인다 — 판정 뒤 확인대상을 바꾸면(정밀 대조 · ★) 발견을 그대로 물려받지 않고 다시 판정을 받는다(2회차 검수)
  const rows = useMemo<ConfirmRow[]>(
    () =>
      facts.rows.map((r) => {
        // 이미지 목록 알약 · 사건 목록과 같은 규칙(frame liveJudgement — 3회차 검수)
        const live = liveJudgement(r.judgement, facts.baseTargetKeys?.[r.no] ?? "", picked[r.no], facts.targetKeys?.[r.no] ?? "")
        if (live.stale) return { ...r, judgement: null, note: "판정 뒤 확인대상이 바뀌었습니다 — 다시 판정하세요" }
        return { ...r, judgement: live.judgement }
      }),
    [facts.rows, facts.targetKeys, facts.baseTargetKeys, picked],
  )
  const crossReview = requested && facts.crossReview === "none" ? "requested" : facts.crossReview
  // 요청 전이면 고를 수 있는 검증자 목록, 요청 뒤면 그 사람 이름 하나
  // 판정한 본인은 교차 검증자로 고를 수 없다(DB §5-C — 1회차 검수)
  const me = viewer.who.split(" ")[0]
  const reviewers = facts.crossReviewer
    ? [{ value: "assigned", label: facts.crossReviewer }]
    : REVIEWERS.filter((r) => !r.label.startsWith(me))
  return (
    <ConfirmWindow
      status={devCase === "empty" ? "ready" : devCase}
      errorAt={S07_ERROR_AT}
      onRetry={() => toast("판정 목록을 다시 불러옵니다(진열용)")}
      isAdmin={viewer.isAdmin}
      features={viewer.features}
      aprthngNo={facts.aprthngNo}
      rows={devCase === "empty" ? [] : rows}
      onJudgementChange={(row, result) => {
        setPicked((prev) => ({ ...prev, [row.no]: { result, targets: facts.targetKeys?.[row.no] ?? "" } }))
        toast.success(`_${row.no} ${LABEL[result]} 저장(진열용)`)
      }}
      lockedReason={crossReview === "none" ? undefined : (facts.lockedReason ?? "교차 검증 중에는 판정을 바꿀 수 없습니다")}
      // 「열기」 = 그 줄의 확인대상 신발 · 순위 · 검색번호 그대로(다른 장의 발견 줄이 기본 신발로 열리던 것 — 2회차 검수)
      onOpenImage={(row) => {
        const shoe = row.shoe?.confirmed ? row.shoe : null
        // 확인대상 줄은 그 후보를 찾은 검색번호가 먼저(3회차 검수 — 마지막에 본 다른 검색으로 열리던 것), 아니면 그 장의 지금 검색
        const run = (shoe ? row.searchNo : null) ?? facts.runOf?.[row.no] ?? row.searchNo ?? undefined
        if (row.judgement === "found" && shoe) {
          to("/dev/s06", { image: row.imageNo, ftwr: shoe.ftwrId, rank: String(shoe.ranking), ...(run ? { run } : {}) })
        } else {
          to("/dev/s05", { image: row.imageNo, ...(run ? { run } : {}) })
        }
      }}
      crossReview={crossReview}
      reviewers={reviewers}
      reviewer={facts.crossReviewer ? "assigned" : reviewer}
      onReviewerChange={setReviewer}
      onRequestCrossReview={(r) => {
        setRequested(true)
        const name = REVIEWERS.find((x) => x.value === r)?.label ?? r
        toast.success(`교차 검증 요청 → ${name}(진열용)`)
      }}
      onToReport={() => toast(PLUS_NOT_READY, { description: "감정서 작성" })}
    />
  )
}

function S07StandaloneContent({ devCase: activeCase, go }: S07ContentProps) {
  const nav = useDevNavigate()
  const to = go ?? nav
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const ftwr = params.get("ftwr") || S07_DEFAULT_FTWR
  const viewer = useDevViewer()
  const showPlus = useDevPlus()

  const [judgements, setJudgements] = useState<Record<string, Judgement>>({})
  const [added, setAdded] = useState<Record<string, CrimeHistoryRow[]>>({})
  const [completed, setCompleted] = useState<Record<string, Judgement>>(INITIAL_COMPLETED)
  const [reviewer, setReviewer] = useState<string | null>(REVIEWERS[0].value)
  // r3 보기 설정 — 보기 개수 · 필터는 이 브라우저에 기억
  const [blockCount, setBlockCount] = useRememberedState<BlockViewCount>("s07", "blocks", 3, oneOf(BLOCK_COUNTS))
  const [filters, setFilters] = useRememberedState<Record<string, string[]>>("s07", "filters", {}, isStringListRecord)
  const [query, setQuery] = useState("")

  const images = useMemo(
    () => ({
      scenes: SCENE.map((s, i) => fakePhotoUrl({ zones: s.zones, rotate: s.rotate, tag: String(i + 1) })),
      shoe: fakeSoleUrl({ kind: "shoe", zones: ["herring", "grid", "tri"] }),
    }),
    [],
  )
  const insight = useMemo(
    () => makeConfirmInsight((id) => sampleSoleUrl(id, { kind: "shoe", zones: OTHER_ZONES[id] ?? ["herring", "grid", "tri"] })),
    [],
  )

  // 표본 그림: 현장 = 그 이미지 번호의 실제 사진, 확인대상 = 신발 번호의 실제 밑창(없으면 위 가짜 그림)
  const blocks: ConfirmImageBlock[] = useMemo(
    () =>
      makeBlocks(ftwr).map((b, i) => ({
        aprthngNo: b.aprthngNo,
        sceneImage: samplePhotoUrl(b.aprthngNo, {}, () => images.scenes[i % images.scenes.length]),
        history: [...b.history, ...(added[b.aprthngNo] ?? [])],
        target: b.target ? { ...b.target, image: sampleSoleUrl(b.target.ftwrId, { kind: "shoe" }, () => images.shoe) } : null,
      })),
    [ftwr, images, added],
  )

  return (
    <ResultConfirmScreen
      status={activeCase}
      errorAt={S07_ERROR_AT}
      onRetry={() => {
        toast("검색 결과를 다시 불러옵니다(진열용)")
        to("/dev/s07", { case: "ready", ftwr })
      }}
      isAdmin={viewer.isAdmin}
      features={viewer.features}
      caseSummary={CASE_SUMMARY}
      blocks={activeCase === "ready" ? blocks : []}
      judgements={judgements}
      onJudgementChange={(aprthngNo, result) => setJudgements((prev) => ({ ...prev, [aprthngNo]: result }))}
      onSaveJudgement={({ aprthngNo, ftwrId, ranking, result }) => {
        const count = Object.values(added).reduce((n, rows) => n + rows.length, 0)
        const row: CrimeHistoryRow = {
          searchNo: NEXT_SEARCH_NO + count,
          frstRegistDt: toKstIso().slice(0, 19).replace("T", " "),
          ranking,
          mtchgId: result === "found" ? ftwrId : null,
        }
        setAdded((prev) => ({ ...prev, [aprthngNo]: [...(prev[aprthngNo] ?? []), row] }))
        setCompleted((prev) => ({ ...prev, [aprthngNo]: result }))
        toast.success(`${aprthngNo} ${LABEL[result]} 저장(진열용)`)
      }}
      showPlus={showPlus}
      insight={insight}
      completed={completed}
      crossReviewer={reviewer}
      onCrossReviewerChange={setReviewer}
      onRequestCrossReview={(r) => {
        const name = REVIEWERS.find((x) => x.value === r)?.label ?? r
        toast(PLUS_NOT_READY, { description: `교차 검증 요청 → ${name}` })
      }}
      onPlusAction={(label) => toast(PLUS_NOT_READY, { description: label })}
      blockCount={blockCount}
      onBlockCountChange={setBlockCount}
      query={query}
      onQueryChange={setQuery}
      filters={filters}
      onFiltersChange={(key, values) => setFilters({ ...filters, [key]: values })}
      onClearFilters={() => {
        setQuery("")
        setFilters({})
      }}
    />
  )
}
