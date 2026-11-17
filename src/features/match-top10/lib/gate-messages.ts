import type { MatchGateCode } from "@/entities/match"

/**
 * 4종 게이트 코드별 안내 문구(REQ-MATCH-009/009b-1/009c/009d) — 원인이 다르므로 문구도
 * 다르다. v0.6.0: `OUTLINE_NOT_GENERATED`(차단) 대신 `OUTLINE_GENERATION_FAILED`
 * (자동 계산 자체가 실패한 경우에만) — 되살리지 말 것(spec.md §F 역전 기록).
 * 옛 대조 화면(`MatchTop10Grid`)과 사건 창 정밀 대조 탭(알림)이 같이 쓴다.
 */
export const MATCH_GATE_MESSAGES: Record<MatchGateCode, string> = {
  ALIGNMENT_NOT_SET: "정렬(ROI+방향)이 설정되지 않았습니다. 먼저 정렬을 저장해 주세요.",
  OUTLINE_GENERATION_FAILED:
    "현장 윤곽 자동 계산에 실패했습니다. 윤곽 재계산 후 다시 시도해 주세요.",
  SHOE_BINARY_NOT_AVAILABLE: "이 신발의 이진 이미지가 없어 매칭할 수 없습니다.",
  COORDINATE_SPACE_MISMATCH:
    "좌표 공간이 일치하지 않습니다(윤곽·현장 이미지 해상도 또는 정렬 좌표 범위). 관리자에게 문의해 주세요.",
}

/** 게이트가 아닌 실패(모델 없음 503 · 서버 오류) 안내 */
export const MATCH_GENERIC_ERROR_MESSAGE = "대응점을 계산하지 못했습니다 — AI 모델을 쓸 수 없거나 서버 오류입니다."
