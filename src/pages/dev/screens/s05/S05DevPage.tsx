import { useMemo, useState } from "react"
import { toast } from "sonner"

import { SearchResultScreen, type ImageMode, type SearchTarget } from "@/widgets/search-result"

import { DevScreenFrame, SCREEN_CASES, devScreen, useDevCase, useDevNavigate, useDevPlus, useDevViewer } from "../frame"
import { fakePhotoUrl } from "../mock-assets/FakePhoto"
import { fakeSoleUrl } from "../mock-assets/FakeSole"
import type { ZoneTriple } from "../mock-assets/fake-art"
import { fakeSideShoeUrl } from "../s06/fake-side-shoe"
import {
  INITIAL_TARGETS,
  makeInsight,
  makeResults,
  S05_ERROR_AT,
  S05_IMAGE_NO,
  S05_PAGE_SIZE,
  S05_TOTAL,
} from "./mock-cases"

const info = devScreen("s05")

// 결과 밑창 무늬 8가지(시안 S05 Z 배열)를 순위마다 돌려 쓴다
const ZONES: readonly ZoneTriple[] = [
  ["herring", "grid", "herring"],
  ["grid", "grid", "blocks"],
  ["herring", "herring", "lines"],
  ["dots", "herring", "grid"],
  ["wave", "grid", "herring"],
  ["blocks", "herring", "blocks"],
  ["tri", "herring", "grid"],
  ["herring", "dots", "herring"],
]

const PLUS_NOT_READY = "시안 — 기능 준비 중"

// S05 검색 결과 진열 페이지: 쪽 번호 · 이진화/원본 보기 · 확인대상(★)을 여기서 들고(제어형), 카드를 누르면 S06 으로 간다.
export function S05DevPage() {
  const to = useDevNavigate()
  const activeCase = useDevCase(SCREEN_CASES.s05, "ready")
  const viewer = useDevViewer()
  const showPlus = useDevPlus()
  const [page, setPage] = useState(1)
  // 지금 앱 기본값은 이진화보기
  const [imageMode, setImageMode] = useState<ImageMode>("이진화보기")
  const [targets, setTargets] = useState<readonly SearchTarget[]>(INITIAL_TARGETS)

  const sceneImage = useMemo(() => fakePhotoUrl({ zones: ["herring", "herring", "herring"], flip: true, tag: "" }), [])
  const soleUrls = useMemo(
    () => ZONES.map((zones, i) => fakeSoleUrl({ kind: imageMode === "이진화보기" ? "bin" : "shoe", zones, seed: i + 1 })),
    [imageMode],
  )
  const results = useMemo(
    () => (activeCase === "ready" ? makeResults(page, (rank) => soleUrls[(rank - 1) % soleUrls.length]) : []),
    [activeCase, page, soleUrls],
  )
  const insight = useMemo(
    () =>
      makeInsight({
        scene: sceneImage,
        shoe: fakeSoleUrl({ kind: "shoe", zones: ZONES[0] }),
        side: fakeSideShoeUrl(),
        aiTop: (zones) => fakeSoleUrl({ kind: "shoe", zones }),
      }),
    [sceneImage],
  )

  return (
    <DevScreenFrame screen={info.screen} title={info.title} cases={info.cases}>
      <SearchResultScreen
        status={activeCase}
        errorAt={S05_ERROR_AT}
        onRetry={() => {
          toast("다시 검색합니다(진열용)")
          to("/dev/s05", { case: "ready" })
        }}
        isAdmin={viewer.isAdmin}
        features={viewer.features}
        imageNo={S05_IMAGE_NO}
        sceneImage={sceneImage}
        results={results}
        totalCount={activeCase === "ready" ? S05_TOTAL : 0}
        page={page}
        pageSize={S05_PAGE_SIZE}
        onPageChange={setPage}
        imageMode={imageMode}
        onImageModeChange={(mode) => {
          setImageMode(mode)
          toast(`${mode} — 결과 이미지를 다시 불러옵니다(진열용)`)
        }}
        onOpenResult={(item, ranking) => to("/dev/s06", { ftwr: item.ftwrId, rank: String(ranking) })}
        showPlus={showPlus}
        insight={insight}
        targets={targets}
        onToggleTarget={(t) => {
          const has = targets.some((x) => x.rank === t.rank)
          setTargets(has ? targets.filter((x) => x.rank !== t.rank) : [...targets, t].sort((a, b) => a.rank - b.rank))
          toast(has ? `${t.rank}위 ${t.ftwrId} 확인대상 제외(진열용)` : `${t.rank}위 ${t.ftwrId} 확인대상 등록(진열용)`)
        }}
        onResume={(rank) => setPage(Math.ceil(rank / S05_PAGE_SIZE))}
        onPlusAction={(label) => toast(PLUS_NOT_READY, { description: label })}
      />
    </DevScreenFrame>
  )
}
