# 부품 목록 — 먼저 가져다 쓰는 부품

**결론: 화면을 만들거나 고칠 때 이 표에서 먼저 찾는다. 있으면 그 출입구에서 가져다 쓰고, 없으면 `SKILL.md` 「작업 순서」대로 시안에 먼저 그린 뒤 이 표에 한 줄을 더한다. 지금 시안 대조까지 끝난(검증됨) 부품은 Button · Chip · Field · Panel · ButtonBar · AiTag 6개다.**

이 표는 사람과 AI가 같이 읽고, 기계도 읽는다.
- `scripts/ui/check-parts-catalog.mjs`(`npm run check:ui`): 상태가 구현됨 · 검증됨인 행의 「파일」이 실제로 있는지, 출입구 4개(`src/shared/ui/{kit,viewer,ai,panel}/index.ts`)가 내보내는 모든 이름이 「부품」 열에 있는지 본다.
- `.claude/hooks/parts_gate.py`(부품표 관문): 부품표의 「그대로」 부품 이름이 「부품」 열에 있는지 본다.
- 그래서 **「부품」 칸에는 PascalCase 부품 이름 하나만** 적는다(`·` `,` `/`로 나누어 읽으므로 설명을 넣지 않는다). 「상태」 칸은 `후보` · `구현됨` · `검증됨` 중 정확히 하나. 「파일」은 저장소 루트 기준 경로.

읽는 법(아래 표 4개 공통):
- 「출입구」 = 가져올 곳(`@/shared/ui/<출입구>`). 「파일」 = 구현 파일(후보는 빈칸).
- 「원본(data-part)」 = r3 시안에서 이 부품을 그리는 클래스 · 그림 함수. 백틱 없는 괄호 설명은 시안에 클래스가 없는 자리(손으로 찾음). 구현 때 그 자리에 `data-part` 표식이 붙는다.
- 「쓰는 화면」 = 그 원본이 나오는 시안 화면(S00 로그인 … S15 모델 관리). 백틱 원본은 `node scripts/ui/count-part-usage.mjs`가 센 값(2026-11-13), 괄호 원본은 설계서 §7의 손 집계.
- 「변형」 = 승인된 다른 모양. 맨 앞 `[ ]`은 출처 — `[재내보내기]` shadcn 파일을 **손대지 않고 그대로** 다시 내보냄(생김새 = 원래 파일, 시안 대조 안 함) · `[기존]` 이 앱의 기존 자체 부품을 그대로 다시 내보냄 · `[새로]` 시안 값으로 새로 만든 부품 · `[감싸기 예정 …]` 후보 — 구현 때 그 shadcn 부품을 감쌀 계획. (설계서 §7은 Button · Field를 shadcn 감싸기로 예정했으나 시안 값을 맞추려고 새로 만들었다 — 기존 `button.tsx` · `input.tsx`는 그대로 있고 **kit의 Button · Field와 다른 부품**이다. 가져오기 경로만 `@/shared/ui/button` → `@/shared/ui/kit`으로 바꾸면 모양이 조용히 바뀌므로, 그 화면을 옮길 때만 바꾼다 — `SKILL.md` 「부품은 출입구 4개에서」.)
- 아래 표 밖의 작은 표들은 「부품」 열 이름을 쓰지 않는다(관문이 「부품」 열을 부품 이름으로 읽기 때문).
- 「상태」 = `후보`(시안에 있음, 코드 없음) → `구현됨`(코드 있음) → `검증됨`(시안 짝과 자동 대조 통과). 이 순서로만 올린다.

## kit — 어디서나 쓰는 기본 부품

| 부품 | 출입구 | 파일 | 원본(data-part) | 쓰는 화면 | 변형 | 상태 |
|---|---|---|---|---|---|---|
| Button | kit | `src/shared/ui/kit/Button.tsx` | `.btn` | S00–S15 | [새로] 크기 `sm` · `sm-h26` · `sm-h22`(+ `md`) × 색 `default` · `pri` · `ok` · `warn`(+ `ai` · `danger` · `ghost`) · 행 버튼 `row`(→ `sm-ok-row` · `sm-warn-row`) · 상태 `role-lock` · `locked` | 검증됨 |
| Chip | kit | `src/shared/ui/kit/Chip.tsx` | `.chip` · `.chip-ref` | S00–S15 | [새로] `blue` · `violet-h20` · `green-h18` · `h18` · `amber` · `amber-h18` · `amber-h19` · `h19` · `blue-h20` · `h20-warn` · `blue-mono-h20` · `h22` · 상태 `on` | 검증됨 |
| Field | kit | `src/shared/ui/kit/Field.tsx` | `.inp` | S00–S15 | [새로] `text` · `mono` · `mono-sm` · `mono-sm-flex` · `select` · `pick` · `select-mono` · `select-warn` · `search-shell` · 상태 `readonly` · `invalid`(모양 미정) | 검증됨 |
| Segmented | kit | | `.seg` | S01–S06 · S08–S10 · S13 · S14 | [감싸기 예정 toggle-group] 2~4칸 · 아이콘 | 후보 |
| RadioRow | kit | | `.radio` | S01 · S02 · S04 · S07 · S08 · S10 | [새로] SCAS ◉○ 한 줄 | 후보 |
| Combobox | kit | | (S02 관서 검색 한 칸) | S01 · S02 | [새로] 검색형 · 결과 경로 표시(「대구청 › 동부서」) — 관서 목록 조회는 `features`가 조립 | 후보 |
| StatusDot | kit | | `.dot` | S00 · S08 · S11 · S15 | [새로] ok · warn · danger · 꺼짐 | 후보 |
| StatusChip | kit | `src/shared/ui/status-chip.tsx` | (인라인 꼬리표) | 다수 | [기존] 기존 부품 재내보내기 — 시안 대조 안 함. 색 `blue` · `teal` · `amber` · `red` · `gray` | 구현됨 |
| Avatar | kit | | `.avatar` | S01–S15 | [새로] 이니셜 · 역할색 | 후보 |
| Tooltip | kit | `src/shared/ui/tooltip.tsx` | (시안 title 속성) | 다수 | [재내보내기] shadcn 파일 그대로 — 시안 대조 안 함 | 구현됨 |
| TooltipTrigger | kit | `src/shared/ui/tooltip.tsx` | (시안 title 속성) | 다수 | [재내보내기] shadcn 파일 그대로 — 시안 대조 안 함 | 구현됨 |
| TooltipContent | kit | `src/shared/ui/tooltip.tsx` | (시안 title 속성) | 다수 | [재내보내기] shadcn 파일 그대로 — 시안 대조 안 함 | 구현됨 |
| TooltipProvider | kit | `src/shared/ui/tooltip.tsx` | (시안 title 속성) | 다수 | [재내보내기] shadcn 파일 그대로 — 시안 대조 안 함 | 구현됨 |
| DataGrid | kit | | `.grid` | S01 · S02 · S04 · S07–S09 · S11–S15 | [새로] SCAS 열 순서 · 행 선택(`tr.sel`) · 새 행 강조(`tr.fx-new`) · 행 안 버튼 | 후보 |
| Pagination | kit | | (목록 아래 쪽수) | S01 · S05 · S10 | [새로] SCAS 「전체 n 중 a-b」 · 「더 보기」(S14) | 후보 |
| DialogShell | kit | | (레이어 팝업 머리 · 몸 · 발) | S02–S10 중 표식 때 확정 | [감싸기 예정 dialog] 1겹 · 큰 팝업(90%) | 후보 |
| Dialog | kit | `src/shared/ui/dialog.tsx` | — | 앱 기존 화면 | [재내보내기] shadcn 파일 그대로 — 시안 대조 안 함 | 구현됨 |
| DialogClose | kit | `src/shared/ui/dialog.tsx` | — | 앱 기존 화면 | [재내보내기] shadcn 파일 그대로 — 시안 대조 안 함 | 구현됨 |
| DialogContent | kit | `src/shared/ui/dialog.tsx` | — | 앱 기존 화면 | [재내보내기] shadcn 파일 그대로 — 시안 대조 안 함 | 구현됨 |
| DialogDescription | kit | `src/shared/ui/dialog.tsx` | — | 앱 기존 화면 | [재내보내기] shadcn 파일 그대로 — 시안 대조 안 함 | 구현됨 |
| DialogFooter | kit | `src/shared/ui/dialog.tsx` | — | 앱 기존 화면 | [재내보내기] shadcn 파일 그대로 — 시안 대조 안 함 | 구현됨 |
| DialogHeader | kit | `src/shared/ui/dialog.tsx` | — | 앱 기존 화면 | [재내보내기] shadcn 파일 그대로 — 시안 대조 안 함 | 구현됨 |
| DialogTitle | kit | `src/shared/ui/dialog.tsx` | — | 앱 기존 화면 | [재내보내기] shadcn 파일 그대로 — 시안 대조 안 함 | 구현됨 |
| DialogTrigger | kit | `src/shared/ui/dialog.tsx` | — | 앱 기존 화면 | [재내보내기] shadcn 파일 그대로 — 시안 대조 안 함 | 구현됨 |
| Tabs | kit | `src/shared/ui/tabs.tsx` | — | 앱 기존 화면 | [재내보내기] shadcn 파일 그대로 — 시안 대조 안 함 | 구현됨 |
| TabsContent | kit | `src/shared/ui/tabs.tsx` | — | 앱 기존 화면 | [재내보내기] shadcn 파일 그대로 — 시안 대조 안 함 | 구현됨 |
| TabsList | kit | `src/shared/ui/tabs.tsx` | — | 앱 기존 화면 | [재내보내기] shadcn 파일 그대로 — 시안 대조 안 함 | 구현됨 |
| TabsTrigger | kit | `src/shared/ui/tabs.tsx` | — | 앱 기존 화면 | [재내보내기] shadcn 파일 그대로 — 시안 대조 안 함 | 구현됨 |
| Checkbox | kit | `src/shared/ui/checkbox.tsx` | — | 앱 기존 화면 | [재내보내기] shadcn 파일 그대로 — 시안 대조 안 함 | 구현됨 |
| Label | kit | `src/shared/ui/label.tsx` | — | 앱 기존 화면 | [재내보내기] shadcn 파일 그대로 — 시안 대조 안 함 | 구현됨 |
| Switch | kit | `src/shared/ui/switch.tsx` | — | 앱 기존 화면 | [재내보내기] shadcn 파일 그대로 — 시안 대조 안 함 | 구현됨 |
| ToggleGroup | kit | `src/shared/ui/toggle-group.tsx` | — | 앱 기존 화면 | [재내보내기] shadcn 파일 그대로 — 시안 대조 안 함(시안 `.seg`는 Segmented 후보가 맡음) | 구현됨 |
| ToggleGroupItem | kit | `src/shared/ui/toggle-group.tsx` | — | 앱 기존 화면 | [재내보내기] shadcn 파일 그대로 — 시안 대조 안 함 | 구현됨 |
| InlineError | kit | | (S00 필드 아래 오류) | S00 | [새로] 필드 아래 한 줄 | 후보 |
| Banner | kit | | (S11 화면 위 고정 배너) | S11 | [새로] 화면 위 고정 | 후보 |
| LoadingImage | kit | `src/shared/ui/image-loading-overlay.tsx` | — | 앱 기존 화면 | [기존] 기존 부품 재내보내기 — 시안 대조 안 함. 표시용 — 래퍼를 만드므로 좌표 재는 캔버스류에 쓰지 말 것 | 구현됨 |
| ImageLoadingOverlay | kit | `src/shared/ui/image-loading-overlay.tsx` | — | 앱 기존 화면 | [기존] 기존 부품 재내보내기 — 시안 대조 안 함. 기존 `relative` 상자 안에 형제로 얹는 겹 | 구현됨 |
| TechCorners | kit | `src/shared/ui/tech-corners.tsx` | `.tc` | S00 · S01 · S08–S15 | [기존] 기존 부품 재내보내기 — 시안 대조 안 함. 네 모서리 L자(시안 `.panel.tc`는 두 모서리 — 그 모양은 Panel `tc` 변형이 재현) | 구현됨 |
| DotGrid | kit | `src/shared/ui/glow-fx.tsx` | `.content` | S01–S15 | [기존] 기존 부품 재내보내기 — 시안 대조 안 함. 시안은 `.content::before` 점 격자 | 구현됨 |
| GlowOrb | kit | `src/shared/ui/glow-fx.tsx` | `.content` | S01–S15 | [기존] 기존 부품 재내보내기 — 시안 대조 안 함. 시안은 `.content::after` 번짐 | 구현됨 |
| EdgeGlow | kit | `src/shared/ui/glow-fx.tsx` | `.topnav` | S01–S15 | [기존] 기존 부품 재내보내기 — 시안 대조 안 함. 시안은 `.topnav::after` 아래 빛줄 | 구현됨 |

## viewer — 족적 사진 표시(재지 않음)

| 부품 | 출입구 | 파일 | 원본(data-part) | 쓰는 화면 | 변형 | 상태 |
|---|---|---|---|---|---|---|
| EvidenceImage | viewer | | `M.photo` · `.imgbox` | S01–S11 | [새로] 보기 방식 원본 · 이진화 · 반전 · 대비 · 증거 꼬리표 · cm 자 · 2:3 틀(**캔버스 화면 제외** — `layout.md`) | 후보 |
| SoleThumb | viewer | | `M.sole` | S00–S03 · S05–S11 | [새로] 크기 · 선택 테 | 후보 |
| PatternIcon | viewer | | `M.picon` · `.picon` | S00 · S04 · S06 · S10 · S11 · S15 | [새로] 크기(`sm` 28 · 기본 36 · `lg` 48) · 필수 표시 · 개수 · 고름(`sel`) · AI(`ai`) | 후보 |
| ZoneBands | viewer | | (S04 상 · 중 · 하 띠) | S04 · S05 · S06 | [새로] 띠별 확신도 | 후보 |
| CompareView | viewer | | (S03 뷰어 B · S06 · S08 나란히 보기) | S03 · S06 · S07 · S08 | [새로] 나란히 · 겹쳐 · 밀어서 | 후보 |
| PointPairs | viewer | | (대응점 표시 그림) | S00 · S06 · S08 | [새로] 점 · 선 · 번호(그림만 — 편집은 화면에서) | 후보 |
| HeatOverlay | viewer | | (유사 부위 히트 그림) | S00 · S05 · S06 · S07 | [새로] 투명도 | 후보 |

공용화 보류(목록에 올리지 않음): 확대경(Loupe) · 십자선(Crosshair) · 자르기 틀(CropFrame) · 회전 손잡이(RotateHandle) · 미니맵(Minimap) — S03에만 있고 좌표를 다루므로 필요한 화면에서 좌표 계약을 확인한 뒤 추출한다(`layout.md`).

## ai — AI가 했다 · 하는 중 · 얼마나 확신하나

| 부품 | 출입구 | 파일 | 원본(data-part) | 쓰는 화면 | 변형 | 상태 |
|---|---|---|---|---|---|---|
| AiTag | ai | `src/shared/ui/ai/AiTag.tsx` | `.ai-tag` · `.ai-mark` | S00–S02 · S04–S12 · S15 | [새로] `default`(「AI」 · 「AI 추천」 …) · `progress`(맥박 점 + 「AI 7/12」) · `done`(「AI✓」) | 검증됨 |
| AiProgress | ai | | `.fx-bar` | S01 · S02 · S04–S12 | [새로] 진행 · 끝 · 실패 · 반짝임(`.run`) | 후보 |
| ScanOverlay | ai | | `.fx-scan` | S01–S07 · S10 · S11 | [새로] 사진 위 훑기 | 후보 |
| LiveDot | ai | | `.fx-live` | S01–S06 · S08 · S10 · S11 · S14 · S15 | [새로] 처리 중 · 대기 | 후보 |
| ConfidenceBar | ai | | (확신도 · 유사도 막대) | S04 · S05 · S06 · S15 | [새로] 0~1 · 0~100% · 임계선(`retrieval-results-grid`의 막대를 분리) | 후보 |
| StatTile | ai | | `.stat` | S01 · S09 · S11–S14 | [새로] 숫자 · 단위 · 빛 | 후보 |
| CheckList | ai | | `.check` | S02 · S07 · S08 · S11 · S14 · S15 | [새로] ok · warn · bad · 줄 버튼 | 후보 |
| AiSuggestion | ai | | (S02 채취 방법 제안 · S03 AI 제안) | S02 · S03 · S04 · S09 | [새로] 제안 + 근거 + 「적용」 | 후보 |
| AiFill | ai | | `.ai-fill` | S09 | [새로] AI가 채운 칸 | 후보 |

## panel — SCAS 틀의 배치 껍데기

| 부품 | 출입구 | 파일 | 원본(data-part) | 쓰는 화면 | 변형 | 상태 |
|---|---|---|---|---|---|---|
| Panel | panel | `src/shared/ui/panel/Panel.tsx` | `.panel` · `.panel-h` · `.panel-b` | S00–S15 | [새로] `default` · `tc`(모서리 장식, `corners`) · `default-pad` · 머리(제목 · 라벨 · 오른쪽 `actions`) | 검증됨 |
| ButtonBar | panel | `src/shared/ui/panel/ButtonBar.tsx` | `.panel-h .r` | S00 · S01 · S06–S15 (+ S02 모달 머리 — 표식 `S02-23`) | [새로] `panel-head` · `modal-head` · SCAS 순서 고정(이전 · 다음 · … · 닫기) | 검증됨 |
| ScasShell | panel | | `M.shell` | S01–S15 | [새로] 위 메뉴 · 탭 줄 · 현재 탭 · 왼쪽 메뉴(`M.scasShell`은 SCAS 비교용이라 원본 아님) — 전환은 검증 후 한 번에 | 후보 |
| SearchForm | panel | | `.form` | S01 · S02 · S04 · S05 · S10 · S11 · S13 | [새로] 라벨-값 2열 · 3열 · 조회 · 초기화 · 필수 라벨(`.l.req`) | 후보 |
| Stepper | panel | | `.stepper` | S01 (+ S07 · S08 흐름 띠는 표식 때 확인) | [새로] 지금 칸 강조 | 후보 |
| Crumb | panel | | `.crumb` | S00 · S06–S15 | [새로] — | 후보 |
| PageHead | panel | | `.page-head` | S06–S08 · S10–S15 | [새로] — | 후보 |

부품이 아닌 것(시안 설명 장치): `.pin` · `.pinbox` · `.notes` · `.fit*` · `.scas-pain` · `.toc` · `.frame` · `.viewport` · `M.pin` · `M.apin` · `M.scasShell` · 「보는 사람」 토글. 대조 때 시안 쪽에서 `.pin`을 떼고 `.pinbox` 클래스를 뗀 뒤 읽는다.

업무가 섞여 목록에 올리지 않는 것: `src/shared/ui/retrieval-results-grid.tsx`(신발 ID · 서버 응답 모양 · 점수 정규화 · 0.8/0.6 등급 판정 · 「필수 문양 조정」 문구) → `entities/shoe/ui`로 옮기고 격자 · 막대만 `kit` · `ai`로 분리할 대상. 출입구에 넣지 않는다.

## 같은 부품인데 값이 다른 자리 · 확인 못 한 것

**결론: 시안 안의 작은 차이는 변형으로 보존했다(설계서 §14-2). 사용자가 통일을 원하면 아래 목록으로 한 번에 정한다. 대조하지 못한 자리는 이유와 함께 남긴다.** 변형별 실제 값은 `visual-spec.md`.

### 값이 다른 자리(변형으로 보존)

- **Button**: 같은 `.btn.sm`이 높이 24(기본) · 26(`sm-h26`, S01 검색 폼 「검색」) · 22(`sm-h22`, S02 「적용」), 좌우 안쪽 여백 8(기본) · 6(행 버튼 `row`). 표 안 행 버튼은 줄 높이 `normal`(부모에서 물려받음).
- **Chip**: 높이 22(기본 · `blue` · `amber` · `h22`) · 20(`violet-h20` · `blue-h20` · `h20-warn` · `blue-mono-h20`) · 19(`amber-h19` · `h19`) · 18(`green-h18` · `h18` · `amber-h18`), 글자 11.5 · 10.5(`amber-h18`) · 10(`h18` · `green-h18` · `amber-h19` · `h19`). 「확인 필요」 칩은 자리마다 왼쪽 바깥 여백만 다르다(배치).
- **Field**: `.inp.w100`에 인라인 mono 글꼴(`select-mono`) · 주황 테두리(`select-warn`) · 글자 11.5(`mono-sm` · `select-mono`)가 덧씌워진 3종. 위 메뉴 검색 칸은 폭 260 고정(`search-shell`).
- **AiTag**: S01 표 안 두 개(`progress` · `done`)는 높이 15 · 좌우 4 · 글자 9 · 배경 `#0b2a26`(토큰 `--t-ai-bg-deep`)로 기본(17 · 6 · 9.5 · `--t-ai-bg`)과 다르다. `done`은 `progress`와 위치만 다르다(left 12 vs 4 — 배치).
- **Panel**: 높이 · 바깥 여백 인라인은 배치로 보고 변형으로 나누지 않았다. 안쪽 여백만 다른 자리(`padding: 50px 14px 0`)를 `default-pad`로.
- **ButtonBar**: `panel-head`의 왼쪽 안쪽 여백 14(`pl-[14px]`)는 시안에서 주석 핀 자리를 비우려고 넣은 인라인 값일 수 있다 — 부품 값으로 옮겨 두었고 최종 검토에서 판단할 것.
- **TechCorners**(기존): 네 모서리 L자. 시안 `.panel.tc`는 왼쪽 위 · 오른쪽 아래 두 모서리라 모양이 다르다 — 시안 모양은 Panel `tc`.

### 픽스처가 없어 대조하지 못한 것

| 부품 · 변형 | 이유 |
|---|---|
| Button `sm-indigo-row` | 시안 코드에는 있으나 S01 데이터상 한 번도 그려지지 않음(번호 `S01-05` 비어 있음). 변형도 안 만듦 |
| Button `md` · `ai` · `danger` · `ghost`, 진짜 잠김(`locked`, 불투명도 .35) | S01 · S02에 쓰인 자리 없음. 시안 CSS 값을 옮겼고 단위 테스트로만 확인 |
| Button `role-lock`(S02-03) | 감정관 시점에서는 잠기지 않아 값이 `sm`과 같음 — 잠긴 모양(보는 사람이 다를 때)은 미대조 |
| Chip `ref` · `ref-voice`(`.chip-ref`) | 화면 틀(`.frame`) 밖 문서 머리, 번호 없음. 변형도 안 만듦 |
| Chip `h22`(S02-11) | 기술책임자에게만 보임(감정관 시점에서 숨김). 값은 기본 22와 같음 |
| AiTag `.ai-mark` | S01 · S02에 쓰인 자리 없음. 변형으로 안 넣음 |
| Panel 머리 라벨(`label`, 시안 `.panel-h .lbl`) | S01 · S02에 쓰인 자리 없음. 시안 글꼴 줄임말이 줄 높이를 `normal`로 되돌리므로 `leading-[normal]`이 필요할 가능성 — 미확인 |
| Panel `default` 대표 S01-14 | 안쪽(폼 + 통계)이 너무 커서 진열하지 않음. `default`는 S02-17이 대표 |

### 픽셀 대조를 뺀 자리(계산값 대조는 함)

| 짝 번호 | 부품 · 변형 | 이유 |
|---|---|---|
| S01-19 | Field `search-shell` | 돋보기가 시안은 글자 ⌕, 부품은 lucide `Search` 아이콘 — 일부러 다르게 함 |
| S02-15 | Field `mono-sm-flex` | 입력칸 글자 세로 반올림 차이(시안 소수 위치 y=.47), 차이 156픽셀이 글자 줄에만 있음 |
| S02-20 | Field `select-warn` | 픽셀 대조는 하되 1픽셀 허용(칩 앞 공백 위치 반올림) |
| S02-17 · S02-18 | Panel `default` · `default-pad` | 시안 요소가 불투명도 .3 틀 · 반투명 덮개 아래라 촬영에 비침 |
| S01-15 | Panel `tc` | 안쪽 표(14행 · 그림)를 재현하지 않음 |
| S01-16 | ButtonBar `panel-head` | 안쪽 라디오 · 분할 조각을 재현하지 않음 |
| S02-23 | ButtonBar `modal-head` | 시안 바탕이 모달 머리 전체의 가로 그라데이션 |
| S01-17 · S01-18 | AiTag `progress` · `done` | 표 칸 밖으로 튀어나온 표식이라 모서리 뒤 그림 · 다음 행 덮임이 비침 |

### 대조 방식이 기본과 다른 짝

- Field 9개 전부 `compare: "control"` — 시안은 `<span>`에 글자를 직접 쓰고 부품은 `<input>`이라, 루트 태그만 같게 보고 앱 쪽 `<input>` · 돋보기 `<svg>`를 빼고 나머지(캐럿 · 칩 · 가상요소)를 비교.
- Panel S01-15는 `shell-head`(루트 + 머리 + 머리 첫 자식 제목만, 안쪽 제외, 높이 제외), ButtonBar S01-16 · S02-23은 `shell`(루트 + 가상요소만, S01-16은 폭 · 높이 제외).
- AiTag S01-17 · S01-18은 `ignorePlacement` — 루트의 `position` · `top` · `right` · `bottom` · `left`만 제외(시안 인라인 절대 위치 = 화면 배치).

### 아직 시안에 없는 상태(쓰기 전에 시안에 먼저 그림)

- Field 틀림(`invalid`) · 초점(focus) 모양 — 지금은 속성(`aria-invalid` · `data-part-state`)과 브라우저 기본 초점 테두리만.
- 마우스 올림 · 누름 · 키보드 초점 상태별 대조는 아직 자동 대조에 없다(다음 단계).
