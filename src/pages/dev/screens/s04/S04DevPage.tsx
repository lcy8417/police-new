import * as React from "react"
import { toast } from "sonner"

import { insertPatternPath, type PatternZone } from "@/entities/pattern"
import { ZoneBands, type ZoneBand } from "@/shared/ui/viewer"
import {
  BoundaryLines,
  PatternCodeScreen,
  patternName,
  RoiBox,
  type CrimePatternTuple,
  type CrimeZones,
  type ExtractState,
  type MatchConditionValues,
  type PaletteKind,
  type ResearchState,
  type SearchImageSource,
} from "@/widgets/pattern-code"

import { DevScreenFrame, SCREEN_CASES, devScreen, useDevCase, useDevNavigate, useDevViewer } from "../frame"
import { FakePhoto } from "../mock-assets/FakePhoto"
import {
  DEFAULT_CODE_NOTE,
  S04_APRTHNG_NO,
  S04_CODE_NOTES,
  S04_IMAGES,
  S04_MATCH_CONDITIONS,
  S04_MOCK,
  S04_PALETTE,
  S04_RESEARCH_MS,
  type NamedZones,
  type S04Case,
} from "./mock-cases"

const info = devScreen("s04")

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

/** 경계선 캔버스 자리에 넣는 가짜 그림 + 시안 도구 모양(고정 장식, pointer-events-none) */
function FakePatternCanvas({ source }: { source: SearchImageSource }) {
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
      <ZoneBands zones={BANDS} />
      <BoundaryLines ys={[35, 67]} />
      <RoiBox left={22} top={1} width={56} height={98} />
    </div>
  )
}

function S04Stage({ caseName }: { caseName: S04Case }) {
  const mock = S04_MOCK[caseName]
  const viewer = useDevViewer()
  const go = useDevNavigate()

  const [aprthngNo, setAprthngNo] = React.useState(S04_APRTHNG_NO)
  const [zones, setZones] = React.useState<NamedZones>(mock.zones)
  const [selectedZone, setSelectedZone] = React.useState<PatternZone>("top")
  const [searchImage, setSearchImage] = React.useState<SearchImageSource>("edited")
  const [extractState, setExtractState] = React.useState<ExtractState>(mock.extractState)
  const [extracted, setExtracted] = React.useState(mock.extracted)
  const [paletteKind, setPaletteKind] = React.useState<PaletteKind>("선")
  const [noteCode, setNoteCode] = React.useState<string | null>(caseName === "ready" ? "n32_04" : null)
  const [researchState, setResearchState] = React.useState<ResearchState>("idle")
  const [matchConditions, setMatchConditions] = React.useState<MatchConditionValues>(S04_MATCH_CONDITIONS)

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
  const palette = React.useMemo(
    () => S04_PALETTE[paletteKind].map((n) => insertPatternPath(n) as string),
    [paletteKind],
  )
  const extractedView = React.useMemo(
    () => extracted.map((it) => ({ ...it, src: insertPatternPath(it.code) as string })),
    [extracted],
  )

  const updateZone = (zone: PatternZone, fn: (items: NamedZones[PatternZone]) => NamedZones[PatternZone]) =>
    setZones((prev) => ({ ...prev, [zone]: fn(prev[zone]) }))

  /** 클릭 넣기 · 끌어 놓기 공통 — 같은 부위에 같은 이름이 있으면 넣지 않는다(이름 기준, docs/pattern-data-model.md §2) */
  const insertInto = (zone: PatternZone, src: string) => {
    const name = patternName(src)
    updateZone(zone, (items) => (items.some(([n]) => n === name) ? items : [...items, [name, 0] as const]))
    setNoteCode(name)
  }

  return (
    <PatternCodeScreen
      status={mock.status}
      errorAt={mock.errorAt}
      onRetry={() => go("/dev/s04", { case: "ready" })}
      isAdmin={viewer.isAdmin}
      features={viewer.features}
      aprthngNo={aprthngNo}
      images={S04_IMAGES}
      onSelectImage={(no) => {
        setAprthngNo(no)
        toast(`${no} 이미지로 바꿨습니다(진열용 — 문양은 같은 가짜 값).`)
      }}
      canvasSlot={<FakePatternCanvas source={searchImage} />}
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
      onRemovePattern={(zone, index) => updateZone(zone, (items) => items.filter((_, i) => i !== index))}
      onToggleEssential={(zone, index) => {
        updateZone(zone, (items) => items.map((t, i) => (i === index ? ([t[0], !t[1]] as const) : t)))
        setResearchState("running")
      }}
      researchState={researchState}
      matchConditions={matchConditions}
      onMatchConditionsChange={setMatchConditions}
      onReset={() => {
        setZones(S04_MOCK.empty.zones)
        toast("4부위 문양을 모두 지웠습니다.")
      }}
      paletteKind={paletteKind}
      onPaletteKindChange={setPaletteKind}
      palette={palette}
      codeNote={noteCode ? { code: noteCode, text: S04_CODE_NOTES[noteCode] ?? DEFAULT_CODE_NOTE } : null}
      history={mock.history}
      onOpenHistory={(no) => toast(`검색 이력 ${no}을 엽니다(진열용).`)}
      onSearch={() => {
        toast.success("필수 문양으로 신발을 검색합니다.")
        go("/dev/s05")
      }}
      onOpenResults={() => go("/dev/s05")}
      onClose={() => go("/dev/s02")}
    />
  )
}

// S04 문양 코딩 · 검색 조건 진열 페이지 — 정본 위젯에 가짜 값 · 이동 콜백만 넘긴다.
export function S04DevPage() {
  const caseName = useDevCase(SCREEN_CASES.s04, "ready")
  return (
    <DevScreenFrame screen={info.screen} title={info.title} cases={info.cases}>
      <S04Stage key={caseName} caseName={caseName} />
    </DevScreenFrame>
  )
}
