# 생김새 값 — 검증된 부품 · 입력 · 저장 · 오류

**결론: 아래 값은 r3 시안을 브라우저로 띄워 읽은 계산값(computed style)이다. 구현된 부품은 표에 짝 번호가 있는 변형에 대해 계산값 대조(+ 예외로 빼지 않은 짝은 스크린샷 대조)를 통과했다. 부품을 고칠 때 이 표와 다르게 만들지 않는다. 표에 없는 상태(틀림 · 초점 · 저장 중 · 저장 실패)는 시안에 먼저 그린다.**

대조의 한계(자세한 이유는 `components.md` 「픽셀 대조를 뺀 자리」 · 「대조 방식이 기본과 다른 짝」 · 「픽스처가 없어 대조하지 못한 것」):
- **스크린샷을 뺀 짝 10개**(`noShot`): S01-19 · S02-15(Field), S02-17 · S02-18 · S01-15(Panel), S01-16 · S02-23(ButtonBar), S01-17 · S01-18(AiTag), S01-31(SoleThumb). **1픽셀 허용** 1개: S02-20(Field).
- **대조 범위를 줄인 짝**: Field 9개 전부 `compare: "control"`, Panel S01-15 `shell-head`(+ 높이 제외), ButtonBar S01-16 · S02-23 `shell`(S01-16은 폭 · 높이 제외), AiTag S01-17 · S01-18 위치 제외(`ignorePlacement` — 이 둘이 전부), SoleThumb S01-31 `shell` + `noShot`. **태그만 통일(`ignoreTags`)**: S01-71 · S01-22 · S01-23 · S04-34 · S01-31(접근성 때문에 span 대신 div · button). 도구 전체: 두께 0 테두리의 종류는 `none`으로 통일.
- **배치 속성은 어느 부품도 대조하지 않는다.** 계산값 대조가 읽는 속성(`tests/ui/style-read.ts` `STYLE_PROPS`)은 색 · 테두리 · 모서리 · 글꼴 · 안쪽 여백 · 폭 · 높이 · 그림자 · 불투명도 · 간격(`gap`) · `content` · `filter` · `position`과 위 · 오른쪽 · 아래 · 왼쪽 위치뿐이고, `display` · `align-items` · `justify-content` · `margin` · `flex`(늘고 줄기)는 없다. 그래서 아래 표의 배치 값(예: ButtonBar 「`display: flex` · 세로 가운데 · 왼쪽 바깥 `auto`(오른쪽 붙임)」, Field `mono-sm-flex`의 `flex: 1`)은 **시안에서 읽어 옮긴 값이고 대조로 확인되지 않았다.** 특히 **ButtonBar의 오른쪽 붙임 · 세로 가운데는 미검증**이다(이 클래스를 지워도 지금 대조는 통과한다). 배치를 정규화해 비교하는 도구는 다음 계획(판정 R34).
- **대조하지 못한 변형 · 상태**(`components.md` 「픽스처가 없어 대조하지 못한 것」과 같은 목록): Button `md` · `ai` · `danger` · `ghost` · `locked`(진짜 잠김) · `role-lock`의 잠긴 모양 · `sm-indigo-row`, Chip `on` · `h22` · `ref` · `ref-voice`, Field `readonly` · `invalid`, Panel 머리 라벨(`label`) · `default` 대표 S01-14, AiTag `.ai-mark`. 이 값들은 시안 CSS에서 옮겼거나(아래 표 밑 문단) 아직 모양이 없다. 마우스 올림 · 누름 · 키보드 초점 상태도 대조하지 않는다.
- 예외를 새로 쓰려면 측정한 이유를 픽스처 주석과 `components.md`에 적어야 한다(`SKILL.md` 작업 순서 6).

읽는 조건(모든 표 공통): 시안 `docs/mockups/scas-redesign/index.html`, 「보는 사람」 = 감정관, 화면 틀 1440px, 실제 글꼴(IBM Plex Sans KR · JetBrains Mono) 로딩 뒤, 움직임 줄이기 켬. 색은 `rgb(…)` 계산값 옆에 토큰 이름을 적었다(`tokens.md`). 「짝」은 시안 · 진열 화면의 `data-part-id`.

## Button (`kit`, 시안 `.btn`)

공통: 글자 11.5px(`sm` 계열) · 보통 굵기(400) · 모서리 6px · 테두리 1px 실선 · 아이콘 사이 간격 6px · 글꼴 ui. 줄 높이는 부모에서 물려받음(18.4px = 11.5 × 1.6, 표 안은 `normal`).

| 짝 | 변형 | 글자 | 바탕 | 테두리 | 높이 | 좌우 안쪽 | 그 밖 |
|---|---|---|---|---|---|---|---|
| S01-01 | `sm` | fg-2 `rgb(199,206,219)` | panel-2 `rgb(15,24,38)` | line-3 `rgb(38,51,74)` | 24 | 8 | 줄 높이 18.4 |
| S01-02 | `sm-pri` | 흰색 `rgb(255,255,255)` | brand-3 `rgb(37,99,235)` | brand-3 | 24 | 8 | 그림자 `0 0 18px 0` brand-glow |
| S01-03 | `sm-h26` | `sm`과 같음 | | | 26 | 8 | |
| S02-02 | `sm-h22` | `sm`과 같음 | | | 22 | 8 | |
| S01-04 | `sm-ok-row` | ok-fg `rgb(74,222,128)` | ok-bg `rgb(18,36,26)` | ok-line `rgb(31,74,47)` | 24 | 6 | 줄 높이 normal |
| S01-06 | `sm-warn-row` | warn `rgb(245,158,11)` | warn-bg `rgb(36,27,12)` | warn-line `rgb(77,58,18)` | 24 | 6 | 줄 높이 normal |
| S02-03 | `sm` · 상태 `role-lock` | `sm`과 같음 | | | 24 | 8 | 불투명도 1(감정관 시점은 안 잠김) |

읽는 법: 한 줄이 한 변형이다. 빈 칸은 위 행(같다고 적은 변형)과 같다.

시안 CSS에서 옮겼지만 S01 · S02에 쓰인 자리가 없어 대조 안 한 값: `ai` 바탕 ai-bg `#0f2624` · 테두리 ai-line `#1d4a44` · 글자 ai `#2dd4bf` / `danger` 바탕 danger-bg `#1a1013` · 테두리 danger-line `#4a1f24` · 글자 danger-fg `#f87171` / `ghost` 투명 · 글자 mute / `md` 높이 30 · 좌우 12 · 글자 12.5 · 모서리 8 / 잠김(`locked` · `disabled`) 불투명도 .35 · 커서 not-allowed.

## Chip (`kit`, 시안 `.chip`)

공통: 모서리 999px(알약) · 테두리 1px 실선 · 간격 5px · 글꼴 ui(`blue-mono-h20`만 JetBrains Mono 600).

| 짝 | 변형 | 글자 | 바탕 | 테두리 | 높이 | 좌우 | 글자 크기 | 줄 높이 |
|---|---|---|---|---|---|---|---|---|
| S01-20 | `blue` | brand `rgb(74,158,255)` | brand-bg `rgb(21,34,56)` | brand-line `rgb(43,74,120)` | 22 | 8 | 11.5 | 18.4 |
| S01-07 | `violet-h20` | violet `rgb(167,139,250)` | violet-bg `rgb(27,22,48)` | violet-line `rgb(59,50,102)` | 20 | 6 | 11.5 | normal |
| S01-08 | `green-h18` | ok-fg `rgb(74,222,128)` | ok-bg `rgb(18,36,26)` | ok-line `rgb(31,74,47)` | 18 | 6 | 10 | normal |
| S01-09 | `h18` | fg-2 `rgb(199,206,219)` | panel-2 `rgb(15,24,38)` | line-3 `rgb(38,51,74)` | 18 | 6 | 10 | normal |
| S02-05 | `amber` | warn `rgb(245,158,11)` | warn-bg `rgb(36,27,12)` | warn-line `rgb(77,58,18)` | 22 | 8 | 11.5 | 18.4 |
| S02-04 | `amber-h18` | warn | warn-bg | warn-line | 18 | 6 | 10.5 | normal |
| S02-06 | `amber-h19` | warn | warn-bg | warn-line | 19 | 8 | 10 | 14 (1.4) |
| S02-07 | `h19` | fg-2 | panel-2 | line-3 | 19 | 8 | 10 | 14 (1.4) |
| S02-08 | `blue-h20` | brand | brand-bg | brand-line | 20 | 8 | 11.5 | 18.4 |
| S02-09 | `h20-warn` | warn `rgb(245,158,11)` | panel-2 `rgb(15,24,38)` | warn-line `rgb(77,58,18)` | 20 | 8 | 11.5 | 18.4 |
| S02-10 | `blue-mono-h20` | brand | brand-bg | brand-line | 20 | 8 | 11.5 | 18.4 (mono 600) |

읽는 법: 「줄 높이」가 normal · 1.4인 것은 부모에서 물려받은 값이다 — 부품이 아니라 놓이는 자리(진열 화면은 픽스처 `boxClass`)가 정한다. `h22`(S02-11)는 기본 22와 값이 같다.

## Field (`kit`, 시안 `.inp`)

공통: 높이 26 · 좌우 안쪽 8 · 테두리 1px 실선 line `rgb(30,42,60)` · 모서리 6 · 바탕 strip `rgb(13,20,32)` · 간격 6 · 글자 fg-2 `rgb(199,206,219)` · 12.5px · 400 · 줄 높이 물려받음(1.6).

| 짝 | 변형 | 폭(부모) | 글자 | 글꼴 | 그 밖 |
|---|---|---|---|---|---|
| S01-11 | `text` | 288.67(부모 폭 100%) | fg-2 | ui 12.5 | |
| S01-12 | `mono` | 288.66 | fg-2 | JetBrains Mono 12.5 | 숫자 자리 폭 고정 |
| S01-13 | `mono-sm` | 288.66 | fg-2 | mono 11.5(줄 높이 18.4) | |
| S02-15 | `mono-sm-flex` | 243(`flex: 1`) | fg-2 | mono 11.5 | 부모가 `flex items-center` |
| S01-10 | `select` | 288.66 | fg-2 | ui 12.5 | 오른쪽 캐럿 ▾ dim `rgb(91,107,133)` |
| S02-14 | `pick` | 225.78 | fg-2 | ui 12.5 | 오른쪽 ⌕ brand `rgb(74,158,255)` |
| S02-16 | `select-mono` | 293 | fg-2 | mono 11.5 | 캐럿 ▾ |
| S02-20 | `select-warn` | 281 | fg-2 | ui 12.5 | 테두리 warn-line `rgb(77,58,18)`, 안에 칩 `amber-h18` 「확인 필요」 |
| S01-19 | `search-shell` | 260 고정 | dim `rgb(91,107,133)` | ui 12.5 | 위 메뉴(strip 바탕) 검색 칸, 돋보기(앱은 lucide `Search`) |

읽는 법: 「폭」은 시안에서 그 칸이 차지한 폭이다. 부품은 부모 폭을 따라 늘고 줄며(`w-full` · `flex-1`), `search-shell`만 고정 폭이다.

## Panel (`panel`, 시안 `.panel` · `.panel-h`)

| 짝 | 변형 | 읽은 값 |
|---|---|---|
| S02-17 | `default` | 테두리 1px line · 모서리 14 · 바탕 panel `rgb(11,18,29)` · 그림자 `inset 0 1px 0 panel-edge, 0 0 40px panel-drop` · 안쪽 여백 0 |
| S02-18 | `default-pad` | 위와 같고 안쪽 여백 위 50 · 좌우 14 · 아래 0(시안 인라인 `padding: 50px 14px 0`, 안쪽 줄: 높이 44 · 아래 1px line-2) |
| S01-15 | `tc` | 위 + 모서리 장식 `::before`(왼쪽 위) · `::after`(오른쪽 아래): 12×12 내용 + 테두리 2px brand-2 = **14px**(가상요소는 `box-content`), 모서리 14, 위치 -1px, `drop-shadow(0 0 4px corner-glow)`. 머리 `.panel-h`: 바탕 panel-head `rgba(13,20,32,.6)` · 아래 1px line-2 · 모서리 `14 14 0 0` · 간격 10 · 좌우 14 · 높이 40, 제목 13px 600 |

## ButtonBar (`panel`, 시안 `.panel-h .r` · 모달 머리 오른쪽 묶음)

| 짝 | 변형 | 읽은 값 |
|---|---|---|
| S01-16 | `panel-head` | `display: flex` · 세로 가운데 · 간격 6 · 왼쪽 바깥 `auto`(오른쪽 붙임) · 왼쪽 안쪽 14(주석 핀 자리 — `components.md` 「값이 다른 자리」) · 테두리 없음 · 글자 물려받음 |
| S02-23 | `modal-head` | 위와 같고 왼쪽 안쪽 0(폭 375.52 × 24 — 버튼 5개 + 구분선 + 검색 버튼) |

읽는 법: 간격 · 안쪽 여백 · 테두리 · 폭 · 높이는 대조로 확인했다. **`display: flex` · 세로 가운데 · 오른쪽 붙임(왼쪽 바깥 `auto`)은 배치 속성이라 대조하지 않았다**(위 「대조의 한계」) — 상태 「검증됨」은 이 범위 밖을 보증하지 않는다.

## AiTag (`ai`, 시안 `.ai-tag`)

| 짝 | 변형 | 읽은 값 |
|---|---|---|
| S02-21 | `default` | 높이 17 · 좌우 6 · JetBrains Mono 9.5px 600 · 글자 사이 .38px · 바탕 ai-bg · 테두리 1px ai-line · 글자 ai · 모서리 999 · 줄 높이 normal |
| S01-17 | `progress` | 높이 15 · 좌우 4 · mono 9px 600 · 글자 사이 .36px · 바탕 ai-bg-deep `rgb(11,42,38)` · 테두리 ai-line · 그림자 `0 2px 6px ai-tag-drop` · 간격 4 · 앞에 맥박 점 5×5(원, 바탕 ai) |
| S01-18 | `done` | `progress`와 같고 그림자 없음, 점 없음, 글자 「AI✓」 |

## 부품 잠금(Task 5)에서 더한 부품 19개 (시안 CSS에서 읽은 값 · 대조 결과는 components.md)

**결론: 아래는 시안 `mockup.css` · 화면 코드에서 읽은 값이다. 짝 번호가 있는 6개(Segmented · Avatar · SoleThumb · AiProgress · PatternIcon · ConfidenceBar)는 위 표들처럼 계산값(+ 가능한 짝은 스크린샷) 대조를 통과했고, 나머지는 값만 옮겼다(대조 없음 — `components.md`의 「잠금 때 대조하지 못한 것」).**

| 부품 | 값 |
|---|---|
| Segmented(`.seg`) | 바깥 inline-flex · 안쪽 3 · 간격 2 · 테두리 1px line · 모서리 8 · 바탕 bg2. 칸: 좌우 12 · 상하 5 · 모서리 6 · 12.5px mute. 눌림: 바탕 brand-bg · 글자 fg · 안쪽 선 1px brand-line. `scas` 눌림은 토큰 없는 `#e9ecf3`/`#1f2a5a` 대신 `bg-foreground`/`text-panel` |
| RadioRow(`.radio`) | 간격 가로 10 · 세로 2 · mute, 선택 fg. 선택 「◉ 」 brand · 미선택 「○ 」 faint |
| StatusDot(`.dot`) | 7×7 원 · currentColor · 빛 `0 0 6px currentColor` + 뒤 글자 12px fg-2 · 간격 6 |
| Avatar(`.avatar`) | 28×28 · 모서리 50%(`rounded-[50%]` — `rounded-full`은 계산값이 달라 대조 실패) · panel-3 · fg-2 12px 600 |
| DataGrid(`.grid`) | 글자 12.5. th 높이 34 · 좌우 10 · 11.5 600 mute · strip · 아래 1px line. td 높이 44 · 좌우 10 · 아래 1px line-2 · fg-2. 선택 행 brand-bg + 첫 칸 왼쪽 3px brand. 올림 `#0e1726`은 panel-2로 대신 |
| DialogShell(S02 `modal`) | 테두리 1px brand-line · 모서리 12 · panel · 그림자 `0 24px 70px rgba(0,0,0,.7)`(.35로 대신). 머리 높이 42 · 좌 14 우 10 · 간격 8 · 아래 1px brand-line · 제목 13.5 bold. 머리 그라데이션 `#132445→#0e1a30`은 단색 brand-bg로 대신 |
| InlineError · Pagination | 12px mute, 시각 mono, 「다시」 brand · 쪽수 줄 `padding:10px 14px; 12px mute`, 숫자 mono |
| EvidenceImage(`.imgbox`) | 모서리 10 · 테두리 1 line · 바탕 canvas · 캡션 왼쪽 8 · 아래 6, mono 600 10.5 fg-2. 2:3 틀. `binary`는 CSS 필터 근사 |
| SoleThumb | `sm` 26×38 · `md` 30×44 · `lg` 38×56, 모서리 5, 테두리 1 line. 눌림 outline 2 brand offset 1 |
| PatternIcon(`.picon`) | 36(`sm` 28 · `lg` 48) · 모서리 6 · 테두리 1 line-3 · 바탕 `--t-picon-bg #f3f5f8`. 고름 outline 2 brand offset 1, AI outline 2 ai offset 1. 배지(필수 · 개수)가 없으면 static + `overflow-hidden`(시안과 같음), 있으면 `relative`(배지 기준) · 자르지 않음 |
| ZoneBands · CompareView · PointPairs | 시안에 직접 대응 요소가 없는 새 모양(값은 코드 + `viewer.md`) |
| AiProgress(`.fx-bar`) | 높이 4 · 모서리 3 · 바탕 line · 채움 `linear-gradient(90deg, brand-2, ai)`. `running`은 `brand-2, ai 40%, ai-shine 50%, ai 60%, brand-2` · `background-size 200% 100%` + `animate-fx-run`. `failed`는 채움 danger + 글자 「실패」(시안에 없음) |
| ConfidenceBar | flex · 간격 4 · 막대 높이 3 · 숫자 mono 9.5px(줄 높이는 부모에서 상속) · 평소 mute / 임계 미만 warn 채움 + 숫자 |
| ScanOverlay(`.fx-scan`) | 높이 2 · `top:100%` · 불투명 0 · ai · 그림자 `0 0 12px 3px ai-scan-glow` · absolute inset-x 0 · pointer-events none |
| LiveDot(`.fx-live`) | 7px 원 ai + 맥박. 부품은 점 옆에 11px muted 글자(기본 보임, `hideLabel`로 숨김) · idle은 속 빈 고리 |

## 입력 · 저장 · 오류

**결론: 입력 칸은 빈 칸 · 안내 글자 · 필수 · 확인 필요 · 읽기 전용 · 잠김 · 비활성 버튼까지 시안에 있다. 틀림 · 초점 · 저장 중 · 저장 실패는 시안에 없으므로 쓰기 전에 시안에 먼저 그린다.** 아래 값은 S01 · S02 · S13 시안에서 읽은 계산값(감정관 시점).

| 상태 | 시안 자리 | 모양(계산값) | 앱에서 |
|---|---|---|---|
| 빈 칸 | S01-11 문서번호 | Field 기본과 같음(글자 없음) | `Field` 그대로 |
| 안내 글자(찾을 것 예시) | S01-19 위 메뉴 검색 칸 「⌕ 감정번호·문서번호·화류번호 바로 찾기」 | 글자 dim `rgb(91,107,133)`, 나머지 Field 기본 | `Field variant="search-shell"` |
| 필수 | S02 등록 폼 라벨 `.l.req` | 라벨 뒤 `::after` 「 *」 danger `rgb(239,68,68)` — **칸이 아니라 라벨**에 붙음 | 라벨은 SearchForm(후보). 칸에는 `Field required`(`aria-required`만, 모양 없음) |
| 확인 필요(근거가 미덥지 않음) | S02-20 채취 방법 「기타」 | 테두리 warn-line `rgb(77,58,18)` + 칸 안 주황 칩 `amber-h18` 「확인 필요」 | `Field variant="select-warn" after={<Chip variant="amber-h18">…}` |
| 읽기 전용 값 | S02 사건정보 감정번호 · 문서번호 · 사건번호 | **칸 없이 글자만** — JetBrains Mono 12.5 · 글자 fg `rgb(229,233,240)` · 테두리 · 바탕 없음 | 글자로만 보여 준다(입력 칸을 회색으로 만들지 않음). `Field readOnly`는 `data-part-state="readonly"` 속성만 |
| 잠김(보는 사람 권한 밖) | S13 구분 · 소속 관서(관리자만 고침), S02-03 「수정」 | 불투명도 .3 · `grayscale(1)` · 누름 막힘(`pointer-events: none`), 나머지 모양은 그대로 | 공용 장치 없음(권한 판단은 `features`) — 쓸 때 이 값으로, 시안 `[data-lock]` 규칙 |
| 비활성 버튼 | S13 「잠기지 않음」 | 불투명도 .35 · 커서 not-allowed, 나머지 `sm`과 같음 | `Button locked`(`disabled` + `data-part-state="locked"`) |
| 틀림 | **시안에 없음** | 미정 | `Field invalid`는 `aria-invalid` + `data-part-state="invalid"` 속성만 — 테두리 색을 지어내지 않는다(판정 R19) |
| 초점(키보드로 들어감) | **입력 칸 초점은 시안에 없음**(시안 `.inp`는 글자 상자라 초점을 못 받음). 문서 전체에 `:focus-visible` 2px brand 테두리 · 2px 띄움 규칙은 있음 | 미정 | 브라우저 기본 초점 테두리 그대로 — 시안에 그린 뒤 옮긴다 |
| 저장 중 · 저장 실패 | **시안에 없음** | 미정 | 원칙만: 실패는 그 칸 · 줄에 남기고 「다시」 버튼(`SKILL.md` 상태 표시) |
| 키보드 이동(Enter · Tab) | **시안에 없음** | 미정 | 정할 때 시안 설명(주석)과 함께 승인받는다 |

읽는 법: 「앱에서」 열이 "미정"이거나 "시안에 없음"이면 그 모양을 코드에서 만들지 말고 시안에 먼저 그린다.

### 「모름」과 「없음」

- **모르는 것을 없다고 보여 주지 않는다.** 검색 결과 0건과 검색 실패는 다른 모양: 조회 실패 = 회색 「확인 못 함 · 시:분 · 다시」, 결과 없음 = 「결과 없음(조건 …)」. 근거가 없으면 「확인 필요」(위 표의 주황 칩).
- 값이 없는 칸은 빈칸 대신 「—」(시안 S01 목록에서 수동 등록 사건의 문서번호 · 사건번호).

## Tailwind로 옮길 때 함정 (대조에서 실제로 잡힌 것)

| 함정 | 증상 | 이렇게 |
|---|---|---|
| `leading-normal`은 1.5다 | 시안 `line-height: normal`과 다름(11.5px에서 17.25px) | `leading-[normal]` |
| `shadow-[…]`는 링 층이 여러 겹 붙는다 | `box-shadow` 계산값이 시안과 다름 | `[box-shadow:0_0_18px_0_var(--t-brand-glow)]`처럼 속성째 |
| Tailwind 기본 초기화(preflight)가 `span` · `h2`에 `border-style: solid` | 시안은 `none` | 부품에 `border-none` |
| 시안 `* { box-sizing: border-box }`는 `::before` · `::after`를 안 잡는다 | 모서리 장식이 2px 작아짐 | `before:box-content after:box-content` |
| `tailwind-merge`가 글자 크기 앞의 `leading-*`를 지운다 | 줄 높이가 사라짐 | `leading-*`를 글자 크기 클래스 **뒤**에 |
| 시안 인라인 높이 · 여백 · 위치 | 부품 값처럼 읽힘 | 놓이는 자리(배치)다 — 부품 props · `className`이 아니라 부모가 정한다. 반복되는 작은 차이만 변형 |
