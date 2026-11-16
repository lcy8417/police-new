import type { ReactNode } from "react"

// 사건 창(S01 사건관리 목록 위 오른쪽에 여는 큰 창, r4 로망 「거래처 창」 이식) — 값만 받아 그린다.
// 무엇을 열지 · 어느 탭인지 · 열린 사건 탭 목록은 부르는 쪽(진열 페이지 = 주소 query)이 들고 있다.

/** 본문 작업 탭: 사건 정보(S02) · 이미지 편집(S03) · 문양 코드(S04) · 검색 결과(S05) · 정밀 대조(S06) · 결과 확인(S07, 사건 단위) */
export type CaseWindowTab = "info" | "edit" | "pattern" | "search" | "compare" | "confirm"

/** 이미지 한 장의 상태(한국어 리터럴 — 목록 진행 · 결과 열 이름과 같다) */
export type CaseImageStatus = "등록" | "검색됨" | "확인" | "발견" | "불발견" | "감정불능"

/** 창 머리 요약 */
export interface CaseWindowSummary {
  /** 감정번호 `00001-25-0649` */
  aprthngNo: string
  /** 사건명 */
  caseName: string
  /** 의뢰관서 */
  requestOffice: string
  /** 등록일자 `YYYY-MM-DD` */
  registeredAt: string
  /** 장수(신발 + 타이어) */
  imageCount: number
  /** 사건 진행 단계 이름(「이미지 확인 중」 · 「교차 검증」 …). +α 를 끄면 부르는 쪽이 비운다 */
  stageLabel?: string
}

/** 왼쪽 목록 한 줄(현장 이미지 한 장) */
export interface CaseWindowImage {
  /** 이미지 번호 `1`(주소 `img` 값) */
  no: string
  /** 이미지 감정번호 `00001-25-0649_1` */
  imageNo: string
  /** 신발 · 타이어 */
  kind: "신발" | "타이어"
  status: CaseImageStatus
  /** 작은 썸네일 */
  thumbSrc?: string
}

/** 작업 탭 줄의 열린 사건 하나 */
export interface CaseWindowOpenCase {
  aprthngNo: string
  caseName: string
}

export interface CaseWindowProps {
  summary: CaseWindowSummary
  images: readonly CaseWindowImage[]
  /** 고른 이미지 번호(없으면 고른 줄 없음) */
  selectedImage: string | null
  tab: CaseWindowTab
  /** 열린 사건들(작업 탭 줄 — 지금 사건 포함) */
  openCases: readonly CaseWindowOpenCase[]
  /** 더 못 여는 까닭(최대 개수 참) — 주면 탭 줄 오른쪽 회색 한 줄 */
  openCasesFull?: string
  /** 목록 순서 앞 · 뒤 사건이 없음(‹ › 잠김) */
  prevOff?: boolean
  nextOff?: boolean
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onSelectImage: (no: string) => void
  onSelectTab: (tab: CaseWindowTab) => void
  onSelectOpenCase: (aprthngNo: string) => void
  onCloseOpenCase: (aprthngNo: string) => void
  /** 사건 전체 판정 「결과 확인」(탭 줄 끝) — 보통 onSelectTab("confirm") 과 같다 */
  onConfirmResult: () => void
  /** 본문 — 고른 탭의 화면 내용(부르는 쪽이 넣는다) */
  children: ReactNode
}
