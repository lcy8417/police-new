import type * as React from "react"

import type { CrimeHistoryRow } from "@/entities/crime"
import type { EssentialFlag, PatternZone } from "@/entities/pattern"
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

/** S04 문양 코딩 · 검색 조건 화면이 받는 값. 저장되는 값은 모두 제어형(spec §6-1). */
export interface PatternCodeScreenProps {
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
  /** 고른 부위에 문양 넣기(팔레트 · 추출 결과 클릭) — 경로를 그대로 넘긴다 */
  onInsertPattern: (src: string) => void
  /** 팔레트 · 추출 결과에서 끌어 온 문양을 놓은 부위에 넣기(고른 부위와 무관, 지금 앱 `onDropToZone`) */
  onInsertPatternToZone: (zone: PatternZone, src: string) => void
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
  /** SCAS 「코드 설명」 — 마지막으로 고른 문양의 설명(없으면 null) */
  codeNote: { code: string; text: string } | null

  /** SCAS 「매칭 조건」 값(지금 검색이 보내지 않아 화면에서는 비활성 — 운영 연결 때 쓸 값) */
  matchConditions: MatchConditionValues
  onMatchConditionsChange: (next: MatchConditionValues) => void

  /** 이 이미지의 검색 이력 */
  history: readonly CrimeHistoryRow[]
  /** 이력 한 줄 열기 */
  onOpenHistory: (searchNo: number) => void
  /** SCAS 「검색」 — 필수 문양으로 신발 검색 */
  onSearch: () => void
  /** SCAS 「검색결과」 — 지난 검색 결과 보기 */
  onOpenResults: () => void
  /** SCAS 「닫기」 */
  onClose: () => void
}
