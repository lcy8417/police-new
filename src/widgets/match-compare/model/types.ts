import type * as React from "react"

import type { Alignment } from "@/entities/alignment"
import type { Crime } from "@/entities/crime"
import type { MatchCorrespondence } from "@/entities/match"
import type { FeatureCode } from "@/entities/session"
import type { Shoe } from "@/entities/shoe"
import type { AlignEditControl } from "@/features/crime-align"
import type { ScreenStatus } from "@/shared/lib/screen-status"

/** 대조 그림 한 장 — 보기 방식 두 가지 이미지와, 대응점 좌표가 속한 이미지 좌표계 크기 */
export interface MatchImage {
  /** RGB(원본) 이미지 URL */
  rgb: string
  /** 스케치 · 이진 이미지 URL */
  sketch: string
  /** 좌표계 폭(px) — 현장은 `저장 현장 이미지 좌표계`, 신발은 `신발 이진 이미지 좌표계` */
  width: number
  /** 좌표계 높이(px) */
  height: number
}

/** 사건정보 표에 쓰는 사건 필드(지금 데이터에 있는 것만, SCAS 라벨 순서는 위젯이 정한다) */
export type MatchCaseInfo = Pick<Crime, "aprthngNo" | "rqestGrfcNm" | "crimeNm" | "pickDt" | "pickPlace">

/** 신발정보 표에 쓰는 신발 필드(지금 데이터에 있는 것만) */
export type MatchShoeInfo = Pick<Shoe, "ftwrId" | "makrCode" | "brandCode" | "modlNm" | "colctYear" | "ftwrGroupNm">

/** 문양 아이콘 한 개 — 소비 측이 경로를 붙여(hydrate) 넘긴다(위젯 안에서 재변환 금지) */
export interface PatternIconItem {
  /** 문양 이름(예 n32_04) */
  name: string
  /** 아이콘 이미지 경로 */
  src: string
  /** 필수(검색에 쓴) 문양 — 현장 문양만. 정밀 대조 1:1 부위 줄에 「필수」 표시 */
  essential?: boolean
}

/** 부위별 문양(상 · 중 · 하 · 윤곽) */
export type ZonePatterns = Record<"top" | "mid" | "bottom" | "outline", readonly PatternIconItem[]>

/** +α AI 대응점 한 쌍(시안 r3 39개) — 좌표는 MatchCorrespondence 와 같은 두 좌표계(현장 · 신발 이미지) */
export interface DensePair {
  /** 현장 x */
  fx: number
  /** 현장 y */
  fy: number
  /** 신발 x */
  sx: number
  /** 신발 y */
  sy: number
  /** 일치(청록 실선) · 불일치(빨강 점선) */
  ok: boolean
}

/** +α 상 · 중 · 하 구역 선(한 이미지 좌표계) */
export interface ZoneLines {
  /** 선의 왼쪽 · 오른쪽 끝 x */
  x: readonly [number, number]
  /** 밑창 맨 위 y */
  top: number
  /** 상|중 · 중|하 경계 y */
  bounds: readonly [number, number]
  /** 밑창 맨 아래 y */
  bottom: number
}

/** 부위 잘라 보기 한 칸(38×34 상자 안에 그림을 놓을 자리, px) */
export interface CropView {
  /** 그림 URL */
  src: string
  /** 상자 기준 왼쪽 */
  left: number
  /** 상자 기준 위 */
  top: number
  /** 그림 폭 */
  width: number
  /** 그림 높이 */
  height: number
}

/** +α 부위별 근거 한 줄(시안 r3 BASIS) */
export interface ZoneBasis {
  /** 부위 이름(상 · 중 · 하) */
  zone: string
  /** 일치 여부(일치 · 불일치 칩) */
  ok: boolean
  /** 부위 점수 0~1 */
  score: number
  /** 대응점 일치 수(예 「12/13」) */
  pairs: string
  /** 칸 수 · 도형 개수 · 각도 비교 한 줄 */
  why: string
  /** 유류 사진 잘라 보기 */
  crimeCrop: CropView
  /** 발견 밑창 잘라 보기 */
  shoeCrop: CropView
}

/**
 * +α(시안 r3) 정밀 대조 값 묶음 — `showPlus` 일 때만 보인다. 지금 match_top10 응답에 없는 값이라
 * 운영 연결 전까지는 진열 페이지만 채운다(시안 S15 정밀 대조 모델 기록과 같은 값).
 */
export interface MatchInsight {
  /** 처리 구분(예 「현장」) */
  processType: string
  /** 목적 한 줄 */
  purpose: string
  /** AI 정합 각도 글자(예 「−4.0°」) */
  alignAngle: string
  /** AI 대응점(앞의 `representative` 개는 대표점 — 굵은 선) */
  pairs: readonly DensePair[]
  /** 대표 대응점 수(번호 1–n) */
  representative: number
  /** 구역 선 — 현장 · 신발 이미지 좌표계 */
  zoneLines: { crime: ZoneLines; shoe: ZoneLines }
  /** AI 미리 대조 시각 · 걸린 시간(예 「07-24 17:31 · 2.4초」) */
  preparedAt: string
  /** AI 미리 대조 숫자 4칸(라벨 · 값) */
  preStats: readonly (readonly [string, string])[]
  /** 겹쳐 보기 미리보기 — 현장 사진 */
  overlayCrime: string
  /** 겹쳐 보기 미리보기 — 바탕 없는 신발 밑창 */
  overlayShoe: string
  /** 겹쳐 보기 투명도(%) */
  overlayOpacity: number
  /** 종합 신뢰도(%) */
  confidence: number
  /** 지표 4개(Inlier Ratio · NCC · Wasserstein · Mutual Info.) */
  metrics: readonly (readonly [string, string])[]
  /** AI 의견 한 줄 */
  opinion: string
  /** 부위별 근거 */
  basis: readonly ZoneBasis[]
  /** 측면 이미지 URL */
  sideImage: string
  /** 사건정보 표에 더할 SCAS 칸(지금 데이터에 없음): SCAS번호 · 문서번호 · 채취방법 */
  caseExtra: { scasNo: string; docNo: string; pickMethod: string }
  /** 신발정보 표에 더할 SCAS 칸(지금 데이터에 없음): 화종 · 비고 */
  shoeExtra: { kind: string; note: string }
}

/**
 * 오른쪽 칸 「AI 대조」 값(결정 기록 — AI 대조는 종합 · 부위 점수 · 한 줄 의견). +α(insight)와 따로 실제 값으로 켠다.
 * 서버에 없는 칸은 비워 보낸다 — 부위 · 의견 · 지표가 비면 그 줄을 그리지 않는다(생김새는 같고 보이는 조건만).
 */
export interface MatchVerdict {
  /** 종합(%) — 실제 화면 = 검색 이미지 유사도 */
  confidence: number
  /** 대응점(일치 여부만 센다) */
  pairs: readonly { ok: boolean }[]
  /** 대조 시각 · 한 사람 등(오른쪽 위 흐린 글자) */
  preparedAt: string
  basis: readonly ZoneBasis[]
  /** 한 줄 의견 — 빈 글자면 줄을 그리지 않는다 */
  opinion: string
  /** 「자세히」 안 지표(라벨 · 값) */
  metrics: readonly (readonly [string, string])[]
  preStats: readonly (readonly [string, string])[]
}

/** r3 비교 후보 한 켤레(검색 결과 순서) — 「현장 1장 대 후보 n장」 · 이전/다음 · 자동 넘기기가 이 목록을 걷는다 */
export interface CompareCandidate {
  /** 신발 ID — 문자열(앞자리 0 보존) */
  ftwrId: string
  /** 검색 결과 순위(1부터, 모르면 null) */
  rank: number | null
  /** 유사도 — imageSearch 응답 그대로 퍼센트 0~100(문자열일 수도 있음) */
  similarity: number | string
  /** RGB(원본) 밑창 그림 URL */
  rgb: string
  /** 스케치 · 이진 밑창 그림 URL */
  sketch: string
}

/** r3 비교 개수 — 화면 글자 그대로(현장 1 : 후보 n) */
export type CompareCount = "1:1" | "1:3" | "1:5"

/** r3 이동 방식 — AutoPlayControl 값 그대로 */
export type CompareAutoMode = "manual" | "auto"

export interface MatchCompareScreenProps {
  /** 조회 상태. 결과 0건 화면이 따로 없어 empty 는 받지 않는다(정렬 미설정은 alignment 로 나타낸다) */
  status: Exclude<ScreenStatus, "empty">
  /** 조회 실패 시각 「시:분」(error 일 때만 보임) */
  errorAt?: string
  /** error 일 때 「다시」 */
  onRetry: () => void
  /** 관리자 여부 */
  isAdmin: boolean
  /** 보는 사람의 기능 권한(판정 · 정렬 저장 = CRIME_SEARCH) */
  features: readonly FeatureCode[]
  /** 검색 결과 순위(S05 에서 넘어옴, 모르면 null) */
  ranking: number | null
  /** 정렬(관심영역 다각형 + 방향 화살표). null 이거나 polygon/arrow 가 null 이면 정렬 미설정 */
  alignment: Alignment | null
  /** Top-10 대응점(match_top10 응답 matches 그대로) */
  matches: readonly MatchCorrespondence[]
  /** 유류(현장) 이미지 */
  crimeImage: MatchImage
  /** 발견(신발) 이미지 */
  shoeImage: MatchImage
  /** 사건정보 */
  caseInfo: MatchCaseInfo
  /** 신발정보 */
  shoeInfo: MatchShoeInfo
  /** 유류 이미지 문양 */
  crimePatterns: ZonePatterns
  /** 발견 이미지 문양 */
  shoePatterns: ZonePatterns
  /**
   * 정렬 설정 캔버스 자리(좌표 수학은 그쪽이 소유). 단독 진열은 대화 상자 안, 사건 창(`inWindow`)에 `alignEdit` 를 함께 주면
   * 대조 판 유류 칸에 바로 놓는다(운영 = `AlignmentDrawCanvas`)
   */
  alignmentSlot: React.ReactNode
  /**
   * 사건 창 판 안 정렬 지정(11/17 사용자 「영역만 여기서 바로 … 지정 · 폴리곤 치기 좀 쉽게」 · 「정렬 설정 누르면 저기서 바로 설정」).
   * 주면 정렬이 없을 때 · 「정렬 설정」을 누를 때 대화 상자 대신 대조 판(유류 칸 = `alignmentSlot` · 발견 칸 = 참고 그림)에서
   * 영역 · 방향을 정하고 막대의 「정렬 저장」(= `onSaveAlignment`) · 「취소」. 없으면 예전 대화 상자
   */
  alignEdit?: AlignEditControl
  /** 「정렬 저장」 — 다각형 · 화살표 값은 슬롯 주인이 들고 있다 */
  onSaveAlignment: () => void
  /** 「확인대상」 — 검색결과 확인(판정)으로 */
  onConfirmTarget: () => void
  /** 「닫기」 — 검색 결과로 돌아감 */
  onClose: () => void
  /** +α · 실증 요소를 보이나(기본 true). 운영 연결은 false 로 시작 */
  showPlus?: boolean
  /**
   * 사건 창 「정밀 대조」 탭 안에 넣는가(11/17). true 면 같은 상태 · 핸들러로 배치만 바꾼다:
   * 왼쪽 = 칸 머리(비교 1:1 · 1:3 · 1:5) · 도구 한 줄 · 유류 | 발견 무대(남은 높이 꽉) · 바닥 단추 줄,
   * 오른쪽 300 칸 밑줄 탭(AI 대조 · 대응 목록 · 정보). 「현장문양검색결과 상세조회」 제목 줄 · 닫기는 그리지 않는다.
   */
  inWindow?: boolean
  /** +α 정밀 대조 값 묶음(showPlus 일 때만 쓴다) */
  insight?: MatchInsight
  /**
   * 실제 「AI 대조」 값(창 모드 오른쪽 칸) — +α 를 꺼도 보인다. +α(insight)가 켜져 있으면 그 값이 먼저다
   */
  verdict?: MatchVerdict | null
  /** 동작이 아직 없는 +α 버튼(이전 · 다음 · 그룹등록 · 프린트 · 감정서 첨부 · 확대 줄 …) — 누른 버튼 글자 */
  onPlusAction?: (label: string) => void

  // ── r3 편의(+α 아님 — showPlus 와 무관하게 보인다). 값은 제어형, 바꾸는 콜백을 넘기면 그 조작이 보인다 ──

  /** 비교 후보 목록(검색 결과 순서). 지금 후보 = shoeInfo.ftwrId(+ ranking)와 같은 칸. 2개 이상이면 이전 · 다음이 켜진다 */
  candidates?: readonly CompareCandidate[]
  /** 후보 바꿈(← → · 이전/다음 · 자동 · 후보 칸 누름) */
  onCandidateChange?: (candidate: CompareCandidate) => void
  /** 비교 개수(기본 1:1 — 대응점 선이 있는 2차 배치) */
  compareCount?: CompareCount
  onCompareCountChange?: (count: CompareCount) => void
  /** 이동 방식(수동 · 자동 후보 넘기기) */
  autoMode?: CompareAutoMode
  onAutoModeChange?: (mode: CompareAutoMode) => void
  /** 자동 넘김 간격(ms) */
  intervalMs?: number
  onIntervalChange?: (ms: number) => void
  /** 자동 재생 중. 마지막 후보에서 위젯이 false 로 돌려준다 */
  playing?: boolean
  onPlayingChange?: (playing: boolean) => void
}
