import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

import { alignmentKeys, fetchAlignment } from "@/entities/alignment"
import { useComparisons, useCrimePatterns, type Crime } from "@/entities/crime"
import { FEATURES } from "@/entities/session"
import { fetchShoeDetail, shoeImageUrl, shoeKeys, type Shoe } from "@/entities/shoe"
import { AlignmentCaptureCanvas, sceneImageUrl, useAlignment } from "@/features/crime-align"
import { useRecordComparison } from "@/features/crime-search"
import { MATCH_GATE_MESSAGES, MATCH_GENERIC_ERROR_MESSAGE, useMatchTop10 } from "@/features/match-top10"
import {
  MatchCompareScreen,
  type CompareAutoMode,
  type CompareCandidate,
  type CompareCount,
  type MatchVerdict,
} from "@/widgets/match-compare"

import { toPercentList } from "./model/similarity-scale"
import { useImageSession, useTabSessionStore, type TabCompareCandidate } from "./model/tab-session"
import { zonePatternsOf } from "./model/tab-values"
import { useNaturalSize } from "./model/use-natural-size"
import type { TabViewer } from "./model/use-viewer"

const toCandidate = (c: TabCompareCandidate): CompareCandidate => ({
  ftwrId: c.ftwrId,
  rank: c.rank,
  similarity: c.similarity,
  rgb: shoeImageUrl(c.ftwrId, "B"),
  sketch: shoeImageUrl(c.ftwrId, "Shoerinsics"),
})

export interface CompareTabProps {
  viewer: TabViewer
  image: Crime
  /** 「확인대상」 — 결과 확인 탭으로 */
  onConfirmTarget: () => void
  /** 「닫기」 — 검색 결과 탭으로 */
  onBackToSearch: () => void
}

/**
 * 「정밀 대조」 탭 — 검색 결과 탭에서 고른 신발과 현장 이미지를 지금 앱 기능으로 맞대어 본다:
 *   정렬(관심영역 + 방향) = `features/crime-align` `useAlignment` · `AlignmentCaptureCanvas`(좌표 수학은 그쪽 소유) · `fetchAlignment`
 *   Top-10 대응점 = `features/match-top10` `useMatchTop10`(정렬이 설정됐을 때만 — GPU 추론)
 *   신발 정보 · 문양 = `fetchShoeDetail`, 그림 = `shoeImageUrl`(B 밑창 · Shoerinsics 이진), 현장 = 저장 원본 `sceneImageUrl`
 *   현장 문양 = C1, AI 대조 칸 = 종합(검색 이미지 유사도) + 대조 기록(F1 record 한 번 · F2 — 대응점 수 · 기록 횟수 · 시각).
 *   부위 점수 · 한 줄 의견은 서버 값이 없어 그 줄을 그리지 않는다(위젯 `verdict`).
 */
export function CompareTab({ viewer, image, onConfirmTarget, onBackToSearch }: CompareTabProps) {
  const aprthngNo = image.aprthngNo ?? ""
  const { compare, candidates } = useImageSession(aprthngNo)
  // 보기 설정은 후보를 넘겨도(본문을 신발마다 새로 그림) 이어지게 여기서 든다 — 자동 넘기기가 끊기지 않게
  const [compareCount, setCompareCount] = React.useState<CompareCount>("1:1")
  const [autoMode, setAutoMode] = React.useState<CompareAutoMode>("manual")
  const [playing, setPlaying] = React.useState(false)
  const [intervalMs, setIntervalMs] = React.useState(3000)
  const view: CompareView = { compareCount, setCompareCount, autoMode, setAutoMode, playing, setPlaying, intervalMs, setIntervalMs }
  if (!compare) {
    return (
      <p className="m-0 grid h-full place-items-center p-[24px] text-center text-[12.5px] text-muted-foreground">
        검색 결과 탭에서 대조할 신발을 고르세요.
      </p>
    )
  }
  return (
    <CompareBody
      key={compare.ftwrId}
      viewer={viewer}
      image={image}
      target={compare}
      candidates={candidates}
      view={view}
      onConfirmTarget={onConfirmTarget}
      onBackToSearch={onBackToSearch}
    />
  )
}

interface CompareView {
  compareCount: CompareCount
  setCompareCount: (next: CompareCount) => void
  autoMode: CompareAutoMode
  setAutoMode: (next: CompareAutoMode) => void
  playing: boolean
  setPlaying: (next: boolean) => void
  intervalMs: number
  setIntervalMs: (next: number) => void
}

interface CompareBodyProps extends CompareTabProps {
  target: TabCompareCandidate
  candidates: readonly TabCompareCandidate[]
  view: CompareView
}

function CompareBody({ viewer, image, target, candidates, view, onConfirmTarget, onBackToSearch }: CompareBodyProps) {
  const aprthngNo = image.aprthngNo ?? ""
  const { ftwrId } = target
  const setCompare = useTabSessionStore((s) => s.setCompare)

  const alignmentQuery = useQuery({
    queryKey: alignmentKeys.detail(aprthngNo, ftwrId),
    queryFn: () => fetchAlignment({ aprthngNo, ftwrId }),
    enabled: Boolean(aprthngNo && ftwrId),
  })
  const align = useAlignment({ aprthngNo, ftwrId })
  const aligned = Boolean(alignmentQuery.data?.polygon && alignmentQuery.data?.arrow)
  const match = useMatchTop10({ aprthngNo, ftwrId, enabled: aligned })
  // 대응점 계산 실패(게이트 409 · 모델 없음 503)는 위젯에 자리가 없어 아무 표시 없이 빈 판으로 남았다(스모크 4단계) —
  // 원인 문구를 알림으로 한 번(같은 쌍은 id 로 하나만)
  const matchNotice = match.gateCode
    ? MATCH_GATE_MESSAGES[match.gateCode]
    : match.isGenericError
      ? MATCH_GENERIC_ERROR_MESSAGE
      : null
  React.useEffect(() => {
    if (matchNotice) toast.error(matchNotice, { id: `match-${aprthngNo}-${ftwrId}` })
  }, [matchNotice, aprthngNo, ftwrId])

  const shoeQuery = useQuery({
    queryKey: shoeKeys.detail(ftwrId),
    queryFn: () => fetchShoeDetail(ftwrId),
  })
  const shoe: Shoe | undefined = shoeQuery.data

  const sceneSrc = sceneImageUrl(aprthngNo)
  const shoeRgb = shoeImageUrl(ftwrId, "B")
  const shoeSketch = shoeImageUrl(ftwrId, "Shoerinsics")
  const sceneSize = useNaturalSize(sceneSrc)
  const shoeSize = useNaturalSize(shoeSketch)

  // 현장 문양 = 서버 문양(C1) — 옛 전역 store 값은 쓰지 않는다
  const patternsQuery = useCrimePatterns(aprthngNo)
  const crimePatterns = React.useMemo(() => zonePatternsOf(patternsQuery.data ?? image), [patternsQuery.data, image])

  // 대조 기록(F1 record · F2) — 정렬이 된 뒤 이 신발과 대조한 기록이 없으면 한 번 남긴다(실패는 조용히 — 접수 전 · 교차 검증 이후 409)
  const canRecord = viewer.isAdmin || viewer.features.includes(FEATURES.CRIME_SEARCH)
  const recordsQuery = useComparisons(aprthngNo, ftwrId)
  const record = useRecordComparison(aprthngNo)
  const askedRef = React.useRef(false)
  const { mutate: recordMutate } = record
  React.useEffect(() => {
    if (askedRef.current || !aligned || !canRecord || !recordsQuery.isSuccess || recordsQuery.data.length > 0) return
    askedRef.current = true
    recordMutate(ftwrId)
  }, [aligned, canRecord, recordsQuery.isSuccess, recordsQuery.data, recordMutate, ftwrId])
  // AI 대조 칸(결정 기록 — 종합 · 부위 · 한 줄 의견): 종합 = 검색 이미지 유사도, 부위 점수 · 의견은 서버 값이 없어 비움
  const verdict = React.useMemo<MatchVerdict | null>(() => {
    const percent = toPercentList([{ similarity: target.similarity }])[0].similarity
    const n = typeof percent === "number" ? percent : Number.parseFloat(percent)
    if (!Number.isFinite(n)) return null
    const records = recordsQuery.data ?? []
    const latest = records[0]
    return {
      confidence: Math.round(n * 10) / 10,
      pairs: [],
      preparedAt: latest ? `${latest.occurredDt.slice(5, 16).replace("T", " ")} · ${latest.actorNm ?? ""}`.replace(/ · $/, "") : "",
      basis: [],
      opinion: "",
      metrics: latest
        ? [
            ["대응점", latest.matchCnt === null ? "—" : String(latest.matchCnt)],
            ["대조 기록", `${records.length}회`],
          ]
        : [],
      preStats: [],
    }
  }, [target.similarity, recordsQuery.data])
  const shoePatterns = React.useMemo(() => zonePatternsOf(shoe), [shoe])
  const compareCandidates = React.useMemo(() => candidates.map(toCandidate), [candidates])

  const handleSaveAlignment = async () => {
    if (!align.canSave) {
      toast("관심영역(3점 이상)과 앞굽 · 뒤꿈치를 모두 지정한 뒤 저장하세요.")
      return
    }
    try {
      await align.save()
      toast.success("정렬을 저장했습니다.")
    } catch {
      toast.error("정렬 저장에 실패했습니다.")
    }
  }

  return (
    <MatchCompareScreen
      status={shoeQuery.isError ? "error" : "ready"}
      onRetry={() => void shoeQuery.refetch()}
      isAdmin={viewer.isAdmin}
      features={viewer.features}
      ranking={target.rank}
      alignment={alignmentQuery.data ?? null}
      matches={match.matches}
      crimeImage={{
        rgb: sceneSrc,
        // 현장은 이진(스케치) 사본이 따로 없다 — 편집본이 있으면 그것, 없으면 원본
        sketch: image.editImage ?? sceneSrc,
        width: sceneSize?.width ?? 1,
        height: sceneSize?.height ?? 1,
      }}
      shoeImage={{ rgb: shoeRgb, sketch: shoeSketch, width: shoeSize?.width ?? 1, height: shoeSize?.height ?? 1 }}
      caseInfo={{
        aprthngNo: image.aprthngNo,
        rqestGrfcNm: image.rqestGrfcNm,
        crimeNm: image.crimeNm,
        pickDt: image.pickDt,
        pickPlace: image.pickPlace,
      }}
      shoeInfo={{
        ftwrId,
        makrCode: shoe?.makrCode ?? null,
        brandCode: shoe?.brandCode ?? null,
        modlNm: shoe?.modlNm ?? null,
        colctYear: shoe?.colctYear ?? null,
        ftwrGroupNm: shoe?.ftwrGroupNm ?? null,
      }}
      crimePatterns={crimePatterns}
      shoePatterns={shoePatterns}
      alignmentSlot={
        align.isLoading ? null : (
          <AlignmentCaptureCanvas
            aprthngNo={aprthngNo}
            polygon={align.polygon}
            arrow={align.arrow}
            phase={align.phase}
            drawMode={align.drawMode}
            arrowStep={align.arrowStep}
            flipHorizontal={align.flipHorizontal}
            onImageNaturalSize={align.seedTemplate}
            onAddPoint={align.addPoint}
            onClosePolygon={align.closePolygon}
            onMoveWholeShape={align.moveWholeShape}
            onMoveVertex={align.moveVertexAt}
            onPickArrowPoint={align.pickArrowPoint}
          />
        )
      }
      onSaveAlignment={() => void handleSaveAlignment()}
      onConfirmTarget={onConfirmTarget}
      onClose={onBackToSearch}
      showPlus={false}
      inWindow
      verdict={verdict}
      candidates={compareCandidates}
      onCandidateChange={(c) => setCompare(aprthngNo, { ftwrId: c.ftwrId, rank: c.rank ?? 0, similarity: c.similarity })}
      compareCount={view.compareCount}
      onCompareCountChange={view.setCompareCount}
      autoMode={view.autoMode}
      onAutoModeChange={view.setAutoMode}
      intervalMs={view.intervalMs}
      onIntervalChange={view.setIntervalMs}
      playing={view.playing}
      onPlayingChange={view.setPlaying}
    />
  )
}
