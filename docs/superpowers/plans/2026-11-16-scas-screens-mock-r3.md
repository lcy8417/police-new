# 11개 화면 시안 r3 — 시인성 · 편의(팔레트 · 글꼴 · 자동 모드 · 필터 · 보기 개수) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 시안 화면을 SCAS 같은 흰 바탕 기본의 팔레트 4종 · 글꼴 선택 · 글자 크기로 바꿀 수 있게 하고, 검색 결과 자동 모드 · 필터/검색 · 보기 개수 같은 편의 기능을 넣는다.

**Architecture:** `--t-*` 토큰을 `[data-theme]` 범위에서 다시 정의(`:root`는 그대로 → 기존 운영 앱 무변경), 글꼴은 `--t-font-ui/--t-font-code` 범위 변수 + 저장소에 넣은 웹폰트. 사용자용 「화면 설정」 창은 ScasShell 상단. 편의 기능은 공용 부품(FilterBar · ColumnPicker · ViewCountSwitch · AutoPlayControl + `useAutoPlay`)으로 만들어 화면에 붙인다.

**Spec:** `docs/superpowers/specs/2026-11-16-scas-screens-mock-design.md` **§14(r3)** — §13(r2) · 1차 규칙 위에 얹는다. 1 · 2차 계획의 Global Constraints 그대로 + 아래.

## Global Constraints (추가분)

- `:root` 기존 토큰 값 · 기존 운영 앱 화면 무변경. 새 팔레트는 `[data-theme="scas-light"|"light-contrast"|"light-soft"|"dark"]` 범위에서만.
- 밝은 팔레트 3종은 본문 글자 · 상태 칩 글자 대비 AA(4.5:1) 이상 — 자동 검사(테스트로 토큰 쌍 대비 계산).
- 글꼴 파일은 공개 라이선스(OFL 등)만, 저장소 `src/assets/fonts/`에 woff2(라이선스 파일 동봉). 디스크 여유가 적으니(약 6GB) 글꼴은 필요한 굵기만(보통 · 굵게), 서브셋 woff2 우선.
- 설정 기억은 localStorage — 읽기/쓰기 모두 try/catch, 실패해도 기본값으로 정상 동작.
- 자동 모드 타이머는 해제 정리 필수(언마운트 · 모드 전환 · 쪽 이동), 움직임 줄이기에서도 넘기기 자체는 동작(애니메이션만 끔).
- 부품 픽셀 대조는 `dark` 팔레트로. 시안에 없는 부품 모양은 SCAS 흰 화면 문법(얇은 회색 선 · 파란 강조 · 표 머리 옅은 회색)을 따른다.
- Write/Edit 도구로만 소스 편집. 포트는 지정된 것만(5210 사용자 확인용은 끄지 않음).

## Review Focus

1. 기존 운영 화면(`/search`, `/crimeRegister` 등, AppShell)의 색 · 글꼴이 1픽셀도 안 바뀐다 — 토큰 회귀 테스트(`tests/ui/token-regression.spec.ts`) 통과.
2. 팔레트를 바꿔도 상태 의미(경고 · 위험 · AI)가 색 외 글자/아이콘으로도 구분된다.
3. 자동 모드: 주기 바꾸면 즉시 반영, 일시정지/재개, 마지막에서 멈춤, 화면 떠나면 타이머 0개.
4. 필터 · 검색 결과 0건은 「조건에 맞는 항목 없음 · 조건 지우기」(조회 실패와 다른 모양).
5. 글자 크기 「아주 크게」 + 1280 폭에서 가로 넘침 0(S01 · S05).

---

### Task T1: 팔레트 · 글꼴 · 화면 설정 (토대, T2와 병렬)

**Files:** `src/index.css`(범위 토큰 · @font-face · `--font-ui/--font-code`를 범위 변수로 — `:root` 기본값 동일), `src/assets/fonts/**`, `src/shared/ui/panel/{ThemeSettings,ThemeScope}.tsx`(+ test), `src/shared/ui/panel/ScasShell.tsx`(루트에 data-theme/data-font/data-scale + 상단 「화면 설정」 자리 — 추가만), `src/shared/lib/display-prefs.ts`(+ test: 읽기/쓰기/기본값/잘못된 값), `src/pages/dev/screens/s00/**`(bare 화면도 같은 범위 적용 — 최소 수정), `.claude/skills/police-ui-design/{SKILL.md,references/tokens.md}`(원칙 개정 · 팔레트 표), `tests/ui/`(대비 검사 · 팔레트 캡처 1장씩).

**Produces:** `export type ThemeName = "scas-light" | "light-contrast" | "light-soft" | "dark"`, `export type FontName = "d2coding" | "pretendard" | "nanum-gothic" | "nanum-barun" | "ibm-plex" | "noto-sans"`, `export type TextScale = "md" | "lg" | "xl"`, `useDisplayPrefs(): { theme; font; scale; reducedMotion; set(p) }`, `<ThemeScope prefs>`(범위 속성 다는 래퍼), `<ThemeSettings />`(설정 창). 기본값 scas-light · d2coding · md.

- [ ] 대비 검사 테스트 먼저(토큰 쌍 → 대비 비율 ≥ 4.5) → 팔레트 3종 값 설계(SCAS 실제 화면 문법: 흰 바탕 · #1f2a5a 계열 남색 머리띠 대신 토큰) → 통과.
- [ ] 글꼴 6종 내려받기(공식 배포처) → woff2 서브셋 → @font-face → 범위 변수 → 테스트(data-font 바꾸면 계산된 font-family 바뀜).
- [ ] 설정 창 · 기억 · ScasShell 연결 → 테스트 → `tests/ui/token-regression.spec.ts`로 기존 화면 무변경 확인.
- [ ] 정본 스킬 원칙 개정(날짜 · 사용자 말 원문 · 범위) + tokens.md 팔레트 표.
- [ ] 검증 · 커밋.

### Task T2: 편의 공용 부품 (T1과 병렬)

**Files:** `src/shared/ui/kit/{FilterBar,ColumnPicker,ViewCountSwitch}.tsx`, `src/shared/ui/ai/AutoPlayControl.tsx`(or kit), `src/shared/lib/use-auto-play.ts`(+ tests), `src/pages/dev/parts/**`(진열), `references/components.md` · `parts-plan.md`(T1의 ThemeSettings/ThemeScope 행도 이 작업이 대신 적음 — T1 노트 받아 합침 단계에서).

**Produces:**
- `FilterBar { query; onQueryChange; filters: { key; label; options: {value; label; count?}[]; value: string[] }[]; onFilterChange(key, values); onClear; resultCount?; total? }`
- `ColumnPicker { columns: { key; label; locked?: boolean }[]; visible: string[]; onChange(keys) }` (SCAS 순서 유지, 잠긴 열은 못 끔)
- `ViewCountSwitch { options: number[] | string[]; value; onChange; label? }`
- `useAutoPlay({ count, intervalMs, enabled, onStep(index), loop?: false }) → { index; playing; play(); pause(); next(); prev(); remainingMs }` — 테스트(가짜 타이머): 주기, 일시정지, 마지막 정지, 해제 정리.
- `AutoPlayControl { mode: "manual"|"auto"; onModeChange; intervalMs; onIntervalChange(ms); playing; onPlayPause; position: {index; total}; remainingRatio }` — 빠른 고르기 1 · 2 · 3 · 5초 + 0.5초 단위 미세 조정(0.5~10초).
- [ ] 부품마다 테스트 먼저 → 구현 → 진열 → 검증 · 커밋.

### Task T3: 병합 · 정리 (T1 · T2 · r2 R5 병합 뒤)
- [ ] 세 갈래 병합, components.md/parts-plan 행 합침, `npm run check:ui` · tsc · vitest · build.

### Task T4~T6: 화면 적용 (병렬)
- T4 ① S05 · S06 · S07: S05 자동 모드(AutoPlayControl + useAutoPlay — 초점 이동 · 스크롤 · 다음 쪽 · 어디까지 봤는지), FilterBar(유사도 등급 · 본 것 · 확인대상 · 상표 검색), ViewCountSwitch 1~6개, 썸네일 크기, 전체 화면, 단축키(← → Space ?). S06 1:1 · 1:3 · 1:5 비교 + 후보 자동 넘기기. S07 블록 1 · 3 · 5개 + 필터.
- T5 ② S01 · S10: FilterBar + ColumnPicker(S01 표 열), S10 카드 크기 · 필터 · 카드 자동 넘기기.
- T6 ③ S13 · S14 (+ S02 · S03 · S04 필요한 곳 검색 칸): FilterBar + ColumnPicker.
- 각 화면: 테스트 먼저(Review Focus 3 · 4), 위젯은 값만 받고(필터 값 · 보기 개수 · 자동 모드 상태는 제어형 — 진열 페이지가 기억/보관), 커밋.

### Task T7: 마감
- [ ] 11개 화면 × scas-light 캡처를 시안(dark)과 나란히 → 사용자 보고(차이 목록). 팔레트 4종 대표 화면 캡처.
- [ ] 전체 검증 1회 + 최종 검수 1회(가장 강한 모델) → 수정 1회 → 재검토.
