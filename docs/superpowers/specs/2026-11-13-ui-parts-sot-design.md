# 공용 UI 부품 정본(SOT) 설계서 — `police-ui-design` (r2)

> **한 줄 요약**: 화면 16개를 **같은 부품으로 조립**하기 위해 부품 정본을 **스킬**(`police-new/.claude/skills/police-ui-design/`)로 만든다. 생김새의 원본은 **r3 시안**, 부품은 4개 출입구(`kit` 기본 · `viewer` 족적 사진 표시 · `ai` AI 표시 · `panel` SCAS 틀)에서 꺼낸다. 새 부품은 「목록에서 찾기 → 시안에 먼저 그림 → 상태별 실제 스타일값 읽기 → 토큰으로 옮기기 → 자동 대조 → 목록에 한 줄」 순서로만 늘린다. romang(`~/Desktop/romang`)의 `romang-ui-design` 체계를 족적 플랫폼에 맞게 **골라서** 옮긴 것이다.

- 작성일: 2026-11-13 / 상태: **r2 — Codex 교차 검증 반영, 사용자 확인 3건 대기(§14)**
- 저장소: `police-new`(React 19 · TS · Vite · Tailwind 4 · shadcn new-york · lucide · FSD)
- 생김새 원본: r3 시안 `docs/mockups/scas-redesign/`(커밋 `3a9d4b8`, 아티팩트 https://claude.ai/artifact/XjNmTGeHLPLjz5PrNJgra7 8판)
- 참고 체계: `~/Desktop/romang/.claude/skills/romang-ui-design/`(SKILL.md · `references/components.md` · `input.md`), `~/Desktop/romang/romang/.claude/rules/{ui-design,board-components,layout,modal}.md`, 관문 훅 `~/Desktop/romang/.claude/hooks/romang/mockup-parts-gate.py`, 대조 `~/Desktop/romang/.moai/state/verify/client-screen-check-1028/compare2.mjs`
- 함께 지키는 정본: `docs/architecture.md`(FSD), `docs/api-communication.md` §4(문양추출 좌표 계약), DB `police-server/docs/superpowers/specs/2026-11-12-pilot-platform-schema-design.md`
- 검토 기록: Codex 독립 검토(2026-11-13) 「반드시 고칠 것」 8건 · romang 누락 5건 · 과한 것 5건 반영 — 본문의 「검토 ①~⑧」

---

## 0. 용어 (처음 한 번만 풀이)

- **정본(SOT, Source of Truth)**: "이 주제는 여기가 기준"인 단 하나의 자리. 다른 문서·코드는 가리키기만 한다.
- **스킬**: AI(Claude·Codex)가 작업 전에 읽는 지침 묶음. 사람도 같은 파일을 읽는다.
- **부품(컴포넌트)**: 여러 화면에서 다시 쓰는 화면 조각. **출입구(배럴)**: 부품을 한곳에서 내보내는 `index.ts`.
- **토큰**: 색·크기에 붙인 역할 이름(`--color-panel`). 화면은 값(`#0b121d`) 대신 이름을 쓴다.
- **computed style**: 브라우저가 최종으로 적용한 실제 스타일값. 눈대중 대신 이 값을 읽는다.
- **변형(variant)**: 같은 부품의 승인된 다른 모양. **훅(hook)**: 파일을 쓰기 직전에 자동 실행되는 검사.

---

## 1. 무엇을 위해, 이번엔 어디까지

**결론: 이번 일은 "부품을 꺼내 쓰고 늘리는 체계"를 세우고, 사건관리(S01·S02)와 대표 부품 6개로 그 체계가 끝까지 돌아가는지 증명하는 것이다. 나머지 부품과 화면 16개 전환은 이 체계 위에서 화면 단위로 한다.**

| 구분 | 내용 |
|---|---|
| **목표** | ① 부품 정본이 한 곳(스킬)에 있고 사람·AI가 같은 곳에서 꺼냄 ② 시안 = 원본, 앱 = 옮긴 것(같은 모양을 두 번 만들지 않음) ③ 새 부품은 정해진 순서로만 추가되고 목록에 기록됨 ④ 모양 일치를 자동 대조로 확인 |
| **이번 범위** | 스킬·참고 파일 · 자동 열림 규칙(Claude) + `AGENTS.md` 안내(Codex) · 토큰 2층(**값은 그대로**, §5) · 출입구 4개 골격 · 부품 목록 1판(**후보**, §7) · **S01·S02** 시안 부품 표식(§8-1) · 진열 화면 `/dev/parts` 틀 · 자동 대조 · hex 검사 · 부품표 관문(등록·검증까지) · **대표 부품 6개 구현·검증**: Button · Chip · Field · Panel · ButtonBar · AiTag |
| **다음 단계(별도 계획)** | 부품 목록의 나머지(우선순위 §10) → 화면 16개 전환(DB 설계서의 C 단계) |
| **하지 않음** | 시안 재디자인 · 라이트 테마 · 모바일 전용 화면 · 기존 화면 일괄 교체 · 좌표를 다루는 캔버스 코드 수정(§6-1) |
| **실패로 보는 것** | 정본 목록과 코드가 따로 놂 / 시안 값 눈대중 / 새 코드에 hex 증가 / 이름만 같고 모양이 다른 부품 / 공용 부품에 업무 판정 / SCAS 라벨·열 순서가 부품 사정으로 바뀜 / **문양추출 좌표가 어긋남** |

---

## 2. 정해진 것과 우선순위

1. **r3 시안이 생김새의 승인 원본**(2026-11-13 사용자). 값이 헷갈리면 시안을 띄워 computed style로 뽑는다.
2. **romang 체계를 골라서 따른다**: 정본 = 스킬, 규칙 파일은 방아쇠, 부품 목록 표, 없으면 만드는 순서, 부품표 관문, 자동 대조, 하지 말 것 기록. romang 자체도 출입구 수(스킬은 2개 · 최신 규칙은 3개)가 어긋나 있으므로 **"romang 그대로"가 아니라 이 문서에 적은 것만** 채택한다(검토 romang-5).
3. **Codex 교차 검증** 반영(이 판).

**우선순위**: 사용자 말 > 스킬 `references/`(**사용자 승인 기록이 있는 항목만** 시안보다 앞섬) > r3 시안 computed style > 기존 앱 코드.

---

## 3. 지금 상태 (2026-11-13 실측, Codex 재검증)

**결론: 같은 색을 세 군데에서 다른 이름으로 쓰고, 시안의 반복 모양 대부분이 이름 없는 인라인 스타일이다.**

| 자리 | 실측 | 뜻 |
|---|---|---|
| 앱 공용 `src/shared/ui/` | 26파일 = 구현 TSX 24 + 테스트 1 + `index.ts` 1. shadcn 기본 + 자체 5개(`tech-corners` · `glow-fx` · `status-chip` · `retrieval-results-grid` · `image-loading-overlay`) | 족적 업무 모양(사진 비교 · AI 표시 · SCAS 틀)은 없음 |
| 앱 색 | `src/index.css` `.dark`에 shadcn 이름. `index.html`이 `<html class="dark">`. **hex 1,679곳 / 85파일(6자리 기준)**, 3·4·8자리 포함 1,698곳 / 87파일 | 토큰을 거의 안 씀 |
| 시안 색 | `assets/mockup.css :root`에 자체 이름(`--bg` `--panel` …), 값은 앱과 같음 | 같은 값, 다른 이름 |
| 시안 부품 | 화면 JS 16개에 인라인 `style=` **2,198회**(원시 소스), 실행 결과 문자열 5,262회 | 반복 모양 상당수가 이름 없이 복사됨 |
| AI용 규칙 | `.claude/rules/` · 디자인 스킬 · `AGENTS.md` 없음. `.claude/settings.json`에 훅 등록 없음 | 화면마다 AI가 다른 기준으로 그림 |
| 기존 규약 충돌 | `CLAUDE.md` 「스타일링」: "하드코딩 hex이 관례" | §5-4에서 바꿈 |

---

## 4. 정본 체계의 모양

**결론: 스킬 하나 + 참고 파일 5개 + 방아쇠(Claude 규칙 · Codex `AGENTS.md`). 다른 문서에는 값을 옮겨 적지 않는다.**

```
police-new/
├── AGENTS.md                          Codex용: UI를 고치기 전 police-ui-design 스킬을 읽으라는 안내 + 검사 명령
├── .claude/
│   ├── settings.json                  ← PreToolUse 훅 등록 추가(§8-3)
│   ├── rules/ui-design.md             방아쇠: src/**/*.tsx · src/**/*.css · docs/mockups/scas-redesign/** 고칠 때 스킬부터
│   ├── hooks/parts_gate.py            부품표 관문(§8-3)
│   └── skills/police-ui-design/
│       ├── SKILL.md                   원칙 · 작업 순서 · 상태 표시 · 하지 말 것과 갱신 절차(§11)
│       └── references/
│           ├── tokens.md              값 · 역할 토큰 대응표(§5)
│           ├── components.md          ★ 부품 목록(§7) — 후보 · 구현됨 · 검증됨
│           ├── visual-spec.md         부품별 상태 표 + **입력 · 저장 · 오류 상태**(§11-2)
│           ├── motion.md              AI 진행 · 스캔 · 실시간 점 · 움직임 줄이기
│           └── layout.md              SCAS 틀 배치 · 스크롤 잘림 방지 · **좌표 민감 영역 규칙**(§6-1)
└── docs/mockups/scas-redesign/        생김새 원본(r3) — 부품 표식(§8-1)
```

- 규칙 파일·`AGENTS.md`에는 내용을 적지 않고 스킬을 가리킨다(두 곳에 적으면 어긋남).
- 생김새를 안 건드리는 수정(로직·데이터)은 스킬을 다 읽지 않아도 된다. 색 · 글꼴 · 굵기 · 간격 · 모서리 · 그림자 · 배치 · 상태 표시 중 하나라도 건드리면 연다.
- `docs/architecture.md`에 "UI 부품은 `police-ui-design` 스킬이 정본" 한 줄을 추가한다.

---

## 5. 토큰 — 값과 역할을 나누되, 이번엔 값을 바꾸지 않는다

**결론: 시안 `:root` 값을 원본으로 값 토큰 `--t-*`를 만들고, **기존 shadcn 역할 이름은 그대로 두고 값만 `--t-*`를 가리키게** 한다. 족적 전용 역할은 **새 이름**으로 추가한다. 이 단계에서 화면에 보이는 색은 하나도 바뀌지 않아야 한다(검토 ②).**

### 5-1. 층
| 층 | 예 | 자리 |
|---|---|---|
| 값 `--t-*` | `--t-panel-2: #0f1826` | `src/index.css` `:root` |
| shadcn 역할(기존 이름 유지) | `.dark { --card: var(--t-panel-2) }` | `src/index.css` `.dark` |
| 새 역할 | `@theme inline { --color-panel: var(--t-panel) }` | `src/index.css` `@theme inline` |

- `<html class="dark">`와 `.dark` 블록은 **유지**한다. `.dark` 클래스를 지우면 `dark:bg-input/30` 같은 기존 조건부 스타일이 꺼진다. `:root`의 라이트 shadcn 값 정리는 범위 밖(다크 단일 — 시안이 다크 단일).
- **기존 이름을 새 뜻으로 쓰지 않는다**: 지금 `--accent`는 어두운 선택 배경(`#16233b`, 고스트 버튼 마우스 올림 · 토글 선택)이다. 밝은 파랑에는 `brand`를 쓴다.

### 5-2. 대응표 (첫 판 — 확정본은 `tokens.md`)
| 값 토큰 | 값 | 시안 이름 | 기존 shadcn 이름(그대로) | 새 역할(Tailwind 이름) |
|---|---|---|---|---|
| `--t-bg` | `#05080d` | `--bg` | — | `bg-canvas` |
| `--t-bg-2` | `#0a0f1a` | `--bg2` | `--background` | — |
| `--t-panel` | `#0b121d` | `--panel` | — | `bg-panel` |
| `--t-panel-2` | `#0f1826` | `--panel2` | `--card` · `--popover` | — |
| `--t-panel-3` | `#141f30` | `--panel3` | — | `bg-panel-3` |
| `--t-strip` | `#0d1420` | `--strip` | `--sidebar` · `--input` | `bg-strip` |
| `--t-select` | `#16233b` | (앱 전용) | `--secondary` · `--muted` · `--accent` · `--sidebar-accent` | — |
| `--t-line` · `--t-line-2` · `--t-line-3` | `#1e2a3c` · `#141d2c` · `#26334a` | `--line` … | `--border`(= line) | `border-line-2` · `border-line-3` |
| `--t-fg` · `--t-fg-2` · `--t-mute` · `--t-dim` | `#e5e9f0` · `#c7cedb` · `#8a93a6` · `#5b6b85` | `--fg` … | `--foreground` · `--muted-foreground`(= mute) | `text-fg-2` · `text-dim` |
| `--t-brand` · `--t-brand-2` · `--t-brand-3` | `#4a9eff` · `#3b82f6` · `#2563eb` | `--blue` … | `--primary` · `--ring`(= brand-3), `--accent-foreground`(= brand-2) | `text-brand` · `bg-brand-2` |
| `--t-ai` · `--t-ai-bg` | `#2dd4bf` · `#0f2624` | `--teal` … | — | `text-ai` · `bg-ai-bg` (AI · 신발 원본 역할) |
| `--t-danger` · `--t-ok` · `--t-warn` · `--t-violet` (+`-bg`) | `#ef4444` · `#22c55e` · `#f59e0b` · `#a78bfa` | `--red` … | (`--destructive`는 기존 oklch 유지 — 바꾸면 화면 변화) | `text-danger` · `bg-ok-bg` … |

- `--k-*`(시안 주석 핀) · `--s-*`(SCAS 와이어프레임)는 **시안 전용**이라 앱 토큰에 넣지 않는다.
- 글꼴: 시안 `--font-ui` · `--font-mono`를 토큰으로. 감정번호 · 신발 번호 · 점수는 `mono`.

### 5-3. 쓰는 규칙
- 새 코드에 hex · 인라인 색 · 컴포넌트 옆 CSS 파일 금지(키프레임 · 토큰은 `src/index.css` 한 곳). 조건부 클래스는 `cn()`.
- 인라인 `style`은 사진 위 좌표처럼 **계산되는 위치값만**(`left/top/width/height/transform`) — 지금 `CLAUDE.md` 예외와 같다.

### 5-4. 기존 hex 1,679곳의 전환
- romang 전환 방식(2026-10-26)을 따른다: **공용 틀은 한 번에**(시점은 §14-1), 틀 안 화면은 **그 화면을 옮길 때**. 안 옮긴 화면을 고칠 때는 그 화면의 지금 모양을 유지하고 새 규칙을 일부만 섞지 않는다.
- 검사(§9)는 **파일 단위**: 「전환 완료 목록」(`scripts/ui-converted.txt`)에 오른 파일은 hex 0이어야 하고, 나머지 파일은 파일마다 기준 수보다 늘면 실패(지우고 새로 넣는 바꿔치기도 잡힘). `src/index.css`의 토큰 정의는 검사에서 뺀다(검토 ⑥).
- `CLAUDE.md` 「스타일링」 절의 "하드코딩 hex이 관례" 줄은 이 설계서 승인과 함께 "색은 `police-ui-design` 스킬의 토큰만 — 기존 hex는 화면을 옮길 때 바꿈(검사: `npm run check:ui`)"으로 고친다. 손으로 쓴 `.css` 금지 · 인라인 `style` 금지 · `pointer-events-none` 규칙은 유지.

---

## 6. 출입구 4개와 경계

**결론: 업무를 모르는 부품만 `shared/ui` 아래 4개 출입구에 둔다. 업무 말·판정·권한·세션은 `entities` · `features` · `widgets`에 남긴다. 좌표를 재는 사진은 공용 부품으로 감싸지 않는다.**

| 출입구 | 담는 것 | 기준 질문 |
|---|---|---|
| `@/shared/ui/kit` | 버튼 · 입력 · 고르기(검색형 포함) · 탭 · 칩 · 꼬리표 · 툴팁 · 대화상자 틀 · 표 · 쪽수 · 안내 줄 | 족적이 아닌 앱에서도 뜻이 통하나? |
| `@/shared/ui/viewer` | 족적 사진 **표시** — 사진 틀 · 보기 방식(원본 · 이진화 · 반전 · 대비) · 증거 꼬리표 · 자 · 비교 보기 · 상중하 띠 · 히트맵 · 대응점 **그림** | 사진 위에 무언가를 **보여 주나**? (재는 건 아님) |
| `@/shared/ui/ai` | AI 꼬리표 · 진행 막대 · 스캔 효과 · 실시간 점 · 신뢰도 막대 · 숫자 타일 · 점검표 · AI 제안 카드 | AI가 했다 · 하는 중 · 얼마나 확신하는지를 보여 주나? |
| `@/shared/ui/panel` | SCAS 틀의 **배치 껍데기** — 메뉴 · 사용자 · 탭 목록을 **받아서** 그리는 GNB · MDI 탭 줄, 검색 조건 패널, 버튼 줄, 라벨-값 폼, 단계 띠, 위치 표시, 쪽 머리 | SCAS 화면 배치를 재현하나? (업무 말 · 권한 판단 없음) |

### 6-1. 좌표 민감 영역 — 공용 부품으로 감싸지 않는다 (검토 ①)
- 대상: `features/patterns-extract/ui/PatternCanvas`, `hooks/useCalibration.js`, `components/Canvas.jsx`, 정렬·대응점 편집 등 **표시된 이미지의 크기(`getBoundingClientRect`)를 재서 서버로 좌표를 보내는 모든 곳**.
- 규칙: 이 `<img>`·`<canvas>`와 그 부모의 크기 · 맞춤(`object-contain`) · 래퍼 구조를 바꾸지 않는다(`docs/api-communication.md` §4 불변식). `viewer` 부품은 여기서 **잰 요소 밖의 `pointer-events-none` 겹 장식**으로만 쓴다. 시안 사진은 일부가 잘리는 방식(`slice`)이지만 캔버스는 전체를 담는 방식이므로, **캔버스 화면에는 시안의 잘린 틀을 적용하지 않는다.**
- 기존 `image-loading-overlay`의 `LoadingImage`처럼 "래퍼 div를 만드는 부품은 캔버스류에 쓰지 말 것" 주석을 `viewer` 부품마다 단다.
- 확대경 · 십자선 · 자르기 · 회전 · 대응점 **편집**은 공용화하지 않고, 필요한 화면에서 좌표 계약을 확인한 뒤 추출한다(검토 4-3).

### 6-2. 지금 있는 부품의 자리 (확정)
| 지금 | 가는 곳 | 이유 |
|---|---|---|
| shadcn 기본 파일(`button.tsx` 등) | `src/shared/ui/`에 그대로, **`kit`이 감싸서 다시 내보냄** | shadcn 갱신으로 덮어써도 감싼 쪽은 안전 |
| `status-chip` · `tech-corners` · `glow-fx` | `kit` | 업무 무관 |
| `image-loading-overlay` | `kit`(표시용 `LoadingImage` · `ImageLoadingOverlay`) | 좌표 주의 주석 유지 |
| `retrieval-results-grid` | **`entities/shoe/ui`** + 범용 격자 · 막대만 `kit` · `ai`로 분리 | 신발 ID · 서버 응답 형태 · 점수 정규화 · 0.8/0.6 등급 판정 · "필수 문양 조정" 문구 = 업무(검토 ③) |
| `widgets/app-shell`(AppShell · TopNav · Sidebar) | **세션 · 권한 · 로그아웃 · 라우팅 조립은 widget에 남음**. 배치만 `panel`의 `ScasShell` 껍데기로 | shared는 shared만 가져온다(FSD) |
| 관서 고르기 | `kit`의 검색형 고르기(Combobox) + **업무 조립 `features`**(관서 목록 조회) | 승인 시안 S02 핀 7 「관서 드롭다운 2단 → 검색 한 칸」(검토 ⑤). 2단 드롭다운은 만들지 않음 |

### 6-3. 가져오기 · 날것 컨트롤 검사 (검토 ⑥)
- `eslint.config.js` `no-restricted-imports`: `pages` · `widgets` · `features` · `entities`에서 **`@/shared/ui` 루트 출입구, `@/shared/ui/<shadcn 파일>`, 출입구 안쪽 파일(`@/shared/ui/kit/<파일>`)** 직접 가져오기 금지 → 4개 출입구로만.
- **날것 컨트롤 검사**: 「전환 완료 목록」 파일에서는 JSX `<button>` · `<input>` · `<select>` · `<textarea>`를 막는다(`no-restricted-syntax`). 가져오기가 없으면 앞 검사에 안 걸리기 때문(romang 「폰 · 폴드 화면은 lint 가드로 날것 컨트롤 막음」과 같은 장치).
- 시작: 새 파일 · 전환 완료 파일은 오류, 나머지는 경고.
- 4개 출입구 사이 방향(`panel` → `viewer`·`ai` → `kit`)은 이번엔 문서 규칙 + 리뷰로 지키고, 자동 검사는 부품이 늘어난 뒤 붙인다(검토 4-4).

---

## 7. 부품 목록 1판 — 후보 (r3 시안에서 뽑음)

**결론: 아래는 "후보"다. 「쓰는 화면」은 §8-1 표식 작업에서 스크립트로 다시 세어 확정하고, 「상태」는 후보 → 구현됨 → 검증됨으로만 올라간다. 경로 · export 검사는 구현됨 이상에만 적용한다(검토 ⑧).**

읽는 법:
- 「원본」 = r3 시안의 클래스 · 그림 함수(구현 때 `data-part` 표식으로 바뀜).
- 「쓰는 화면」 = S00 로그인 … S15 모델 관리(Codex 재집계 반영, 2026-11-13).
- 「출처」 = 🔁 shadcn 감싸기 / 🆕 새로 / ✳ 기존 자체 부품. 「상태」 = 후보 · **이번 구현**(§1의 6개).

### 7-1. `kit`
| 부품 | 원본 | 쓰는 화면 | 변형 후보 | 출처 | 상태 |
|---|---|---|---|---|---|
| Button | `.btn` | S00–S15 | primary · ghost · danger · SCAS 행 버튼(초록 검색·확인 / 남청 검증 / 빨강 결재회수) · 아이콘만 | 🔁 | **이번 구현** |
| Chip | `.chip` · `.chip-ref` | S00–S15 | 상태 · 근거 · 고름 on/off · 작게 | 🆕 | **이번 구현** |
| Field | `.inp` (+ `core.js` 공용 검색 칸) | S00–S15 | 텍스트 · 날짜 범위 · 검색(돋보기) · 읽기 전용 · 필수 · 오류 | 🔁 | **이번 구현** |
| Segmented | `.seg` | S01–S06 · S08–S10 · S13 · S14 | 2~4칸 · 아이콘 | 🔁(toggle-group) | 후보 |
| RadioRow | `.radio` | S01 · S02 · S04 · S07 · S08 · S10 | SCAS ◉○ 한 줄 | 🆕 | 후보 |
| Combobox | (S02 관서 검색 한 칸) | S02 · S01(검색 폼) | 검색형 · 결과 경로 표시(「대구청 › 동부서」) | 🆕 | 후보 |
| StatusDot | `.dot` | S00 · S08 · S11 · S15 | ok · warn · danger · 꺼짐 | 🆕 | 후보 |
| StatusChip | (인라인 꼬리표) | 다수 | 상태색 · 필수 · 「지금」 | ✳ | 후보 |
| Avatar | `.avatar`(`core.js` 공용 틀) | S01–S15 | 이니셜 · 역할색 | 🆕 | 후보 |
| Tooltip | (시안 title) | 다수 | 기본 | 🔁 | 후보 |
| DataGrid | `.grid` | S01 · S02 · S04 · S07–S09 · S11–S15 | SCAS 열 순서 · 행 선택(`tr.sel`) · 새 행 강조(`tr.fx-new`) · 행 안 버튼 | 🆕 | 후보 |
| Pagination | (목록 아래) | S01 · S05 · S10 | SCAS 「전체 n 중 a-b」 · 「더 보기」(S14) | 🆕 | 후보 |
| DialogShell | (레이어 팝업 머리 · 몸 · 발) | S02–S10 중 표식 때 확정 | 1겹 · 큰 팝업(90%) | 🔁(dialog) | 후보 |
| InlineError · Banner | (S00 필드 오류 · S11 고정 배너) | S00 · S11 | 필드 아래 · 화면 위 고정 | 🆕 | 후보 |
| LoadingImage | — | 앱 | 표시용 | ✳ | 후보 |
| TechCorners · GlowFx | (모서리 L자 · 번짐) | S00 · 쪽 머리 | — | ✳ | 후보 |

### 7-2. `viewer` (표시만 — §6-1)
| 부품 | 원본 | 쓰는 화면 | 변형 후보 | 출처 | 상태 |
|---|---|---|---|---|---|
| EvidenceImage | `M.photo` · `.imgbox` | S01–S11 | 보기 방식 원본 · 이진화 · 반전 · 대비 · 증거 꼬리표 · cm 자 · 2:3 틀(**캔버스 화면 제외**) | 🆕 | 후보 |
| SoleThumb | `M.sole` | 신발 후보 자리 | 크기 · 선택 테 | 🆕 | 후보 |
| PatternIcon | `M.picon` · `assets/patterns/` | S00 · S04 · S06 · S10 · S11 · S15 | 크기 · 필수 표시 · 개수 | 🆕 | 후보 |
| ZoneBands | (S04 상 · 중 · 하 띠) | S04 · S05 · S06 | 띠별 확신도 | 🆕 | 후보 |
| CompareView | (S03 뷰어 B · S06 · S08) | S03 · S06 · S07 · S08 | 나란히 · 겹쳐 · 밀어서 | 🆕 | 후보 |
| PointPairs(그림) | (대응점 표시) | S00 · S06 · S08 | 점 · 선 · 번호 | 🆕 | 후보 |
| HeatOverlay | (유사 부위 히트) | S00 · S05 · S06 · S07 | 투명도 | 🆕 | 후보 |
| (공용화 보류) Loupe · Crosshair · CropFrame · RotateHandle · Minimap | S03 | S03 | — | — | 화면에서 추출(§6-1) |

### 7-3. `ai`
| 부품 | 원본 | 쓰는 화면 | 변형 후보 | 출처 | 상태 |
|---|---|---|---|---|---|
| AiTag | `.ai-tag` · `.ai-mark` | S00 · S01 · S02 · S04–S12 · S15 | 「AI」 · 「AI 추천」 · 「AI✓」 · 「AI 7/12」 | 🆕 | **이번 구현** |
| AiProgress | `.fx-bar > i`(`.run`) | S01 · S02 · S04–S12 | 진행 · 끝 · 실패 · 반짝임 | 🆕 | 후보 |
| ScanOverlay | `.fx-scan` | S01–S07 · S10 · S11 | 사진 위 훑기 | 🆕 | 후보 |
| LiveDot | `.fx-live` | S01–S06 · S08 · S10 · S11 · S14 · S15 | 처리 중 · 대기 | 🆕 | 후보 |
| ConfidenceBar | (확신도 · 유사도 막대) | S04 · S05 · S06 · S15 | 0~1 · 0~100% · 임계선 | 🆕(`retrieval-results-grid`의 막대 분리) | 후보 |
| StatTile | `.stat` | S01 · S09 · S11–S14 | 숫자 · 단위 · 빛 | 🆕 | 후보 |
| CheckList | `.check` | S02 · S07 · S08 · S11 · S14 · S15 | ok · warn · bad · 줄 버튼 | 🆕 | 후보 |
| AiSuggestion | (S02 채취 방법 제안 · S03 AI 제안) | S02 · S03 · S04 · S09 | 제안 + 근거 + 「적용」 | 🆕 | 후보 |
| AiFill | `.ai-fill` | S09 | AI가 채운 칸 | 🆕 | 후보 |

### 7-4. `panel`
| 부품 | 원본 | 쓰는 화면 | 변형 후보 | 출처 | 상태 |
|---|---|---|---|---|---|
| Panel | `.panel` · `.panel-h` · `.panel-b` | S00–S15 | 파란 띠 머리 · 접기 · 머리 오른쪽 버튼 | 🆕 | **이번 구현** |
| ButtonBar | (패널 오른쪽 위 버튼 줄) | 다수 | SCAS 순서 고정(이전 · 다음 · … · 닫기) | 🆕 | **이번 구현** |
| ScasShell(껍데기) | **`M.shell`**(개선안 틀). `M.scasShell`은 SCAS 비교용이라 원본 아님 | S01–S15 | 탭 줄 · 현재 탭 | 🆕 | 후보(전환 시점 §14-1) |
| SearchForm | `.form` | S01 · S02 · S04 · S05 · S10 · S11 · S13 | 라벨-값 2열 · 3열 · 조회 · 초기화 | 🆕 | 후보 |
| Stepper | `.stepper` | S01(+ S07 · S08 흐름 띠) | 지금 칸 강조 | 🆕 | 후보 |
| Crumb · PageHead | `.crumb` · `.page-head` | S00 · S06–S15 | — | 🆕 | 후보 |

### 7-5. 부품이 아닌 것 (시안 설명 장치)
`.pin` · `.pinbox` · `.notes` · `.fit*` · `.scas-pain` · `.toc` · `.frame` · `.viewport` · `M.pin` · `M.apin` · `M.scasShell` · 「보는 사람」 토글.

---

## 8. 부품을 늘리는 순서

**결론: romang의 순서를 따르되, 우리 시안은 인라인 스타일이 많아서 "시안에 부품 표식 붙이기"를 0단계로 먼저 한다. 0단계는 S01·S02부터.**

### 8-1. 0단계 — 시안에 부품 표식 (이번엔 S01·S02)
- 부품 자리마다 `data-part="<부품>"`, `data-part-variant="<변형>"`, `data-part-state="<상태>"`, 대조 짝 번호 `data-part-id="<화면>-<번호>"`를 붙인다. **`data-state`는 쓰지 않는다** — shadcn이 이미 `checked` · `active` · `open`으로 쓴다(검토 ④).
- **생김새는 바꾸지 않는다**: 붙이기 전후 스크린샷이 같아야 한다. 조건 고정(검토 ④):
  - 화면 전체가 아니라 **시안 `.frame` 요소(1440px 프레임)만** 촬영
  - `document.fonts.ready` 뒤 촬영(외부 글꼴), **움직임 줄이기(reduced-motion)** 에뮬레이션으로 애니메이션을 최종 상태에 고정
  - 「보는 사람」 = 감정관으로 고정(저장된 역할 무시)
  - `M.photo`의 잡음 시드는 지금 **전역 호출 순번**(`core.js:87` · `:133`)이라 단독 실행 시 질감이 달라진다 → 선택 인자 `seed`를 추가하되, 주지 않으면 지금과 같은 순번을 써서 **기존 화면은 변화 0**
- 인라인 스타일로 복사된 반복 모양은 같은 부품 이름으로 묶는다. 값이 조금씩 다른 것(예: 칩 높이 22 · 24px)은 **변형으로 보존**이 기본(§14-2) — 임의로 맞추지 않는다.
- 이때 「쓰는 화면」을 스크립트로 다시 세어 §7을 확정한다.

### 8-2. 새 부품 · 변형 추가 7단계
1. **목록(`components.md`)과 다른 화면 코드에서 가까운 부품을 찾는다.** 같으면 가져다 쓰고, 승인된 차이만 변형으로 연다.
2. **없으면 r3 시안에 먼저 그린다**(시안 = 원본). 시안에 없는 상태(예: 오류 · 잠김)는 추출할 수 없으므로 시안에 그려 승인받는다.
3. **상태마다 computed style을 읽는다**(Playwright, 실제 마우스 올림 · 누름 · 키보드 초점을 만들어서).
4. **토큰 + Tailwind로 옮긴다.** 새 색 · 그림자는 `--t-*` → 역할 순서로 먼저 추가.
5. **구현에도 같은 `data-part*` 속성**을 붙인다.
6. **자동 대조에 짝을 넣는다**(§9). 상태마다 차이 0.
7. **목록에 한 줄**: 부품 · 파일 경로 · 원본(`data-part`) · 쓰는 화면 · 변형 · 상태.

### 8-3. 부품표 관문 (검토 ⑦)
- **대상**(처음엔 좁게): `docs/mockups/scas-redesign/screens/*.js` · `assets/*.css|*.js`, `src/pages/dev/**`. 운영 화면 전체에는 아직 걸지 않는다(검토 4-5).
- **부품표** `parts-plan.md`(대상 폴더마다): `| 자리 | 부품 | 판정(그대로 · 확장 · 새로) | 메모 |`. 부품과 상관없는 수정은 `부품 불필요 — 사유` 한 줄.
- **승인 줄**: 확장 · 새로가 있으면 `승인: MM/DD 소유자 — <부품>(<변형>), …` — 승인 대상 부품 이름을 적어 **옛 승인을 새 변경에 재사용하지 못하게** 한다.
- **훅이 검사하는 것**(romang `mockup-parts-gate.py`를 이 대상에 맞게 고침): 부품표 있음 · 표가 비어 있지 않음 · 판정 값이 셋 중 하나 · 「그대로」 부품 이름이 `components.md`에 있음 · 확장 · 새로 부품이 승인 줄에 이름으로 있음. 어기면 쓰기를 막고 이유를 보여 준다.
- **등록**: `.claude/settings.json`의 `hooks.PreToolUse`(matcher `Write|Edit|MultiEdit`)에 `python3 .claude/hooks/parts_gate.py`를 넣는다 — 파일만 만들면 실행되지 않는다.
- **Codex**: 훅이 없으므로 `AGENTS.md` 안내 + `npm run check:ui`가 같은 부품표 검사를 한 번 더 한다.
- **완료 확인**: 4가지 경우 — 부품표 없음 → 거부 / 「그대로」만 → 허용 / 미승인 새로 → 거부 / 승인된 새로 → 허용 — 를 Claude 훅과 `check:ui` 양쪽에서 실제로 돌려 본다.

---

## 9. 보는 곳과 재는 곳

**결론: 사람은 `/dev/parts` 진열 화면에서 눈으로, AI는 `components.md`에서 글로 고른다. 둘이 같은지는 대조 스크립트가 확인하고, 다르면 실패(종료 코드 1)로 끝난다.**

| 장치 | 무엇 | 자리 |
|---|---|---|
| 진열 화면 | **구현된 부품만** 변형 × 상태로 진열. 시안과 같은 고정 예시(문구 · 부모 폭 · 역할 · 시드). 개발 실행에서만 열림 | `src/pages/dev/parts/` |
| 자동 대조 | `data-part-id`가 같은 시안 요소 ↔ 진열 요소를 상태별로 비교: 요소 + **자식 요소 + `::before`/`::after`** computed style(px 0.01 이내) + 주요 SVG 속성 + **요소 스크린샷 차이**. 요소 없음 · 상태 생성 실패 · 차이 중 하나라도 있으면 **실패** | `scripts/ui-compare.mjs`(Playwright) |
| hex 검사 | 파일 단위 기준(§5-4). 토큰 정의 제외 | `scripts/count-hex.mjs` + `scripts/hex-baseline.json` |
| 목록 검사 | 「구현됨 · 검증됨」 부품의 파일 경로가 있고, 4개 출입구 `index.ts`의 모든 export가 목록에 있음 + 부품표 검사(§8-3) | `scripts/check-parts-catalog.mjs` |

`npm run check:ui` = 위 셋 묶음. **대조 차이 0은 모양이 같다는 뜻이지 공용 부품을 썼다는 뜻이 아니다** — 공용 부품 사용은 §6-3 검사가 맡는다. romang 원본 대조 스크립트는 차이를 출력만 하고 실패로 끝나지 않으므로, 이 점은 그대로 옮기지 않는다.

---

## 10. 다음 구현 우선순위 (이번 범위 다음)

1. 사건관리(S01 · S02) 나머지: SearchForm · RadioRow · Combobox · DataGrid · Pagination · StatTile · AiProgress · LiveDot · ScanOverlay · EvidenceImage · Stepper
2. ScasShell 껍데기 + 공용 틀 전환(§14-1)
3. 시안 표식 S03–S15 → `ai` 나머지 → `viewer`(좌표 계약 확인 후) → `panel` 나머지

---

## 11. 원칙 · 상태 · 하지 말 것 (스킬 SKILL.md 첫 판)

**결론: 이 프로젝트에서 사용자가 정했거나 거절한 것만 적는다. romang의 분홍 · 글꼴 · 세무 화면 취향은 옮기지 않는다.**

### 11-1. 원칙
- **SCAS 순서 · 라벨 · 열 순서는 그대로**(시안 r1 · r2). 새 열 · 새 버튼은 **맨 끝**(시안 S08 #1 · #8).
- **AI는 「추천」** — 확정은 사람. AI가 채운 값 · 고른 후보에는 항상 AI 표시(AiTag · AiFill).
- **과학수사 다크 톤**(시안 r1 결정).
- 상태는 **색만으로 구분하지 않는다** — 점 · 글자 · 아이콘을 같이.
- 움직이는 효과는 **AI가 실제로 일하는 자리에만**. 움직임 줄이기 설정이면 멈추고, 멈춘 모양이 최종 상태(시안 r3 규칙).
- 스크롤 잘림 금지 — 세로 틀의 스크롤 자식은 `flex-1 min-h-0 overflow-y-auto`(romang `layout.md` §1).

### 11-2. 「모름」과 「없음」, 입력 · 저장 · 오류 (romang에서 가져옴 — 검토 romang-1 · 2)
- **모르는 것을 없다고 보여 주지 않는다**: 검색 결과 0건과 검색 실패는 다른 모양. 조회 실패 = 회색 「확인 못 함 · 시:분 · 다시」, 결과 없음 = 「결과 없음(조건 …)」. 근거가 없으면 「확인 필요」.
- **실패는 그 자리에 남긴다**: 저장 실패를 잠깐 뜨는 알림으로만 처리하지 않는다 — 실패한 칸 · 줄에 표시가 남고 다시 시도 버튼이 있다.
- 입력 칸 상태(빈 필수 · 틀림 · 읽기 전용 · 잠김 · 저장 중 · 저장 실패)와 키보드 이동(Enter · Tab)은 `references/visual-spec.md`의 「입력 · 저장 · 오류」 절에서 정한다. 첫 판은 S01 · S02 · S13 시안의 입력 칸에서 읽어 채운다.

### 11-3. 하지 말 것
| 하지 말 것 | 근거 |
|---|---|
| SCAS 배치를 부품 사정으로 바꾸기 | 시안 r2 「SCAS 배치 충실화」 |
| 승인 시안이 이미 고친 것을 옛 SCAS 방식으로 되돌리기(예: 관서 2단 드롭다운) | 시안 S02 핀 7 · 검토 ⑤ |
| 실제 사건 사진 · 실명 · 주소를 시안 · 진열 화면에 쓰기 | 프로젝트 규칙(가짜 데이터, 이름 가림 `박○○`) |
| AI 성능을 부풀린 문구 | 시안 r3 수정 기록(「0 손으로 찍는 문양」 철회) |
| 새 코드의 hex · 인라인 색 · 컴포넌트 옆 CSS | §5 |
| 공용 부품 안에 업무 판정 · 권한 · 세션 | §6 |
| 좌표를 재는 사진을 공용 틀로 감싸기 | §6-1 · `api-communication.md` §4 |

### 11-4. 하지 말 것 갱신 절차
사용자가 모양을 거절하면 그 자리에서 이 표에 **날짜 · 사용자 말(원문) · 적용 범위 · 예외**를 한 줄로 추가한다. 같은 내용이 이미 있으면 새 줄 대신 그 줄을 고친다.

---

## 12. 다 됐다고 말할 수 있는 기준 (이번 범위)

1. `police-ui-design` 스킬 · 참고 파일 5개가 있고, `.tsx`를 고치면 Claude 규칙이 스킬을 연다. `AGENTS.md`가 Codex에게 같은 스킬을 가리킨다.
2. 토큰 2층이 `src/index.css`에 있고 **앱 화면 색 변화 0**(S01 · S02 대응 앱 화면 스크린샷 전후 동일), 시안 `:root`의 앱용 값이 모두 `--t-*`와 1:1.
3. 시안 S01 · S02에 `data-part*` 표식, 붙이기 전후 `.frame` 스크린샷 차이 0.
4. 4개 출입구 `index.ts`가 있고 §6-3 검사가 새 파일 · 전환 완료 파일에서 동작.
5. 대표 부품 6개(Button · Chip · Field · Panel · ButtonBar · AiTag)가 **검증됨** — 진열 화면에 있고 시안 짝과 대조 통과.
6. 부품표 관문 4가지 경우를 Claude 훅 · `check:ui` 양쪽에서 확인.
7. `npm run check:ui` · `npx tsc --noEmit` · `npx vitest run` · `npm run build` · 변경 파일 `npx eslint` 모두 통과(이 저장소 완료 규약).
8. `CLAUDE.md` 「스타일링」 절과 `docs/architecture.md`가 이 스킬을 가리킨다.

---

## 13. 검토에서 과하다고 본 것 — 이렇게 줄였다

| 원래(r1) | 지금(r2) |
|---|---|
| 시안 16개 화면 전부 먼저 표식 | S01 · S02부터 |
| 모든 부품 × 변형 × 상태 진열 | 구현된 부품만 누적 |
| viewer 전부 공용화 | 표시 부품만, 편집 도구는 화면에서 추출 |
| 출입구 간 방향 자동 검사 | 문서 규칙 + 리뷰, 자동화는 나중 |
| `src/pages/**` 전체에 관문 | 시안 · 개발용 진열 화면만 |

---

## 14. 사용자에게 확인할 것

1. **공용 앱 틀 전환 시점**: 지금 앱의 틀(TopNav 110px · Sidebar 250px)을 시안의 SCAS 틀(GNB · MDI 탭)로 바꾸는 일을 **검증 후 한 번에** 할지, **실증 대상 화면부터** 새 틀을 쓸지.
2. **시안 안의 작은 차이**(예: 칩 높이 22 · 24px): 기본은 **변형으로 보존**(승인 원본을 바꾸지 않음). 하나로 맞추길 원하면 표식 작업 때 목록을 뽑아 한 번에 승인받는다.
3. **실증 기준 화면**: 감정관 PC의 최소 해상도 · 브라우저 확대율(예: 1920×1080 · 100%). 시안 1440px 프레임만으로는 실제 장비에서 잘림 여부를 판단할 수 없다.
