import type { FeatureCode } from "@/entities/session"
import type { ScreenStatus } from "@/shared/lib/screen-status"

/**
 * 신발 검색 결과 한 건.
 * 출처: services/api.js imageSearch 응답 — 서버 `result[]`의 `{ ftwr_id, similarity }`를
 * imageSearch 가 `{ ftwrId, image, similarity }`로 바꾼 항목 그대로(이미지 API 계층이라 camel 변환 없음).
 */
export interface ImageSearchResultItem {
  /** 신발 ID — 문자열(앞자리 0 보존, 예 "00758"). Number() 변환 금지 */
  ftwrId: string
  /** 신발 이미지 URL(`/shoes_images/{B|Shoerinsics}/<ftwrId>.png`) */
  image: string
  /** 유사도 — 퍼센트 0~100(예 69.99). 서버가 문자열로 줄 수도 있다 */
  similarity: number | string
  /**
   * r3 빠른 찾기용 상표명. imageSearch 응답에는 없다 — 운영 연결 때 신발 목록(brandCode)에서 채우고, 없으면 화류번호로만 찾는다.
   */
  brandNm?: string | null
  /**
   * 사건 창(11/17) 부위별 일치 — 상 · 중 · 하 점수와 한 줄 근거. imageSearch 응답에는 없다(+α) — 없으면 카드 위 표식 · 빠른 비교 막대를 그리지 않는다.
   */
  zoneScores?: readonly PeekZone[]
  /** 사건 창(11/17) 후보 신발의 부위별 문양(그림 경로 — 소비 측이 hydrate 해서 넘긴다). 없으면 빠른 비교 문양 줄을 그리지 않는다 */
  zonePatterns?: readonly ZonePatternSet[]
}

/** 부위 하나의 문양 그림들(빠른 비교 「고른 문양 ↔ 후보 문양」 줄) */
export interface ZonePatternSet {
  /** 부위 이름(상 · 중 · 하 · 윤곽) */
  zone: string
  /** 문양 — 이름(대체글)과 그림 경로(그대로 쓴다) */
  patterns: readonly { name: string; src: string; essential?: boolean }[]
}

/** 사건 창 자동 스크롤 방식 — 속도(px/초로 흘림) · 쪽 넘김(n초마다 한 화면) */
export type AutoScrollMode = "speed" | "page"

/** r3 결과형태(한 줄 카드 수). 1–6 = 보기 개수 칸, 8 = +α 「촘촘 8열」 */
export type ResultColumns = 1 | 2 | 3 | 4 | 5 | 6 | 8

/** r3 썸네일 크기 — 화면 글자 그대로 */
export type ThumbSize = "작게" | "보통" | "크게"

/** r3 이동 방식 — AutoPlayControl 값 그대로 */
export type AutoMode = "manual" | "auto"

/**
 * r3 필터 묶음 키: grade(유사도 등급 ok · warn · danger) · seen(seen · unseen) · target(star) · ai(top10).
 * seen · target · ai 는 +α 값(본 위치 · 확인대상 · AI 10건)이 있어야 칩이 보인다.
 */
export type ResultFilterKey = "grade" | "seen" | "target" | "ai"

/** r3 필터 값(묶음 키 → 고른 값들, 빈 배열 · 없음 = 거르지 않음) */
export type ResultFilterValues = Readonly<Partial<Record<ResultFilterKey, readonly string[]>>>

/** 이진화/원본 보기 — 지금 앱의 한국어 리터럴 그대로(imageSearch 가 이 값으로 신발 이미지 폴더 B/Shoerinsics 를 고른다) */
export type ImageMode = "이진화보기" | "원본보기"

/** +α 「AI가 먼저 보라는 10건」 한 칸(시안 r3 TOP) */
export interface AiTopItem {
  /** AI 가 다시 매긴 순위(1부터) */
  rank: number
  /** 신발 ID — 문자열 */
  ftwrId: string
  /** 유사도 퍼센트(0~100) */
  similarity: number
  /** 밑창 그림 URL */
  image: string
  /** 부위별 근거 한 줄(예 「상·중 헤링본 주기 일치」) */
  why: string
  /** 이미 봄(✓) */
  seen: boolean
  /** 일치 부위 히트 겹침 */
  heat: boolean
}

/** +α 빠른 비교 창의 부위 한 줄 */
export interface PeekZone {
  /** 부위 이름(상 · 중 · 하) */
  zone: string
  /** 부위 점수 0~100 */
  score: number
  /** 이유 한 줄 */
  why: string
}

/** +α 빠른 비교 창(시안 r3 peek) — 초점 카드 옆에 뜬다 */
export interface QuickPeek {
  /** 현장 사진 URL */
  sceneImage: string
  /** 부위별 점수 */
  zones: readonly PeekZone[]
  /** 아래 주황 칩 글자(예 「하 부위 다름 → 확인대상 신중」) */
  caution: string
}

/** +α 상세조회 칸(시안 S05 아래 칸) */
export interface ResultDetailInsight {
  /** 순위 */
  rank: number
  /** 신발 ID — 문자열 */
  ftwrId: string
  /** 유사도 퍼센트 */
  similarity: number
  /** 유류(현장) 이미지 URL */
  crimeImage: string
  /** 발견(신발) 이미지 URL */
  shoeImage: string
  /** 측면 이미지 URL */
  sideImage: string
  /** 신발정보(SCAS 라벨 순서, 2열로 흐른다) */
  info: readonly (readonly [string, string])[]
}

/**
 * +α(시안 r3) 값 묶음 — `showPlus` 일 때만 보인다. 지금 imageSearch 응답에 없는 값이라 운영 연결 전까지는 진열 페이지만 채운다.
 * 확인대상(★)은 저장되는 값이라 여기 두지 않고 `targets` prop(제어형)으로 받는다.
 */
export interface SearchInsight {
  /** 검색번호(예 572433) */
  searchNo: string
  /** 검색 방법(예 「이미지 검색」) */
  searchMethod: string
  /** 필수 문양 요약(예 「필수 문양 상·중 헤링본」) */
  essentialSummary: string
  /** 검색 시각 「MM-DD HH:MM」 */
  searchedAt: string
  /** 어디까지 봤나(순위) */
  seenUpTo: number
  /** 마지막으로 본 시각 「MM-DD HH:MM」 */
  seenAt: string
  /** 키보드 초점 카드 순위(빠른 비교 창이 뜨는 카드) */
  focusRank: number | null
  /** AI 순위 다시 매김으로 오른 계단(순위 → 몇 계단) */
  rerankUp: Readonly<Record<number, number>>
  /** 유사도 분포 막대(앞 순위부터, 퍼센트) */
  distribution: readonly number[]
  /** 분포 1위 유사도(퍼센트) */
  topSimilarity: number
  /** 분포 꼴찌 유사도(퍼센트) */
  bottomSimilarity: number
  /** 이 순위 뒤는 꼬리(분포 아래 안내) */
  tailFrom: number
  /** AI가 먼저 보라는 10건 */
  aiTop: readonly AiTopItem[]
  /** 빠른 비교 창(초점 카드) */
  peek: QuickPeek | null
  /** 상세조회 칸 */
  detail: ResultDetailInsight | null
  /** 사건 창(11/17) 문양 코드 탭에서 고른 부위별 문양 — 빠른 비교의 왼쪽 줄. 없으면 문양 줄을 그리지 않는다 */
  queryPatterns?: readonly ZonePatternSet[]
}

/** 확인대상 한 건(+α 카드 ★ · 왼쪽 확인대상 칸) */
export interface SearchTarget {
  /** 순위 */
  rank: number
  /** 신발 ID — 문자열 */
  ftwrId: string
}

export interface SearchResultScreenProps {
  /** 검색 상태. error 는 조회 실패, empty 는 결과 0건(서로 다른 모양) */
  status: ScreenStatus
  /** empty 일 때 안내 글(없으면 「결과 없음 · 필수 문양을 조정해 다시 검색」) — 사건 창의 검색 전 장 등 */
  emptyNote?: { title: string; hint: string }
  /** 조회 실패 시각 「시:분」(error 일 때만 보임) */
  errorAt?: string
  /** error 일 때 「다시」 */
  onRetry: () => void
  /** 관리자 여부 */
  isAdmin: boolean
  /** 보는 사람의 기능 권한 */
  features: readonly FeatureCode[]
  /** 이미지번호(감정물 번호 aprthngNo, 예 00001-25-0646_1) */
  imageNo: string
  /** 왼쪽 현장 족적 이미지 URL */
  sceneImage: string
  /** 지금 쪽의 결과(서버 순위 순서 그대로) */
  results: readonly ImageSearchResultItem[]
  /** 전체 결과 건수 */
  totalCount: number
  /** 지금 쪽 번호(1부터) */
  page: number
  /** 쪽당 건수 — 순위 계산에 쓴다 */
  pageSize: number
  /** 쪽 이동(1부터) */
  onPageChange: (page: number) => void
  /** 이진화/원본 보기(검색 요청에 실려 가는 값이라 제어형) */
  imageMode: ImageMode
  /** 이진화/원본 보기 바꿈 */
  onImageModeChange: (mode: ImageMode) => void
  /** 결과 카드를 누름 — ranking 은 1부터 센 전체 순위 */
  onOpenResult: (item: ImageSearchResultItem, ranking: number) => void
  /** +α · 실증 요소를 보이나(기본 true). 운영 연결은 false 로 시작 */
  showPlus?: boolean
  /**
   * 사건 창 「검색 결과」 탭 안에 넣는가(11/17). true 면 같은 상태 · 핸들러로 배치만 바꾼다:
   * 왼쪽 현장 족적(높이 꽉) + 검색 요약 칸(칸 안 스크롤) | 오른쪽 결과(칸 머리 + 두 줄 도구 막대 + 칸 안 스크롤 — AI 10건 · 그리드 · 쪽수 · 상세조회).
   * 창 머리와 겹치는 「문양검색결과」 제목 줄 · 이미지번호는 그리지 않고, 설명 문장은 칸 머리 ⓘ 로 모은다.
   */
  inWindow?: boolean
  /** +α 값 묶음(showPlus 일 때만 쓴다) */
  insight?: SearchInsight
  /** 확인대상(+α ★ · 확인대상 칸) — 저장되는 값이라 제어형 */
  targets?: readonly SearchTarget[]
  /** ★ 누름 — 확인대상 넣기/빼기 */
  onToggleTarget?: (target: SearchTarget) => void
  /** 「137위부터 이어 보기」 — 그 순위가 있는 쪽으로 */
  onResume?: (rank: number) => void
  /** 동작이 아직 없는 +α 버튼(그룹등록 · 프린트 · 크게 보기 …) — 누른 버튼 글자 */
  onPlusAction?: (label: string) => void

  // ── r3 편의(+α 아님 — showPlus 와 무관하게 보인다). 값은 모두 제어형, 바꾸는 콜백을 넘기면 그 조작이 보인다 ──

  /** 결과형태(한 줄 카드 수). 없으면 위젯 안 기본값(+α 8열 · 아니면 4열) */
  columns?: ResultColumns
  onColumnsChange?: (columns: ResultColumns) => void
  /** 썸네일 크기(기본 「보통」) */
  thumbSize?: ThumbSize
  onThumbSizeChange?: (size: ThumbSize) => void
  /** 빠른 찾기 글자(화류번호 · 상표) — 지금 쪽 안에서 거른다 */
  query?: string
  onQueryChange?: (query: string) => void
  /** 필터 칩 값 */
  filters?: ResultFilterValues
  onFiltersChange?: (key: ResultFilterKey, values: string[]) => void
  /** 「조건 지우기」 — 글자 · 칩 모두 비움 */
  onClearFilters?: () => void
  /** 이동 방식(수동 · 자동) */
  autoMode?: AutoMode
  onAutoModeChange?: (mode: AutoMode) => void
  /** 자동 넘김 간격(ms, 0.5초 단위 0.5~10초) */
  intervalMs?: number
  onIntervalChange?: (ms: number) => void
  /** 자동 재생 중(일시정지 = false). 마지막 카드에서 위젯이 false 로 돌려준다 */
  playing?: boolean
  onPlayingChange?: (playing: boolean) => void
  /** 초점 카드 순위(빠른 비교 창 · 자동 모드가 따라감). 없으면 insight.focusRank */
  focusRank?: number | null
  onFocusChange?: (rank: number) => void
  /** 「어디까지 봤는지」 — 초점이 지나간 순위까지 올린다(+α 값이 있을 때만 부른다) */
  onSeenUpToChange?: (rank: number) => void
  /** 짧은 안내(전체 화면을 못 쓸 때 등) — 진열은 알림으로 띄운다 */
  onNotice?: (message: string) => void

  // ── 사건 창(inWindow, 11/17 「순위가 쭉」) — results 는 1위부터 이어진 한 목록(page 1), 끝에 닿으면 onLoadMore ──

  /** 목록 끝에 닿음(자동 스크롤 · 손 스크롤) — 다음 순위들을 붙여 달라. 없거나 다 붙었으면(results.length >= totalCount) 부르지 않는다 */
  onLoadMore?: () => void
}
