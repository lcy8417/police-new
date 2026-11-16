import * as React from "react"
import { toast } from "sonner"

import { insertPatternPath, type PatternZone } from "@/entities/pattern"
import { toKstIso } from "@/shared/lib"
import { ZoneBands, type ZoneBand } from "@/shared/ui/viewer"
import {
  BoundaryLines,
  HISTORY_COLUMNS,
  PatternCodeScreen,
  patternName,
  PriceTagBox,
  RoiBox,
  ZoneConfidenceTags,
  type CrimePatternTuple,
  type CrimeZones,
  type ExtractState,
  type ImageCodingStatus,
  type MatchConditionValues,
  type PaletteKind,
  type PatternCardMeta,
  type PatternMetaMap,
  type ResearchState,
  type SearchImageSource,
  type SearchMethod,
  type SearchRun,
  type WeightLevel,
  type WeightOverrideMap,
  type ZoneConfidenceTag,
} from "@/widgets/pattern-code"

import {
  DevScreenFrame,
  SCREEN_CASES,
  devScreen,
  subsetOf,
  useDevCase,
  useDevNavigate,
  useDevPlus,
  useDevViewer,
  useRememberedState,
  type DevGo,
} from "../frame"
import { FakePhoto } from "../mock-assets/FakePhoto"
import {
  DEFAULT_CODE_NOTE,
  fakeSearchRun,
  S04_APRTHNG_NO,
  S04_KINDS,
  S04_LIBRARY,
  S04_RUNS,
  S04_CODE_NOTES,
  S04_FUNNEL,
  S04_IMAGE_REST,
  S04_IMAGE_STATUSES,
  S04_IMAGE_TOTAL,
  S04_IMAGES,
  S04_MATCH_CONDITIONS,
  S04_MOCK,
  S04_PALETTE,
  S04_RECENT,
  S04_RESEARCH_MS,
  S04_ZONE_CONFIDENCE,
  type NamedZones,
  type S04Case,
} from "./mock-cases"

const info = devScreen("s04")
const HISTORY_KEYS: string[] = HISTORY_COLUMNS.map((c) => c.key)
const isHistoryKeys = subsetOf(HISTORY_KEYS)

/** 동작이 아직 없는 신규 버튼(spec §13-4) */
const notReady = (label: string) => toast("시안 — 기능 준비 중", { description: label })

const ZONE_KEYS: PatternZone[] = ["top", "mid", "bottom", "outline"]
const BANDS: ZoneBand[] = [
  { key: "top", label: "상", from: 0.01, to: 0.35 },
  { key: "mid", label: "중", from: 0.35, to: 0.67 },
  { key: "bottom", label: "하", from: 0.67, to: 0.99 },
]

/** 서버 모양(이름) → 화면 모양(경로). 페이지에서 한 번만 붙인다(docs/pattern-data-model.md §3) */
function hydrate(zones: NamedZones): CrimeZones {
  const out = {} as Record<PatternZone, CrimePatternTuple[]>
  for (const z of ZONE_KEYS) out[z] = zones[z].map((t) => insertPatternPath(t) as CrimePatternTuple)
  return out
}

/** 시안 영역별 확신도 꼬리표(띠 위치는 BANDS 와 같음) */
const CONFIDENCE_TAGS: ZoneConfidenceTag[] = BANDS.map((b) => ({
  key: b.key,
  label: b.label,
  from: b.from * 100,
  to: b.to * 100,
  confidence: S04_ZONE_CONFIDENCE[b.key],
}))

/**
 * 경계선 캔버스 자리에 넣는 가짜 그림 + 시안 도구 모양(고정 장식, pointer-events-none).
 * 신규 켜기면 띠 글자 대신 영역별 AI 확신도 꼬리표(시안 r3)와 가격표 네모(시안 핀 8)를 얹는다.
 */
function FakePatternCanvas({ source, plus }: { source: SearchImageSource; plus: boolean }) {
  return (
    <div className="absolute inset-y-[8px] left-1/2 aspect-[2/3] -translate-x-1/2">
      <FakePhoto
        look={source === "edited" ? "binary" : "raw"}
        zones={["herring", "herring", "herring"]}
        rotate={0}
        flip
        tag=""
        preserveAspectRatio="xMidYMid meet"
      />
      <ZoneBands zones={BANDS} className={plus ? "[&_span]:hidden" : undefined} />
      <BoundaryLines ys={[35, 67]} />
      <RoiBox left={22} top={1} width={56} height={98} />
      {plus ? (
        <>
          <ZoneConfidenceTags tags={CONFIDENCE_TAGS} />
          <PriceTagBox left={52} top={43} width={14} height={7} />
        </>
      ) : null}
    </div>
  )
}

/** 다음 미코딩 이미지(지금 이미지 제외) */
function nextUncoded(statuses: Record<string, ImageCodingStatus>, current: string): string | null {
  return S04_IMAGES.find((no) => no !== current && statuses[no] === "uncoded") ?? null
}

function S04Stage({ caseName, imageNo, go: goProp, inWindow }: { caseName: S04Case; imageNo: string; go?: DevGo; inWindow?: boolean }) {
  const mock = S04_MOCK[caseName]
  const viewer = useDevViewer()
  const plus = useDevPlus()
  const nav = useDevNavigate()
  const go = goProp ?? nav
  const [meta, setMeta] = React.useState<PatternMetaMap>(mock.meta)
  const [imageStatuses, setImageStatuses] = React.useState<Record<string, ImageCodingStatus>>(S04_IMAGE_STATUSES)
  const [historyQuery, setHistoryQuery] = React.useState("")
  // r3 보기 설정(설계서 §14-6): 검색 이력 보이는 열은 이 브라우저에 기억. 검색어는 이번 화면에서만
  const [historyColumns, setHistoryColumns] = useRememberedState<string[]>("s04", "historyColumns", HISTORY_KEYS, isHistoryKeys)
  const [soleText, setSoleText] = React.useState("")
  const [searchMethod, setSearchMethod] = React.useState<SearchMethod>("image")
  const [selectedSearchNo, setSelectedSearchNo] = React.useState<number | undefined>(mock.history[0]?.searchNo)

  const [aprthngNo, setAprthngNo] = React.useState(imageNo)
  const [zones, setZones] = React.useState<NamedZones>(mock.zones)
  const [selectedZone, setSelectedZone] = React.useState<PatternZone>("top")
  const [searchImage, setSearchImage] = React.useState<SearchImageSource>("edited")
  const [extractState, setExtractState] = React.useState<ExtractState>(mock.extractState)
  const [extracted, setExtracted] = React.useState(mock.extracted)
  const [paletteKind, setPaletteKind] = React.useState<PaletteKind>("선")
  const [noteCode, setNoteCode] = React.useState<string | null>(caseName === "ready" ? "n32_04" : null)
  const [researchState, setResearchState] = React.useState<ResearchState>("idle")
  const [matchConditions, setMatchConditions] = React.useState<MatchConditionValues>(S04_MATCH_CONDITIONS)
  // 사건 창(11/17): 사람이 고른 가중치 · 조건별 검색 이력(가짜 계산 — spec 2026-11-17-pattern-weight-rule-design §4)
  const [weightOverrides, setWeightOverrides] = React.useState<WeightOverrideMap>({})
  const [searchRuns, setSearchRuns] = React.useState<SearchRun[]>(caseName === "ready" || caseName === "running" ? S04_RUNS : [])

  // 진열용 실시간 재검색: 필수를 바꾸면 잠깐 「갱신 중」, S04_RESEARCH_MS 뒤 「갱신했습니다」(F20)
  React.useEffect(() => {
    if (researchState !== "running") return
    const t = window.setTimeout(() => setResearchState("done"), S04_RESEARCH_MS)
    return () => window.clearTimeout(t)
  }, [researchState])

  // 진열용: 추출을 누르면 잠시 뒤 끝난 모양으로(running 케이스는 계속 도는 모양을 보여 준다)
  React.useEffect(() => {
    if (extractState !== "running" || caseName === "running") return
    const t = window.setTimeout(() => {
      setExtracted(S04_MOCK.ready.extracted)
      setExtractState("done")
    }, 1500)
    return () => window.clearTimeout(t)
  }, [extractState, caseName])

  const hydrated = React.useMemo(() => hydrate(zones), [zones])
  // 사건 창은 전체 문양 목록(폴더 그대로), 단독 진열은 시안 앞쪽 일부 그대로
  const palette = React.useMemo(
    () => (inWindow ? S04_LIBRARY : S04_PALETTE)[paletteKind].map((n) => insertPatternPath(n) as string),
    [paletteKind, inWindow],
  )
  const recentPaths = React.useMemo(() => S04_RECENT.map((n) => insertPatternPath(n) as string), [])
  const extractedView = React.useMemo(
    () => extracted.map((it) => ({ ...it, src: insertPatternPath(it.code) as string })),
    [extracted],
  )

  const updateZone = (zone: PatternZone, fn: (items: NamedZones[PatternZone]) => NamedZones[PatternZone]) =>
    setZones((prev) => ({ ...prev, [zone]: fn(prev[zone]) }))

  /** 문양 카드 덧붙임 한 칸 고치기(이름 기준). patch 가 null 이면 지운다 */
  const patchMeta = (zone: PatternZone, name: string, patch: Partial<PatternCardMeta> | null) =>
    setMeta((prev) => {
      const zoneMeta = { ...(prev[zone] ?? {}) }
      if (patch === null) delete zoneMeta[name]
      else zoneMeta[name] = { ...(zoneMeta[name] ?? { status: "manual" }), ...patch }
      return { ...prev, [zone]: zoneMeta }
    })
  const nameAt = (zone: PatternZone, index: number) => zones[zone][index]?.[0] ?? ""

  /** 클릭 넣기 · 끌어 놓기 공통 — 같은 부위에 같은 이름이 있으면 넣지 않는다(이름 기준, docs/pattern-data-model.md §2) */
  const insertInto = (zone: PatternZone, src: string) => {
    const name = patternName(src)
    updateZone(zone, (items) => (items.some(([n]) => n === name) ? items : [...items, [name, 0] as const]))
    setNoteCode(name)
  }

  /** 가중치 한 칸 고치기(이름 기준). null 이면 지워 규칙 값으로 */
  const setWeight = (zone: PatternZone, name: string, level: WeightLevel | null) =>
    setWeightOverrides((prev) => {
      const row = { ...(prev[zone] ?? {}) }
      if (level === null) delete row[name]
      else row[name] = level
      return { ...prev, [zone]: row }
    })

  /** 사건 창 「검색」 — 지금 문양 · 필수 · 가중치 · 조건으로 가짜 신발 DB 를 돌려 이력 한 줄을 더한다 */
  const runSearch = () => {
    const searchNo = Math.max(572400, ...searchRuns.map((r) => r.searchNo)) + 1
    const run = fakeSearchRun({
      searchNo,
      at: toKstIso().slice(0, 19).replace("T", " "),
      source: searchImage,
      zones,
      meta,
      overrides: weightOverrides,
      conditions: matchConditions,
    })
    setSearchRuns((prev) => [run, ...prev])
    toast.success(`검색 ${searchNo} — 결과 ${run.resultCount.toLocaleString("ko-KR")}건(진열 가짜 계산)`)
  }

  /** 「이 조건 다시 불러오기」 — 그때의 문양 · 필수 · 가중치 · 매칭 조건 · 이미지를 되살린다(그때 검색한 문양은 모두 확인된 문양) */
  const restoreRun = (searchNo: number) => {
    const run = searchRuns.find((r) => r.searchNo === searchNo)
    if (!run) return
    const nextZones = {} as NamedZones
    const nextMeta: PatternMetaMap = {}
    const nextOverrides: WeightOverrideMap = {}
    for (const z of ZONE_KEYS) {
      nextZones[z] = run.zones[z].map((p) => [p.name, p.essential ? 1 : 0] as const)
      const zoneMeta: Record<string, PatternCardMeta> = {}
      const zoneOverrides: Record<string, WeightLevel> = {}
      for (const p of run.zones[z]) {
        const m = meta[z]?.[p.name]
        if (m) zoneMeta[p.name] = m.status === "suggested" ? { ...m, status: "ai" } : m
        if (p.manual) zoneOverrides[p.name] = p.weight
      }
      nextMeta[z] = zoneMeta
      nextOverrides[z] = zoneOverrides
    }
    setZones(nextZones)
    setMeta(nextMeta)
    setWeightOverrides(nextOverrides)
    setMatchConditions(run.conditions)
    setSearchImage(run.source)
    toast(`검색 ${searchNo} 조건을 다시 불러왔습니다.`)
  }

  return (
    <PatternCodeScreen
      status={mock.status}
      errorAt={mock.errorAt}
      onRetry={() => go("/dev/s04", { case: "ready" })}
      isAdmin={viewer.isAdmin}
      features={viewer.features}
      showPlus={plus}
      inWindow={inWindow}
      onPlusAction={notReady}
      aprthngNo={aprthngNo}
      images={S04_IMAGES}
      onSelectImage={(no) => {
        setAprthngNo(no)
        toast(`${no} 이미지로 바꿨습니다(진열용 — 문양은 같은 가짜 값).`)
      }}
      canvasSlot={<FakePatternCanvas source={searchImage} plus={plus} />}
      searchImage={searchImage}
      onSearchImageChange={setSearchImage}
      extractState={extractState}
      onExtract={() => {
        setExtractState("running")
        toast(searchImage === "edited" ? "편집본으로 AI 문양 추출을 시작했습니다." : "원본으로 AI 문양 추출을 시작했습니다.")
      }}
      extracted={extractedView}
      zones={hydrated}
      selectedZone={selectedZone}
      onSelectZone={setSelectedZone}
      onInsertPattern={(src) => insertInto(selectedZone, src)}
      onInsertPatternToZone={insertInto}
      onRemovePattern={(zone, index) => {
        patchMeta(zone, nameAt(zone, index), null)
        setWeight(zone, nameAt(zone, index), null)
        updateZone(zone, (items) => items.filter((_, i) => i !== index))
      }}
      onToggleEssential={(zone, index) => {
        updateZone(zone, (items) => items.map((t, i) => (i === index ? ([t[0], !t[1]] as const) : t)))
        setResearchState("running")
      }}
      researchState={researchState}
      matchConditions={matchConditions}
      onMatchConditionsChange={setMatchConditions}
      onReset={() => {
        setZones(S04_MOCK.empty.zones)
        setMeta({})
        toast("4부위 문양을 모두 지웠습니다.")
      }}
      paletteKind={paletteKind}
      onPaletteKindChange={setPaletteKind}
      palette={palette}
      codeNote={noteCode ? { code: noteCode, text: S04_CODE_NOTES[noteCode] ?? DEFAULT_CODE_NOTE } : null}
      history={mock.history}
      historyQuery={historyQuery}
      onHistoryQueryChange={setHistoryQuery}
      historyColumns={historyColumns}
      onHistoryColumnsChange={setHistoryColumns}
      selectedSearchNo={selectedSearchNo}
      onOpenHistory={(no) => {
        setSelectedSearchNo(no)
        toast(`검색 이력 ${no}을 엽니다(진열용).`)
      }}
      onSearch={
        inWindow
          ? runSearch
          : () => {
              toast.success("필수 문양으로 신발을 검색합니다.")
              go("/dev/s05")
            }
      }
      onOpenResults={() => go("/dev/s05")}
      onClose={() => go("/dev/s02")}
      // ── 시안 r2 신규(+α) ──
      editedLook="이진화"
      priceTagWarning
      imageStatuses={imageStatuses}
      imageProgress={{
        total: S04_IMAGE_TOTAL,
        done: Object.values(imageStatuses).filter((s) => s === "done").length,
        rest: S04_IMAGE_REST,
        next: nextUncoded(imageStatuses, aprthngNo),
      }}
      onNextImage={(no) => {
        // 진열용: 넘어간 이미지를 「검색 중」으로, 떠난 이미지는 그대로 둔다
        setImageStatuses((prev) => ({ ...prev, [no]: "searching" }))
        setAprthngNo(no)
        toast(`${no} 이미지로 넘어갑니다(진열용 — 문양은 같은 가짜 값).`)
      }}
      patternMeta={meta}
      onConfirmSuggestion={(zone, index) => patchMeta(zone, nameAt(zone, index), { status: "ai" })}
      onConfirmAllSuggestions={() =>
        setMeta((prev) => {
          const out: PatternMetaMap = {}
          for (const z of ZONE_KEYS) {
            const zoneMeta = prev[z]
            if (!zoneMeta) continue
            out[z] = Object.fromEntries(
              Object.entries(zoneMeta).map(([n, m]) => [n, m.status === "suggested" ? { ...m, status: "ai" as const } : m]),
            )
          }
          return out
        })
      }
      onCountChange={(zone, index, count) => patchMeta(zone, nameAt(zone, index), { count })}
      soleText={soleText}
      onSoleTextChange={setSoleText}
      recentPatterns={recentPaths}
      searchMethod={searchMethod}
      onSearchMethodChange={setSearchMethod}
      funnel={S04_FUNNEL}
      // ── 사건 창(11/17) — 가중치 · 검색 이력 · 확대경 그림 ──
      patternKinds={S04_KINDS}
      weightOverrides={weightOverrides}
      onWeightChange={(zone, index, level) => setWeight(zone, nameAt(zone, index), level)}
      onResetWeights={() => {
        setWeightOverrides({})
        toast("가중치를 모두 규칙 기본값으로 되돌렸습니다.")
      }}
      searchRuns={searchRuns}
      onRestoreRun={restoreRun}
      onOpenRun={() => go("/dev/s05")}
      lensSource={<FakePatternCanvas source={searchImage} plus={plus} />}
    />
  )
}

export interface S04ContentProps {
  devCase: S04Case
  /** 코딩하는 이미지 번호(`<감정번호>_<n>`, 없으면 시안 값) */
  imageNo?: string
  /** 화면 옮기기(없으면 진열 주소 이동) — 사건 창은 탭 바꾸기로 받는다 */
  go?: DevGo
  /** 사건 창 안(11/17) — 겹치는 제목 줄 · 닫기 · 이미지 목록 없이 세 칸 · 높이 꽉(위젯 `inWindow`) */
  inWindow?: boolean
}

/** S04 틀 없는 내용 — 진열 페이지와 사건 창(「문양 코드」 탭)이 같이 쓴다 */
export function S04Content({ devCase, imageNo = S04_APRTHNG_NO, go, inWindow }: S04ContentProps) {
  return <S04Stage key={devCase} caseName={devCase} imageNo={imageNo} go={go} inWindow={inWindow} />
}

// S04 문양 코딩 · 검색 조건 진열 페이지 — 정본 위젯에 가짜 값 · 이동 콜백만 넘긴다.
export function S04DevPage() {
  const caseName = useDevCase(SCREEN_CASES.s04, "ready")
  return (
    <DevScreenFrame screen={info.screen} title={info.title} cases={info.cases}>
      <S04Content devCase={caseName} />
    </DevScreenFrame>
  )
}
