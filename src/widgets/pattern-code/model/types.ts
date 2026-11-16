import type * as React from "react"

import type { CrimeHistoryRow } from "@/entities/crime"
import type { EssentialFlag, PatternInsertOrigin, PatternZone } from "@/entities/pattern"
import type { FeatureCode } from "@/entities/session"
import type { ScreenStatus } from "@/shared/lib/screen-status"

/**
 * AI 통합 추출 결과 한 건. 출처: `services/api.js` `patternsExtract` 응답(type="crime" → `{ extracted: data }`,
 * 항목 `{ code, score }` — `features/patterns-extract` `ExtractedPatternItem`과 같은 모양).
 * `src`는 페이지가 `insertPatternPath`로 붙여 넘긴 그림 경로(위젯 안에서 다시 변환하지 않는다).
 */
export interface ExtractedPatternView {
  /** 문양 이름(예 `n32_04`) */
  code: string
  /** AI 점수 0~1 */
  score: number
  /** 그림 경로 `/src/assets/Patterns/전체/<이름>.png` */
  src: string
}

/** 사건(crime) 문양 한 칸 — `[그림 경로, 필수 플래그]`(docs/pattern-data-model.md §2). 경로는 페이지가 붙여 넘긴다 */
export type CrimePatternTuple = readonly [path: string, essential: EssentialFlag]

/** 상 · 중 · 하 · 윤곽 4부위의 문양 */
export type CrimeZones = Record<PatternZone, readonly CrimePatternTuple[]>

/** 팔레트 종류 — 지금 앱 `PatternPalette` KINDS 그대로(버튼 안은 글자만, docs/pattern-data-model.md §4) */
export type PaletteKind = "무늬" | "선" | "윤곽" | "다각" | "삼각" | "사각" | "원" | "항목"

/** 검색 · 추출에 쓸 이미지(지금 앱 「편집 검색」 — 현장 원본 / 편집본) */
export type SearchImageSource = "original" | "edited"

/** AI 문양 추출 진행 상태. idle = 아직 안 돌림 */
export type ExtractState = "idle" | "running" | "done" | "failed"

/** 필수 문양 변경 뒤 재검색 상태 */
export type ResearchState = "idle" | "running" | "done"

/** SCAS 「매칭 조건」 값. 고를 수 있는 글자(선택지)는 SCAS 라벨이라 위젯 상수 `MATCH_OPTIONS`에 있다 */
export interface MatchConditionValues {
  /** 검색구분(현장문양 · 동일범 · 용의자문양) */
  searchKind: string
  /** 등록기간 시작 `YYYY-MM-DD` */
  periodFrom: string
  /** 등록기간 끝 `YYYY-MM-DD` */
  periodTo: string
  /** 성별(전체 · 남 · 여 · 혼용) */
  gender: string
  /** 굽유무(전체 · 유 · 무 · 불상) */
  heel: string
}

/**
 * 검색 이력 한 줄 — 지금 이력(`CrimeHistoryRow`)에 시안 SCAS 열(결과건수 · 검색방법)을 덧붙인 모양.
 * 지금 API 는 두 값을 주지 않으므로 없으면 「—」(운영 연결 때 채움).
 */
export interface SearchHistoryRow extends CrimeHistoryRow {
  /** 결과건수(SCAS 「결과건수」) */
  resultCount?: number | null
  /** 검색방법(SCAS 「검색방법」 — 예 이미지검색 · 현장문양검색 · 인공지능) */
  method?: string | null
}

/** 문양 카드 상태(시안 r2 핀 5): ai = 감정관이 확인한 AI 문양, suggested = AI 제안(확인 전엔 검색에 안 들어감), manual = 수동 */
export type PatternCardStatus = "ai" | "suggested" | "manual"

/** SCAS 개수 칸 값 — 0–9 · 10이상(시안 핀 10) */
export type PatternCount = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10이상"

/** 부위 문양 한 칸의 덧붙임 정보(시안 r2). 문양 이름으로 찾는다(이름 기준 — docs/pattern-data-model.md §2) */
export interface PatternCardMeta {
  /** AI · 제안 · 수동 */
  status: PatternCardStatus
  /** AI 확신도 0~1(수동이면 없음) */
  confidence?: number
  /** SCAS 개수 */
  count?: PatternCount
  /** AI 가 엉뚱하게 잡았을 수 있는 제안(시안 「AI 제안?」 주황) */
  doubtful?: boolean
}

/** 부위별 · 문양 이름별 덧붙임 정보 */
export type PatternMetaMap = Partial<Record<PatternZone, Record<string, PatternCardMeta>>>

/** 검색 방식(시안 핀 7 덧붙임) */
export type SearchMethod = "image" | "pattern" | "hybrid"

/** 이미지 목록 상태(시안 핀 3) */
export type ImageCodingStatus = "done" | "searching" | "uncoded" | "duplicate"

/** 이미지 1장씩 진행(시안 핀 3) */
export interface ImageProgress {
  /** 전체 장 수 */
  total: number
  /** 확인완료 장 수 */
  done: number
  /** 목록에 다 안 보인 나머지(예 「… _7 – _12」) */
  rest?: string
  /** 다음 미코딩 이미지 감정물 번호(없으면 버튼 없음) */
  next: string | null
}

/** 검색 전 미리보기 깔때기 한 단(시안 핀 12) */
export interface FunnelStep {
  /** 단 이름(예 「신발 DB」) */
  label: string
  /** 보이는 값(예 「128,406」 · 「Top 10」) */
  value: string
  /** 막대 폭 0~100(%) */
  ratio: number
}

/**
 * 문양 가중치 단계(spec 2026-11-17-pattern-weight-rule-design §2) — 낮음 0.5 · 보통 1 · 높음 2.
 * 사건 문양 튜플(`[이름, 필수]`)은 그대로 두고 가중치는 따로 든다(§6).
 */
export type WeightLevel = "low" | "normal" | "high"

/** 사람이 고른 가중치(부위 → 문양 이름 → 단계). 없는 문양은 규칙 값을 쓴다 */
export type WeightOverrideMap = Partial<Record<PatternZone, Readonly<Record<string, WeightLevel>>>>

/** 검색 이력에 남는 문양 한 칸 — 그때의 필수 · 가중치 */
export interface SearchRunPattern {
  /** 문양 이름(경로 아님) */
  name: string
  /** 필수(거르기) */
  essential: boolean
  /** 그때의 가중치 단계 */
  weight: WeightLevel
  /** 사람이 고른 값이었나(「직접」) */
  manual: boolean
  /** 그때의 카드 상태(AI · 확인 / 수동) — 다시 불러올 때 규칙 R3 · R4 를 그때와 같게. 없으면 수동 */
  status?: PatternCardStatus
  /** 그때의 AI 확신도 0~1(AI 문양만) — 다시 불러올 때 규칙 R3 를 그때와 같게 */
  confidence?: number
  /** 그때의 SCAS 개수(0–9 · 10이상) — 다시 불러올 때 같이(2회차 검수. DB 저장 열은 서버 후속 B13) */
  count?: PatternCount
}

/** 검색 결과 상위 한 건(진열 가짜 계산) */
export interface SearchRunHit {
  /** 신발 ID — 문자열 그대로(앞자리 0 보존) */
  ftwrId: string
  /** 문양 점수 0~1(spec §4). 검색 문양이 없으면 null(「점수 없음」 — 이미지 유사도만, 0점과 다름) */
  score: number | null
  /** 밑창 그림 주소(검색 이력 썸네일 — 운영 `/shoes_images/{B|Shoerinsics}/<ftwrId>.png`) */
  src?: string
}

/** 검색 한 번 = 이력 한 줄(사건 창 「검색 이력」 탭) — 어떤 조건으로 어떤 결과가 나왔나 */
export interface SearchRun {
  /** 검색번호 */
  searchNo: number
  /** 검색 시각 `YYYY-MM-DD HH:MM:SS`(KST) */
  at: string
  /** 검색에 쓴 이미지(원본 · 편집본) */
  source: SearchImageSource
  /** 부위별 검색 문양(확인 전 AI 제안은 빠짐) */
  zones: Readonly<Record<PatternZone, readonly SearchRunPattern[]>>
  /**
   * 그때 화면에 있던 확인 전 AI 제안(검색에는 안 들어감 — 가중치 R5 를 같은 문맥으로 되살리려고 남긴다, 2회차 검수).
   * 없으면 제안 없이 검색한 것
   */
  pending?: Readonly<Partial<Record<PatternZone, readonly { name: string; confidence?: number }[]>>>
  /** 그때의 밑창 문자열(SCAS 「문자열」 칸 — 없으면 빈 칸). DB 저장 열은 서버 후속 B13 */
  soleText?: string
  /** 그때의 매칭 조건 */
  conditions: MatchConditionValues
  /** 결과 수(필수 거르기 통과) */
  resultCount: number
  /** 상위 신발(최대 5) */
  top: readonly SearchRunHit[]
}

/** S04 문양 코딩 · 검색 조건 화면이 받는 값. 저장되는 값은 모두 제어형(spec §6-1). */
export interface PatternCodeScreenProps {
  /**
   * 시안 r2 신규(+α · 실증) 요소를 보일까(기본 true). false 면 `data-plus` 요소를 모두 숨기고 1차 모양으로 돌아간다.
   * 실증 역할 잠금(시안 `data-lock="analyst admin"`)도 true 일 때만 건다(spec §13-3 · §13-5).
   */
  showPlus?: boolean
  /**
   * 사건 창 「문양 코드」 탭 안에 넣는가(11/17). true 면 같은 상태 · 핸들러로 배치만 바꾼다:
   * 왼쪽 현장 이미지(높이 꽉) | 가운데 4부위 문양 · 팔레트(칸 안 스크롤) | 오른쪽 좁은 칸 탭(AI 추출 · 검색 조건 · 검색이력), 바닥 단추 줄.
   * 창 머리와 겹치는 제목 줄(문양 상세보기 · 감정번호) · 닫기 · 왼쪽 목록과 겹치는 이미지 목록 표는 그리지 않는다.
   */
  inWindow?: boolean
  /** 동작이 아직 없는 신규 버튼을 눌렀을 때(버튼 글자를 넘긴다). 진열 페이지는 「시안 — 기능 준비 중」 알림 */
  onPlusAction?: (label: string) => void
  /** 화면 조회 상태. empty = 이 이미지에 아직 문양 · 검색 이력이 없음 */
  status: ScreenStatus
  /** 조회 실패 시각 「시:분」 */
  errorAt?: string
  /** 조회 다시 시도 */
  onRetry: () => void
  /** 관리자 여부 */
  isAdmin: boolean
  /** 보는 사람의 기능 권한. 문양 편집 · 추출 · 검색은 `CRIME_SEARCH`가 있어야 한다 */
  features: readonly FeatureCode[]

  /** 지금 코딩 중인 감정물 번호(예 `00001-25-0649_2`) */
  aprthngNo: string
  /** 같은 의뢰의 이미지(감정물 번호) 목록 — SCAS 「이미지 목록」 */
  images: readonly string[]
  /** 이미지 목록에서 다른 이미지를 고름 */
  onSelectImage: (aprthngNo: string) => void

  /** 좌표 캔버스 자리(운영 연결 때 `PatternCanvas` — 경계선 · 신발 영역 도구를 그대로 끼움) */
  canvasSlot: React.ReactNode
  /** 검색 · 추출에 쓸 이미지 */
  searchImage: SearchImageSource
  onSearchImageChange: (next: SearchImageSource) => void
  /** AI 문양 추출 상태 */
  extractState: ExtractState
  /** AI 문양 추출 실행(고른 이미지 기준) */
  onExtract: () => void
  /** AI 통합 추출 결과(점수 내림차순으로 보인다) */
  extracted: readonly ExtractedPatternView[]

  /** 4부위 문양 */
  zones: CrimeZones
  /** 문양을 넣을 부위(SCAS 「입력 중」 빨간 테) */
  selectedZone: PatternZone
  onSelectZone: (zone: PatternZone) => void
  /**
   * 고른 부위에 문양 넣기(팔레트 · 추출 결과 클릭) — 경로를 그대로 넘긴다.
   * origin = "ai" 는 AI 추출 결과(「AI」 탭 · 추출 결과 칸)에서 넣은 것 — 부르는 쪽이 AI 출처 · 확신도를 남긴다(2회차 검수)
   */
  onInsertPattern: (src: string, origin?: PatternInsertOrigin) => void
  /** 팔레트 · 추출 결과에서 끌어 온 문양을 놓은 부위에 넣기(고른 부위와 무관, 지금 앱 `onDropToZone`) */
  onInsertPatternToZone: (zone: PatternZone, src: string, origin?: PatternInsertOrigin) => void
  /** 부위의 문양 빼기(지금 앱: 썸네일 클릭) */
  onRemovePattern: (zone: PatternZone, index: number) => void
  /** 필수 문양 켜고 끄기(지금 앱: 우클릭) */
  onToggleEssential: (zone: PatternZone, index: number) => void
  /** 필수 문양이 바뀐 뒤 실시간 재검색 상태(F20). idle = 아직 다시 찾지 않음 */
  researchState: ResearchState
  /** SCAS 「다시입력」 — 4부위 문양 모두 지움 */
  onReset: () => void

  /** 팔레트 종류 */
  paletteKind: PaletteKind
  onPaletteKindChange: (kind: PaletteKind) => void
  /** 고른 종류의 문양 그림 경로 */
  palette: readonly string[]
  /** 종류별 문양 수(창 모드 문양 목록 알약 탭의 개수) */
  paletteCounts?: Partial<Record<PaletteKind, number>>
  /** SCAS 「코드 설명」 — 마지막으로 고른 문양의 설명(없으면 null) */
  codeNote: { code: string; text: string } | null

  /** SCAS 「매칭 조건」 값(지금 검색이 보내지 않아 화면에서는 비활성 — 운영 연결 때 쓸 값) */
  matchConditions: MatchConditionValues
  onMatchConditionsChange: (next: MatchConditionValues) => void

  /** 이 이미지의 검색 이력 */
  history: readonly SearchHistoryRow[]
  /** r3: 검색 이력 검색어(제어형 — 없으면 검색 칸을 그리지 않는다). 신규(+α) 아님 */
  historyQuery?: string
  onHistoryQueryChange?: (query: string) => void
  /** r3: 검색 이력 표에 보일 열 key(제어형, 없으면 전부) */
  historyColumns?: string[]
  onHistoryColumnsChange?: (keys: string[]) => void
  /** 고른 이력 줄(시안 첫 줄 강조) */
  selectedSearchNo?: number
  /** 이력 한 줄 열기 */
  onOpenHistory: (searchNo: number) => void
  /** SCAS 「검색」 — 필수 문양으로 신발 검색 */
  onSearch: () => void
  /** SCAS 「검색결과」 — 지난 검색 결과 보기 */
  onOpenResults: () => void
  /** SCAS 「닫기」 */
  onClose: () => void

  // ── 시안 r2 신규(+α) — 값이 없으면 그 칸을 그리지 않는다 ──
  /** 편집본 보기 이름(현장 이미지 오른쪽 위 칩 「편집본 · 이진화」) */
  editedLook?: string
  /** 가격표로 보이는 부분이 있어 AI가 못 잡을 수 있다는 경고(시안 핀 8) */
  priceTagWarning?: boolean
  /** 이미지 목록 상태 열 */
  imageStatuses?: Readonly<Record<string, ImageCodingStatus>>
  /** 이미지 1장씩 진행 · 다음 이미지 */
  imageProgress?: ImageProgress
  /** 「다음 이미지 →」 */
  onNextImage?: (aprthngNo: string) => void
  /** 문양 카드 덧붙임 정보(AI · 제안 · 수동 · 확신도 · 개수) */
  patternMeta?: PatternMetaMap
  /** AI 제안 「✓ 확인」 */
  onConfirmSuggestion?: (zone: PatternZone, index: number) => void
  /** 「제안 모두 확인」 */
  onConfirmAllSuggestions?: () => void
  /** 개수 바꾸기 */
  onCountChange?: (zone: PatternZone, index: number, count: PatternCount) => void
  /** SCAS 「문자열」 행 값(밑창 글자) */
  soleText?: string
  onSoleTextChange?: (next: string) => void
  /** 팔레트 「최근 사용」 그림 경로(페이지가 붙여 넘김) */
  recentPatterns?: readonly string[]
  /** 검색 방식 */
  searchMethod?: SearchMethod
  onSearchMethodChange?: (next: SearchMethod) => void
  /** 검색 전 미리보기 깔때기 */
  funnel?: { steps: readonly FunnelStep[]; note: string }

  // ── 사건 창(`inWindow`) 전용 — 11/17 먹색 작업판 · 가중치 · 검색 이력 ──
  /** 문양 이름 → 종류(팔레트 폴더). 가중치 규칙 R2 와 문양 목록 표시에 쓴다 */
  patternKinds?: Readonly<Record<string, PaletteKind>>
  /** 사람이 고른 가중치(없으면 모두 규칙 값) */
  weightOverrides?: WeightOverrideMap
  /** 가중치 바꾸기 — null 이면 그 문양을 규칙 값으로 되돌림 */
  onWeightChange?: (zone: PatternZone, index: number, level: WeightLevel | null) => void
  /** 「규칙 기본값으로」 — 사람이 고른 가중치를 모두 지움 */
  onResetWeights?: () => void
  /** 검색 이력(검색 한 번 = 한 줄, 최신이 앞). 있으면 창 모드 「검색 이력」 탭이 이 모양으로 그린다 */
  searchRuns?: readonly SearchRun[]
  /** 지금 화면 조건(문양 · 필수 · 가중치 · 매칭 조건 · 이미지)과 같은 이력 줄의 검색번호 — 그 줄에 「지금」 표시. 없으면 표시 없음 */
  currentRunNo?: number
  /** 「이 조건 다시 불러오기」 */
  onRestoreRun?: (searchNo: number) => void
  /** 「결과 보기」(검색 결과 탭으로) */
  onOpenRun?: (searchNo: number) => void
  /**
   * 확대경 · 살펴보기에 그릴 그림(누를 수 없는 복사본 — 운영은 현장 이미지 `<img>`). 없으면 확대경 · 살펴보기 그림 없이 틀만.
   * 좌표 캔버스(`canvasSlot`)는 건드리지 않는다.
   */
  lensSource?: React.ReactNode
}
