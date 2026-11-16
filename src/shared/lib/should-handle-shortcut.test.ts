import { afterEach, describe, expect, it } from "vitest"

import { isTextEntryTarget, shouldHandleShortcut, type ShortcutKeyEvent } from "./should-handle-shortcut"

function mount(html: string): HTMLElement {
  const host = document.createElement("div")
  host.innerHTML = html
  document.body.appendChild(host)
  return host.firstElementChild as HTMLElement
}

function ev(key: string, target: EventTarget | null, extra: Partial<ShortcutKeyEvent> = {}): ShortcutKeyEvent {
  return { key, target, defaultPrevented: false, altKey: false, ctrlKey: false, metaKey: false, ...extra }
}

describe("shouldHandleShortcut", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  it("평범한 자리(본문 · div)에서는 ← → Space Enter ? 를 받는다", () => {
    const div = mount("<div tabindex='0'>카드</div>")
    for (const key of ["ArrowLeft", "ArrowRight", " ", "Enter", "?", "s"]) {
      expect(shouldHandleShortcut(ev(key, div))).toBe(true)
      expect(shouldHandleShortcut(ev(key, document.body))).toBe(true)
    }
    expect(shouldHandleShortcut(ev("ArrowRight", null))).toBe(true)
  })

  it("이미 처리된 키(defaultPrevented)는 받지 않는다", () => {
    expect(shouldHandleShortcut(ev("ArrowRight", document.body, { defaultPrevented: true }))).toBe(false)
  })

  it("Alt · Ctrl · Meta 가 함께 눌리면 받지 않는다(Alt+← = 뒤로) — Shift 는 받는다", () => {
    expect(shouldHandleShortcut(ev("ArrowLeft", document.body, { altKey: true }))).toBe(false)
    expect(shouldHandleShortcut(ev("ArrowLeft", document.body, { ctrlKey: true }))).toBe(false)
    expect(shouldHandleShortcut(ev("ArrowLeft", document.body, { metaKey: true }))).toBe(false)
    expect(shouldHandleShortcut({ ...ev("?", document.body), shiftKey: true } as ShortcutKeyEvent)).toBe(true)
  })

  it("글자를 쓰는 자리(글자형 input · textarea · select · contenteditable)에서는 어떤 키도 받지 않는다", () => {
    const targets = [
      mount("<input />"),
      mount("<input type='text' />"),
      mount("<input type='search' />"),
      mount("<input type='number' />"),
      mount("<textarea></textarea>"),
      mount("<select><option>a</option></select>"),
      mount("<div contenteditable='true'><span id='in'>글</span></div>").querySelector("span") as HTMLElement,
    ]
    for (const t of targets) {
      expect(isTextEntryTarget(t)).toBe(true)
      for (const key of ["ArrowRight", " ", "Enter", "?"]) expect(shouldHandleShortcut(ev(key, t))).toBe(false)
    }
  })

  it("체크박스 · 버튼은 글자 자리가 아니다 — 화살표는 받고 Space · Enter 는 그 컨트롤 몫", () => {
    const targets = [
      mount("<button type='button'>재생</button>"),
      mount("<a href='#x'>링크</a>"),
      mount("<input type='checkbox' />"),
      mount("<div role='button' tabindex='0'>칩</div>"),
      mount("<button role='switch'>켜기</button>"),
      mount("<div role='checkbox' tabindex='0'></div>"),
    ]
    for (const t of targets) {
      expect(isTextEntryTarget(t)).toBe(false)
      expect(shouldHandleShortcut(ev("ArrowRight", t))).toBe(true)
      expect(shouldHandleShortcut(ev(" ", t))).toBe(false)
      expect(shouldHandleShortcut(ev("Enter", t))).toBe(false)
    }
  })

  it("버튼 안쪽 요소(아이콘 등)도 버튼으로 본다", () => {
    const icon = mount("<button><span>▶</span></button>").querySelector("span") as HTMLElement
    expect(shouldHandleShortcut(ev(" ", icon))).toBe(false)
  })

  it("화살표로 값을 옮기는 컨트롤(라디오 · 범위 · 탭 · 선택지)에서는 화살표를 받지 않는다", () => {
    const targets = [
      mount("<input type='radio' />"),
      mount("<input type='range' />"),
      mount("<div role='radiogroup'><button role='radio'>1</button></div>").querySelector("button") as HTMLElement,
      mount("<button role='tab'>탭</button>"),
      mount("<div role='option' tabindex='0'>항목</div>"),
      mount("<div role='slider' tabindex='0'></div>"),
    ]
    for (const t of targets) {
      expect(shouldHandleShortcut(ev("ArrowLeft", t))).toBe(false)
      expect(shouldHandleShortcut(ev("ArrowRight", t))).toBe(false)
    }
  })
})
