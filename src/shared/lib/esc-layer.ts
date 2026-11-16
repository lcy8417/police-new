// Esc 는 맨 위 층부터 하나씩(로망 스킬 6-2). 손수 만든 겹(편집 판 · 미리보기 판)이 document 에 단 Esc 처리기는
// 자기보다 위에 뜬 다른 층(대화상자 · 떠 있는 고르기 · 화면 설정 펼침 · `data-esc-layer` 겹)이 열려 있으면 받지 않는다.
// 처리기 등록 순서가 늦은 위 층이 preventDefault 하기 전에 아래 층이 먼저 닫히던 것(3회차 검수 — 화면 설정 · 관리 ▾ 를 연 채 Esc).

/** 다른 층 표시(CaseWindowFrame 과 같은 기준) */
export const ESC_LAYER_SELECTOR =
  '[role="dialog"][data-state="open"], [role="alertdialog"], [data-radix-popper-content-wrapper], [data-esc-layer]'

/**
 * `root` 위에 다른 층이 열려 있나 — 자기 자신과 자기를 감싼 바깥 층(사건 창 · 패널)은 빼고 센다.
 * `root` 가 없으면(아직 안 그려짐) false
 */
export function hasLayerAbove(root: Element | null): boolean {
  if (!root) return false
  return Array.from(document.querySelectorAll(ESC_LAYER_SELECTOR)).some((el) => el !== root && !el.contains(root))
}
