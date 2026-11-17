import type { CaseWindowTab } from "@/widgets/case-window"

// 새 사건관리(`/cases`) 사건 창 상태 = 주소(query). 시안 규약(`pages/dev/screens/s01/case-window-query.ts`)을 그대로 옮긴 것 —
// 화면 이식 계획 §4 ⓪ 「주소 상태(case-window-query.ts 규약을 실제 페이지 model 로 — 진열 파일은 남김)」. pages 끼리는 가져오지 않아 복제한다.
// `?open=<사건 = 감정의뢰번호>&img=<이미지 순번>&tab=<탭>&tabs=<열린 사건들, 쉼표>`.
// 뒤로가기로 이전 상태, 주소를 그대로 보내면 같은 창이 열린다. 다른 query(shoe …)는 건드리지 않는다.
// `ftwr` · `rank` · `run` 은 창 안 검색 결과 → 정밀 대조 → 결과 확인으로 넘기는 신발 번호 · 검색번호 — 창을 닫거나 사건 · 이미지를 바꾸면 지운다.

export const CASE_WINDOW_TABS: readonly CaseWindowTab[] = ["info", "edit", "pattern", "search", "compare", "confirm"]

/** 작업 탭 줄에 동시에 열어 둘 수 있는 사건 수(로망 작업 탭과 같음) */
export const MAX_OPEN_CASES = 8

/** 더 못 열 때 탭 줄 오른쪽 회색 한 줄 */
export const OPEN_CASES_FULL = `사건은 ${MAX_OPEN_CASES}개까지 열 수 있어요 — 탭을 닫고 여세요`

export interface CaseWindowQuery {
  open: string
  img: string | null
  tab: CaseWindowTab
  tabs: string[]
}

/** 창 안 검색 문맥 — 그 사건 · 그 이미지 것 */
const CONTEXT_KEYS = ["ftwr", "rank", "run"] as const

/** 창을 닫을 때 지우는 키. 열린 사건 탭 목록(`tabs`)은 남긴다 */
const WINDOW_KEYS = ["open", "img", "tab", ...CONTEXT_KEYS] as const

const isTab = (v: string | null): v is CaseWindowTab => CASE_WINDOW_TABS.some((t) => t === v)

/** 주소의 열린 사건 탭 목록(중복 없이, 최대 개수까지) */
export function readOpenTabs(params: URLSearchParams): string[] {
  return [...new Set((params.get("tabs") ?? "").split(",").filter(Boolean))].slice(0, MAX_OPEN_CASES)
}

/** 주소에서 창 상태를 읽는다. `open` 이 없으면 창이 닫힌 것(null). 열린 탭 목록에 지금 사건이 없으면 넣는다 */
export function readCaseWindow(params: URLSearchParams): CaseWindowQuery | null {
  const open = params.get("open")
  if (!open) return null
  const tabs = readOpenTabs(params)
  const withOpen = tabs.includes(open) ? tabs : [...tabs.slice(0, MAX_OPEN_CASES - 1), open]
  const tab = params.get("tab")
  return { open, img: params.get("img"), tab: isTab(tab) ? tab : "info", tabs: withOpen }
}

/**
 * 창 상태를 주소에 쓴 새 query(나머지 키는 그대로).
 * null 이면 창을 닫는다(창 키를 지우고 `tabs` 는 남김). `clearTabs` 면 `tabs` 까지 지운다(마지막 탭을 닫음).
 */
export function writeCaseWindow(params: URLSearchParams, next: CaseWindowQuery | null, clearTabs = false): URLSearchParams {
  const out = new URLSearchParams(params)
  if (next === null) {
    for (const k of WINDOW_KEYS) out.delete(k)
    if (clearTabs) out.delete("tabs")
    return out
  }
  // 사건이나 이미지가 바뀌면 앞 사건 · 이미지의 검색 문맥(ftwr · rank · run)을 지운다
  if (params.get("open") !== next.open || (params.get("img") ?? null) !== (next.img ?? null)) {
    for (const k of CONTEXT_KEYS) out.delete(k)
  }
  out.set("open", next.open)
  if (next.img) out.set("img", next.img)
  else out.delete("img")
  out.set("tab", next.tab)
  out.set("tabs", next.tabs.join(","))
  return out
}

/**
 * 사건 하나를 연다(행 클릭 · 「검색」 · 작업 탭 고르기). 이미 열린 탭이면 그 탭으로, 아니면 탭 줄 끝에 더한다.
 * 탭이 이미 가득(8개)이고 새 사건이면 null — 부르는 쪽이 까닭을 알린다.
 */
export function openCaseWindow(
  tabs: readonly string[],
  open: string,
  at: { tab: CaseWindowTab; img: string | null }
): CaseWindowQuery | null {
  if (!tabs.includes(open) && tabs.length >= MAX_OPEN_CASES) return null
  return { open, img: at.img, tab: at.tab, tabs: tabs.includes(open) ? [...tabs] : [...tabs, open] }
}

/** ‹ › 로 옆 사건으로 — 지금 탭 자리를 옆 사건으로 바꾼다(탭이 쌓이지 않게). 옆 사건이 이미 열려 있으면 그 탭으로만 옮긴다 */
export function stepCaseWindow(current: CaseWindowQuery, next: string, img: string | null): CaseWindowQuery {
  const tabs = current.tabs.includes(next) ? current.tabs : current.tabs.map((t) => (t === current.open ? next : t))
  return { ...current, open: next, img, tabs }
}

/** 작업 탭 × — 닫은 탭이 지금 사건이면 옆 탭(오른쪽, 없으면 왼쪽)으로, 마지막이면 창을 닫는다(null) */
export function closeCaseTab(
  current: CaseWindowQuery,
  closing: string,
  firstImageOf: (caseNo: string) => string | null
): CaseWindowQuery | null {
  const index = current.tabs.indexOf(closing)
  const tabs = current.tabs.filter((t) => t !== closing)
  if (tabs.length === 0) return null
  if (closing !== current.open) return { ...current, tabs }
  const open = tabs[Math.min(index, tabs.length - 1)]
  return { ...current, open, img: firstImageOf(open), tabs }
}
