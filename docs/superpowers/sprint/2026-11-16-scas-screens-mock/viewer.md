# viewer 갈래 노트 (Task 3) — 컨트롤러가 적용할 것

## 1. components.md 행 (상태 `구현됨`)

| 부품 | 출입구 | 파일 | 변형 / 상태 |
|---|---|---|---|
| EvidenceImage | viewer | `src/shared/ui/viewer/EvidenceImage.tsx` | 변형 `raw` · `binary` · `invert` · `contrast`(보기 방식) · 꼬리표 `tag` · cm 자 `ruler` · 캡션 |
| SoleThumb | viewer | `src/shared/ui/viewer/SoleThumb.tsx` | 변형 `sm`(26×38) · `md`(30×44) · `lg`(38×56) · 상태 `on`(aria-pressed) |
| PatternIcon | viewer | `src/shared/ui/viewer/PatternIcon.tsx` | 변형 `sm`(28) · `md`(36) · `lg`(48) · 상태 `sel` · `ai` · 필수 · 개수 |
| ZoneBands | viewer | `src/shared/ui/viewer/ZoneBands.tsx` | 띠 `top` · `mid` · `bottom`(확신도 없음, pointer-events-none) |
| CompareView | viewer | `src/shared/ui/viewer/CompareView.tsx` | 변형 `side` · `overlay` · `slide` |
| PointPairs | viewer | `src/shared/ui/viewer/PointPairs.tsx` | 변형 `crime` · `shoe`, 활성 박스 `data-active` |

가짜 그림(부품 아님, 개발 전용): `src/pages/dev/screens/mock-assets/{FakePhoto,FakeSole}.tsx` + `fake-art.tsx` · `svg-url.ts`. 함수 `fakePhotoUrl` · `fakeSoleUrl`(토큰 값을 읽어 굳힌 데이터 URL).

## 2. visual-spec 값(시안 mockup.css에서 읽음 · 대조는 안 돌림)
- `.imgbox`: radius 10, 테두리 1 line, 바탕 bg(#05080d 상당 → `bg-canvas`), `.cap` 왼쪽 8 · 아래 6, 글자 mono 600 10.5 fg2. 구현은 2:3 틀 + `object-cover`.
- `.picon`: 36 / sm 28 / lg 48, radius 6, 테두리 line-3, `sel` outline 2 brand offset 1, `ai` outline 2 ai offset 1.
- 밑창 썸네일 크기(시안 s01): 26×38 · 30×44, radius 5.
- 필수 · 개수 배지(PatternIcon)와 증거 꼬리표 · 자 눈금 모양은 시안에 직접 대응 요소가 없어 새로 정한 값(승인 필요).

## 3. 시안 표식 요청(`data-part-id`) — 현재 진열 id(제안)
| id | 부품 | 시안 자리 |
|---|---|---|
| S05-31 / S05-32 | EvidenceImage raw / binary | `screens/s05-search-result.js` 50줄 `.imgbox`(현장 사진) |
| S01-31 | SoleThumb md | `screens/s01-case-list.js` 81줄 `.imgbox` 30×44 |
| S04-31 / S04-32 | PatternIcon md(필수 · 개수) / sm sel | `screens/s04-pattern-code.js` 34줄 `picon(...)` · 90줄 |
| S04-33 | ZoneBands | `screens/s04-pattern-code.js` 상·중·하 띠 자리 |
| S06-31 / S06-32 | CompareView side / slide | `screens/s06-compare.js` 201줄 · 247줄 |
| S06-33 | PointPairs crime | `screens/s08-verify-approve.js` 94줄 photoMarks 근처 |
fixtures-viewer-meta.ts 의 id는 위와 같다. 시안 쪽에 표식이 없으면 비교 대상에서 빼거나 id를 바꿔 맞춘다. parts-plan.md(docs/mockups/…) 행 추가 필요.

## 4. 토큰 빈틈
- `.picon` 바탕 밝은 종이색(#f3f5f8 상당): 토큰 없음 → `bg-white`.
- 가짜 사진 바닥 갈색, 밑창 밝은 회색 등: 가장 가까운 토큰(`--t-faint`, `--t-fg`)으로 대체. 시안과 색이 다름.
- 증거 번호표 노란색 → `--t-warn`.
- 확인 요청: `border-line`/`text-mute` 같은 Tailwind 이름이 없어 `border-border` · `text-fg-2` 등으로 대신함.

## 5. 남은 차이 / 주의
- 부품 · 변형 · 대조 id · 남은 차이: 위 표(대조는 Task 5 이후).
- PointPairs · MatchBox: `@/entities/match` 타입 import 가 eslint boundaries 경고(shared→entities)를 낸다(오류 아님). 브리프 지시라 유지. 필요하면 타입을 shared 로 옮기는 결정 필요.
- EvidenceImage 는 `<img>`+CSS 필터라 `binary` 는 진짜 이진화가 아니라 근사. 시안은 별도 SVG.
