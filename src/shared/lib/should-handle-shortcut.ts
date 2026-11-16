// 화면 단축키(← → Space Enter ? S …)를 화면이 받아도 되는지 가리는 공용 검사.
// 창(window) 전체에 단 keydown 듣개가 다른 컨트롤의 키를 가로채지 않도록 한 곳에서 같은 규칙을 쓴다(S05 · S06 · S10).
//
// 받지 않는 경우(false):
// 1. 이미 누가 처리함(`defaultPrevented`)
// 2. Alt · Ctrl · Meta 가 함께 눌림(Alt+← = 뒤로 가기 등 브라우저 · 운영체제 몫). Shift 는 허용(「?」 = Shift+/)
// 3. 글자를 쓰는 자리 — 글자형 input · textarea · select · contenteditable
// 4. Space · Enter 인데 그 키로 스스로 눌리는 컨트롤 — 버튼 · 링크 · 체크박스 · 라디오 · 버튼류 role
//    (화면이 또 받으면 「버튼 눌림 + 화면 단축키」가 겹친다)
// 5. 화살표인데 화살표로 값을 옮기는 컨트롤 — 라디오 · 범위(range) · 탭 · 목록 선택지 · 슬라이더 role

/** 검사에 쓰는 키 이벤트 모양(DOM KeyboardEvent · React KeyboardEvent 모두 맞는다) */
export interface ShortcutKeyEvent {
  key: string
  target: EventTarget | null
  defaultPrevented: boolean
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
}

// 글자를 쓰지 않는 input 종류(이 밖의 type 은 모두 글자형으로 본다)
const NON_TEXT_INPUT_TYPES = ["checkbox", "radio", "button", "submit", "reset", "image", "color", "file", "range"]

const TEXT_TARGET = [
  "textarea",
  "select",
  "[contenteditable='']",
  "[contenteditable='true']",
  "[contenteditable='plaintext-only']",
  `input${NON_TEXT_INPUT_TYPES.map((t) => `:not([type='${t}'])`).join("")}`,
].join(", ")

const PRESS_CONTROL = [
  "button",
  "a[href]",
  "summary",
  "input[type='checkbox']",
  "input[type='radio']",
  "input[type='button']",
  "input[type='submit']",
  "input[type='reset']",
  "[role='button']",
  "[role='link']",
  "[role='checkbox']",
  "[role='switch']",
  "[role='radio']",
  "[role='tab']",
  "[role='option']",
  "[role='menuitem']",
].join(", ")

const ARROW_CONTROL = [
  "input[type='radio']",
  "input[type='range']",
  "[role='radio']",
  "[role='radiogroup']",
  "[role='tab']",
  "[role='tablist']",
  "[role='option']",
  "[role='listbox']",
  "[role='slider']",
  "[role='menu']",
  "[role='menuitem']",
].join(", ")

const ARROW_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"])

function closestOf(target: EventTarget | null, selector: string): boolean {
  if (typeof Element === "undefined" || !(target instanceof Element)) return false
  return target.closest(selector) !== null
}

/** 글자를 쓰는 자리인가(글자형 input · textarea · select · contenteditable) */
export function isTextEntryTarget(target: EventTarget | null): boolean {
  return closestOf(target, TEXT_TARGET)
}

/** 화면 단축키로 받아도 되는가 — 아니면 그 키는 브라우저 · 초점 컨트롤의 몫 */
export function shouldHandleShortcut(e: ShortcutKeyEvent): boolean {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return false
  if (isTextEntryTarget(e.target)) return false
  if ((e.key === " " || e.key === "Enter") && closestOf(e.target, PRESS_CONTROL)) return false
  if (ARROW_KEYS.has(e.key) && closestOf(e.target, ARROW_CONTROL)) return false
  return true
}
