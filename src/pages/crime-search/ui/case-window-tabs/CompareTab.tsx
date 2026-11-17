import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

import { alignmentKeys, fetchAlignment } from "@/entities/alignment"
import type { Crime } from "@/entities/crime"
import { fetchShoeDetail, shoeImageUrl, shoeKeys, type Shoe } from "@/entities/shoe"
import { AlignmentCaptureCanvas, sceneImageUrl, useAlignment } from "@/features/crime-align"
import { useMatchTop10 } from "@/features/match-top10"
import { MatchCompareScreen, type CompareAutoMode, type CompareCandidate, type CompareCount } from "@/widgets/match-compare"

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
 * AI 종합 · 부위 점수 · 의견(F1 · F2)과 대조 기록은 API 가 없어 숨김(+α 끔).
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

  const crimePatterns = React.useMemo(() => zonePatternsOf(image), [image])
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
