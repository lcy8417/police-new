import { useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import { toast } from "sonner"

import type { Alignment } from "@/entities/alignment"
import { insertPatternPath, type PatternZone } from "@/entities/pattern"
import {
  MatchCompareScreen,
  type CompareAutoMode,
  type CompareCandidate,
  type CompareCount,
  type ZonePatterns,
} from "@/widgets/match-compare"
import type { PatternMetaMap, SearchRun, SearchRunHit } from "@/widgets/pattern-code"

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
  useWorkValue,
  useWorkWriter,
  useInWorkMemory,
  CASE_TARGETS_FIELD,
  addTarget,
  type CaseTarget,
  type DevGo,
} from "../frame"
import {
  fakeShoePatterns,
  rankOfRun,
  S04_META_FIELD,
  S04_MOCK,
  S04_RUNS,
  S04_RUNS_FIELD,
  S04_ZONES_FIELD,
  type NamedZones,
} from "../s04/mock-cases"
import { S05_RUN_NO_FIELD } from "../s05/mock-cases"
import { FakeSole, fakeSoleUrl, SOLE_PALETTE } from "../mock-assets/FakeSole"
import { hasSamplePhotos, samplePhotoUrl, sampleSoleUrl } from "../mock-assets/sample-images"
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

/** 이름 → 비교 띠 문양 한 칸(경로는 여기 페이지에서 한 번만 붙인다 — docs/pattern-data-model.md §3) */
const patternIcon = (name: string) => ({ name, src: insertPatternPath(name) as string })

/** 이름 문양 4부위 → 비교 띠 문양 */
function zonePatternsOf(zones: Readonly<Record<PatternZone, readonly string[]>>): ZonePatterns {
  return {
    top: zones.top.map(patternIcon),
    mid: zones.mid.map(patternIcon),
    bottom: zones.bottom.map(patternIcon),
    outline: zones.outline.map(patternIcon),
  }
}

/** r3 비교 후보 — 사건 창에서 그 이미지의 검색(이력 「자세히」로 본 검색)이 있으면 그 검색의 상위 20건, 없으면 S05 가짜 결과 1쪽(20건). 주소의 신발이 없으면 맨 앞에 */
function makeCandidates(ftwr: string, rank: number | null, hits?: readonly SearchRunHit[]): CompareCandidate[] {
  // 첫 칸은 2차 발견 이미지와 같은 그림(seed 없음)
  const art = CANDIDATE_ZONES.map((zones, i) => {
    const seed = i === 0 ? undefined : i + 1
    return { rgb: fakeSoleUrl({ kind: "shoe", zones, seed }), sketch: fakeSoleUrl({ kind: "bin", zones, seed }) }
  })
  // 표본 신발 사진은 신발 번호로 고른다(검색 결과 카드와 같은 그림) — 없으면 가짜 그림
  const imagesOf = (id: string, k: number) => {
    const fake = art[k % art.length]
    return {
      rgb: sampleSoleUrl(id, { kind: "shoe" }, () => fake.rgb),
      sketch: sampleSoleUrl(id, { kind: "bin" }, () => fake.sketch),
    }
  }
  const base = hits
    ? hits.slice(0, 20).map((h) => ({ ftwrId: h.ftwrId, similarity: h.score === null ? "—" : Math.round(h.score * 10000) / 100 }))
    : makeResults(1, () => "").map((r) => ({ ftwrId: r.ftwrId, similarity: r.similarity }))
  const list: CompareCandidate[] = base.map((r, i) => ({
    ftwrId: r.ftwrId,
    rank: i + 1,
    similarity: r.similarity,
    ...imagesOf(r.ftwrId, i),
  }))
  if (!list.some((c) => c.ftwrId === ftwr)) list.unshift({ ftwrId: ftwr, rank, similarity: "—", ...imagesOf(ftwr, 0) })
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
  // 사건 창: 같은 이미지의 문양 코드 탭 값(4부위 문양 · 검색 이력)과 검색 결과 탭이 본 검색 번호를 보관함에서 읽는다
  // 문양 코드 · 검색 결과 탭을 아직 안 열었어도 그 탭의 처음 값(4부위 · 이력 · 가장 최근 검색)과 같은 값으로 본다(2회차 검수 — 방문 전후 값이 다르던 것)
  const inWork = useInWorkMemory()
  const workZones = useWorkValue<NamedZones>(S04_ZONES_FIELD) ?? (inWork ? S04_MOCK.ready.zones : undefined)
  const workMeta = useWorkValue<PatternMetaMap>(S04_META_FIELD) ?? (inWork ? S04_MOCK.ready.meta : undefined)
  const workRuns = useWorkValue<SearchRun[]>(S04_RUNS_FIELD) ?? (inWork ? S04_RUNS : undefined)
  const workRunNo = useWorkValue<number>(S05_RUN_NO_FIELD)
  const urlRun = params.get("run")
  const run = useMemo(() => {
    if (!workRuns) return undefined
    const no = urlRun ? Number(urlRun) : workRunNo
    return workRuns.find((r) => r.searchNo === no) ?? (inWork ? workRuns[0] : undefined)
  }, [workRuns, workRunNo, urlRun, inWork])
  const runHits = useMemo(() => (run ? rankOfRun(run) : undefined), [run])
  // 확인대상 목록(검색 결과 ★ 와 같은 목록 — 여러 후보를 쌓는다, 2회차 검수). 넣고 곧바로 결과 확인 탭으로 옮기므로 보관함에 바로 적는다
  const caseTargets = useWorkValue<readonly CaseTarget[]>(CASE_TARGETS_FIELD) ?? []
  const writeWork = useWorkWriter()
  const candidates = useMemo(() => makeCandidates(urlFtwr, urlRank, runHits), [urlFtwr, urlRank, runHits])
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

  // 현장 = 이 이미지 번호의 실제 사진(표본 사진이 없으면 가짜 그림)
  const sceneKey = caseInfo.aprthngNo ?? "00001-25-0646_1"
  const crimeImage = useMemo(
    () => ({
      rgb: samplePhotoUrl(sceneKey, { zones: ZONES, rotate: 0, tag: "1" }),
      sketch: samplePhotoUrl(sceneKey, { zones: ZONES, rotate: 0, tag: "1", look: "binary" }),
      ...CRIME_SIZE,
    }),
    [sceneKey],
  )
  // 1:1 의 발견 이미지 = 지금 후보 그림(좌표계는 같은 가짜 밑창 크기)
  const shoeImage = useMemo(
    () => ({ rgb: currentCandidate.rgb, sketch: currentCandidate.sketch, ...SHOE_SIZE }),
    [currentCandidate],
  )
  // 비교 띠 문양(1회차 검수 — 상수였던 것): 현장 = 문양 코드 탭의 지금 4부위(사건 창), 신발 = 지금 후보의 신발 DB 문양(가짜 DB 에 있으면).
  // 없으면 시안 값 그대로(단독 진열)
  // 현장 쪽은 검색에 쓰는 문양만(확인 전 AI 제안 빼고 — 가중치 스펙 §4 Q, 2회차 검수)
  const crimePatterns = useMemo(() => {
    if (!workZones) return CRIME_PATTERNS
    const used = (z: PatternZone) => workZones[z].map(([n]) => n).filter((n) => workMeta?.[z]?.[n]?.status !== "suggested")
    return zonePatternsOf({ top: used("top"), mid: used("mid"), bottom: used("bottom"), outline: used("outline") })
  }, [workZones, workMeta])
  const shoePatterns = useMemo(() => {
    const shoe = fakeShoePatterns(ftwrId)
    return shoe ? zonePatternsOf(shoe.zones) : SHOE_PATTERNS
  }, [ftwrId])
  const insight = useMemo(
    () =>
      makeMatchInsight({
        overlayCrime: samplePhotoUrl(sceneKey, { zones: ZONES, rotate: 0, tag: "", ruler: false }),
        overlayShoe: sampleSoleUrl(ftwrId, { kind: "shoe" }, () =>
          svgToUrl(<FakeSole kind="shoe" zones={ZONES} palette={{ ...resolvePalette(SOLE_PALETTE.shoe), ground: "transparent" }} />),
        ),
        cropCrime: samplePhotoUrl(sceneKey, { zones: ZONES, rotate: 0, tag: "", ruler: false, look: "contrast" }),
        cropShoe: sampleSoleUrl(ftwrId, { kind: "shoe", zones: ZONES }),
        side: fakeSideShoeUrl(),
      }),
    [sceneKey, ftwrId],
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
      crimePatterns={crimePatterns}
      shoePatterns={shoePatterns}
      alignmentSlot={<AlignmentDecor alignment={FAKE_ALIGNMENT} src={hasSamplePhotos ? crimeImage.rgb : undefined} />}
      onSaveAlignment={() => {
        setSavedAlignment(FAKE_ALIGNMENT)
        toast.success("정렬을 저장했습니다(진열용)")
      }}
      onConfirmTarget={() => {
        // 사건 창: 이 장의 확인대상 목록에 더한다(덮어쓰지 않음 — 여러 검색의 여러 후보, DB §5-C) → 결과 확인 탭이 그 장 판정 줄에 싣는다(2회차 검수)
        writeWork(
          CASE_TARGETS_FIELD,
          addTarget(caseTargets, {
            ftwrId,
            rank: ranking,
            similarity: typeof currentCandidate.similarity === "number" ? currentCandidate.similarity : null,
            searchNo: run ? String(run.searchNo) : null,
            from: "compare",
          }),
        )
        to("/dev/s07", { ftwr: ftwrId })
      }}
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
