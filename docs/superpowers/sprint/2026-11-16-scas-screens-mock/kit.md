# kit 갈래 노트 (Task 2) — 컨트롤러가 적용할 것

공유 파일은 건드리지 않았다. 아래를 merge 때 반영한다. 계산값은 시안 CSS(`mockup.css`)에서 읽은 값이며 브라우저 측정·픽셀 대조는 하지 않았다(Task 5).

## 1. components.md 행 (상태 → `구현됨`, 대조 전이라 검증됨 아님)

| 부품 | 파일 | 변형 열에 쓸 말 |
|---|---|---|
| Segmented | `src/shared/ui/kit/Segmented.tsx` | [새로] 기본 · `scas`(밝은 눌림). 눌린 칸 `aria-pressed`. toggle-group은 감싸지 않음(radio 역할이라 시안 선택자 `aria-pressed`와 다름) |
| RadioRow | `src/shared/ui/kit/RadioRow.tsx` | [새로] ◉○ 한 줄 · 상태 `disabled` |
| Combobox | `src/shared/ui/kit/Combobox.tsx` | [새로] 검색형 한 칸 · 결과에 경로 · 방향키/Enter. 내부는 Field `pick` 재사용 |
| StatusDot | `src/shared/ui/kit/StatusDot.tsx` | [새로] 변형 `ok` · `warn` · `danger` · `off`(글자 필수) |
| Avatar | `src/shared/ui/kit/Avatar.tsx` | [새로] 기본 · `blue` · `teal` · `violet` · `amber`. 크기는 28 고정(S13의 44는 미지원) |
| DataGrid | `src/shared/ui/kit/DataGrid.tsx` | [새로] 열 정의 · 선택 행(`aria-selected`) · 빈 목록 문구. `tr.fx-new`는 아직 없음(움직임 부품 쪽) |
| Pagination | `src/shared/ui/kit/Pagination.tsx` | [새로] 「전체 n 중 a-b」 / total 없으면 「a-b」. 「더 보기」(S14)·« » 처음/끝 이동은 없음 |
| DialogShell | `src/shared/ui/kit/DialogShell.tsx` | [새로] 기본 · `large`(폭 90%). shadcn dialog 감쌈 |
| InlineError | `src/shared/ui/kit/InlineError.tsx` | [새로] 회색 「확인 못 함 · 시:분 · 다시」 |

## 2. visual-spec.md 에 넣을 값 (시안 CSS에서 읽음)

- Segmented(`.seg`): 바깥 inline-flex · 안쪽 3 · 간격 2 · 테두리 1px line · 모서리 8 · 바탕 bg2(`--background`). 칸: 좌우 12 · 상하 5 · 모서리 6 · 글자 12.5 mute. 눌림: 바탕 brand-bg · 글자 fg · 안쪽 선 1px brand-line. `scas` 눌림: 시안 바탕 `#e9ecf3` · 글자 `#1f2a5a`(토큰 없음).
- RadioRow(`.radio`): 간격 가로 10 · 세로 2 · 글자 mute, 선택 fg. 선택 「◉ 」 brand, 미선택 「○ 」 faint.
- StatusDot(`.dot`): 7×7 원 · currentColor · 빛 `0 0 6px currentColor`. 부품은 뒤에 글자 12px(fg-2) · 간격 6. 톤색 ok/warn/danger, off = faint.
- Avatar(`.avatar`): 28×28 원 · 바탕 panel-3 · 글자 fg-2 12px 600.
- DataGrid(`.grid`): 글자 12.5. th 높이 34 · 좌우 10 · 11.5 600 mute · 바탕 strip · 아래 1px line · nowrap. td 높이 44 · 좌우 10 · 아래 1px line-2 · fg-2 · nowrap(`wrap`: 높이 auto · 상하 8 · 줄 1.4). 선택 행: 바탕 brand-bg + 첫 칸 안쪽 왼쪽 3px brand. 마우스 올림 바탕 시안 `#0e1726` → panel-2.
- Pagination: 시안 S01 인라인(`padding:10px 14px; font-size:12px; color:mute; justify-between`), 오른쪽 숫자는 mono.
- DialogShell: 시안 S02 `modal` — 테두리 1px brand-line · 모서리 12 · 바탕 panel · 그림자 `0 24px 70px rgba(0,0,0,.7)`. 머리 높이 42 · 좌 14 우 10 · 간격 8 · 아래 1px brand-line · 제목 13.5 bold · 바탕 그라데이션 `#132445 → #0e1a30`.
- InlineError: 글자 12px mute, 시각은 mono, 「다시」 brand.

## 3. 시안 `data-part-id` 표시 요청 (fixtures-kit-meta.ts 의 id 와 같게)

| id | 화면 · 자리 | 부품 · 변형 |
|---|---|---|
| S01-71 | s01-case-list.js:132 「목록보기/문양보기」 `.radio` — 단 Segmented가 아니라 RadioRow 후보. 진짜 `.seg`가 있는 자리(S03 보기 방식 등)에 달 것 | Segmented |
| S01-72 | `.seg .is-scas` 쓰는 자리 | Segmented `scas` |
| S02-71 | s02-case-detail.js:23 `radio()` 반환 `.radio` | RadioRow |
| S02-72 | S02 관서 검색 한 칸 | Combobox |
| S11-71 / S11-72 | S11 상태 `.chip` 안 `.dot`(블루)·S15 운영 중 | StatusDot ok/danger — 시안 `.dot`은 칩 안 점이라 글자 분리 모양이 다름. 대조 전 정할 것 |
| S01-73 | `.topnav .who .avatar` | Avatar |
| S01-74 | S01 목록 `table.grid` | DataGrid |
| S01-75 | s01-case-list.js:152 쪽수 줄 | Pagination |
| S00-71 | S00 필드 아래 오류(현재 시안에 없음 — 그려야 함) | InlineError |
| (진열 안 함) | DialogShell | S02 `modal` — 화면 덮개라 진열 상자에 못 넣음. 대조는 별도 방법 필요 |

id는 다른 갈래와 겹치지 않게 7x 번대로 뒀다. 바꿔도 되나 meta·render·시안을 같이 바꿀 것.

## 4. 토큰 빈틈 (hex를 새로 쓰지 않고 가장 가까운 토큰으로 대신함)

- Segmented `scas` 눌림: `#e9ecf3`/`#1f2a5a` → `bg-fg`/`text-panel`.
- DataGrid hover `#0e1726` → `bg-panel-2`(`#0f1826`).
- DialogShell 머리 그라데이션 → 단색 `bg-brand-bg`; 그림자 .7 → `--t-panel-drop`(.35). 오버레이는 기존 `dialog.tsx`의 hex(`#03060C`/75)가 그대로 남음 — 기존 파일이라 손대지 않음.

## 5. 부품 · 변형 · 대조 id · 남은 차이

- 위 표의 id는 모두 **시안 표식 전**이라 parts-compare 짝이 아직 없다. fixtures-kit* 는 병합용으로만 두었고 fixtures.tsx/meta.ts에 합치는 것은 컨트롤러 몫(`...KIT_PART_FIXTURES`, `...KIT_FIXTURE_RENDERS`). 표식이 시안에 달리기 전에 합치면 Task 5 대조가 짝 없음으로 실패한다 — 표식 후 합칠 것.
- DataGrid: `fx-new` 행, 행 안 버튼 전용 스타일은 없음(셀 안 버튼은 클릭이 행 콜백을 막지 않도록만 처리).
- Pagination: S14 「더 보기」, « » 이동 없음. S01 시안은 「페이지 1 / 9」 입력형이므로 대조 시 모양 차이 예상.
- DialogShell 기본 폭 720은 임시값(시안 모달 폭 1180 · 1190이 화면마다 다름).
- 승인 줄은 이미 있고 `check:ui:static`는 통과(components.md에 이름이 후보 행으로 이미 있었음).
