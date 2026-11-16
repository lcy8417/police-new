import type * as React from "react"

import type { Alignment } from "@/entities/alignment"
import type { Crime } from "@/entities/crime"
import type { MatchCorrespondence } from "@/entities/match"
import type { FeatureCode } from "@/entities/session"
import type { Shoe } from "@/entities/shoe"
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
}

/** 부위별 문양(상 · 중 · 하 · 윤곽) */
export type ZonePatterns = Record<"top" | "mid" | "bottom" | "outline", readonly PatternIconItem[]>

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
  /** 정렬 설정 캔버스 자리(운영은 AlignmentCaptureCanvas — 좌표 수학은 그쪽이 소유) */
  alignmentSlot: React.ReactNode
  /** 「정렬 저장」 — 다각형 · 화살표 값은 슬롯 주인이 들고 있다 */
  onSaveAlignment: () => void
  /** 「확인대상」 — 검색결과 확인(판정)으로 */
  onConfirmTarget: () => void
  /** 「닫기」 — 검색 결과로 돌아감 */
  onClose: () => void
}
