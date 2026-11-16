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

/** S03 이미지 편집 화면이 받는 값. 저장되는 값은 모두 제어형(spec §6-1). */
export interface ImageEditScreenProps {
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
}
