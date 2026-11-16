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
  /** 사건 진행 단계 이름(「이미지 확인 중」 · 「교차 검증」 …). +α 를 끄면 부르는 쪽이 비운다. 단계 띠(stages)를 주면 머리에 그리지 않는다(같은 말 중복) */
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

/** 단계 칸 · 할 일 상자 · 탭 표시가 가리키는 자리(탭 + 그 이미지). img 가 없으면 지금 고른 이미지 그대로 */
export interface CaseWindowTarget {
  tab: CaseWindowTab
  img?: string
}

/** 단계 · 할 일 상태(로망 창 상태 이름) — 끝 · 아직 · 문제 · 해당 없음 */
export type CaseFlowState = "done" | "pending" | "problem" | "notApplicable"

/** 사건 진행 단계 띠 한 칸(6칸: 접수 · 1차 작업 · 검색·판정 · 교차 검증 · 감정서 · 결재) */
export interface CaseWindowStage {
  /** 단계 이름 */
  name: string
  state: CaseFlowState
  /** 칸 아래 작은 글자(「끝」 · 「2개 남음」 · 「아직」) */
  note: string
  /** 이 단계에 확인할 문제가 있음(작은 글자 끝 「!」) */
  dot?: boolean
  /** 누르면 갈 대표 탭 */
  target: CaseWindowTarget
}

/** 「↳ 이 단계 할 일」 상자 하나 */
export interface CaseWindowTask {
  id: string
  label: string
  /** 상자 안 작은 글자(「지금」 · 「_4 ↔ _5」) */
  note: string
  state: CaseFlowState
  /** 지금 할 것(지금 단계의 첫 남은 할 일) */
  now?: boolean
  /** AI 가 찾아 준 할 일 — 이름 앞 AI 표식(신규 끄면 부르는 쪽이 빼서 넘긴다) */
  ai?: boolean
  /** 마우스를 올리면 보이는 까닭 */
  hint: string
  /** 누르면 갈 자리 */
  target: CaseWindowTarget
}

/** 탭 이름 뒤 표시 — done ✓ · problem ! · blanks 노란 빈 칸 수 · notApplicable – · count 흐린 수 */
export interface CaseWindowTabMark {
  kind: "done" | "problem" | "blanks" | "notApplicable" | "count"
  count?: number
}

/** 창 머리 ⋯ 메뉴 한 줄 */
export interface CaseWindowMenuItem {
  label: string
  onSelect: () => void
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
  /** 사건 진행 단계 띠 6칸 — 주면 머리 아래 「지금 단계 › 할 일」 줄 · 단계 띠 · 할 일 상자를 그린다 */
  stages?: readonly CaseWindowStage[]
  /** 지금 단계(stages 의 번호, 0 부터) */
  currentStage?: number
  /** 지금 단계의 할 일 */
  tasks?: readonly CaseWindowTask[]
  /** 할 일 줄 오른쪽 저장 상태 「✓ 저장됨 시:분」 */
  savedAt?: string
  /** 탭 이름 뒤 표시(고른 이미지 기준, 사건 정보는 사건 빈 칸 수) */
  tabMarks?: Partial<Record<CaseWindowTab, CaseWindowTabMark>>
  /** 머리 ⋯ 메뉴(사건복사 · 수정) */
  menu?: readonly CaseWindowMenuItem[]
  /** 왼쪽 목록 맨 아래(사진 추가 · 끌어 놓기) */
  railFooter?: ReactNode
  /** 단계 칸 · 할 일 상자를 눌렀을 때 — 탭과 이미지를 한 번에 옮긴다 */
  onGo?: (target: CaseWindowTarget) => void
  /** 본문 — 고른 탭의 화면 내용(부르는 쪽이 넣는다) */
  children: ReactNode
}
