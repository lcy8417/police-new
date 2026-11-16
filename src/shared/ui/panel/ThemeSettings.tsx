import * as React from "react"

import {
  useDisplayPrefs,
  type FontName,
  type TextScale,
  type ThemeName,
} from "@/shared/lib/display-prefs"
import { cn } from "@/shared/lib/utils"
import { Button, Segmented } from "../kit"
import { partAttrs } from "../part-attrs"

// 사용자용 「화면 설정」 창(설계서 §14-4): 팔레트 4 · 글꼴 6 · 글자 크기 3 · 움직임 줄이기.
// 고른 값은 이 브라우저에 기억한다(useDisplayPrefs — 실패해도 기본값). ScasShell 위 메뉴 오른쪽 끝 · S00 진열 화면에 둔다.
// 미리보기 색 · 글꼴은 hex 를 쓰지 않고 작은 범위(`data-theme` · `data-font`)를 달아 그 팔레트 · 글꼴의 토큰으로 그린다.

/** 팔레트 이름표(화면 글자) */
const THEME_LABELS: Record<ThemeName, string> = {
  "scas-light": "SCAS 밝게",
  "light-contrast": "또렷하게",
  "light-soft": "부드럽게",
  dark: "어둡게",
}

/** 글꼴 이름표(화면 글자) */
const FONT_LABELS: Record<FontName, string> = {
  d2coding: "D2Coding",
  pretendard: "Pretendard",
  "nanum-gothic": "나눔고딕",
  "nanum-barun": "나눔바른고딕",
  "ibm-plex": "IBM Plex Sans KR",
  "noto-sans": "Noto Sans KR",
}

/** 글자 크기 이름표(화면 글자) */
const SCALE_LABELS: Record<TextScale, string> = {
  md: "보통",
  lg: "크게",
  xl: "아주 크게",
}

const THEME_ORDER: ThemeName[] = ["scas-light", "light-contrast", "light-soft", "dark"]
const FONT_ORDER: FontName[] = ["d2coding", "pretendard", "nanum-gothic", "nanum-barun", "ibm-plex", "noto-sans"]
const SCALE_ORDER: TextScale[] = ["md", "lg", "xl"]

// 팔레트 미리보기: 그 팔레트 범위 안에서 바탕 · 패널 · 강조 · AI 색 네 칸
function Swatch({ theme }: { theme: ThemeName }) {
  return (
    <span
      aria-hidden="true"
      data-theme={theme}
      className="inline-flex overflow-hidden rounded-[4px] border border-solid border-line-3 bg-canvas"
    >
      <span className="size-[10px] bg-canvas" />
      <span className="size-[10px] bg-panel" />
      <span className="size-[10px] bg-brand" />
      <span className="size-[10px] bg-ai" />
    </span>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-[6px]">
      <span className="text-[12px] font-semibold text-fg-2">{label}</span>
      {children}
    </div>
  )
}

export interface ThemeSettingsProps {
  className?: string
  /** (11/17 확장) 어두운 위 막대용 — ⚙ 아이콘만(글자는 화면 읽기 이름), 종이색 글자 */
  compact?: boolean
}

export function ThemeSettings({ className, compact = false }: ThemeSettingsProps) {
  const prefs = useDisplayPrefs()
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const panelId = React.useId()

  // 열려 있을 때만: 바깥 누름 · Esc 로 닫는다(Esc 면 여는 버튼으로 초점 되돌림)
  React.useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      // 이 Esc 는 화면 설정 닫기 몫 — 아래 층(편집 판 · 사건 창)이 같이 닫히지 않게 알린다(3회차 검수)
      e.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener("mousedown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div {...partAttrs("ThemeSettings", { state: open ? "open" : undefined })} ref={rootRef} className={cn("relative", className)}>
      <Button
        ref={triggerRef}
        size="sm"
        variant={compact ? "ghost" : undefined}
        aria-label={compact ? "화면 설정" : undefined}
        title={compact ? "화면 설정" : undefined}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((v) => !v)}
        className={
          compact
            ? "h-[30px] w-[30px] justify-center rounded-[9px] px-0 text-paper/75 hover:bg-paper/14 hover:text-paper focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-paper"
            : undefined
        }
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="1.8"
          className={compact ? "size-[16px] stroke-current" : "size-[14px] stroke-current"}
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
        </svg>
        {compact ? null : "화면 설정"}
      </Button>
      {/* 펼침 칸(disclosure): 초점을 가두지 않는 보통 구역이다(대화상자 아님) — Tab 으로 버튼 다음에 바로 들어간다 */}
      {open && (
        <section
          id={panelId}
          data-esc-layer=""
          aria-label="화면 설정"
          className={
            "absolute top-[calc(100%+6px)] right-0 z-50 grid w-[380px] gap-[14px] rounded-[10px] border border-solid border-border " +
            "bg-panel p-[14px] text-left text-[12.5px] text-foreground [box-shadow:0_8px_30px_0_var(--t-panel-drop)]"
          }
        >
          <div className="flex items-center justify-between">
            <b className="text-[14px]">화면 설정</b>
            <Button size="sm-h22" variant="ghost" onClick={() => setOpen(false)}>
              닫기
            </Button>
          </div>

          <Row label="색 팔레트">
            <Segmented
              aria-label="색 팔레트"
              className="flex flex-wrap"
              value={prefs.theme}
              onValueChange={(v) => prefs.set({ theme: v as ThemeName })}
              items={THEME_ORDER.map((t) => ({
                value: t,
                label: (
                  <span className="inline-flex items-center gap-[6px]">
                    <Swatch theme={t} />
                    {THEME_LABELS[t]}
                  </span>
                ),
              }))}
            />
          </Row>

          <Row label="글꼴">
            <Segmented
              aria-label="글꼴"
              className="flex flex-wrap"
              value={prefs.font}
              onValueChange={(v) => prefs.set({ font: v as FontName })}
              items={FONT_ORDER.map((f) => ({
                value: f,
                // 이름표를 그 글꼴로 그린다(범위 속성 data-font 가 글꼴을 건다)
                label: <span data-font={f}>{FONT_LABELS[f]}</span>,
              }))}
            />
          </Row>

          <Row label="글자 크기">
            <Segmented
              aria-label="글자 크기"
              value={prefs.scale}
              onValueChange={(v) => prefs.set({ scale: v as TextScale })}
              items={SCALE_ORDER.map((s) => ({ value: s, label: SCALE_LABELS[s] }))}
            />
          </Row>

          <Row label="움직임 줄이기">
            <Segmented
              aria-label="움직임 줄이기"
              value={prefs.reducedMotion ? "on" : "off"}
              onValueChange={(v) => prefs.set({ reducedMotion: v === "on" })}
              items={[
                { value: "off", label: "끔" },
                { value: "on", label: "켬" },
              ]}
            />
          </Row>

          <p className="m-0 text-[11.5px] text-dim">고른 값은 이 브라우저에 기억됩니다.</p>
        </section>
      )}
    </div>
  )
}
