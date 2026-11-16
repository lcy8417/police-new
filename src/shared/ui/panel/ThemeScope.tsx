import * as React from "react"

import {
  clearThemeScope,
  setThemeScope,
  themeScopeAttrs,
  ThemePortalContext,
  type DisplayPrefs,
} from "@/shared/lib/display-prefs"
import { partAttrs } from "../part-attrs"

// 시안 화면 범위(설계서 §14-1): 이 상자 안에서만 팔레트 · 글꼴 · 글자 크기 · 움직임 줄이기가 걸린다.
// 값은 src/index.css 의 `[data-theme]` · `[data-font]` · `[data-scale]` · `[data-motion]` 규칙에 있다 — 여기는 속성만 단다.
// 범위 밖(기존 운영 화면 · 부품 진열 /dev/parts)은 :root 값 그대로다.
// 겹침 창: 상자 끝에 포털 자리(`data-theme-portal`)를 두고 맥락으로 알린다 — DialogShell 이 body 대신 여기로 포털해
// 범위의 색 · 글꼴 · 배율을 그대로 받는다. 앱 전체 알림(Toaster)에는 「열린 범위」로 설정을 알린다.
export interface ThemeScopeProps extends React.ComponentProps<"div"> {
  /** 화면 설정 값(보통 `useDisplayPrefs()`) */
  prefs: DisplayPrefs
}

export function ThemeScope({ prefs, children, ...props }: ThemeScopeProps) {
  const [portal, setPortal] = React.useState<HTMLDivElement | null>(null)
  const [id] = React.useState(() => Symbol("ThemeScope"))
  const { theme, font, scale, reducedMotion } = prefs

  React.useEffect(() => () => clearThemeScope(id), [id])
  React.useEffect(() => {
    setThemeScope(id, { theme, font, scale, reducedMotion })
  }, [id, theme, font, scale, reducedMotion])

  return (
    <div {...partAttrs("ThemeScope")} {...themeScopeAttrs(prefs)} {...props}>
      <ThemePortalContext.Provider value={portal}>{children}</ThemePortalContext.Provider>
      <div data-theme-portal="" ref={setPortal} />
    </div>
  )
}
