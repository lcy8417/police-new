import { useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import type { Alignment } from "@/entities/alignment"
import { MatchCompareScreen } from "@/widgets/match-compare"

import { DEV_SCREENS, DevScreenFrame, useDevCase, useDevViewer } from "../frame"
import { fakePhotoUrl } from "../mock-assets/FakePhoto"
import { fakeSoleUrl } from "../mock-assets/FakeSole"
import type { ZoneTriple } from "../mock-assets/fake-art"
import { AlignmentDecor } from "./AlignmentDecor"
import {
  CASE_INFO,
  CRIME_PATTERNS,
  CRIME_SIZE,
  FAKE_ALIGNMENT,
  MATCHES,
  S06_CASES,
  S06_DEFAULT_FTWR,
  S06_ERROR_AT,
  SHOE_PATTERNS,
  SHOE_SIZE,
  shoeInfoFor,
} from "./mock-cases"

const info = DEV_SCREENS.find((s) => s.id === "s06")!
const ZONES: ZoneTriple = ["herring", "grid", "tri"]

// S06 상세 조회 · 정밀 대조 진열 페이지. `?ftwr=` · `?rank=`는 S05 카드에서 넘어온다.
// 정렬은 여기서 들고 있다(제어형) — no-alignment 케이스에서 「정렬 저장」을 누르면 가짜 정렬이 저장된 것처럼 바뀐다.
export function S06DevPage() {
  const navigate = useNavigate()
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const as = params.get("as")
  const ftwrId = params.get("ftwr") || S06_DEFAULT_FTWR
  const rankParam = Number(params.get("rank"))
  const ranking = Number.isInteger(rankParam) && rankParam > 0 ? rankParam : null
  const activeCase = useDevCase(S06_CASES, "ready")
  const viewer = useDevViewer()
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

  const withAs = (path: string, query: Record<string, string> = {}) => {
    const q = new URLSearchParams(query)
    if (as) q.set("as", as)
    const s = q.toString()
    return s ? `${path}?${s}` : path
  }

  return (
    <DevScreenFrame screen={info.screen} title={info.title} cases={S06_CASES}>
      <MatchCompareScreen
        status={activeCase === "no-alignment" ? "ready" : activeCase}
        errorAt={S06_ERROR_AT}
        onRetry={() => {
          toast("대응 매칭을 다시 불러옵니다(진열용)")
          navigate(withAs("/dev/s06", { case: "ready", ftwr: ftwrId }))
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
        onConfirmTarget={() => navigate(withAs("/dev/s07", { ftwr: ftwrId }))}
        onClose={() => navigate(withAs("/dev/s05"))}
      />
    </DevScreenFrame>
  )
}
