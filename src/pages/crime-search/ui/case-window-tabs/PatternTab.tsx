import * as React from "react"
import { useMutationState } from "@tanstack/react-query"
import { toast } from "sonner"

import { useCrimePatterns, useEditHistory, useSearchHistory, type Crime } from "@/entities/crime"
import { insertPatternPath, type PatternInsertOrigin, type PatternZone } from "@/entities/pattern"
import { useRunSearch } from "@/features/crime-search"
import { PatternCanvas, extractCrimeWithRun, patternSaveKey, useSavePatterns } from "@/features/patterns-extract"
import { ApiError } from "@/shared/api"
import {
  PatternCodeScreen,
  type ExtractedPatternView,
  type ExtractState,
  type MatchConditionValues,
  type PaletteKind,
  type SearchHistoryRow,
  type SearchMethod,
} from "@/widgets/pattern-code"

import { paletteCounts, paletteOf, patternKinds } from "./model/palette"
import { useSearchRunSession } from "./model/search-run-session"
import { useImageSession, useTabSessionStore, type TabSearchImage } from "./model/tab-session"
import {
  conditionKey,
  confirmAll,
  confirmAt,
  countAt,
  draftFromRun,
  hydrateZones,
  insertInto,
  removeAt,
  runConditionKey,
  runOfEntry,
  saveBodyOf,
  searchBodyOf,
  toggleAt,
  usePatternDraft,
  weightAt,
  type PatternDraft,
} from "./model/use-pattern-draft"
import type { TabViewer } from "./model/use-viewer"
import { useRejudgeConfirm } from "./RejudgeConfirm"

/** 매칭 조건 처음 값 */
const DEFAULT_CONDITIONS: MatchConditionValues = { searchKind: "현장문양", periodFrom: "", periodTo: "", gender: "전체", heel: "전체" }

/** 경계선 상태(현장 경로는 경계선 좌표를 보내지 않는다 — PatternCanvas 가 그리기만, 좌표 계약 불변) */
interface LineState {
  lineYs: [number, number]
  draggingLine: number | null
  offsetY: number
}

export interface PatternTabProps {
  viewer: TabViewer
  image: Crime
  /** 「검색」 · 「검색결과」 — 검색 결과 탭으로 */
  onOpenSearch: () => void
  /** 판정이 확정된 장(A2 `aprthng_sttus` CONFIRMED) — 고치기 전에 「다시 판정」 확인 */
  judged?: boolean
}

/** 서버 거절 문구(없으면 기본) */
const messageOf = (error: unknown, fallback: string) => (error instanceof ApiError && error.detail ? error.detail : fallback)

/**
 * 「문양 코드」 탭(B 단계 묶음 ①) — 서버가 정본:
 *   문양 · 카드 덧붙임(출처 · 확신도 · 개수 · 「AI 제안?」) · 직접 가중치 · 밑창 문자열 = C1 → 화면 초안(`usePatternDraft`)
 *   저장 = C2(「검색」 직전 · 탭을 떠날 때 바뀐 게 있으면, 판 번호 `rowVersion` — 409 면 서버 값으로 되돌림)
 *   AI 추출 = C3(실행 번호 헤더 → AI 카드에 남김), 「검색」 = D1 기록(가중치 단계 · 제안 · 문자열 · 조건 · 입력 파일) → 검색 결과 탭
 *   검색 이력 = D2(검색 한 번 = 한 줄), 「이 조건 다시 불러오기」 = 그 줄의 조건(cond)으로 초안을 되살림
 * 좌표 캔버스는 실제 `PatternCanvas`(슬롯에 그대로 — 좌표 계약 불변). 옛 전역 store 는 쓰지 않는다.
 */
export function PatternTab({ viewer, image, onOpenSearch, judged = false }: PatternTabProps) {
  const aprthngNo = image.aprthngNo ?? ""
  const imgRef = React.useRef<HTMLImageElement | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const [lineState, setLineState] = React.useState<LineState>({ lineYs: [100, 200], draggingLine: null, offsetY: 0 })

  const patternsQuery = useCrimePatterns(aprthngNo)
  const historyQuery = useSearchHistory(aprthngNo)
  const editsQuery = useEditHistory(aprthngNo)
  // [버그] 혼자 쓰는데 「다른 사람이 먼저 고쳤습니다」(C2 409): 탭을 떠나며 저장한 뒤 다시 들어오면 캐시의 옛 값(옛 판 번호)이 먼저 그려져
  // 그걸 고치면 다음 저장이 409 였다. 이 탭이 열린 뒤 새로 읽은 값만 쓰고, 앞 탭(이미 사라짐)이 떠나며 한 저장이 아직 진행 중이면
  // 그 저장 · 다시 읽기가 끝날 때까지 기다린다(고칠 칸을 내주지 않음). 서버(B4 편집 · B5 되돌리기)는 판 번호를 올리지 않는다 — C2 · A8 만.
  const [mountedAt] = React.useState(() => Date.now())
  const savingBefore =
    useMutationState({
      // 이 탭이 열리기 전(같은 ms 포함 — 이 탭의 저장은 사람이 누른 뒤라 늘 더 늦다)에 시작한 저장만
      filters: { mutationKey: patternSaveKey(aprthngNo), status: "pending", predicate: (m) => m.state.submittedAt <= mountedAt },
      select: (m) => m.state.submittedAt,
    }).length > 0
  const freshPatterns = patternsQuery.isFetchedAfterMount && !savingBefore ? patternsQuery.data : undefined
  const { draft, update, reset, markSaved, dirty, rowVersion, ready } = usePatternDraft(freshPatterns)
  const save = useSavePatterns(aprthngNo)
  const search = useRunSearch(aprthngNo)

  const { searchImage } = useImageSession(aprthngNo)
  const setSearchImage = useTabSessionStore((s) => s.setSearchImage)
  const setRun = useSearchRunSession((s) => s.setRun)

  const [extractState, setExtractState] = React.useState<ExtractState>("idle")
  const [lastRunId, setLastRunId] = React.useState<number | null>(null)
  const [paletteKind, setPaletteKind] = React.useState<PaletteKind>("무늬")
  const [conditions, setConditions] = React.useState<MatchConditionValues>(DEFAULT_CONDITIONS)
  const [searchMethod, setSearchMethod] = React.useState<SearchMethod>("image")
  const [selectedZone, setSelectedZone] = React.useState<PatternZone>("top")
  const [selectedSearchNo, setSelectedSearchNo] = React.useState<number | undefined>(undefined)
  const busy = save.isPending || search.isPending

  const kinds = React.useMemo(() => patternKinds(), [])
  const palette = React.useMemo(() => paletteOf(paletteKind), [paletteKind])
  const counts = React.useMemo(() => paletteCounts(), [])
  const zones = React.useMemo(() => hydrateZones(draft.zones), [draft.zones])
  const extracted = React.useMemo<ExtractedPatternView[]>(
    () => draft.extracted.map((item) => ({ code: item.code, score: item.score, src: insertPatternPath(item.code) as string })),
    [draft.extracted],
  )

  // 검색 이력(최신이 앞) — 위젯 이력 줄(조건이 남은 새 기록) · 옛 표 줄
  const entries = React.useMemo(() => [...(historyQuery.data ?? [])].reverse(), [historyQuery.data])
  const searchRuns = React.useMemo(() => entries.map(runOfEntry).filter((r): r is NonNullable<typeof r> => r !== null), [entries])
  const historyRows = React.useMemo<SearchHistoryRow[]>(
    () =>
      entries.map((e) => ({
        searchNo: e.searchNo,
        frstRegistDt: e.frstRegistDt ?? "",
        ranking: e.ranking,
        mtchgId: e.mtchgId,
        resultCount: e.resultCount,
        method: e.method,
      })),
    [entries],
  )
  const currentRunNo = React.useMemo(() => {
    const now = conditionKey(draft, kinds, conditions, searchImage)
    return searchRuns.find((r) => runConditionKey(r) === now)?.searchNo
  }, [draft, kinds, conditions, searchImage, searchRuns])

  // 검색 · 추출 이미지: 편집본이면 그 data URL, 원본이면 감정물 번호(서버가 저장 장면 그림을 찾는다 — 지금 앱과 같음)
  const queryImage = searchImage === "edited" && image.editImage ? image.editImage : aprthngNo
  // 기록에 남길 입력 파일(B3): 편집본 = 지금 편집본, 원본 = 작업본. 옛 감정물(파일 없음)은 기록 없이 검색만
  const inputFileId = (searchImage === "edited" ? editsQuery.data?.currentFileId : editsQuery.data?.workingFileId) ?? undefined

  /** 바뀐 게 있으면 C2 1건(없으면 그대로). 실패하면 false — 409 면 서버 값으로 되돌린다 */
  const saveIfDirty = React.useCallback(
    async (current: PatternDraft, version: number | null, isDirty: boolean): Promise<boolean> => {
      if (!isDirty) return true
      if (version === null) {
        toast("이 감정물은 문양을 저장할 수 없습니다(앱에서 등록한 사건이 아님).")
        return false
      }
      try {
        const saved = await save.mutateAsync(saveBodyOf(current, version))
        // 기준 = 방금 보낸 초안 · 판 번호 = 서버가 준 새 번호(다시 읽은 값의 확신도 자릿수가 달라도 옛 번호에 묶이지 않게)
        markSaved(current, saved.rowVersion)
        return true
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          toast.error(messageOf(error, "다른 사람이 먼저 고쳤습니다"), { description: "서버의 지금 문양으로 다시 불러옵니다." })
          reset()
        } else {
          toast.error(messageOf(error, "문양 저장에 실패했습니다."))
        }
        return false
      }
    },
    [save, reset, markSaved],
  )

  // 판정이 확정된 장: 처음 고치는 순간 「다시 판정 상태가 됩니다」를 묻고, 취소면 서버 값으로 되돌린다
  // (저장은 「검색」 직전 · 탭을 떠날 때라 그때는 창을 띄울 수 없어 — 고치기 시작할 때 묻는다)
  const rejudge = useRejudgeConfirm(judged)
  const { confirm: confirmRejudge } = rejudge
  const resetRef = React.useRef(reset)
  resetRef.current = reset
  React.useEffect(() => {
    if (!dirty) return
    void confirmRejudge().then((ok) => {
      if (!ok) resetRef.current()
    })
  }, [dirty, confirmRejudge])

  // 탭을 떠날 때(탭 · 이미지 이동 · 창 닫기) 바뀐 게 있으면 저장 — 최신 값은 ref 로
  // 확정 판정 장은 「계속」에 답한 뒤에만(확인 창이 떠 있는 채 떠나면 저장하지 않는다 — [검수])
  const latest = React.useRef({ draft, rowVersion, dirty, saveIfDirty, isAccepted: rejudge.isAccepted })
  latest.current = { draft, rowVersion, dirty, saveIfDirty, isAccepted: rejudge.isAccepted }
  React.useEffect(
    () => () => {
      const l = latest.current
      if (l.dirty && l.isAccepted()) void l.saveIfDirty(l.draft, l.rowVersion, true)
    },
    [],
  )

  const handleExtract = async () => {
    setExtractState("running")
    try {
      const { extracted: items, runId } = await extractCrimeWithRun(aprthngNo, queryImage)
      update((d) => ({ ...d, extracted: items }))
      setLastRunId(runId)
      setExtractState("done")
    } catch (error) {
      console.error("패턴 추출 중 오류:", error)
      toast.error("패턴 추출 중 오류가 발생했습니다.")
      setExtractState("failed")
    }
  }

  const handleSearchImage = (next: TabSearchImage) => {
    if (next === "edited" && !image.editImage) {
      toast("편집 이미지가 없습니다. 이미지 편집 탭에서 저장하면 편집본으로 추출 · 검색할 수 있습니다.")
      return
    }
    setSearchImage(aprthngNo, next)
  }

  const insert = (zone: PatternZone, src: string, origin?: PatternInsertOrigin) => {
    const hit = origin === "ai" ? draft.extracted.find((e) => e.code === insertedName(src)) : undefined
    update((d) => insertInto(d, zone, src, hit ? { score: hit.score, runId: lastRunId } : null))
  }

  const handleSearch = async () => {
    if (busy) return
    if (!(await saveIfDirty(draft, rowVersion, dirty))) return
    const record = inputFileId !== undefined
    try {
      const res = await search.mutateAsync(
        searchBodyOf(draft, kinds, { image: queryImage, source: searchImage, conditions, method: searchMethod, record, inputFileId }),
      )
      if (res.search_no !== undefined) {
        setRun(aprthngNo, res.search_no)
        toast.success(`검색 ${res.search_no} — 결과 ${res.total.toLocaleString("ko-KR")}건`)
      } else {
        toast("이 감정물은 작업 이미지 파일이 없어 검색 기록 없이 결과만 봅니다.")
      }
      if (res.weights_mismatch) toast("화면 가중치 규칙이 서버와 달라 서버 값으로 검색했습니다.")
      onOpenSearch()
    } catch (error) {
      toast.error(messageOf(error, "검색에 실패했습니다."))
    }
  }

  const openRun = (searchNo: number) => {
    setRun(aprthngNo, searchNo)
    onOpenSearch()
  }

  const status = patternsQuery.isError ? "error" : !ready ? "loading" : "ready"
  const sceneSrc = searchImage === "edited" ? image.editImage ?? image.image : image.image

  return (
    <>
    {rejudge.dialog}
    <PatternCodeScreen
      status={status}
      onRetry={() => void patternsQuery.refetch()}
      isAdmin={viewer.isAdmin}
      features={viewer.features}
      showPlus={false}
      inWindow
      aprthngNo={aprthngNo}
      images={[aprthngNo]}
      onSelectImage={() => undefined}
      canvasSlot={
        <PatternCanvas
          canvasRef={canvasRef}
          imgRef={imgRef}
          image={image.image ?? null}
          lineState={lineState}
          setLineState={setLineState}
          onExtract={() => void handleExtract()}
          onClear={() => update((d) => ({ ...d, zones: { top: [], mid: [], bottom: [], outline: [] }, meta: {}, overrides: {}, runIds: {} }))}
          onShowOrigin={() => handleSearchImage("original")}
          onShowEdit={() => handleSearchImage("edited")}
          isExtracting={extractState === "running"}
          // 현장 경로는 경계선 좌표를 보내지 않으므로 신발용 chrome(경계선 · 영역)은 띄우지 않는다(지금 앱과 같음)
          patternActive={false}
          viewIsEdit={searchImage === "edited"}
          editImage={image.editImage ?? null}
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
      onSelectZone={setSelectedZone}
      onInsertPattern={(src, origin) => insert(selectedZone, src, origin)}
      onInsertPatternToZone={insert}
      onRemovePattern={(zone, i) => update((d) => removeAt(d, zone, i))}
      onToggleEssential={(zone, i) => update((d) => toggleAt(d, zone, i))}
      // 필수를 바꾼 뒤 재검색은 「검색」(기록)으로 — 이 탭에서는 갱신 줄을 띄우지 않는다
      researchState="idle"
      onReset={() => update((d) => ({ ...d, zones: { top: [], mid: [], bottom: [], outline: [] }, meta: {}, overrides: {}, runIds: {} }))}
      paletteKind={paletteKind}
      onPaletteKindChange={setPaletteKind}
      palette={palette}
      paletteCounts={counts}
      codeNote={null}
      matchConditions={conditions}
      onMatchConditionsChange={setConditions}
      history={historyRows}
      selectedSearchNo={selectedSearchNo}
      onOpenHistory={(no) => {
        setSelectedSearchNo(no)
        openRun(no)
      }}
      onSearch={() => void handleSearch()}
      onOpenResults={() => {
        if (searchRuns[0]) setRun(aprthngNo, searchRuns[0].searchNo)
        onOpenSearch()
      }}
      onClose={() => undefined}
      patternMeta={draft.meta}
      onConfirmSuggestion={(zone, i) => update((d) => confirmAt(d, zone, i))}
      onConfirmAllSuggestions={() => update(confirmAll)}
      onCountChange={(zone, i, count) => update((d) => countAt(d, zone, i, count))}
      soleText={draft.soleText}
      onSoleTextChange={(next) => update((d) => ({ ...d, soleText: next }))}
      searchMethod={searchMethod}
      onSearchMethodChange={setSearchMethod}
      patternKinds={kinds}
      weightOverrides={draft.overrides}
      onWeightChange={(zone, i, level) => update((d) => weightAt(d, zone, i, level))}
      onResetWeights={() => update((d) => ({ ...d, overrides: {} }))}
      searchRuns={searchRuns}
      currentRunNo={currentRunNo}
      onRestoreRun={(searchNo) => {
        const run = searchRuns.find((r) => r.searchNo === searchNo)
        if (!run) return
        update((d) => draftFromRun(run, d))
        setConditions(run.conditions)
        if (run.source === "original" || image.editImage) setSearchImage(aprthngNo, run.source)
        toast(`검색 ${searchNo} 조건을 다시 불러왔습니다.`)
      }}
      onOpenRun={openRun}
      lensSource={sceneSrc ? <img src={sceneSrc} alt="" draggable={false} className="block size-full object-contain" /> : undefined}
    />
    </>
  )
}

/** 경로든 이름이든 이름만(추출 결과 찾기용) */
function insertedName(src: string): string {
  return src.split("/").pop()!.split(".")[0]
}
