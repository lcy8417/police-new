import type { Alignment } from "@/entities/alignment"
import type { MatchCorrespondence } from "@/entities/match"
import type { MatchCaseInfo, MatchShoeInfo, ZonePatterns } from "@/widgets/match-compare"

// S06 상세 조회 · 정밀 대조 진열용 가짜 값. 사진은 가짜 그림(mock-assets), 값은 시안 예시(00001-25-0646_1 · 대구청)에 맞춘다.

export const S06_CASES = ["ready", "loading", "error", "no-alignment"] as const
export type S06Case = (typeof S06_CASES)[number]

export const S06_ERROR_AT = "17:31"
export const S06_DEFAULT_FTWR = "00758"

/** 좌표계 크기: 현장 = FakePhoto(200×300) × 5, 신발 = FakeSole(100×264) × 4 */
export const CRIME_SIZE = { width: 1000, height: 1500 } as const
export const SHOE_SIZE = { width: 400, height: 1056 } as const

/** match_top10 박스 한 변(계약값 96) */
const BOX = 96

// 밑창 좌표(0–100 × 0–264, 시안 S06 PTS · MORE_OK 일부)와 점수
const SOLE_POINTS: readonly [number, number, number][] = [
  [40, 40, 0.93],
  [62, 80, 0.91],
  [55, 140, 0.88],
  [40, 200, 0.84],
  [58, 236, 0.71],
  [30, 24, 0.82],
  [70, 30, 0.8],
  [24, 70, 0.77],
  [50, 160, 0.74],
  [36, 188, 0.66],
]

/** Top-10 대응점 — FakePhoto 안 밑창 자리(x 50–150, y 16–280 → ×5)와 FakeSole(×4)에 맞춘 값 */
export const MATCHES: MatchCorrespondence[] = SOLE_POINTS.map(([u, v, score]) => {
  const fx = 250 + u * 5
  const fy = 80 + v * 5
  return { fx, fy, sx: u * 4, sy: v * 4, score, box: { cx: fx, cy: fy, size: BOX }, box_image: "" }
})

/** 저장된 정렬(현장 좌표계): 밑창을 두르는 다각형 + 뒤꿈치 → 앞코 화살표 */
export const FAKE_ALIGNMENT: Alignment = {
  polygon: [
    [270, 90],
    [730, 90],
    [760, 760],
    [700, 1400],
    [300, 1400],
    [240, 760],
  ],
  arrow: [
    [500, 1320],
    [500, 180],
  ],
  flipHorizontal: false,
}

/** 사건정보 — 사건명은 긴 값(40자 안팎) */
export const CASE_INFO: MatchCaseInfo = {
  aprthngNo: "00001-25-0646_1",
  rqestGrfcNm: "대구청",
  crimeNm: "주거침입 절도 — 단독주택 1층 주방 창문으로 침입해 현금을 훔친 사건",
  pickDt: "2025-07-19T02:40:00",
  pickPlace: "주방 바닥",
}

export function shoeInfoFor(ftwrId: string): MatchShoeInfo {
  return {
    ftwrId,
    makrCode: null,
    brandCode: "B0038",
    modlNm: null,
    colctYear: "2019",
    ftwrGroupNm: "crocs(크록스)-038",
  }
}

const icon = (name: string) => ({ name, src: `/src/assets/Patterns/전체/${name}.png` })

/** 시안 S06 PROWS — 유류 · 발견 이미지 문양 */
export const CRIME_PATTERNS: ZonePatterns = {
  top: [icon("n32_04"), icon("n31_02")],
  mid: [icon("n21_05")],
  bottom: [icon("n21_02")],
  outline: [icon("s10c")],
}
export const SHOE_PATTERNS: ZonePatterns = {
  top: [icon("n32_04"), icon("n31_02")],
  mid: [icon("n21_05"), icon("s81b")],
  bottom: [icon("n21_02"), icon("n62_02")],
  outline: [icon("s10c")],
}
