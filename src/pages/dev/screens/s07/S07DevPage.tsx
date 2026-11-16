import { useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import { toast } from "sonner"

import type { CrimeHistoryRow } from "@/entities/crime"
import { toKstIso } from "@/shared/lib/kst"
import { ResultConfirmScreen, type BlockViewCount, type ConfirmImageBlock, type Judgement } from "@/widgets/result-confirm"

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
  type DevGo,
} from "../frame"
import { fakePhotoUrl } from "../mock-assets/FakePhoto"
import { fakeSoleUrl } from "../mock-assets/FakeSole"
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
}

/**
 * S07 틀 없는 내용 — 진열 페이지와 사건 창(사건 단위 「결과 확인」 탭)이 같이 쓴다. `?ftwr=` 는 주소에서 읽는다.
 * 가짜 이미지 블록 · 이력은 시안 0646 값 그대로다(어느 사건 창에서 열어도 같다).
 */
export function S07Content({ devCase: activeCase, go }: S07ContentProps) {
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
    () => makeConfirmInsight((id) => fakeSoleUrl({ kind: "shoe", zones: OTHER_ZONES[id] ?? ["herring", "grid", "tri"] })),
    [],
  )

  const blocks: ConfirmImageBlock[] = useMemo(
    () =>
      makeBlocks(ftwr).map((b, i) => ({
        aprthngNo: b.aprthngNo,
        sceneImage: images.scenes[i % images.scenes.length],
        history: [...b.history, ...(added[b.aprthngNo] ?? [])],
        target: b.target ? { ...b.target, image: images.shoe } : null,
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
