import type { Alignment } from "@/entities/alignment"
import type { MatchCorrespondence } from "@/entities/match"
import type {
  CropView,
  DensePair,
  MatchCaseInfo,
  MatchInsight,
  MatchShoeInfo,
  ZonePatterns,
} from "@/widgets/match-compare"

// S06 상세 조회 · 정밀 대조 진열용 가짜 값. 사진은 가짜 그림(mock-assets), 값은 시안 예시(00001-25-0646_1 · 대구청)에 맞춘다.

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

/** 사건정보 — r2: 시안 S06 INFO 값 그대로(사건명 「주거침입」) */
export const CASE_INFO: MatchCaseInfo = {
  aprthngNo: "00001-25-0646_1",
  rqestGrfcNm: "대구청",
  crimeNm: "주거침입",
  pickDt: "2025-07-19T02:40:00",
  pickPlace: "주방 바닥",
}

/** 신발정보 — r2: 시안 S06 INFO 값 그대로(모델번호는 빈 칸) */
export function shoeInfoFor(ftwrId: string): MatchShoeInfo {
  return {
    ftwrId,
    makrCode: "○○산업",
    brandCode: "○○스포츠",
    modlNm: null,
    colctYear: "2025",
    ftwrGroupNm: "○○스포츠-012",
  }
}

// ── r2 +α(시안 r3) 가짜 값 ─────────────────────────────────────────────

/** 밑창 좌표(0–100 × 0–264) → 현장 그림 좌표(FakePhoto 안 밑창 자리 × 5) */
const toCrime = (u: number, v: number): [number, number] => [250 + u * 5, 80 + v * 5]
/** 밑창 좌표 → 신발 그림 좌표(FakeSole × 4) */
const toShoe = (u: number, v: number): [number, number] => [u * 4, v * 4]

/** 시안 PTS(대표 5개, 1 = 일치) — Top-10 대응 박스 1–5 와 같은 자리 */
const PTS: readonly [number, number, boolean][] = [
  [40, 40, true],
  [62, 80, true],
  [55, 140, true],
  [40, 200, true],
  [58, 236, false],
]
/** 시안 MORE_OK(24) · MORE_BAD(10) — 대표 5개와 합쳐 일치 28 · 불일치 11 = 39 */
const MORE_OK: readonly [number, number][] = [
  [30, 24], [70, 30], [50, 18], [46, 40], [24, 70], [76, 66], [50, 58], [60, 46], [36, 86], [64, 90], [34, 104], [66, 112],
  [48, 122], [22, 120], [28, 150], [52, 160], [44, 170], [38, 140], [60, 132], [36, 188], [50, 196], [30, 214], [48, 214], [40, 250],
]
const MORE_BAD: readonly [number, number][] = [
  [18, 44], [76, 150], [74, 170], [60, 204], [34, 232], [70, 222], [46, 246], [56, 254], [74, 190], [28, 200],
]

export const DENSE_PAIRS: DensePair[] = [
  // 대표점은 Top-10 대응 박스 1–5(MATCHES)와 같은 자리라 굵은 선이 두 박스를 잇는다
  ...PTS.map(([u, v, ok]) => {
    const [fx, fy] = toCrime(u, v)
    const [sx, sy] = toShoe(u, v)
    return { fx, fy, sx, sy, ok }
  }),
  ...MORE_OK.map(([u, v]) => {
    const [fx, fy] = toCrime(u, v)
    const [sx, sy] = toShoe(u, v)
    return { fx, fy, sx, sy, ok: true }
  }),
  ...MORE_BAD.map(([u, v], i) => {
    const [fx, fy] = toCrime(u, v)
    // 불일치는 신발 쪽이 어긋난 자리(시안 ±9~10 · ±12~14)
    const [sx, sy] = toShoe(u + (i % 2 ? 9 : -10), v + (i % 2 ? -14 : 12))
    return { fx, fy, sx, sy, ok: false }
  }),
]

/** 잘라 보기: 유류 사진(200×300 → 폭 76)과 발견 밑창(100×264 → 폭 38)에서 부위 시작 y0(밑창 좌표)를 위로 */
const crimeCrop = (src: string, y0: number): CropView => ({ src, left: -19, top: -Math.round((16 + y0) * 0.38), width: 76, height: 114 })
const shoeCrop = (src: string, y0: number): CropView => ({ src, left: 0, top: -Math.round(y0 * 0.38), width: 38, height: 100 })

/** +α 값 묶음. 그림 URL 은 진열 페이지가 만든다 */
export function makeMatchInsight(img: {
  overlayCrime: string
  overlayShoe: string
  cropCrime: string
  cropShoe: string
  side: string
}): MatchInsight {
  const basis = [
    { zone: "상", y0: 0, ok: true, score: 0.93, pairs: "12/13", why: "헤링본 줄 9 ↔ 9줄 · 기울기 32° ↔ 31°" },
    { zone: "중", y0: 92, ok: true, score: 0.88, pairs: "10/12", why: "격자 칸 수 가로 7 ↔ 7칸 · 세로 5 ↔ 5칸" },
    { zone: "하", y0: 176, ok: false, score: 0.45, pairs: "6/14", why: "삼각형 5 ↔ 6개 · 현장 하 부위 일부 소실" },
  ]
  return {
    processType: "현장",
    purpose: "「이런 종류의 신발」을 찾아 수사망 좁히기",
    alignAngle: "−4.0°",
    pairs: DENSE_PAIRS,
    representative: PTS.length,
    zoneLines: {
      crime: { x: [toCrime(-4, 0)[0], toCrime(104, 0)[0]], top: toCrime(0, 0)[1], bounds: [toCrime(0, 92)[1], toCrime(0, 176)[1]], bottom: toCrime(0, 264)[1] },
      shoe: { x: [toShoe(-4, 0)[0], toShoe(104, 0)[0]], top: 0, bounds: [toShoe(0, 92)[1], toShoe(0, 176)[1]], bottom: toShoe(0, 264)[1] },
    },
    preparedAt: "07-24 17:31 · 2.4초",
    preStats: [
      ["특징점", "412↔398"],
      ["대응점", "39"],
      ["일치", "28"],
      ["정합 각도", "−4.0°"],
    ],
    overlayCrime: img.overlayCrime,
    overlayShoe: img.overlayShoe,
    overlayOpacity: 42,
    confidence: 87,
    metrics: [
      ["Inlier Ratio", "0.72"],
      ["NCC", "0.81"],
      ["Wasserstein", "0.14"],
      ["Mutual Info.", "1.36"],
    ],
    opinion: "같은 밑창 쪽 근거가 강함 — 판정은 감정관",
    basis: basis.map(({ y0, ...r }) => ({ ...r, crimeCrop: crimeCrop(img.cropCrime, y0), shoeCrop: shoeCrop(img.cropShoe, y0) })),
    sideImage: img.side,
    caseExtra: { scasNo: "2025-11710", docNo: "SCAS수사부-2944", pickMethod: "전사판채취법" },
    shoeExtra: { kind: "운동화", note: "용의자신발" },
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
