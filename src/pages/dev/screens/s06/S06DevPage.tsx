import { useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import { toast } from "sonner"

import type { Alignment } from "@/entities/alignment"
import {
  MatchCompareScreen,
  type CompareAutoMode,
  type CompareCandidate,
  type CompareCount,
} from "@/widgets/match-compare"

import {
  DevScreenFrame,
  SCREEN_CASES,
  devScreen,
  isIntervalMs,
  oneOf,
  useDevCase,
  useDevNavigate,
  useDevPlus,
  useDevViewer,
  useRememberedState,
  type DevGo,
} from "../frame"
import { fakePhotoUrl } from "../mock-assets/FakePhoto"
import { FakeSole, fakeSoleUrl, SOLE_PALETTE } from "../mock-assets/FakeSole"
import { resolvePalette, type ZoneTriple } from "../mock-assets/fake-art"
import { svgToUrl } from "../mock-assets/svg-url"
import { makeResults } from "../s05/mock-cases"
import { AlignmentDecor } from "./AlignmentDecor"
import { fakeSideShoeUrl } from "./fake-side-shoe"
import {
  CASE_INFO,
  CRIME_PATTERNS,
  CRIME_SIZE,
  FAKE_ALIGNMENT,
  makeMatchInsight,
  MATCHES,
  S06_DEFAULT_FTWR,
  S06_ERROR_AT,
  SHOE_PATTERNS,
  SHOE_SIZE,
  shoeInfoFor,
} from "./mock-cases"

const info = devScreen("s06")
const ZONES: ZoneTriple = ["herring", "grid", "tri"]
const COMPARE_VALUES: readonly CompareCount[] = ["1:1", "1:3", "1:5"]

// 후보 밑창 무늬(첫 칸은 2차 발견 이미지 무늬 그대로)
const CANDIDATE_ZONES: readonly ZoneTriple[] = [
  ZONES,
  ["grid", "grid", "blocks"],
  ["herring", "herring", "lines"],
  ["dots", "herring", "grid"],
  ["wave", "grid", "herring"],
  ["blocks", "herring", "blocks"],
  ["tri", "herring", "grid"],
  ["herring", "dots", "herring"],
]

/** r3 비교 후보 — S05 가짜 결과 1쪽(20건). 주소의 신발이 없으면 맨 앞에 */
function makeCandidates(ftwr: string, rank: number | null): CompareCandidate[] {
  // 첫 칸은 2차 발견 이미지와 같은 그림(seed 없음)
  const art = CANDIDATE_ZONES.map((zones, i) => {
    const seed = i === 0 ? undefined : i + 1
    return { rgb: fakeSoleUrl({ kind: "shoe", zones, seed }), sketch: fakeSoleUrl({ kind: "bin", zones, seed }) }
  })
  const list: CompareCandidate[] = makeResults(1, () => "").map((r, i) => ({
    ftwrId: r.ftwrId,
    rank: i + 1,
    similarity: r.similarity,
    ...art[i % art.length],
  }))
  if (!list.some((c) => c.ftwrId === ftwr)) list.unshift({ ftwrId: ftwr, rank, similarity: "—", ...art[0] })
  return list
}

// S06 상세 조회 · 정밀 대조 진열 페이지. `?ftwr=` · `?rank=`는 S05 카드에서 넘어온다.
// 정렬은 여기서 들고 있다(제어형) — no-alignment 케이스에서 「정렬 저장」을 누르면 가짜 정렬이 저장된 것처럼 바뀐다.
export function S06DevPage() {
  const activeCase = useDevCase(SCREEN_CASES.s06, "ready")
  return (
    <DevScreenFrame screen={info.screen} title={info.title} cases={info.cases}>
      <S06Content devCase={activeCase} />
    </DevScreenFrame>
  )
}

export interface S06ContentProps {
  devCase: (typeof SCREEN_CASES.s06)[number]
  /** 대조하는 현장 이미지 번호(`<감정번호>_<n>`, 없으면 시안 값) */
  imageNo?: string
  /** 화면 옮기기(없으면 진열 주소 이동) — 사건 창은 탭 바꾸기로 받는다 */
  go?: DevGo
  /** 사건 창 안(11/17) — 겹치는 제목 줄 · 닫기 없이 무대 높이 꽉 · 오른쪽 탭(위젯 `inWindow`) */
  inWindow?: boolean
}

/** S06 틀 없는 내용 — 진열 페이지와 사건 창(「정밀 대조」 탭)이 같이 쓴다. `?ftwr=` · `?rank=` 는 주소에서 읽는다 */
export function S06Content({ devCase: activeCase, imageNo, go, inWindow }: S06ContentProps) {
  const nav = useDevNavigate()
  const to = go ?? nav
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const urlFtwr = params.get("ftwr") || S06_DEFAULT_FTWR
  const rankParam = Number(params.get("rank"))
  const urlRank = Number.isInteger(rankParam) && rankParam > 0 ? rankParam : null
  const caseInfo = useMemo(() => (imageNo ? { ...CASE_INFO, aprthngNo: imageNo } : CASE_INFO), [imageNo])
  const viewer = useDevViewer()
  const showPlus = useDevPlus()
  const [savedAlignment, setSavedAlignment] = useState<Alignment | null>(null)
  const alignment = activeCase === "no-alignment" ? savedAlignment : FAKE_ALIGNMENT

  // r3 후보 넘기기: 검색 결과 1쪽(S05 가짜 값)을 후보 목록으로. 주소의 신발이 목록에 없으면 맨 앞에 넣는다.
  // 지금 후보는 여기서 든다(자동 넘김마다 주소를 쌓지 않게) — 처음 값만 주소(?ftwr · ?rank)에서.
  const candidates = useMemo(() => makeCandidates(urlFtwr, urlRank), [urlFtwr, urlRank])
  const [current, setCurrent] = useState<{ ftwrId: string; rank: number | null }>(() => {
    const hit = candidates.find((c) => c.ftwrId === urlFtwr && (urlRank === null || c.rank === urlRank))
    return { ftwrId: urlFtwr, rank: hit ? hit.rank : urlRank }
  })
  const ftwrId = current.ftwrId
  const ranking = current.rank
  const currentCandidate = candidates.find((c) => c.ftwrId === ftwrId) ?? candidates[0]
  const [compareCount, setCompareCount] = useRememberedState<CompareCount>("s06", "compare", "1:1", oneOf(COMPARE_VALUES))
  const [intervalMs, setIntervalMs] = useRememberedState<number>("s06", "interval", 2000, isIntervalMs)
  const [autoMode, setAutoMode] = useState<CompareAutoMode>("manual")
  const [playing, setPlaying] = useState(false)

  const crimeImage = useMemo(
    () => ({
      rgb: fakePhotoUrl({ zones: ZONES, rotate: 0, tag: "1" }),
      sketch: fakePhotoUrl({ zones: ZONES, rotate: 0, tag: "1", look: "binary" }),
      ...CRIME_SIZE,
    }),
    [],
  )
  // 1:1 의 발견 이미지 = 지금 후보 그림(좌표계는 같은 가짜 밑창 크기)
  const shoeImage = useMemo(
    () => ({ rgb: currentCandidate.rgb, sketch: currentCandidate.sketch, ...SHOE_SIZE }),
    [currentCandidate],
  )
  const insight = useMemo(
    () =>
      makeMatchInsight({
        overlayCrime: fakePhotoUrl({ zones: ZONES, rotate: 0, tag: "", ruler: false }),
        overlayShoe: svgToUrl(
          <FakeSole kind="shoe" zones={ZONES} palette={{ ...resolvePalette(SOLE_PALETTE.shoe), ground: "transparent" }} />,
        ),
        cropCrime: fakePhotoUrl({ zones: ZONES, rotate: 0, tag: "", ruler: false, look: "contrast" }),
        cropShoe: fakeSoleUrl({ kind: "shoe", zones: ZONES }),
        side: fakeSideShoeUrl(),
      }),
    [],
  )


  return (
    <MatchCompareScreen
      status={activeCase === "no-alignment" ? "ready" : activeCase}
      errorAt={S06_ERROR_AT}
      onRetry={() => {
        toast("대응 매칭을 다시 불러옵니다(진열용)")
        to("/dev/s06", { case: "ready", ftwr: ftwrId })
      }}
      isAdmin={viewer.isAdmin}
      features={viewer.features}
      ranking={ranking}
      alignment={alignment}
      matches={MATCHES}
      crimeImage={crimeImage}
      shoeImage={shoeImage}
      caseInfo={caseInfo}
      shoeInfo={shoeInfoFor(ftwrId)}
      crimePatterns={CRIME_PATTERNS}
      shoePatterns={SHOE_PATTERNS}
      alignmentSlot={<AlignmentDecor alignment={FAKE_ALIGNMENT} />}
      onSaveAlignment={() => {
        setSavedAlignment(FAKE_ALIGNMENT)
        toast.success("정렬을 저장했습니다(진열용)")
      }}
      onConfirmTarget={() => to("/dev/s07", { ftwr: ftwrId })}
      onClose={() => to("/dev/s05")}
      showPlus={showPlus}
      inWindow={inWindow}
      insight={insight}
      onPlusAction={(label) => toast("시안 — 기능 준비 중", { description: label })}
      candidates={candidates}
      onCandidateChange={(c) => setCurrent({ ftwrId: c.ftwrId, rank: c.rank })}
      compareCount={compareCount}
      onCompareCountChange={setCompareCount}
      autoMode={autoMode}
      onAutoModeChange={(mode) => {
        setAutoMode(mode)
        setPlaying(mode === "auto")
      }}
      intervalMs={intervalMs}
      onIntervalChange={setIntervalMs}
      playing={playing}
      onPlayingChange={setPlaying}
    />
  )
}
