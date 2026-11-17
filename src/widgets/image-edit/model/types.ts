import type * as React from "react"

import type { FeatureCode } from "@/entities/session"
import type { ThresholdMode } from "@/shared/lib"
import type { ScreenStatus } from "@/shared/lib/screen-status"

/**
 * A 이미지 커팅의 덧붙인 도구(SCAS 버튼 뒤). 지금 앱 기준:
 * 크롭 · 각도보정 · 길이측정 = 등록 화면 `EditorMode`(crop · calibration · measure),
 * 배경제거 · 접합장애물제거 · 이진화 · 노이즈제거 = 커맨드센터 `EditTool`(background · inpaint · threshold · denoise).
 */
export type ImageEditTool = "crop" | "calibrate" | "measure" | "background" | "inpaint" | "threshold" | "denoise"

/** 다각형으로 영역을 고르는 도구(배경제거 · 접합장애물제거) */
export type PolygonTool = Extract<ImageEditTool, "background" | "inpaint">

/** 노이즈제거(AI 서버 처리) 진행 상태. idle = 아직 안 돌림 */
export type DenoiseState = "idle" | "running" | "done" | "failed"

/**
 * B 보기용 뷰어의 보기 설정. 출처: `features/crime-register/lib/pixel-filters.ts` `Adjustments`(같은 필드 · 같은 범위).
 * 보기용이라 저장하지 않는다(시안 핀 7).
 */
export interface ViewAdjustments {
  /** 밝기 -100..100, 0 = 그대로 */
  brightness: number
  /** 대비 -100..100, 0 = 그대로 */
  contrast: number
  /** 감마 0.2..3.0, 1 = 그대로 */
  gamma: number
  /** 이진화 임계값 0..255, null = 꺼짐 */
  threshold: number | null
  /** 색 반전 */
  invert: boolean
  /** 흑백 */
  grayscale: boolean
}

/** AI 제안 한 줄(시안 핀 11 — 기울기 맞추기 · 족적만 자르기 · 좌우반전). 누를 때만 반영된다 */
export interface ImageEditAiSuggestion {
  /** 제안 식별자(누름 콜백으로 돌려준다) */
  id: string
  /** 제안 이름(예 「기울기 맞추기」) */
  title: string
  /** 흐린 근거 한 줄(예 「족적 축 −4.2°」) */
  reason: string
  /** 버튼 글자(예 「맞추기」 · 「적용」 · 「반전」) */
  actionLabel: string
  /** warn = 되돌리기 어려운 변경이라 주황 버튼(시안 「반전」) */
  tone?: "default" | "warn"
}

/** 편집 이력 한 줄(시안 핀 12) */
export interface ImageEditHistoryEntry {
  /** 순서 번호(1부터) */
  no: number
  /** 한 일(예 「좌로 4° 회전」) */
  label: string
  /** 한 시각 「시:분:초」(KST) */
  at: string
  /** 그 단계 결과 파일 번호(서버 편집 이력 B3 — 진열은 없음) */
  fileId?: number
  /** 그 단계 결과 파일 SHA-256 */
  sha256?: string
  /** 되돌림 줄이면 되돌아간 편집 번호(0 = 받은 원본) */
  revertOf?: number
  /** 그 단계 모습 그림 주소(서버 단계 그림). 없으면 받은 원본에 `stepLook` 근사 모습(진열) */
  src?: string
}

/** B 보기용 뷰어 옆에 나란히 띄우는 발견(검색 결과) 이미지 — 시안 핀 6 */
export interface FoundImage {
  /** 그림 주소 */
  src: string
  /** 대체글 */
  alt: string
  /** 창 머리 글자(예 「발견 이미지 · 305659」) */
  label: string
}

/** S03 이미지 편집 화면이 받는 값. 저장되는 값은 모두 제어형(spec §6-1). */
export interface ImageEditScreenProps {
  /**
   * 시안 r2 신규(+α · 실증) 요소를 보일까(기본 true). false 면 `data-plus` 요소를 모두 숨기고 1차 모양으로 돌아간다.
   * 실증 역할 잠금(시안 `data-lock`)도 true 일 때만 건다(spec §13-3 · §13-5).
   */
  showPlus?: boolean
  /**
   * 사건 창 「이미지 편집」 탭 안에 넣는가(11/17). true 면 같은 상태 · 핸들러로 배치만 바꾼다:
   * 1차 편집(A 이미지 커팅)만 높이 꽉 · 오른쪽 좁은 칸(AI 제안 · 편집 이력 탭), 창 머리와 겹치는 제목 줄 · 감정번호 · ✕ · 「1차 작업」 꼬리표 ·
   * 시나리오 설명 줄(A · B)은 그리지 않는다. 2차 B 「이미지 뷰어 · 나란히」(유류 vs 발견)는 정밀 대조 탭의 일이라 뺀다.
   */
  inWindow?: boolean
  /** 동작이 아직 없는 신규 버튼을 눌렀을 때(버튼 글자를 넘긴다). 진열 페이지는 「시안 — 기능 준비 중」 알림 */
  onPlusAction?: (label: string) => void
  /** 화면 조회 상태(이미지 1장 편집이라 「결과 없음」 상태가 없다) */
  status: Exclude<ScreenStatus, "empty">
  /** 조회 실패 시각 「시:분」 */
  errorAt?: string
  /** 조회 다시 시도 */
  onRetry: () => void
  /** 관리자 여부(관리자는 모든 버튼 사용) */
  isAdmin: boolean
  /** 보는 사람의 기능 권한. 편집 · 저장은 `CRIME_SEARCH` 또는 `CRIME_REGISTER`가 있어야 한다 */
  features: readonly FeatureCode[]
  /** 감정물 번호(창 제목 옆), 예 `00001-25-0649_2` */
  aprthngNo: string
  /** 받은 원본 이미지 크기(px) */
  originalSize: { width: number; height: number }

  /** A 좌표 캔버스 자리(크롭 · 회전 · 4점 · 다각형 캔버스를 운영 연결 때 그대로 끼움) */
  canvasSlot: React.ReactNode
  /** 확대율(%) — SCAS −[100]+ 칸 */
  zoom: number
  onZoomChange: (zoom: number) => void
  /** 회전 각도(도, 자유각) — SCAS 좌[n]우 칸 */
  rotateStep: number
  onRotateStepChange: (deg: number) => void
  /** 좌/우 버튼 — 각도 칸 값만큼 돌린다 */
  onRotate: (dir: "left" | "right") => void
  /** 화면 크기에 맞춤 */
  onFit: () => void
  /** 100%(실제 크기) */
  onActualSize: () => void
  /** 지금 고른 도구(null = 없음) */
  activeTool: ImageEditTool | null
  onToolChange: (tool: ImageEditTool | null) => void
  /** 이진화 모드(OpenCV THRESH_* 대응) */
  thresholdMode: ThresholdMode
  onThresholdModeChange: (mode: ThresholdMode) => void
  /** 이진화 임계값 0..255 */
  threshold: number
  onThresholdChange: (value: number) => void
  /** 이진화 미리보기를 편집본에 적용 */
  onApplyThreshold: () => void
  /** 4점 각도보정 적용 */
  onApplyCalibration: () => void
  /** 다각형 도구(배경제거 · 접합장애물제거) 실행 */
  onApplyPolygon: (tool: PolygonTool) => void
  /** 길이측정 결과 — P3 · P4 실측(cm). 아직 안 쟀으면 null */
  measureCm: number | null
  /** 노이즈제거(AI) 진행 상태 */
  denoiseState: DenoiseState
  /** 노이즈제거 실행 */
  onRunDenoise: () => void
  /** 되돌릴 단계가 있는가 */
  canUndo: boolean
  /** 한 단계 되돌리기 */
  onUndo: () => void
  /** 편집 이력 n 단계까지 남기고 뒤를 되돌린다(0 = 받은 원본까지) — 사건 창 편집 이력 미리보기 「여기까지 되돌리기」. 없으면 onUndo 를 여러 번 */
  onUndoTo?: (no: number) => void
  /** 원본 복원(SCAS 「처음상태」) */
  onRestore: () => void
  /** SCAS 「취소」 — 편집을 버리고 닫음 */
  onCancel: () => void
  /** SCAS 「확인」 — 자르기 · 회전 확정 */
  onConfirm: () => void
  /** SCAS 「저장」 — 편집 이미지 저장 */
  onSave: () => void

  /** B 보기용 뷰어에 띄울 이미지(사건 이미지) */
  viewerImage: { src: string; alt: string }
  /** B 보기 설정(밝기 · 대비 · 감마 · 임계값 · 반전 · 흑백) */
  adjustments: ViewAdjustments
  onAdjustmentsChange: (next: ViewAdjustments) => void
  /** B 「닫기」 */
  onClose: () => void

  // ── 시안 r2 신규(+α) — 값이 없으면 그 칸을 그리지 않는다 ──
  /** A 캔버스 칸 AI 꼬리표 — 자 인식 눈금(예 「1 cm = 120 px」) · 족적 축(예 「−4.2°」) */
  canvasTags?: { ruler: string; axis: string }
  /** 채취 방법이 전사판이라 SCAS 「좌우반전」을 주황으로 권한다(시안 핀 4, 자동으로 뒤집지 않음) */
  recommendFlip?: boolean
  /** A 오른쪽 칸 「AI 제안」 줄들 */
  aiSuggestions?: readonly ImageEditAiSuggestion[]
  /** AI 제안 버튼을 누름 */
  onApplyAiSuggestion?: (id: string) => void
  /** A 오른쪽 칸 「원본 → 편집본」 작은 그림 두 장 */
  beforeAfter?: { original: string; edited: string }
  /** A 오른쪽 칸 「편집 이력」(되돌리기는 `onUndo`) */
  editHistory?: readonly ImageEditHistoryEntry[]
  /** 받은 원본의 SHA-256 해시(줄여 보이는 글자, 예 「9f3a 71c0 … 4be2 c21e」) */
  originalHash?: string
  /** 받은 원본 파일이 보관돼 있지 않다(옛 자료 — 서버 B3 `original: null`). 편집 이력 칸 아래에 「원본 없음」 */
  originalMissing?: boolean
  /** SCAS 「좌우반전」 · 「상하반전」 — 주면 아래 버튼 줄의 두 단추가 켜진다(없으면 「준비 중」) */
  onFlip?: (axis: "horizontal" | "vertical") => void
  /** B 왼쪽 창 머리 글자(예 「유류 이미지 · _2」) */
  viewerLabel?: string
  /** B 오른쪽 창 — 발견 이미지 */
  foundImage?: FoundImage
  /** B 「✦ 이 화면 그대로 AI 문양 다시 추출 → S04」(시안 핀 8, 저장하지 않음) */
  onReextractFromView?: () => void
}
