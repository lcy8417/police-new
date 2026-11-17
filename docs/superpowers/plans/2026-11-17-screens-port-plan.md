# 화면 이식 계획 — 확정 시안을 실제 앱 라우트로 (2026-11-17)

> **한 줄 요약**: 시안 위젯은 이미 「값만 받아 그리는(제어형)」 모양이라 **위젯은 거의 그대로 두고**, 진열 페이지(`pages/dev/screens/**`)가 하던 「가짜 값 조립」을 **새 실제 페이지 + `entities/*/api` 쿼리 + `features/*` 뮤테이션**으로 바꾼다. 같은 저장소(`police-new`)에서 시안 브랜치를 그대로 이어받아(빨리 감기 가능) 새 라우트 `/cases`를 옛 라우트와 **나란히** 세우고, 서버 B 단계 묶음 ①~⑤가 끝나는 순서대로 옛 라우트를 넘겨주기(리다이렉트)로 바꾼다.

- 상태: **초안 — 사용자 검토 전**(코드 구현 없음)
- 서버 짝 문서(정본 API): `police-server/docs/superpowers/specs/2026-11-17-pilot-b-stage-api-design.md`(아래 「서버 §」, API 번호 A1 · D1 … 는 그 문서 §4)
- 시안 결정: `docs/superpowers/specs/2026-11-17-case-window-decisions.md`(「결정 §」), 가중치 `2026-11-17-pattern-weight-rule-design.md`, 후속 `2026-11-17-backend-followups.md`(B1~B21), 검수 `2026-11-17-review-log.md`
- 프론트 계약(바꾸지 않음): `docs/api-communication.md`(두 계층 · `backendFetch` · KST), `docs/pattern-data-model.md`(튜플 · 이름 기준), `docs/architecture.md`(FSD 단방향), 디자인 정본 `.claude/skills/police-ui-design/`

표시: 「제안」 = 근거 문서에 없는 이 계획의 판단 / 「사용자 확인 필요」 = 정해야 진행 가능.

---

## 0. 방식 — 어느 브랜치에서, 무엇을 남기고 무엇을 새로

**결론: 시안 브랜치를 기반으로 새 갈래를 만들고, 진열 페이지는 지우지 않고(개발 실행 전용 회귀 진열로) 실제 페이지를 따로 만든다.**

| 질문 | 판단 | 까닭 |
|---|---|---|
| 어느 브랜치에서 | `feat/scas-screens-mock`(지금 시안) 끝에서 새 갈래 `feat/screens-port`(새 worktree — 제안). 시안 브랜치는 시안 고침 전용으로 둔다 | 시안 브랜치 = 운영 앱(`police-new` `feat/pilot-db-a`, `a8c93d6`) + 시안 커밋 201개라 **그대로 빨리 감기**로 합칠 수 있다(갈라진 곳 없음 — `git merge-base` 확인). 위젯 · 공용 부품(`shared/ui/{kit,viewer,ai,panel}`)이 이미 있다 |
| 진열 페이지(`/dev/s00`~`/dev/s14`) | **남긴다**(`import.meta.env.DEV`일 때만 번들 — 지금 그대로). 가짜 값은 진열 페이지 안에만 | 위젯 모양 회귀 · 시각 검사(`check:ui:visual`) · 매뉴얼 초안 캡처의 기준으로 계속 쓴다 |
| 실제 페이지 | 새 `pages/cases`(사건관리 목록 + 사건 창), `pages/manage-users` · `pages/manage-logs` · `pages/login`은 **안의 위젯만 바꿈** | 진열 페이지 코드를 복사해 고치지 않는다 — 진열 페이지의 상태 · 가짜 계산(`frame/work-memory.ts`, `s01/case-live.ts`)은 서버가 대신한다(서버 B17) |
| 옛 화면 | 넘겨주기 전까지 **그대로 동작**(서버도 옛 API를 그대로 둠 — 서버 §4 「기존」) | 실증 중 어느 묶음이 늦어도 옛 길로 일할 수 있게 |
| `+α`(`data-plus`, `showPlus`) | 실제 페이지는 **서버 값이 있는 것만 켠다**. 위젯별로 `showPlus` 대신 개별 값(있으면 그림 · 없으면 안 그림)으로 넘긴다 — 진열의 「전부 켬/끔」 스위치는 진열 전용 | 결정 §2 「목록에 AI 표식 · 펼침 요약 없음」 등 이미 뺀 것은 다시 켜지 않는다 |

---

## 1. 라우트 · 페이지 대응표

**결론: 남색 위 막대 한 줄 틀(`ScasShell`) 아래 `/cases` 하나가 사건 업무 전부(목록 + 사건 창 6탭 + 신발 DB 패널)를 맡고, 옛 `/search*` · `/crimeRegister` · `/shoesRepository*` · `/edit` · `/editormode`는 묶음이 끝나는 대로 `/cases`의 주소 상태로 넘겨준다.**

지금 라우트는 `src/App.jsx`(레거시 위치 — `docs/architecture.md` §4). 주소 상태는 시안 규약 그대로(`s01/case-window-query.ts`): `?open=<감정번호>&img=<n>&tab=<info|edit|pattern|search|compare|confirm>&tabs=<열린 감정번호들>` + 창 안 문맥 `ftwr` · `rank` · `run`, 신발 패널 `?shoe=1`(+ `ftwr=`).

| 지금(실제 앱) | 화면 | 시안 | 판정 | 언제(묶음 — §4) |
|---|---|---|---|---|
| 셸 `widgets/app-shell`(`AppShell` = TopNav + Sidebar) | 앱 틀 | `shared/ui/panel/ScasShell`(위 막대 한 줄 · 사이드바 없음, 결정 §1) | **바꾸기** — 새 라우트는 `ScasShell`, 옛 라우트는 넘겨주기 전까지 `AppShell` 유지(두 틀 공존). 마지막 묶음 뒤 `AppShell` · `Sidebar` · `nav-items` 없앰 | ⓪ 세움 · ⑤ 뒤 정리 |
| `/` → `FirstAllowedRedirect` | 첫 화면 | — | **바꾸기** — `firstAllowedPath`(`features/auth/model/feature-routes.ts`)가 `CASE_STATUS_VIEW` · `CRIME_SEARCH`면 `/cases` | ⓪ |
| `/login` (`pages/login`) | S00 로그인 | `widgets/login-screen` | **바꾸기**(페이지 안 위젯 교체). 「지난 로그인」 줄은 로그인 뒤로 옮기거나 숨김(B11 — 서버는 로그인 전 값을 주지 않음) | ⓪ |
| `/password` | 비밀번호 변경 | — | 그대로 | — |
| (없음) | S01 사건관리 목록 + 사건 창 | `widgets/case-list` · `widgets/case-window` · `shared/ui/panel/window` | **새로** `/cases`(`pages/cases`) | ⓪ 목록 · 창 틀 · 사건 정보 탭 |
| `/crimeRegister` (`pages/crime-register` + `widgets/crime-register-stage`) | 사건 등록 | `widgets/case-detail` 등록 모드(S02 `mode="register"`) | **바꾸기** — `/cases?new=1`(목록 「+ 등록」과 같은 창). 옛 주소는 넘겨주기 | ② |
| `/search`, `/search/:aprthngNo` (`pages/crime-search` 통합 커맨드센터) | 사건 상세 · 문양 · 검색 | 사건 창 탭 `info` · `pattern` · `search` | **바꾸기** — `/search/:aprthngNo` → `/cases?open=<감정번호>&img=<n>&tab=pattern`(감정물 번호 끝 `_n`에서 `img`) | ① 끝 |
| `/search/:aprthngNo/crimeHistory/:searchNo` | 검색 이력 1건 | 문양 코드 탭 「검색 이력」 → 「자세히」 = 검색 결과 탭 | **바꾸기** — `…&tab=search&run=<searchNo>` | ① 끝 |
| `/search/:aprthngNo/patternExtract` · `/shoesResult` | (이미 리다이렉트 스텁) | — | 넘겨주기 대상만 `/cases`로 | ① 끝 |
| `/search/:aprthngNo/shoesResult/detail/:ftwrId` (`ResultDetail`) | 상세 조회 · 대조 | 사건 창 탭 `compare`(`widgets/match-compare`) | **바꾸기** — `…&tab=compare&ftwr=<ftwrId>` | ② |
| `/edit/:aprthngNo` | (리다이렉트) | 사건 창 탭 `edit`(`widgets/image-edit`) | **바꾸기** — `…&tab=edit` | ③ |
| `/editormode` (`pages/EditorMode.jsx`, 독립 편집기) | 독립 편집기 | 사건 창 이미지 편집 탭(1차 편집만, 결정 §3-2) | **없앰**(③ 뒤) — 쓰는 사람이 있으면 사용자 확인 | ③ 뒤 |
| (없음) | S07 결과 확인 | 사건 창 탭 `confirm`(`widgets/result-confirm` `ConfirmWindow`) | **새로**(창 안) | ② |
| `/shoesRepository`, `/shoesRepository/:ftwrId`, `/shoesRegister`, `/shoesEdit/:ftwrId` (`pages/shoe-repository` + `widgets/shoe-workbench`) | 신발 DB | 위 막대 「신발 DB」 → 오른쪽 슬라이드 패널(`widgets/shoe-db` `ShoeDbPanel` · `ShoeEditor`, 결정 §4) | **바꾸기** — `/cases?shoe=1&ftwr=<id>`. `widgets/shoe-workbench`는 넘겨준 뒤 없앰(레거시 공유 부품은 `grep` 확인 후 — `architecture.md` §5) | ④ |
| `/manage/users` (`pages/manage-users`) | S13 사용자 관리 | `widgets/admin-users-screen` | **바꾸기**(페이지 안 위젯 교체, 주소 그대로 — 위 막대 「관리 ▾」) | ⑤ |
| `/manage/logs` (`pages/manage-logs`) | S14 사용 · 감사 기록 | `widgets/admin-logs-screen` | **바꾸기**(같음) | ⑤ |
| `/dev`, `/dev/s00`~`/dev/s14`, `/dev/parts` | 진열 | — | **그대로**(개발 실행 전용) | — |
| (없음) | 감정서 작성 · 교차 검증자 의견(검증함) | **시안 없음**(결과 확인의 「감정서로」 · 「교차 검증 요청」 단추까지만) | **보류** — 시안을 먼저 그려 승인(서버 §9-1 ⑪). 그때까지 「감정서로」는 「준비 중」 | ② 뒤(시안 승인 후) |

권한 가드(`features/auth`, 지금 방식 그대로): `/cases` = `RequireFeature`(`CASE_STATUS_VIEW` 또는 `CRIME_SEARCH`), 탭은 `CaseWindowProps.visibleTabs`로(수사관 = 「사건 정보」만 — 결정 §3), 신발 패널 = `SHOE_VIEW`, `/manage/*` = `RequireAdmin`. 버튼 잠금은 위젯의 `*-access.ts` · `roles.ts` 규칙을 쓰되 **아래 §3-6의 결재 권한 제거**를 먼저 반영.

---

## 2. 가짜 데이터 → 실제 쿼리 · 뮤테이션 자리

**결론: 진열 페이지의 가짜 값 파일마다 바꿀 쿼리 · 뮤테이션이 정해져 있다. 읽기는 `entities/*/api`(`useQuery`), 쓰기는 `features/*`(`useMutation`), 응답 변환은 계층 규칙대로(CRUD = camel 변환, 이미지 처리 = 무변환).**

### 2-1. 새로 만들 슬라이스(FSD — `docs/architecture.md` §6)

| 슬라이스 | 담는 것 | 서버 API |
|---|---|---|
| `entities/request`(새) | 의뢰 목록 · 상세 · 결과 확인 · 교차 검증 후보 · 감정서 읽기, 쿼리 키 | A1 · A2 · G1 · H1 · H3 · I1 |
| `entities/crime/api`(넓힘) | 편집 이력 · 문양(메타 포함) · 검색 이력 요약 · 이력 상세 · 결과 페이지 · 확인대상 · 판정 판본 · 대조 기록 | B3 · C1 · D2 · D3 · D4 · E2 · G3 · F2 |
| `entities/shoe/api`(넓힘) | 거르기 목록 · 개수 · 상세 · 작업 단계 | J1 · J2 · J3 · J8 |
| `entities/code`(새) | 코드표(채취 방법 · 사건명 · 관서 `ORG`) · 문양 종류 사전 | A7 · C4 |
| `entities/admin/api`(넓힘) | 기능 기록 대상 번호 · 감사 기록 · 사슬 검증 | K1 · K2 · K3 |
| `features/case-info`(새) | 사건 정보 수정 · 접수 · 사진 추가(원본 → 등록) | A3 · A4 · B1 + A6 |
| `features/crime-edit`(넓힘) | 편집 단계 저장 · 되돌리기 | B4 · B5 |
| `features/patterns-extract`(넓힘) | 문양 + 메타 저장 · AI 추출(실행 기록 번호 받기) | C2 · C3 |
| `features/crime-search`(넓힘) | 검색 실행(가중치 · 기록) · 본 위치 · 확인대상 ★ | D1 · E1 · E3 · E4 |
| `features/judgement`(새) | 판정 저장 | G2 |
| `features/cross-review`(새) | 요청 · 회수 · (검증함 시안 뒤) 의견 | H2 · H5 · H4 |
| `features/report`(새 — 시안 뒤) | 초안 · 저장 · 발송 · 정정 | I2~I5 |
| `features/shoe-repository`(넓힘) | 등록 · 편집 · 문양 입력 · 승인 | J4~J7 |

`features` 끼리는 가져오지 않는다(`architecture.md` §1). 여러 기능을 엮는 것은 `pages/cases`(창 탭 조립)에서.

### 2-2. 진열 가짜 값 → 실제 자리(파일별)

| 진열 파일 | 가짜 값(내보내는 이름) | 실제 자리 | 비고 |
|---|---|---|---|
| `s00/mock-cases.ts` | `MOCK_ACCOUNT` · `FAILED_REMAINING` · `ATTEMPT_LIMIT` · 오류 문구 3종 | 기존 `login`(`POST /auth/login`) · 서버 `detail` 문구 그대로 | 남은 시도 수는 서버 문구에 있을 때만 |
| | `MOCK_LAST_LOGIN` | 없음 → 줄 숨김 | B11 |
| | `DEMO_*`(AI 시연 그림) | 정적 장식 그대로 | 화면 장식 — 서버 무관 |
| `s01/mock-cases.ts` | `makeCaseRows` · `S01_TOTAL` · `S01_PAGE_SIZE` · `S01_LIVE_AT` | `useRequestList`(A1 — `q` · `flow` · `result` · `awaiting` · `unsearched` · `mine` 칩) | **전체 건수가 없다**(키셋 페이지) → §5 위험 R3 |
| | `makeCaseImages` · `stageLabel` | `useRequestDetail`(A2 — `images[].img_sttus`, `flow`) | |
| | `makeConfirmRows` | `useConfirmRows`(G1) | |
| `s01/case-flow.ts` | 흐름 5칸 · 탭 표시 · `aiIssuesOf`(AI 1차 작업 점검) | A2 `flow` · `info_blanks`, 탭 표시는 A2 · G1 값으로 계산 | AI 점검은 **없앰**(결정 — AI는 문양 추출 · 순위만) |
| `s01/case-live.ts` · `frame/work-memory.ts` | 사건 · 이미지별 작업 보관함, 장 상태 파생 | **서버 상태 + TanStack 캐시**로 대체(B17 — `img_sttus`) | 파일 자체는 진열 전용으로 남김 |
| `frame/case-targets.ts` | 확인대상 목록 · 판정 지문 | `useTargets`(E2) · E3 · E4, 판정 `note`는 G1 | 「확인대상이 바뀌면 다시 판정」은 서버가(B14) |
| `frame/dev-viewers.ts` | 보는 사람 5종 | `useSession`(`/auth/me` — `features` · `roles` · `org_id`) | 진열 전용 |
| `s01/CaseWindowUpload.tsx` · `s02/use-fake-upload.ts` | 가짜 올림 진행률 | `uploadOriginal`(B1 — 이미 `entities/crime/api`) → `registerCrime`(A6, `originalFileId`) | 진행률 % 는 `fetch`로 못 잰다 → 「올리는 중」 표시(제안) |
| `s02/mock-cases.ts` | `DETAIL_FORM` · `PENDING_VALUES`(SCAS 칸 「준비 중」) | A2 사건 정보 칸 → 수정 A3(`rowVersion`) | 「준비 중」 잠금을 풀고 실제 칸으로(문서번호 · 피해자 등 DB §5-B 칸) |
| | `OFFICE_ITEMS` | 의뢰관서 = 등록자 소속(읽기 전용), 이름은 A7 `ORG` | 대리 등록은 서버 §9-1 ⑫ |
| | `makeImages` · `S02_PLUS` · `S02_DEMO_UPLOAD` | A2 `images`, 흐름 A2 · 올림 위와 같음 | AI 점검 · 필수 칸 도넛(+α) 없앰 |
| | 채취 방법(지금 한글 이름을 8자 코드 칸에 넣음) | A7 코드표 고르기(B9) | 감정번호는 `POST /requests/number` 발급 → 읽기 전용(B9) |
| `s03/mock-cases.ts` | `S03_HISTORY` · `S03_HASH` · `S03_ORIGINAL_SIZE` | `useEditHistory`(B3 — `original.sha256`, `width`/`height`, 단계별 `result_file_id`) | 되돌리기 줄은 **지우지 않고 「되돌림」 줄 추가**(B8) |
| | `S03_AI_SUGGESTIONS` · `S03_CROP_LABEL*` · `S03_MEASURE_CM` · `S03_TILT` | 없음 → 숨김 | 자 인식 · 기울기 제안 모델 없음 |
| | `S03_FOUND_LABEL` | E2 확인대상의 신발 그림(`shoeImageUrl`) | |
| `s04/mock-cases.ts` | `S04_MOCK`(부위 문양 · 카드 메타) · `S04_ZONE_CONFIDENCE` | `usePatterns`(C1 — 튜플 + `meta` + `sole_text` + `extracted_raw`) | 튜플은 그대로, 메타는 따로(가중치 §6) |
| | `S04_IMAGES` · `S04_IMAGE_STATUSES` · `S04_IMAGE_TOTAL` · `S04_IMAGE_REST` | A2 `images` | |
| | `S04_PALETTE` · `S04_LIBRARY` · `S04_KINDS` | 프론트 자산 그대로(`utils/get-patterns-path.js`의 `import.meta.glob`), 종류 사전은 C4와 같은지 테스트 | R2 사전 정본 = 서버 §5-3 |
| | `S04_FAKE_SHOES` · `fakeSearchRun` · `rankOfRun` · `fakeShoePatterns` · `S04_RUNS` | 검색 = D1(`record: true`), 이력 = D2 · 「다시 불러오기」 = D3 `cond` | `match-score.ts`는 표시용으로만, 순위는 서버 |
| | `S04_MATCH_CONDITIONS` | 화면 상태 → D1 `conditions` | |
| | `S04_FUNNEL` · `S04_CODE_NOTES` · `S04_RECENT` | 없음 → 숨김 | +α |
| | AI 추출 결과(진열 지연 `S04_RESEARCH_MS`) | `patternsExtract`(C3 — `run_id`를 메타 `ai_run_id`로) | 좌표 계약 그대로(§3-1) |
| `s05/mock-cases.ts` | `makeResults` · `makeRange` · `runResults` · `S05_TOTAL` · `S05_PAGE_SIZE` | `useSearchResults`(D4 — 저장 순위 200 + 그 뒤 다시 계산) | `similarity`는 0~100 그대로(`>1이면 /100` 정규화 유지), 문양 점수는 `pattern_score` |
| | `S05_SEEN_UP_TO` · `S05_SEEN_AT` | D3 · D4 `seen` → 갱신 E1 | 사용자 확인 필요 — 기본값 1(서버 저장) — `?plus=0` 숨김 해제 |
| | `INITIAL_TARGETS` | E2 → ★ = E3 · E4 | |
| | `DETAIL_INFO` · `MOCK_BRANDS` | J3 신발 상세 | **상표 이름이 없다**(`brandCode`만) → 코드로 보이거나 A7 코드표에 상표 그룹이 있으면 그 이름(경찰청 확인 — SCAS 코드 전체, DB §11-2) |
| | `zoneInfo` · `S05_QUERY_PATTERNS` · `runQueryPatterns` | 고른 문양 = C1, 후보 문양 = J3 · 검색 응답, 부위 일치 표식은 화면이 같은 부위 이름 비교로 계산 | 부위 「점수」는 서버에 없음 → 일치 표식만 |
| | `AI_TOP` · `distributionBins` · `makeInsight`의 AI 재순위 | 없앰(결정 §3-4 「AI 먼저 보기 없음」) · 분포는 숨김 | |
| `s06/mock-cases.ts` | `CASE_INFO` · `shoeInfoFor` · `CRIME_PATTERNS` · `SHOE_PATTERNS` | A2 · J3 · C1 | |
| | `MATCHES` · `DENSE_PAIRS` · `FAKE_ALIGNMENT` | 기존 `fetchMatchTop10` · 유사부위 · `fetchAlignment`/`saveAlignment`(이미 `entities/match` · `entities/alignment`) | 서버 「기존 그대로」 |
| | `makeMatchInsight`(AI 종합 · 부위 점수 · 한 줄 의견) | 종합 = F1(`record=true`) · 지난 기록 F2. 부위 점수 · 의견은 **숨김** | 모델 출력 없음(서버 §4-6) |
| `s07/mock-cases.ts` | `makeBlocks` · `CASE_SUMMARY` · `INITIAL_COMPLETED` | G1(`rows` · `cross_review` · `locked_reason`) | |
| | 판정 누름 | G2(`useSaveJudgement`) — 메모 칸 `opinionCn` | 사용자 확인 필요 — 기본값 4(메모 칸을 창 결과 확인 줄에 — 부품표 승인 먼저, B15) |
| | `REVIEWERS` | H1 | 본인 · 판정자 제외는 서버가 |
| | `makeConfirmInsight`(AI 추천 근거) | 없앰 | +α |
| `s10/mock-cases.ts` | `makeS10Shoes` · `makeS10AllShoes` · `S10_TOTAL` · `S10_PAGE_SIZE` | J1 · J2(거르기 매개변수 B18) | |
| | `S10_STAGE_SUMMARY` · `S10_CARD_INFO` · `makeS10CardInfo` | J8 · J1 `work_status` | 「AI 확인 필요」 칩은 화면 상태만(서버 §9-1 ⑤) |
| | `S10_OFFICES` | A7 `ORG` | |
| | `S10_AI_SUGGEST` · `makeS10AiDetails` · `S10_EXTRACT_MS` | C3(`type=shoes`, 경로 `/crime/:ftwrId/patterns_extract`, `image` = data URL 또는 **원본 `ftwrId` 문자열**) | 가림 % 는 모델 없음 → 숨김 |
| | 승인 단추(지금 `!isAdmin` 잠금) | J7 — `SHOE_APPROVE` 권한으로 잠금(B4) | |
| | `S10_DUPLICATE_MESSAGE` | 서버 409 `detail` 그대로(`ApiError.detail`) | |
| `s13/mock-cases.ts` | `MOCK_USERS` · `MOCK_ROLES` · `MOCK_ORGS` · `MOCK_FEATURES` · `MOCK_CURRENT_USER_ID` · `MOCK_LOGIN_META` | 기존 `fetchUsers` · `fetchRoles` · `fetchOrgs` · `fetchFeatures` · `useSession` | 서버 그대로 |
| | `MOCK_DUTIES` · `MOCK_DUTY_ROLE_CODES` | 기능 `SHOE_PATTERN` · `SHOE_APPROVE`(서버 0017) → 기존 `replaceUserFeatures` | 분업 저장 방식 통일(검수 3회차 남은 것)을 이때 |
| | `MOCK_ADMIN_HISTORY` | K2(`ROLE_CHANGE` · `PERMISSION_CHANGE` · `ORG_CHANGE` · `USER_CHANGE`) | |
| | `MOCK_OVERVIEW` · `MOCK_PRESET_HINT` · `MOCK_PERMISSION_NOTES` | 사용자 목록 값으로 계산(없는 값의 타일은 숨김) · 안내 글은 정적 | |
| `s14/mock-cases.ts` | `MOCK_SESSIONS` · `MOCK_TIMELINES` · `MOCK_EVENTS` · `MANY_SESSIONS` · `MOCK_ACTIONS` · `MOCK_LOG_USERS` | 기존 `fetchSessions` · `fetchSessionEvents` · `fetchEvents`(+ K1 `target_id`) · `fetchActions` · `fetchUsers` | 50개씩, 전체 개수 없음 |
| | `MOCK_ADMIN_ACTIONS` | K2 | |
| | `MOCK_INSIGHTS`(시간대 차트 · 이상 징후 · 해시 사슬) | 사슬 = K3(`audit_event`만 — B12), 차트 · 이상 징후는 **숨김** | 집계 API 없음(서버 §4-11) |
| | `MOCK_TAB_COUNTS` | 없음 → 숨김 | |
| `mock-assets/*`(`FakePhoto` · `FakeSole` · `sample-images` · `sample-shoes`) | 가짜 사진 · 밑창 | 현장 = `/files/{file_id}` · `/crime_images/…`, 신발 = `shoeImageUrl(ftwrId, "B" \| "S" \| "Shoerinsics")` | 진열 전용으로 남김 |

### 2-3. 위젯 타입에서 바뀌는 곳(작게)

| 위젯 타입 | 바뀜 | 까닭 |
|---|---|---|
| `case-list` `CaseListRow` | `stage`(옛 「검증요청 · 결재 · 결재완료」 숫자) → 서버 `flow_stage`(0~4) 그대로. `ai` · `summary` · `source` · `isNew` · `stackSrc`는 실제 페이지가 넘기지 않음 | 결재 없음 · 결정 §2 |
| `case-detail` `CaseDetailPlus.stage` 주석 「… · 감정서 · 결재」 | 결재 칸 없음으로 | 결재 없음 |
| `image-edit` `ImageEditHistoryEntry` | `fileId` · `sha256` · `revertOf?` 더함(단계 그림 · 해시 · 되돌림 줄) | B8 |
| `pattern-code` `SearchRunHit.score` | 서버 `pattern_score`와 같은 뜻(0~1 · null) — 그대로 | B7 |
| `result-confirm` `ConfirmRow` | `examId` · `rowVersion` · `opinionCn?` 더함 | B15 · 동시 수정 |
| `entities/session` `FEATURES` | `REPORT_APPROVE` 삭제, `SHOE_PATTERN` · `SHOE_APPROVE` 추가, `REPORT_WRITE` 라벨 「감정서 작성」 | 서버 0013 · 0017 |

---

## 3. 흉내만 낸 기능 → 실제 동작

**결론: 좌표를 다루는 캔버스는 지금 운영 부품을 「슬롯」에 그대로 끼우고(좌표 계약 불변), 보기 조정 · 확대경은 실제 픽셀을 캔버스로 다룬다. 저장은 모두 서버 API로.**

| # | 시안의 흉내 | 실제로 | 지킬 것 |
|---|---|---|---|
| 3-1 | 문양 코드 `canvasSlot` = `FakePatternCanvas`(s04) · `lensSource`도 가짜 | `features/patterns-extract/ui/PatternCanvas` + `usePatternManager`(crime 모드)를 **그대로 슬롯에**. 경계선 · 신발 영역 도구 그대로. 확대경은 같은 이미지 요소를 캔버스로 확대(`lensSource`) | `api-communication.md` §4 좌표 계약 **불변** — `recompute()` · `toCanvasY` · `<canvas absolute inset-0 size-full>` · `h-full w-auto object-contain` 손대지 않음. `line_ys` · `render_size` 정수 + `[1, renderH-1]` clamp. 위젯의 시각 장식은 `pointer-events-none`. 테스트: `line-geometry.test.ts` + 슬롯에 끼운 상태 추출 요청 본문 검사 |
| 3-2 | 이미지 편집 `canvasSlot` = `FakeCanvas`(s03 — 도구별 그림만) | 도구별 실제 부품: 자르기 · 회전 = `features/crime-register`(`use-image-editor` · `rotate-image`), **4점 보정 = 레거시 `hooks/useCalibration.js`**(canvas 좌표 → 상대 좌표 → `naturalWidth/Height` 픽셀 → `/crime/demo/perspective`)를 `features/crime-edit`의 TS 훅으로 옮겨 쓰기(로직 그대로), 배경 · 가림 다각형 = `features/crime-edit` `PolygonCaptureCanvas`, 이진화 = `ThresholdControls` + `/binarization`, 노이즈 = `/denoising`. 레거시 `components/Canvas.jsx`(자르기 · 회전)는 참고만 하고 FSD 쪽 훅으로 | 한 도구 「확인」 = 결과 PNG(base64)를 **B4로 한 단계 저장**(`srcFileId` = 지금 파일). 「여기까지 되돌리기」 = B5. 회전값 초기화는 화면에서. 편집은 1차만(결정 §3-2) |
| 3-3 | 보기 조정(대비 · 밝기 · 반전 · 이진화)이 CSS 필터 흉내 | `features/crime-register/lib/pixel-filters.ts`(`Adjustments` — 같은 필드 · 범위)로 **실제 픽셀**을 오프스크린 캔버스에 그려 보임. 저장 안 함(보기용) | 백엔드 이미지를 캔버스로 읽을 때 `crossOrigin="use-credentials"`(`api-communication.md` §1-1). 큰 원본은 화면 크기로 줄인 사본에 필터(성능 — §5 R4) |
| 3-4 | 확대경 · 「확대 찍기」(핀) · 크게 살펴보기 | 화면 좌표 → 이미지 자연 픽셀 비율 변환(시안 `match-compare/model/zoom-link.ts`의 `viewToRatio` 재사용) → 원본 해상도 캔버스에서 잘라 그림. 최소 48(결정 §3-3) | 90° 회전 보기 잘림(검수 3회차 남은 것 #29)은 좌표 계산과 함께 고친다 |
| 3-5 | Shoerinsics(이진 밑창) · 밑창 · 측면 그림 = 가짜 SVG | `shoeImageUrl(ftwrId, "Shoerinsics" \| "B" \| "S")` — 서버 `static/shoes_images/{B,Shoerinsics}` 실제 폴더. 없는 그림은 로드 실패 → 「그림 없음」(보호 이미지 실패는 `revalidateSession`) | 측면(`S`) 폴더가 서버에 없을 수 있다 — 「측면 없음」 표시와 같은 뜻으로 |
| 3-6 | 역할 판정(`imageEditAccess` · `patternCodeAccess` · `viewerRoles`)이 **`REPORT_APPROVE`로 「기술책임자」를 가림** | `/auth/me`의 `roles`(`REVIEWER`)로 판정하고 `REPORT_APPROVE` 참조를 지움(서버 0013에서 권한 삭제) | 결재 없음. S13 문구 「결재·반려」 · 「감정서 결재」도 같은 커밋 |
| 3-7 | 실제 업로드 없음(`use-fake-upload`) | 파일 고르기 → `uploadOriginal`(원본 바이트 그대로, `POST /files/original`) → 화면 축소 · 회전 → `registerCrime`(`originalFileId`). 여러 장이면 장마다 순서대로 | 원본 먼저(DB §2-3 h). 실패한 장만 다시(나머지는 남음) |
| 3-8 | 검색 = 가짜 DB에 가중치 식 | D1 `record: true`(가중치 · 메타 · 제안 · 문자열 · 조건 실어 보냄) → 응답 `search_no` · `weights_applied`로 이력 줄 · 카드 갱신. 실시간 재검색(필수 토글)은 지금처럼 `record` 없이 | `api-communication.md` §5 디바운스 · settled 게이트 그대로. 쿼리 키에 가중치 시그니처도 넣는다(이중 요청 방지와 같은 원리) |
| 3-9 | 자동 넘기기(결과 목록 스크롤 · n초 쪽 넘김) | D4를 쪽 단위로 미리 받아 둠(다음 쪽 prefetch) + 본 위치 E1을 쪽 넘길 때마다(디바운스) | 「움직임 줄이기」 존중(검수 1회차 #23) |

---

## 4. 순서 · 묶음 · 완료 기준

**결론: 서버 묶음 번호와 같은 번호로 간다. ⓪(틀)만 서버 ②의 첫 조각(A1 · A2 · 0013)을 기다리고, 나머지는 서버 묶음이 끝난 뒤 바로 따라간다.**

| 묶음 | 화면 | 기다리는 서버 | 할 일 | 완료 기준 |
|---|---|---|---|---|
| ⓪ 틀 · 목록 · 사건 정보(읽기) | `ScasShell` · `/cases` 목록 · 사건 창 틀 · 「사건 정보」 탭 보기 · 로그인 | 서버 ②의 0013 · A1 · A2 | 라우트 · 가드 · `firstAllowedPath`, **개발 중계 규칙 `vite.config.js` `BACKEND_PROXY_PATTERN`에 `requests|codes|review-steps|report-versions` 추가**(지금 `crime|shoes|auth|admin|files`뿐 — 빠뜨리면 새 API가 Vite로 가서 HTML이 돌아옴. 화면 주소 `/cases`와 겹치지 않음), `entities/request`, `FEATURES` 정리(§2-3), 역할 판정 교체(§3-6), 주소 상태(`case-window-query.ts` 규약을 `pages/cases/model`로 — 진열 파일은 남김), 위 막대 바로 찾기 = A1 `q` | 수사관 · 감정관 · 검증자 · 관리자 계정으로 목록 · 창 열기(수사관은 자기 관서만 · 「사건 정보」 탭만), 키셋 「더 보기」 동작, 17만 건 DB에서 첫 쪽 1초 안(§5 R3), 옛 라우트 전부 그대로 동작(e2e `app-shell.spec.ts` + 옛 화면 스모크) |
| ① 문양 · 검색 · 가중치 · 이력 | 「문양 코드」 · 「검색 결과」 탭 | 서버 ① | §3-1 · §3-8 · §3-9, C1~C3 · D1~D4 · E1 · E3 · E4 연결, 「다시 불러오기」 = D3 `cond`, `match-score.ts`는 표시용 | 문양 저장 → 새로 열어도 같은 카드(메타 · 개수 · 문자열), 검색 1번 = 이력 1줄(서버 `search_no`), 다시 불러오기가 같은 가중치 · 제안, β = 0에서 순위가 옛 `/search`와 같음, 화면 규칙 = 서버 규칙(공용 사례 파일 테스트 통과), 본 위치 · ★ 저장, 이중 요청 0(네트워크 검사), 좌표 계약 테스트 통과 → **옛 `/search*` 넘겨주기** |
| ② 판정 · 교차 검증 · 결과 확인 · 정밀 대조 · 등록 | 「결과 확인」 · 「정밀 대조」 탭, 사건 정보 수정 · 접수 · 사진 추가 · 등록 모드 | 서버 ②(나머지) · ⑤의 F1 · F2 | G1~G3 · H1 · H2 · H5 · A3 · A4 · A6 · A7 연결, 판정 메모 칸(부품표 승인 뒤), 수사관 잠금(`REQUESTED`만 — 사용자 확인 필요 — 기본값 2) | 판정 누름 = 저장, 확인대상 바꾸면 「다시 판정」(서버 B14), 발견은 확인대상 있을 때만, 교차 검증 요청 → 판정 잠김 · 회수 → 풀림, 수사관 접수 뒤 수정 단추 없음 · 서버 403, 감정번호 읽기 전용 · 채취 방법 코드 고르기 → **옛 `/crimeRegister` · `ResultDetail` 넘겨주기**. 감정서 · 검증함 화면은 시안 승인 뒤 별도 |
| ③ 이미지 편집 · 원본 | 「이미지 편집」 탭 | 서버 ③ | §3-2~§3-4, B3~B5 | 도구마다 확인 = 이력 1줄 + 단계 그림 · 해시, 되돌리기 = 줄 추가(지움 없음), 원본 해시 · 「원본 없음」 표시, 그새 다른 편집 409 처리 → **`/edit` 넘겨주기 · `/editormode` 없앰(확인 뒤)** |
| ④ 신발 검수 | 신발 DB 패널 · 편집 판 | 서버 ④ | J1~J8 · C3(`type=shoes`), 분업 잠금(`SHOE_PATTERN` · `SHOE_APPROVE`), `validateShoeForm` 예약어에 `stages` 추가, Shoerinsics 실제 경로 | 거르기(등록관서 · 등록일 · 승인 · 문양 입력) 서버 결과와 일치, 승인 = 승인 담당만, 11.7만 신발에서 첫 쪽 1초 안 → **옛 `/shoesRepository*` 넘겨주기 · `shoe-workbench` 정리** |
| ⑤ 관리 · 기록 | 사용자 관리 · 사용 기록 | 서버 ⑤ | 위젯 교체, 분업 열, K1~K3, 관리 이력 탭 | 대상 번호 거르기, 감사 기록 · 사슬 검증 결과 표시(`activity_log`에는 사슬 표시 없음 — B12), 마지막 관리자 보호 문구 = 서버 문구 → **`AppShell` · `Sidebar` 정리** |

모든 묶음 공통: `npm run typecheck` · `npm test` · `npm run lint` · `npm run check:ui`(시각 기준은 **진열 페이지**로 유지 — 실제 페이지는 데이터가 달라 픽셀 비교 대상이 아님) · MSW(이미 개발 의존성)로 서버 응답 모양 고정 테스트(실제 페이지 상태 loading · error · empty · ready 각각).

---

## 5. 위험

| # | 위험 | 막는 법 |
|---|---|---|
| R1 | **레거시 공존** — 두 틀(`AppShell` · `ScasShell`), 옛 전역 store(`useCrimeStore` — `SessionProvider`가 `CRIME_SEARCH`면 **모든 사건 + 편집 이미지 base64**를 한 번에 받음, `GET /crime/`), 옛 · 새 화면이 같은 감정물을 동시에 고침 | 새 페이지는 `useCrimeStore`를 **쓰지 않는다**(TanStack 쿼리만). 옛 화면을 넘겨준 묶음마다 `SessionProvider`의 자동 `refetch()` 조건을 좁히고, ⑤ 뒤 store 제거. 동시 수정은 서버 `rowVersion` · 409(「다른 사람이 먼저 고쳤습니다」)를 위젯 안 오류 줄로 |
| R2 | **권한 가드** — 시안 잠금 규칙이 `REPORT_APPROVE`(삭제됨)에 기대고, 시안 감정관 권한(`CRIME_REGISTER` · `SHOE_EDIT`)이 서버 역할 기본값과 달랐음(B3) | §3-6 역할 판정 교체를 ⓪에. 서버 0013이 역할 기본값을 맞춘 뒤 실제 계정 4종으로 탭 · 단추 잠금 표 테스트. 화면 잠금은 편의일 뿐 — 서버가 최종(403) |
| R3 | **성능 — 목록 17만 건** | 목록은 A1 키셋 「더 보기」(쪽 번호 · 전체 건수 없음 — `CaseListScreenProps.total` 생략, `Pagination`을 「더 보기」로 바꾸거나 앞 · 뒤만 — 제안), 기본 최근 한 달 · 앱 사건만(`src=APP`), 썸네일은 작업본 주소를 `loading="lazy"`로, 바로 찾기는 디바운스 300ms. 과거 사건 섞어 보기는 사용자 확인(서버 §9-1 ⑧) |
| R4 | 큰 원본 이미지(장당 ~6MB) 캔버스 처리 | 보기 조정 · 확대경은 화면 크기 사본에, 확대 찍기만 원본 해상도 조각. 편집 결과 저장 크기는 지금 규칙(최대 1000px 작업본) 유지 — 원본은 서버에 따로(B1) |
| R5 | 검색 이중 요청 · 캐시 혼선 | 가중치 · 메타 시그니처를 쿼리 키에(§3-8), 서버 캐시 키도 가중치 · β 포함(서버 §4-4) |
| R6 | 가중치 규칙이 화면 · 서버에서 갈라짐 | 공용 사례 JSON 테스트 양쪽, 응답 `weights_mismatch` 표시(서버 §5-1) |
| R7 | 시안에 없는 화면(감정서 · 검증함) 때문에 흐름이 「교차 검증」에서 멈춤 | 실증 시작 전 시안 → 승인 → 이식을 ② 뒤 첫 일로. 그 전까지 「감정서로」는 「준비 중」, 관리자가 옛 길 없음을 안내 |
| R8 | 브라우저 업로드 진행률 없음(`fetch`) | 「올리는 중 n/m장」으로(장 단위) — 바이트 진행률이 꼭 필요하면 XHR 래퍼(사용자 확인) |
| R10 | 새 API 경로가 개발 중계 규칙에 없어 화면이 HTML을 받음 | ⓪에서 중계 규칙 확장 + 중계 규칙 단위 테스트(경로 목록 = 서버 라우터 앞부분 목록) |
| R9 | 디스크 여유가 적다(약 1.4GB) | 실제 사진 · 신발 이미지는 저장소에 넣지 않음(`samples/crime` git 제외 그대로), 1/10 속도 자료는 측정 후 지움(서버 DB §7-3-1) |

---

## 6. 매뉴얼 캡처를 실제 앱으로 다시 찍는 시점

**결론: 묶음마다 해당 장만 다시 찍고, 전체는 실증 서버에 실제 자료가 들어간 뒤 실증 시작 직전에 한 번 더 찍는다.** 지금 캡처(`docs/manual/captures/*.png`)는 진열 페이지(`/dev/*`)를 `scripts/manual/capture.mjs`로 찍은 것이다.

| 시점 | 다시 찍는 매뉴얼 장 | 조건 |
|---|---|---|
| ⓪ 끝 | 1 시작하기(로그인 · 화면 설정) · 2 사건관리 목록 | 실제 계정 · 실제 목록(샘플 사건 몇 건 — `samples/crime`, git 제외) |
| ① 끝 | 3 사건 창의 문양 코드 · 검색 결과 · 7 가중치 설정 | 검색 결과가 나오려면 **GPU 서버**(이 맥은 CUDA 없음 — `police-server/CLAUDE.md`) — 실증 서버나 학교 GPU 서버에서 |
| ② 끝 | 3 사건 정보 · 결과 확인 · 정밀 대조 · 2 사건 등록 | 판정 · 교차 검증까지 진행한 샘플 사건 |
| ③ 끝 | 3 이미지 편집(편집 이력 미리보기) | 원본 업로드한 샘플 |
| ④ 끝 | 4 신발 DB | 실제 신발 그림(`static/shoes_images`) |
| ⑤ 끝 | 5 사용자 관리 · 6 기록과 감사 | 실증 계정 몇 개 · 기록이 쌓인 뒤 |
| **실증 시작 직전(최종)** | 전체 + Word 다시 조립(`scripts/manual/build-docx.mjs`) | 실DB 적용(서버 「0005~0018」) 뒤, 감정서 · 검증함 화면까지 들어간 상태 |

`capture.mjs`는 주소를 `/dev/*` → 실제 라우트(`/cases?open=…&tab=…`)로 바꾸고, 로그인 단계를 더한다(테스트 계정 — 비밀번호는 환경변수, 저장소에 넣지 않음). 개인정보가 보이는 칸(피해자 성명 등)은 샘플 값만 쓴다.

---

## 7. 사용자 확인 필요(이 계획에서)

| # | 질문 | 제안(기본) |
|---|---|---|
| ① | 감정서 작성 · 교차 검증자 의견(검증함) 화면 시안을 언제 그리나 | ② 묶음 직후 시안 → 승인 → 이식(R7) |
| ② | `/editormode`(독립 편집기)를 쓰는 사람이 있나 | 없으면 ③ 뒤 삭제 |
| ③ | 목록 쪽 넘김 — 쪽 번호 대신 「더 보기」(전체 건수 없음)로 바꿔도 되나 | 「더 보기」 |
| ④ | 업로드 진행률을 바이트 단위로 꼭 보여야 하나 | 장 단위 |
| ⑤ | 상표 코드(`brandCode`)를 이름으로 보이려면 코드표가 필요 — 받기 전엔 코드로 보여도 되나 | 코드로 |
| ⑥ | 서버 문서의 기본값 1~4 · 질문 ①~⑫ | 서버 §9-1 |
