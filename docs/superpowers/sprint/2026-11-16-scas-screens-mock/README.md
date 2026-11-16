# 11개 화면 시안(가짜 데이터) 스프린트 노트

- 계획: `docs/superpowers/plans/2026-11-16-scas-screens-mock.md` · 설계서: `docs/superpowers/specs/2026-11-16-scas-screens-mock-design.md`
- 진열 주소(개발 실행 전용, 포트 5210): `/dev`(목차) · `/dev/s00` … `/dev/s14`(11개). `?case=ready|loading|error|empty` · `?as=admin|investigator|readonly`.
- 갈래 작업은 공유 파일(`parts-plan.md` · 출입구 `index.ts` · `components.md` · `App.jsx` · `index.css`)을 직접 고치지 않고, 이 폴더에 `<갈래>.md` 노트로 요청을 적는다(spec §9-2).

## 요청 노트 목록

`kit.md` · `viewer.md` · `ai.md` — 모두 부품 잠금(Task 5)에서 반영 끝.

## 부품 잠금 결과 (Task 5)

화면 갈래는 부품 23개를 아래 상태로 가져다 쓴다. 새 공용 부품은 잠금 뒤 추가하지 않는다(필요하면 멈추고 사용자에게). 자세한 값은 `references/components.md`(상태 · 「잠금 때 대조한 것 · 못 한 것」) · `visual-spec.md` · `tokens.md` · `motion.md`.

**상태** — 검증됨(시안 짝 대조 통과): Segmented · Avatar · SoleThumb(루트 계산값만) · AiProgress · PatternIcon(기본 · 고름 `sel`; AI 변형은 대조 짝 없음) · ConfidenceBar. 구현됨(대조 못 함 · 실패): RadioRow · LiveDot · Combobox · StatusDot · DataGrid · Pagination · DialogShell · InlineError · EvidenceImage · ZoneBands · CompareView · PointPairs · ScanOverlay, 그리고 panel 4개(ScasShell · SearchForm · Crumb · PageHead — 이번 잠금 대상 아님). 검증됨 6개는 계산값 + 스크린샷 0픽셀(SoleThumb는 계산값만, 안쪽 그림이 시안 SVG라서).

**남은 차이 (화면에서 알고 쓸 것)** — `ignorePlacement`는 AiTag S01-17 · 18만, `ignoreTags` 짝은 S01-71 · 22 · 23 · 31 · S04-34.
- RadioRow: 칸이 button + aria-hidden ◉○ 글자(시안은 span `::before`) — 모양은 같고 구조만 다름.
- LiveDot: 점 + 보이는 글자 래퍼. 점만 필요하면 `hideLabel`(래퍼는 남음).
- PatternIcon 고름(`selected`) · AI: 색 테 + 그림 대체글(`alt`「이름 선택됨」 · 「이름 AI 제안」). 필수 · 개수 배지는 시안에 없는 새 모양(배지가 있을 때만 `relative`, `overflow-hidden` 안 씀).
- DialogShell: 화면 덮개라 진열 상자에 못 넣어 픽셀 대조 생략. 기본 폭 720은 임시값.
- EvidenceImage · CompareView · SoleThumb 안쪽 그림은 가짜 그림(`mock-assets`)이라 시안 SVG와 다름. EvidenceImage `binary`는 CSS 필터 근사.
- DataGrid: `tr.fx-new` 새 행 강조 · 행 안 버튼 스타일 없음. Pagination: 「더 보기」(S14) · « » 이동 없음. Segmented 크기 변형 없음(시안 `padding:2px` 같은 인라인은 화면이 `className`으로). Avatar 28 고정(S13 44 미지원).
- 대조 도구 변경: `tests/ui/style-read.ts`가 두께 0 테두리의 종류를 `none`으로 통일하고 `ignoreTags`(접근성 때문에 button · div로 그린 부품은 태그만 통일)를 더함. 픽스처 `noMockup`(시안 짝 없음 · 대조 실패 이유)은 진열에는 나오고 대조에서만 빠진다.

**의도적 차이(되돌리지 말 것)** — LiveDot 글자 기본 보임(`hideLabel` 끔) · ConfidenceBar `low`(aria-valuetext)와 PatternIcon 고름/AI(alt)는 읽는 단서만(시안에 보이는 표식 없음) · Combobox는 blur 때 확정 안 한 입력 버림 · RadioRow `name`은 묶음 `aria-label`.

**더한 토큰 · 키프레임(`src/index.css`)** — 값 토큰: `--t-ai-scan-glow`(ScanOverlay 번짐) · `--t-ai-shine`(AiProgress 반짝임 띠) · `--t-picon-bg`(`bg-picon`, PatternIcon 바탕). 키프레임: `fx-scan` · `fx-fill` · `fx-shimmer` + 애니메이션 `animate-fx-scan` · `animate-fx-fill` · `animate-fx-run`(= fx-fill + fx-shimmer 동시). 기존 토큰 값은 바꾸지 않음. 대신 쓰던 근사(AiProgress 띠 없음, ScanOverlay `--t-ai-pulse`, PatternIcon `bg-white`)는 정확한 값으로 교체.

**그 밖의 반영** — ScasShell 사용자 이니셜을 kit `Avatar`로 교체. ConfidenceBar의 sr-only 「낮음」 글자를 막대의 `aria-valuetext`로 옮김(`low`면 「0.42 낮음」, 아니면 숫자만). PatternIcon의 sr-only 글자는 이미지 `alt`로 옮김. `parts-plan.md`(진열)에 화면 진열 페이지 S00–S14용 「그대로」 행 23개 추가. 시안 표식(`data-part-id`) 추가: S01-21 · 22 · 23 · 31 · 71 · 73 · 76, S04-31 · 32 · 34(RadioRow S01-76 · LiveDot S01-21은 대조 실패로 `noMockup`). 갈래 노트의 id가 겹쳐(S04-31) ConfidenceBar를 S04-34로 바꿈.
