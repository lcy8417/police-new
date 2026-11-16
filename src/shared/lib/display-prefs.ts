import { useSyncExternalStore } from "react"

// 시안 화면 「화면 설정」 값(설계서 §14-1·3·4): 팔레트 · 글꼴 · 글자 크기 · 움직임 줄이기.
// 이 브라우저에만 기억한다(localStorage). 읽기 · 쓰기가 실패하거나 값이 깨져 있으면 기본값으로 동작한다.

/** 팔레트 — `[data-theme]` 범위 토큰(src/index.css). `dark` = r3 시안 색 그대로 */
export type ThemeName = "scas-light" | "light-contrast" | "light-soft" | "dark"
/** 글꼴 — `[data-font]` 범위 변수(src/index.css). 파일은 src/assets/fonts/ */
export type FontName = "d2coding" | "pretendard" | "nanum-gothic" | "nanum-barun" | "ibm-plex" | "noto-sans"
/** 글자 크기 — `[data-scale]` 화면 배율(보통 · 크게 · 아주 크게) */
export type TextScale = "md" | "lg" | "xl"

export interface DisplayPrefs {
  /** 팔레트 */
  theme: ThemeName
  /** 글꼴 */
  font: FontName
  /** 글자 크기 */
  scale: TextScale
  /** 움직임 줄이기(켜면 애니메이션 · 전환 효과를 끄고 다 끝난 모양으로 둔다) */
  reducedMotion: boolean
}

export const THEME_NAMES: readonly ThemeName[] = ["scas-light", "light-contrast", "light-soft", "dark"]
export const FONT_NAMES: readonly FontName[] = [
  "d2coding",
  "pretendard",
  "nanum-gothic",
  "nanum-barun",
  "ibm-plex",
  "noto-sans",
]
export const TEXT_SCALES: readonly TextScale[] = ["md", "lg", "xl"]

export const DEFAULT_DISPLAY_PREFS: DisplayPrefs = {
  theme: "scas-light",
  font: "d2coding",
  scale: "md",
  reducedMotion: false,
}

/** 범위 속성(src/index.css 의 `[data-theme]` · `[data-font]` · `[data-scale]` · `[data-motion]` 규칙이 받는다) */
export interface ThemeScopeAttrs {
  "data-theme": ThemeName
  "data-font": FontName
  "data-scale": TextScale
  "data-motion"?: "reduce"
}

/** 설정 → 범위 요소에 달 속성 */
export function themeScopeAttrs(prefs: DisplayPrefs): ThemeScopeAttrs {
  return {
    "data-theme": prefs.theme,
    "data-font": prefs.font,
    "data-scale": prefs.scale,
    ...(prefs.reducedMotion ? { "data-motion": "reduce" as const } : {}),
  }
}

/** localStorage 열쇠(값 모양을 바꾸면 끝 번호를 올린다) */
export const DISPLAY_PREFS_KEY = "scas-mock.display-prefs.v1"

function pick<T extends string>(list: readonly T[], value: unknown, fallback: T): T {
  return typeof value === "string" && (list as readonly string[]).includes(value) ? (value as T) : fallback
}

/** 아무 값이나 받아 올바른 설정으로 고친다(모르는 칸 · 틀린 값은 칸별로 기본값) */
export function normalizeDisplayPrefs(raw: unknown): DisplayPrefs {
  const obj = raw != null && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  return {
    theme: pick(THEME_NAMES, obj.theme, DEFAULT_DISPLAY_PREFS.theme),
    font: pick(FONT_NAMES, obj.font, DEFAULT_DISPLAY_PREFS.font),
    scale: pick(TEXT_SCALES, obj.scale, DEFAULT_DISPLAY_PREFS.scale),
    reducedMotion: typeof obj.reducedMotion === "boolean" ? obj.reducedMotion : DEFAULT_DISPLAY_PREFS.reducedMotion,
  }
}

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage
  } catch {
    return null
  }
}

/** 기억한 설정 읽기. 없음 · 깨진 JSON · 저장소 접근 실패 → 기본값 */
export function readDisplayPrefs(): DisplayPrefs {
  try {
    const text = storage()?.getItem(DISPLAY_PREFS_KEY)
    return text ? normalizeDisplayPrefs(JSON.parse(text)) : { ...DEFAULT_DISPLAY_PREFS }
  } catch {
    return { ...DEFAULT_DISPLAY_PREFS }
  }
}

/** 설정 기억하기. 실패(용량 · 사생활 모드 등)는 조용히 넘긴다 — 화면은 메모리 값으로 계속 동작 */
export function writeDisplayPrefs(prefs: DisplayPrefs): void {
  try {
    storage()?.setItem(DISPLAY_PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // 기억 실패 — 이번 창에서만 유지
  }
}

// 같은 창 안의 여러 사용처(틀 · 설정 창)가 한 값을 보도록 모듈 하나에 둔다.
let current: DisplayPrefs | null = null
const listeners = new Set<() => void>()

function snapshot(): DisplayPrefs {
  if (current == null) current = readDisplayPrefs()
  return current
}

function emit() {
  for (const fn of listeners) fn()
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  // 다른 탭에서 바꾼 값도 따라간다
  const onStorage = (e: StorageEvent) => {
    if (e.key !== DISPLAY_PREFS_KEY) return
    current = readDisplayPrefs()
    emit()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(fn)
    window.removeEventListener("storage", onStorage)
  }
}

/** 설정 일부를 바꾸고 기억한다 */
export function setDisplayPrefs(patch: Partial<DisplayPrefs>): void {
  current = normalizeDisplayPrefs({ ...snapshot(), ...patch })
  writeDisplayPrefs(current)
  emit()
}

/** 테스트용: 메모리 값을 버리고 다음 읽기 때 저장소에서 다시 읽게 한다 */
export function resetDisplayPrefsCache(): void {
  current = null
}

export interface UseDisplayPrefs extends DisplayPrefs {
  set: (patch: Partial<DisplayPrefs>) => void
}

/** 화면 설정 읽기 + 바꾸기. 같은 창의 모든 사용처가 같은 값을 본다 */
export function useDisplayPrefs(): UseDisplayPrefs {
  const prefs = useSyncExternalStore(subscribe, snapshot, () => DEFAULT_DISPLAY_PREFS)
  return { ...prefs, set: setDisplayPrefs }
}
