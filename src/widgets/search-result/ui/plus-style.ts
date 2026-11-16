// S05 화면 안에서만 쓰는 +α 모양 글자 묶음(시안 S05 인라인 스타일을 토큰으로 옮김).

/** 시안 `.ai-mark`: 청록 고정폭 10px 글자(「AI」) */
export const AI_MARK = "font-code text-[10px] font-semibold tracking-[0.12em] text-ai"

/** 시안 `.chip.teal` 색 — Chip 위에 덧씌운다 */
export const CHIP_TEAL = "border-ai-line bg-ai-bg text-ai"

/** 시안 왼쪽 작은 상자(본 위치 · 유사도 분포): 테두리 line3 · 바탕 panel2 · 모서리 8 */
export const SIDE_BOX = "grid gap-[6px] rounded-[8px] border border-solid border-line-3 bg-panel-2 px-[10px] py-[8px]"

/** 키보드 안내 한 줄(사건 창에서는 칸 머리 ⓘ 로 모은다) */
export const KEYBOARD_NOTE = "키보드 ← → 한 장 · PgDn 한 쪽 · Enter 상세조회 · S ★"

/** 보기 거르기 칩 줄 끝 안내(사건 창에서는 ⓘ) */
export const FILTER_NOTE = "끝까지 보기는 그대로 — 거르는 건 보기만 바꿉니다"

/** 쪽수 옆 안내(사건 창에서는 ⓘ) */
export const STAR_NOTE = "카드 ☆ = 확인대상 지름길(상세조회 버튼과 같음)"

/** 시안 사진 상자 위 꼬리표(현장 · 신발 번호) */
export const PHOTO_LABEL =
  "pointer-events-none absolute top-[4px] left-[4px] rounded-[3px] bg-canvas/80 px-[4px] font-code text-[9px]"
