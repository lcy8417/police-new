import { useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import { toast } from "sonner"

import type { Alignment } from "@/entities/alignment"
import { MatchCompareScreen } from "@/widgets/match-compare"

import { DevScreenFrame, SCREEN_CASES, devScreen, useDevCase, useDevNavigate, useDevPlus, useDevViewer } from "../frame"
import { fakePhotoUrl } from "../mock-assets/FakePhoto"
import { FakeSole, fakeSoleUrl, SOLE_PALETTE } from "../mock-assets/FakeSole"
import { resolvePalette, type ZoneTriple } from "../mock-assets/fake-art"
import { svgToUrl } from "../mock-assets/svg-url"
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

// S06 상세 조회 · 정밀 대조 진열 페이지. `?ftwr=` · `?rank=`는 S05 카드에서 넘어온다.
// 정렬은 여기서 들고 있다(제어형) — no-alignment 케이스에서 「정렬 저장」을 누르면 가짜 정렬이 저장된 것처럼 바뀐다.
export function S06DevPage() {
  const to = useDevNavigate()
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const ftwrId = params.get("ftwr") || S06_DEFAULT_FTWR
  const rankParam = Number(params.get("rank"))
  const ranking = Number.isInteger(rankParam) && rankParam > 0 ? rankParam : null
  const activeCase = useDevCase(SCREEN_CASES.s06, "ready")
  const viewer = useDevViewer()
  const showPlus = useDevPlus()
  const [savedAlignment, setSavedAlignment] = useState<Alignment | null>(null)
  const alignment = activeCase === "no-alignment" ? savedAlignment : FAKE_ALIGNMENT

  const crimeImage = useMemo(
    () => ({
      rgb: fakePhotoUrl({ zones: ZONES, rotate: 0, tag: "1" }),
      sketch: fakePhotoUrl({ zones: ZONES, rotate: 0, tag: "1", look: "binary" }),
      ...CRIME_SIZE,
    }),
    [],
  )
  const shoeImage = useMemo(
    () => ({
      rgb: fakeSoleUrl({ kind: "shoe", zones: ZONES }),
      sketch: fakeSoleUrl({ kind: "bin", zones: ZONES }),
      ...SHOE_SIZE,
    }),
    [],
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
    <DevScreenFrame screen={info.screen} title={info.title} cases={info.cases}>
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
        caseInfo={CASE_INFO}
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
        insight={insight}
        onPlusAction={(label) => toast("시안 — 기능 준비 중", { description: label })}
      />
    </DevScreenFrame>
  )
}
