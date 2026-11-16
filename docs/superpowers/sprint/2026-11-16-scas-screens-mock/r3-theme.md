# r3 T1 — 팔레트 · 글꼴 · 화면 설정 노트 (2026-11-16)

설계서 §14-1 · 3 · 4 · 8, 계획 r3 Task T1. 값 · 규칙의 정본은 `police-ui-design` 스킬 `references/tokens.md` 「팔레트 · 글꼴 범위」 — 여기는 합칠 때 할 일만.

## 합칠 때 T2(또는 합침 단계)가 대신 적을 것

`check:ui:static`의 부품 목록 검사는 출입구 export 가 `components.md` 「부품」 열에 있어야 통과한다. T1 은 `components.md`를 고치지 않으므로 **아래 두 행이 들어가기 전까지 이 갈래 단독으로는 `check:ui:static`이 2건 실패**한다(`ThemeScope` · `ThemeSettings` 「표의 부품 열에 없음」). 두 행을 임시로 넣고 `npm run check:ui` 전체(96개)가 통과하는 것은 확인했다(확인 뒤 되돌림).

`references/components.md` 표(panel 묶음, ScasShell 근처)에 더할 행:

```
| ThemeScope | panel | `src/shared/ui/panel/ThemeScope.tsx` | (시안 없음 — r3 사용자 결정 2026-11-16) | 진열 틀(S00–S14) | [새로] 범위 상자 하나: `prefs`(DisplayPrefs)를 `data-theme` · `data-font` · `data-scale` · `data-motion` 속성으로 단다. 값은 `src/index.css` 범위 규칙(`tokens.md` 「팔레트 · 글꼴 범위」). 겹쳐도 글자 배율은 바깥 한 번. 상자 끝 포털 자리(`[data-theme-portal]`, 맥락 `useThemePortalContainer`) — DialogShell 이 범위 안이면 여기로 포털, 열린 동안 Toaster 에 설정을 알림(`useActiveThemeScope`) | 구현됨 |
| ThemeSettings | panel | `src/shared/ui/panel/ThemeSettings.tsx` | (시안 없음 — r3 사용자 결정 2026-11-16, 설계서 §14-4) | 진열 틀(ScasShell `headerEnd` · S00 진열 막대 끝) | [새로] 「화면 설정」 버튼 + 펼침 칸(disclosure — `aria-expanded` · `aria-controls`, 이름 있는 `section`, 초점을 가두지 않음. Esc · 바깥 누름 · 닫기로 닫힘, Esc 면 버튼으로 초점 복귀). 안: 팔레트 4(미리보기 4칸 = 그 팔레트 범위 토큰) · 글꼴 6(이름표를 그 글꼴로) · 글자 크기 3 · 움직임 줄이기 — 모두 kit `Segmented`. 값은 `useDisplayPrefs`(localStorage, 실패 → 기본값). 상태 `open` | 구현됨 |
```

진열(`src/pages/dev/parts/parts-plan.md`) 쪽은 픽스처를 넣지 않았으므로 줄이 필요 없다. 시안 짝이 없는 부품이라 픽셀 대조 대상이 아니다(설계서 §14-9: 밝은 팔레트는 대비 검사 + 캡처로 갈음).

## 다른 갈래가 알고 쓸 것

- **설정 값 읽기**: `import { useDisplayPrefs } from "@/shared/lib/display-prefs"` → `{ theme, font, scale, reducedMotion, set }`. 같은 창의 모든 사용처가 한 값을 본다. 자동 넘기기(T2 `useAutoPlay`)는 `reducedMotion`이면 애니메이션만 끄고 넘기기는 그대로.
- **ScasShell 새 prop(추가만)**: `display?: DisplayPrefs`(루트 범위 속성) · `headerEnd?: ReactNode`(위 메뉴 오른쪽 끝). 둘 다 없으면 전과 같다 → `/dev/parts` 의 ScasShell 픽스처는 다크 그대로.
- **진열 틀**: `DevScreenFrame`이 진열 막대까지 `ThemeScope`로 감싸고, 틀 자체가 `h-full overflow-auto`(화면 높이 + 스크롤)다. 전에는 `#root`의 `overflow:hidden` 때문에 900px 아래가 잘려 스크롤이 안 됐다 — 이제 틀 안에서 세로 스크롤된다. 화면 끝 스크롤(자동 모드)은 이 틀(`[data-part="ThemeScope"]`)이나 화면 안 스크롤 상자 기준으로.
- **밝은 팔레트에서 어색한 자리(화면 갈래 몫)**: `bg-foreground`를 「밝은 종이」 바탕으로 쓴 곳이 진한 남색이 된다 — `widgets/search-result/ui/SearchResultScreen.tsx`(신발 사진 칸) · `widgets/result-confirm/ui/ResultConfirmScreen.tsx`. 밝은 바탕이 필요하면 `bg-picon`(모든 팔레트에서 밝은 종이색). `widgets/pattern-code/ui/decorations.tsx`의 `bg-danger text-foreground`(밝은 팔레트에서 빨강 위 진한 글자)도 같은 성격. shadcn `Switch` · `Checkbox`는 hex 고정색이라 팔레트를 따르지 않는다.
- 글자 크기 「아주 크게」(zoom 1.25)는 1280 폭에서 문서 가로 넘침 0(검사 있음)이지만, 화면 안 배치는 1024 폭처럼 좁아져 S01 목록 머리의 「목록보기 · 문양보기」가 세로로 접힌다 — 화면 갈래가 좁은 폭 배치를 손볼 자리.
