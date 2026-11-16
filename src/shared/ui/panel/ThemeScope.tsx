import * as React from "react"

import { themeScopeAttrs, type DisplayPrefs } from "@/shared/lib/display-prefs"
import { partAttrs } from "../part-attrs"

// 시안 화면 범위(설계서 §14-1): 이 상자 안에서만 팔레트 · 글꼴 · 글자 크기 · 움직임 줄이기가 걸린다.
// 값은 src/index.css 의 `[data-theme]` · `[data-font]` · `[data-scale]` · `[data-motion]` 규칙에 있다 — 여기는 속성만 단다.
// 범위 밖(기존 운영 화면 · 부품 진열 /dev/parts)은 :root 값 그대로다.
export interface ThemeScopeProps extends React.ComponentProps<"div"> {
  /** 화면 설정 값(보통 `useDisplayPrefs()`) */
  prefs: DisplayPrefs
}

export function ThemeScope({ prefs, ...props }: ThemeScopeProps) {
  return <div {...partAttrs("ThemeScope")} {...themeScopeAttrs(prefs)} {...props} />
}
