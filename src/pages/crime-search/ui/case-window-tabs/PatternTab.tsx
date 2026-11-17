import * as React from "react"
import { toast } from "sonner"

import { putCrimePatterns, useCrimeStore, type Crime } from "@/entities/crime"
import { insertPatternPath, type PatternZone } from "@/entities/pattern"
import { PatternCanvas, usePatternManager } from "@/features/patterns-extract"
import { imageChangeHandler } from "@/utils/get-input-change"
import {
  PatternCodeScreen,
  type ExtractedPatternView,
  type ExtractState,
  type MatchConditionValues,
  type PaletteKind,
} from "@/widgets/pattern-code"

import { paletteCounts, paletteOf, patternKinds } from "./model/palette"
import { useImageSession, useTabSessionStore, type TabSearchImage } from "./model/tab-session"
import { zonesOf } from "./model/tab-values"
import type { TabViewer } from "./model/use-viewer"

/** 부위 인덱스(지금 앱 `usePatternManager.selected` 0~3) ↔ 부위 이름 — PatternZones 순서 그대로 */
const ZONE_KEYS: readonly PatternZone[] = ["top", "mid", "bottom", "outline"]

/** 매칭 조건 처음 값(지금 검색은 이 값을 보내지 않는다 — 위젯도 「보내지 않음」으로 그린다) */
const DEFAULT_CONDITIONS: MatchConditionValues = { searchKind: "현장문양", periodFrom: "", periodTo: "", gender: "전체", heel: "전체" }

const NO_HISTORY: never[] = []

export interface PatternTabProps {
  viewer: TabViewer
  image: Crime
  /** 「검색」 · 「검색결과」 — 검색 결과 탭으로 */
  onOpenSearch: () => void
}

/**
 * 「문양 코드」 탭 — 지금 앱 커맨드센터(CrimeDetailPage)의 문양 흐름을 그대로 쓴다:
 *   좌표 캔버스 = 실제 `PatternCanvas`(슬롯에 그대로 — 좌표 계약 불변), 상태 = `usePatternManager`(crime 모드, store 갱신)
 *   AI 추출 = `patternsExtract`(현장은 통합 추출 → `extractedRaw`), 넣기 · 빼기 · 필수 = 훅 함수(이름 기준 중복 검사)
 *   「검색」 = 문양 저장(`PUT /crime/:aprthngNo` — `putCrimePatterns`) 뒤 검색 결과 탭
 * 가중치는 규칙 값 표시만(사람이 고르는 칸 · 「직접」 저장 API 없음), 검색 이력 탭은 이력 요약 API 가 없어 숨긴다.
 */
export function PatternTab({ viewer, image, onOpenSearch }: PatternTabProps) {
  const aprthngNo = image.aprthngNo ?? ""
  const imgRef = React.useRef<HTMLImageElement | null>(null)
  const crimeData = useCrimeStore((s) => s.crimeData)
  const index = crimeData.findIndex((c) => c.aprthngNo === aprthngNo)
  const current = index >= 0 ? crimeData[index] : image

  const pm = usePatternManager({ index, currentData: current, imgRef })
  const { searchImage } = useImageSession(aprthngNo)
  const setSearchImage = useTabSessionStore((s) => s.setSearchImage)

  const [extractState, setExtractState] = React.useState<ExtractState>(current.extractedRaw?.length ? "done" : "idle")
  const [paletteKind, setPaletteKind] = React.useState<PaletteKind>("무늬")
  const [conditions, setConditions] = React.useState<MatchConditionValues>(DEFAULT_CONDITIONS)
  const [saving, setSaving] = React.useState(false)

  const zones = React.useMemo(() => zonesOf(current), [current])
  const selectedZone = ZONE_KEYS[pm.selected ?? 0]
  const palette = React.useMemo(() => paletteOf(paletteKind), [paletteKind])
  const counts = React.useMemo(() => paletteCounts(), [])
  const extracted = React.useMemo<ExtractedPatternView[]>(
    () =>
      (current.extractedRaw ?? []).map((item) => ({
        code: item.code,
        score: item.score,
        src: insertPatternPath(item.code) as string,
      })),
    [current.extractedRaw]
  )

  const handleExtract = async () => {
    setExtractState("running")
    try {
      await pm.extractPattern()
      setExtractState("done")
    } catch (error) {
      console.error("패턴 추출 중 오류:", error)
      toast.error("패턴 추출 중 오류가 발생했습니다.")
      setExtractState("failed")
    }
  }

  // 원본 · 편집본 — 지금 앱 스와퍼처럼 imgRef.src 를 바꾸고(추출이 이 src 를 읽는다), 검색 결과 탭도 같은 이미지로 검색하게 남긴다
  const handleSearchImage = (next: TabSearchImage) => {
    if (next === "edited" && !current.editImage) {
      toast("편집 이미지가 없습니다. 이미지 편집 탭에서 저장하면 편집본으로 추출 · 검색할 수 있습니다.")
      return
    }
    setSearchImage(aprthngNo, next)
    imageChangeHandler(next === "edited" ? "edit" : "origin", imgRef, current)
  }

  const entryPath = (zone: PatternZone, i: number) => zones[zone][i]?.[0]

  const handleSearch = async () => {
    if (saving) return
    setSaving(true)
    try {
      // 지금 앱과 같이 검색 전에 지금 문양을 서버에 저장한다(PUT — 필수 플래그 · 통합 추출 결과 포함)
      await putCrimePatterns(aprthngNo, current)
      onOpenSearch()
    } catch (error) {
      console.error("문양 저장 오류:", error)
      toast.error("문양 업데이트 중 오류가 발생했습니다.")
    } finally {
      setSaving(false)
    }
  }

  const sceneSrc = searchImage === "edited" ? current.editImage ?? current.image : current.image

  return (
    <PatternCodeScreen
      status="ready"
      onRetry={() => undefined}
      isAdmin={viewer.isAdmin}
      features={viewer.features}
      showPlus={false}
      inWindow
      aprthngNo={aprthngNo}
      images={[aprthngNo]}
      onSelectImage={() => undefined}
      canvasSlot={
        <PatternCanvas
          canvasRef={pm.canvasRef}
          imgRef={imgRef}
          image={current.image ?? null}
          lineState={pm.lineState}
          setLineState={pm.setLineState}
          onExtract={() => void handleExtract()}
          onClear={pm.clearPattern}
          onShowOrigin={() => handleSearchImage("original")}
          onShowEdit={() => handleSearchImage("edited")}
          isExtracting={extractState === "running"}
          // 현장 경로는 경계선 좌표를 보내지 않으므로 신발용 chrome(경계선 · 영역)은 띄우지 않는다(지금 앱과 같음)
          patternActive={false}
          viewIsEdit={searchImage === "edited"}
          editImage={current.editImage ?? null}
          hideViewSwapper
          readOnly
        />
      }
      searchImage={searchImage}
      onSearchImageChange={handleSearchImage}
      extractState={extractState}
      onExtract={() => void handleExtract()}
      extracted={extracted}
      zones={zones}
      selectedZone={selectedZone}
      onSelectZone={(zone) => pm.setSelected(ZONE_KEYS.indexOf(zone))}
      onInsertPattern={(src) => pm.insertPatternToZone(selectedZone, src)}
      onInsertPatternToZone={(zone, src) => pm.insertPatternToZone(zone, src)}
      onRemovePattern={(zone, i) => {
        const path = entryPath(zone, i)
        if (path) pm.deletePattern(zone, path)
      }}
      onToggleEssential={(zone, i) => {
        const path = entryPath(zone, i)
        if (path) pm.essentialCheck(zone, path)
      }}
      // 필수를 바꾼 뒤 재검색은 검색 결과 탭이 한다(디바운스 · settled 게이트) — 이 탭에서는 갱신 줄을 띄우지 않는다
      researchState="idle"
      onReset={pm.clearPattern}
      paletteKind={paletteKind}
      onPaletteKindChange={setPaletteKind}
      palette={palette}
      paletteCounts={counts}
      codeNote={null}
      matchConditions={conditions}
      onMatchConditionsChange={setConditions}
      history={NO_HISTORY}
      onOpenHistory={() => undefined}
      onSearch={() => void handleSearch()}
      onOpenResults={onOpenSearch}
      onClose={() => undefined}
      patternKinds={patternKinds()}
      lensSource={sceneSrc ? <img src={sceneSrc} alt="" draggable={false} className="block size-full object-contain" /> : undefined}
    />
  )
}
