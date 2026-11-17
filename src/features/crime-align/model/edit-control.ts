import type { AlignmentPhase, ArrowStep, DrawMode, UseAlignment } from "./use-alignment"

// 판 안 정렬 지정 도구 막대의 값 · 동작 묶음(11/17 사용자 「영역만 여기서 바로 이미지가 뜨고 지정해주면 · 폴리곤 치기 좀 쉽게」).
// 사건 창 정밀 대조 위젯(`widgets/match-compare` CompareWindow)이 이 묶음으로 막대 · 안내 한 줄을 그리고,
// 그림 위 누름 · 끌기 · Enter · Backspace 는 캔버스(`AlignmentDrawCanvas`)가 받는다. 저장은 위젯의 `onSaveAlignment` 그대로.

export interface AlignEditControl {
  /** 지금 단계 — 영역(polygon) → 방향(arrow) → 저장 대기(review) */
  phase: AlignmentPhase
  /** 영역 그리기 방식 — 밑창 틀 · 사각형 · 점 찍기 */
  drawMode: DrawMode
  /** 방향에서 다음에 누를 점 */
  arrowStep: ArrowStep
  /** 영역 점 수 */
  pointCount: number
  /** 좌우 반전 미리보기 중(그림 위 입력 잠김) */
  flip: boolean
  /** 점 찍기 영역을 지금 닫을 수 있나(3점 이상) */
  canClose: boolean
  /** 정렬 저장 가능(영역 3점 이상 + 앞굽 · 뒤꿈치) */
  canSave: boolean
  /** 저장 요청 중 */
  saving: boolean
  /** 그리기 방식 바꾸기 — 지금 영역을 지우고 그 방식으로 새로 시작 */
  onDrawMode: (mode: DrawMode) => void
  /** 점 찍기 영역 닫기 */
  onClose: () => void
  /** 마지막 점 지우기 */
  onUndo: () => void
  /** 지금 방식으로 처음부터(방향도 지움) */
  onRestart: () => void
  /** 방향(앞굽 · 뒤꿈치)만 다시 */
  onRedoArrow: () => void
  /** 좌우 반전 켜고 끄기 */
  onFlip: () => void
  /** 저장하지 않은 고침 버리기(저장본으로) */
  onCancel: () => void
}

/** 정렬 훅 → 도구 막대 묶음(순수 — 값만 옮긴다) */
export function alignEditControl(align: UseAlignment): AlignEditControl {
  return {
    phase: align.phase,
    drawMode: align.drawMode,
    arrowStep: align.arrowStep,
    pointCount: align.polygon.length,
    flip: align.flipHorizontal,
    canClose: align.phase === "polygon" && align.drawMode === "scratch" && align.canClosePolygon,
    canSave: align.canSave,
    saving: align.isSaving,
    onDrawMode: (mode) => {
      if (mode === "scratch") align.startFromScratch()
      else if (mode === "rect") align.startRect()
      else align.startTemplate()
    },
    onClose: align.closePolygon,
    onUndo: align.removeLastPoint,
    onRestart: align.restart,
    onRedoArrow: align.clearArrow,
    onFlip: align.toggleFlip,
    onCancel: align.discard,
  }
}
