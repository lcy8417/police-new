# SCAS 필드 이름 전환 — 프론트 실행 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 서버가 SCAS 열 이름으로 응답하게 바뀌는 데 맞춰, 화면이 읽고 보내는 모든 필드·URL 변수·폼 입력을 새 이름으로 바꾼다.

**Architecture:** 바깥에서 안쪽 순서로 바꾼다. ① 타입과 API 함수(`entities/*`, `services/*`)를 먼저 바꾸면 TypeScript가 바뀐 이름을 쓰는 화면들을 오류로 알려 준다. ② 그 오류 목록을 따라 라우트 → 사건 등록 → 사건 조회 → 이력 → 신발 저장소 순서로 고친다. 응답 키 변환은 기존 규약대로 `convertKeysToCamelCase`가 하고, 수동 매핑은 추가하지 않는다.

**Tech Stack:** React + TypeScript + Vite, TanStack Query v5, Zustand, Vitest + MSW, React Router v7

**Spec:** `../police-server/docs/superpowers/specs/2026-11-03-scas-postgres-design.md` (이하 "설계서"). 이름 대응은 설계서 §3·§4, 입력 검증은 §5가 정본이다. 서버 계획 `police-server/docs/superpowers/plans/2026-11-03-scas-postgres-server.md`의 Task 3~6과 같은 API 계약을 쓴다.

## Global Constraints

- 새 이름 정본(설계서 §4, camel): 사건 `aprthngNo, apprslReqestNo, pickDt, pickPlace, pickMthCode, crimeNm, rqestGrfcNm, processSttus, editImage, extractedRaw, pidinetOutline, frstRegistDt` / 이력 `searchNo, ranking, mtchgId` / 신발 `ftwrId, ftwrGroupId, ftwrGroupNm, modlNm, brandCode, makrCode, colctPlace, colctYear, sexdstnSe, swingSe, ftwrSize`
- 이미지 처리 API(`services/api.js`, `entities/alignment`, `entities/match`)는 camel 변환을 하지 않는다. 그쪽 키는 설계서 §4-3 그대로(`ftwr_id`, `aprthng_no`, `flipHorizontal`, `ftwrId`).
- URL 변수: `:crimeNumber` → `:aprthngNo`, `:modelNumber` → `:ftwrId`, `:historyId` → `:searchNo`. 경로를 만들 때는 `encodeURIComponent`를 쓴다.
- ID는 문자열이다. `Number()`·`parseInt` 금지(`ftwrId="00758"` 보존). 단, `searchNo`는 숫자.
- 저장소 규약 유지: FSD 계층 방향, Tailwind 전용(손으로 쓴 `.css`·인라인 색상 금지), 한국어 UI 문자열·주석·커밋, 파일명 규칙. 문양 좌표 계약(`PatternCanvas`·`line_ys`)은 건드리지 않는다.
- 레거시 DEAD 파일(`components/{CrimeRegisterMain,PartialPatterns,PatternList,PatternItem,SearchResults,Sidebar,FormList,FormItem,Header,CalibrationInfo}.jsx`, `hooks/useCalibration.js`, `MatchViewer`·`CorrespondenceMap`·`CrossZoomRows`)는 수정하지 않는다.
- 완료 기준: Task 1~5는 **그 Task가 고친 테스트 + 변경 파일 `npx eslint`** 통과 후 커밋하고, 남은 `tsc`·다른 테스트 오류 목록을 작업 노트에 이어서 기록한다. 전체 `npx tsc --noEmit` + `npx vitest run` + `npm run build` 통과는 Task 6의 완료 조건이다.
- ID(`aprthngNo`, `apprslReqestNo`, `ftwrId`)는 영문·숫자·`-`·`_`만 허용된다(설계서 §5). 그래도 방어용으로 화면 링크·API 경로·정적 이미지 URL에서 `encodeURIComponent`를 쓴다. 이미지 처리 API 본문에 ID를 보낼 때는 URL에서 파일명을 잘라 내지 말고 원본 ID 문자열을 보낸다.
- 신발 DTO의 메타데이터(`colctPlace, colctYear, makrCode, brandCode, modlNm, ftwrGroupId, ftwrGroupNm, sexdstnSe, swingSe, ftwrSize`)는 `string | null`. 화면은 `null`을 빈 칸으로 표시하고, 수정 요청에서는 빈 칸을 그대로(`""` 또는 `null`) 보낸다.

## Review Focus

- 앞자리 0 신발 ID(`00758`)가 목록 클릭 → URL → 상세 조회 → 이미지 URL까지 `"00758"` 그대로 → Task 2 `shoe-paths.test.ts`의 `keeps leading zero`
- 사건 번호·신발 ID에 허용되지 않은 문자(`/`, `#`, 공백, `.`)나 예약어(`count`)를 넣으면 등록 단계에서 막힘 → Task 3 `rejects bad characters`, Task 6 `rejects reserved ftwrId`
- 채취 일시 필터에 `2024-01-29 05:31`(분까지)이나 `2024-01-29 05:31:00`(초까지)을 넣으면 응답 형식이 `2024-01-29T05:31:00`이어도 같은 사건이 찾아짐 → Task 4 `pickDt filter normalizes`
- 등록 폼에서 최대 길이 초과·형식 오류(설계서 §5)를 서버로 보내기 전에 막고 한국어 메시지 표시 → Task 3 `validate-crime-register.test.ts`
- 서버가 400/409를 돌려줄 때 `detail` 문구가 화면에 그대로 표시(지금은 `console.error`만) → Task 3 `RegisterStage.test.tsx`의 `shows server detail`
- 매칭 신발 없이 저장된 이력(`mtchgId: null`)을 열어도 이력 화면이 깨지지 않음 → Task 5 `CrimeHistoryPage.test.tsx`의 `renders without matched shoe`

---

### Task 1: 타입과 API 계층

**Files:**
- Modify: `src/entities/crime/model/types.ts`, `src/entities/crime/api/crime-api.ts`, `src/entities/shoe/model/types.ts`, `src/entities/shoe/model/form.ts`, `src/entities/shoe/api/shoe-api.ts`, `src/entities/alignment/model/types.ts`, `src/entities/alignment/api/alignment-api.ts`, `src/entities/match/model/types.ts`, `src/entities/match/api/match-api.ts`, `src/services/crud.js`(`fetchCurrentShoes`, `fetchHistoryData`, `fetchPatterns`만), `src/services/api.js`(`imageProcessing`, `patternsExtract`, `imageSearch`, `imageLoad`, `fetchSimilarity` — 인자 이름 `crimeNumber`→`aprthngNo`, `modelNumber`→`ftwrId`와 URL 조립)
- Test: 위 entities의 `*.test.ts` 4개 + `src/shared/lib/case.test.ts`

**Interfaces:**
- Produces:
  - `CrimeDto`/`Crime`: 설계서 §4-1 키(snake/camel). `id`·`crime_number`·`image_number`·`find_*`·`request_office`·`state`·`matching_shoes`·`register_time` 삭제
  - `CrimeHistoryRow = { searchNo: number; frstRegistDt: string; ranking: number; mtchgId: string | null }`
  - `CrimeRegisterBody = { image: string; aprthngNo: string; apprslReqestNo: string; pickDt: string; pickPlace: string; pickMthCode: string; crimeNm: string; rqestGrfcNm: string }`
  - `HistorySaveBody = { top; mid; bottom; outline; ranking: number; mtchgId: string | null; editImage: string | null; extractedRaw: ExtractedPatternItem[] | null }`, `saveCrimeHistory(...) -> Promise<{ searchNo: number }>`
  - `ShoeDto`/`Shoe`: 설계서 §4-2 키. `ShoesRegisterBody`/`ShoesEditBody`: 설계서 §4-4
  - `fetchCrimeDetail(aprthngNo)`, `fetchShoeDetail(ftwrId)`, `updateShoe({ ftwrId, ... })` 등 인자 이름 변경
  - `imageSearch` 결과 항목: `{ ftwrId: string; image: string; similarity: number }` — 서버 `item.ftwr_id`로 `ftwrId`를 채우고 `image`는 지금처럼 `${url}/shoes_images/{B|Shoerinsics}/${ftwrId}.png`(기존 `shoesName` 삭제)
  - alignment·similarity·match_top10 쿼리 변수 `model_number` → `ftwr_id`. `LatestAlignmentDto.ftwrId`, `MatchTop10ResponseDto = { matches; aprthng_no; ftwr_id }`, `MatchGateErrorDetail`의 `crime_number`/`model_number` → `aprthng_no`/`ftwr_id`
  - API 오류: `apiGet`/`apiSend`가 400·409 응답이면 서버 `detail` 문자열을 담은 `ApiError(status, detail)`를 throw(`src/shared/api/client.ts`). Task 3이 이 클래스를 사용

- [ ] **Step 1: 실패하는 테스트로 바꾸기** — 각 `*-api.test.ts`의 MSW 응답 fixture를 설계서 키로 바꾸고 기대값도 camel 새 이름으로 수정. 추가:
  - `crime-api.test.ts`: `fetchCrimeDetail returns history rows` (`searchNo`, `mtchgId`), `registerCrime sends SCAS keys`(요청 본문 키 집합 == `CrimeRegisterBody` 키)
  - `shoe-api.test.ts`: `fetchShoesList maps ftwr fields`(`ftwrId`, `colctPlace`, `ftwrGroupNm`)
  - `client.test.ts`(신규): `throws ApiError with server detail on 409`
  - `api.test.ts`(신규, `src/services/`): `imageLoad uses aprthngNo in URL`, `patternsExtract uses aprthngNo in URL`, `imageSearch maps ftwr_id`(요청 URL에 `encodeURIComponent("05019-24-0017_5")`가 들어가고 `undefined`가 없음)
- [ ] **Step 2: 실패 확인** — `npx vitest run src/entities src/shared/api` → FAIL
- [ ] **Step 3: 타입·API 구현** — 이 시점에 `npx tsc --noEmit`가 내는 오류 목록을 작업 노트로 남긴다(Task 2~6의 할 일 목록)
- [ ] **Step 4: 통과 확인** — 위 vitest PASS (tsc는 Task 6까지 실패할 수 있음)
- [ ] **Step 5: Commit** — `feat(api): 사건·신발·정렬·매칭 API 타입을 SCAS 필드명으로 전환`

### Task 2: 라우트와 경로·이미지 URL

**Files:**
- Modify: `src/App.jsx`(라우트 변수), `src/pages/crime-search/model/search-paths.ts`, `src/pages/shoe-repository/model/shoe-paths.ts`, `src/features/crime-align/lib/scene-image-url.ts`, `src/features/match-top10/ui/MatchCorrespondenceViewer.tsx`(303-309행 URL), `src/pages/crime-search/ui/ResultDetailPage.tsx`, `src/pages/editor-mode` 쪽 `EditorMode.jsx`·`ImageLoader.jsx`의 `crimeNumber`/`modelNumber` 변수
- Test: `search-paths.test.ts`, `shoe-paths.test.ts`(없으면 생성), `scene-image-url.test.ts`

**Interfaces:**
- Consumes: Task 1 타입
- Produces: `searchDetailPath(aprthngNo: string)`, `crimeHistoryPath(aprthngNo: string, searchNo: number, ranking?: number)`, `resultDetailPath(aprthngNo: string, ftwrId: string, ranking?: number)`, `shoeDetailPath(ftwrId: string)` — 모두 `encodeURIComponent` 적용. 기존 함수 이름이 다르면 기존 이름을 유지하고 인자 이름만 바꾼다
  - `sceneImageUrl(aprthngNo)`, 신발 이미지 URL 헬퍼 `shoeImageUrl(ftwrId: string, kind: "B" | "S" | "Shoerinsics")`(`src/entities/shoe/lib/shoe-image-url.ts` 신규)

- [ ] **Step 1: 실패하는 테스트** — `encodes and decodes aprthngNo`(`"05019-24-0017_5"` → 경로 → `useParams` 값과 같음), `keeps leading zero`(`shoeDetailPath("00758")`가 `/shoesRepository/00758`), `shoeImageUrl("00758","S")`가 `/shoes_images/S/00758.png`로 끝남
- [ ] **Step 2: 실패 확인** — `npx vitest run src/pages src/features/crime-align/lib src/entities/shoe/lib`
- [ ] **Step 3: 구현**
- [ ] **Step 4: 통과 확인**
- [ ] **Step 5: Commit** — `feat(routes): URL 변수를 aprthngNo·ftwrId·searchNo로 변경`

### Task 3: 사건 등록 화면

**Files:**
- Modify: `src/widgets/crime-register-stage/ui/CaseInfoPanel.tsx`, `src/widgets/crime-register-stage/model/form.ts`, `src/widgets/crime-register-stage/ui/RegisterStage.tsx`
- Create: `src/widgets/crime-register-stage/model/validate-crime-register.ts`(+ `.test.ts`), `src/widgets/crime-register-stage/ui/RegisterStage.test.tsx`(없으면)

**Interfaces:**
- Consumes: Task 1 `registerCrime`, `ApiError`
- Produces:
  - 폼 상태 `CrimeRegisterForm = { apprslReqestNo; aprthngSn; pickDt; pickPlace; pickMthCode; crimeNm; rqestGrfcNm }` — `aprthngSn`(감정물 순번)은 화면 전용, 기본값 `"1"`
  - `buildAprthngNo(apprslReqestNo: string, aprthngSn: string): string` → `` `${apprslReqestNo}_${aprthngSn}` ``
  - `validateCrimeRegister(form: CrimeRegisterForm): string | null` — 설계서 §5 규칙(번호는 `^[0-9A-Za-z_-]+$`만, `pickDt`는 빈 값·`YYYY-MM-DD HH:mm`·`YYYY-MM-DD HH:mm:ss`이며 실제 날짜, `pickPlace` 200·`crimeNm` 300·`rqestGrfcNm` 300자). 첫 위반의 한국어 메시지, 없으면 `null`
- 입력칸(라벨 → 키, `maxLength`): 감정의뢰번호 → `apprslReqestNo`(필수), 감정물 순번 → `aprthngSn`, 채취 일시 → `pickDt`(placeholder `YYYY-MM-DD HH:mm` 유지), 채취 장소 → `pickPlace`(200, 신규), 채취 방법 코드 → `pickMthCode`(8), 사건명 → `crimeNm`(300), 의뢰관서 → `rqestGrfcNm`(300). 조합된 감정물 번호(`buildAprthngNo` 결과)를 입력칸 아래에 미리 보여 준다
- 서버 오류(`ApiError`)는 폼 위 오류 영역에 `detail` 그대로 표시

- [ ] **Step 1: 실패하는 테스트** — `validate-crime-register.test.ts`: 의뢰번호 빈 값 → `"감정의뢰번호를 입력하세요"`, 조합 번호 21자 → `"감정물 번호는 20자 이내여야 합니다"`, `pickDt="어제"` → `"채취 일시 형식은 YYYY-MM-DD HH:mm 입니다"`, `pickMthCode` 9자 → `"채취 방법 코드는 8자 이내입니다"`, `rejects bad characters`(의뢰번호 `"05019/24"`·`"05019 24"`·`"05019#24"`·순번 `"1.5"` → `"번호는 영문·숫자·-·_만 쓸 수 있습니다"`), `pickDt="2024-01-29 05:31:07"`·`""` → 통과, `"2024-02-30 10:00"` → 형식 메시지, 정상 → `null` / `RegisterStage.test.tsx`: `shows server detail`(MSW 409 `{"detail":"이미 등록된 번호입니다"}` → 그 문구가 화면에 보임), `sends aprthngNo`(본문 `aprthngNo == "05019-24-0017_5"`)
- [ ] **Step 2: 실패 확인**
- [ ] **Step 3: 구현**
- [ ] **Step 4: 통과 확인**
- [ ] **Step 5: Commit** — `feat(register): 사건 등록 폼을 SCAS 감정물 필드로 전환`

### Task 4: 사건 조회(커맨드센터) 화면

**Files:**
- Modify: `src/features/crime-search/model/case-row.ts`, `src/features/crime-search/ui/CaseListCompact.tsx`, `src/features/crime-search/ui/QuickSearchBar.tsx`, `src/pages/crime-search/ui/CaseExplorerPanel.tsx`, `src/pages/crime-search/ui/CrimeDetailPage.tsx`, `src/features/crime-search/ui/ShoeDetailContent.tsx`, `src/shared/ui/retrieval-results-grid.tsx`, `src/entities/crime/model/crime-store.ts`, `src/features/patterns-extract/model/use-pattern-manager.ts`(83·120·136행 사건 ID), `src/features/crime-edit/model/use-image-edit.ts`(83행), `src/features/crime-edit/model/use-edit-processing.ts`, 활성 레거시 `useImageProcessing.js`(EditorMode가 사용), 정렬·매칭 호출 체인 `src/features/crime-align/model/use-alignment.ts`·`use-scene-footprint.ts`·`ui/AlignmentGate.tsx`·`ui/AlignmentCaptureCanvas.tsx`, `src/features/match-top10/model/use-match-top10.ts`·`ui/MatchTop10Panel.tsx`·`ui/MatchTop10Grid.tsx`(props·훅 입력을 `aprthngNo`/`ftwrId`로)
- Test: `CrimeDetailPage.test.tsx`, `ShoeDetailContent.test.tsx`, `crime-store.test.ts`, `use-pattern-manager.crime.test.ts`, `use-image-edit.test.ts`, `use-alignment.test.tsx`, `AlignmentGate.test.tsx`, `AlignmentCaptureCanvas.test.tsx`, `MatchTop10Panel.test.tsx`, `MatchTop10Grid.test.tsx`

**Interfaces:**
- Consumes: Task 1·2
- Produces: `CrimeSearchRow = { aprthngNo; apprslReqestNo; crimeNm; pickDt; pickPlace; rqestGrfcNm; pickMthCode; processSttus }`, `QuickSearchFilters = { pickDt; rqestGrfcNm; pickMthCode }`, `RetrievalResultItem = { ftwrId; image; similarity }`
- 화면 표시 라벨: 사건번호 → "감정물 번호", 이미지 번호 → "감정의뢰번호", 발견 일시 → "채취 일시", 발견 방법 → "채취 방법 코드", 처리 상태는 `processSttus` 값 그대로
- 상세 Sheet에서 이력 저장 시 `mtchgId`에 선택한 `ftwrId`를 넣는다(기존 `matchingShoes`)

- 채취 일시 필터: `matchesPickDt(pickDt: string | null, input: string): boolean`(`src/features/crime-search/model/case-row.ts`) — 입력의 공백을 `T`로 바꾼 뒤 `pickDt`가 그 문자열로 시작하면 일치(분까지 입력 = 분 단위, 초까지 = 초 단위, 날짜만 = 그 날짜). `pickDt`가 `null`이면 입력이 있을 때 불일치. 기존 완전일치 비교(`CaseExplorerPanel.tsx:129`)를 이 함수로 교체
- [ ] **Step 1: 테스트 fixture·기대값을 새 이름으로 바꿔 실패시키기** — 추가: `CaseExplorerPanel filters by rqestGrfcNm`(의뢰관서 필터가 `rqestGrfcNm`으로 동작), `retrieval grid keys by ftwrId`, `pickDt filter normalizes`(`"2024-01-29 05:31"`·`"2024-01-29 05:31:00"`·`"2024-01-29"` 모두 `"2024-01-29T05:31:00"`과 일치, `null`은 불일치)
- [ ] **Step 2: 실패 확인** — `npx vitest run src/pages/crime-search src/features/crime-search src/entities/crime src/features/patterns-extract src/features/crime-edit src/features/crime-align src/features/match-top10`
- [ ] **Step 3: 구현** — Task 1에서 남긴 tsc 오류 중 이 파일들 것을 모두 해소
- [ ] **Step 4: 통과 확인**
- [ ] **Step 5: Commit** — `feat(search): 사건 조회 화면을 SCAS 필드명으로 전환`

### Task 5: 이력·결과 상세 화면

**Files:**
- Modify: `src/pages/crime-search/ui/CrimeHistoryPage.tsx`, `src/pages/crime-search/ui/ResultDetailPage.tsx`, `CrimeDetailPage.tsx`의 이력 목록 부분(716-750행)
- Create: `src/pages/crime-search/ui/CrimeHistoryPage.test.tsx`

**Interfaces:**
- Consumes: Task 1 `CrimeHistoryRow`, `fetchHistoryData(searchNo)`, Task 2 `shoeImageUrl`
- 이력 목록: `searchNo`(키·링크), `frstRegistDt`(표시), `ranking`, `mtchgId`(표시, 없으면 `"매칭 없음"`)
- `CrimeHistoryPage.tsx` 40-42행의 `matchingShoes.replace("B","S")` 문자열 조작을 `shoeImageUrl(mtchgId, "S")`로 교체. `mtchgId`가 `null`이면 신발 이미지·문양 비교 영역을 숨기고 `"매칭된 신발이 없습니다"` 표시

- [ ] **Step 1: 실패하는 테스트** — `renders without matched shoe`(`mtchgId: null` → 오류 없이 안내 문구), `renders matched shoe images`(`mtchgId:"00758"` → `/shoes_images/B/00758.png`·`/S/00758.png`)
- [ ] **Step 2: 실패 확인**
- [ ] **Step 3: 구현**
- [ ] **Step 4: 통과 확인**
- [ ] **Step 5: Commit** — `feat(history): 이력 화면을 searchNo·mtchgId 기반으로 전환`

### Task 6: 신발 저장소 화면 + 문서 + 전체 검증

**Files:**
- Modify: `src/features/shoe-repository/ui/ShoeList.tsx`, `src/widgets/shoe-workbench/ui/ShoeInfoPanel.tsx`, `src/widgets/shoe-workbench/ui/ShoeWorkbench.tsx`, `src/pages/shoe-repository/ui/ShoeRepositoryPage.tsx`, `src/features/patterns-extract/model/use-pattern-manager.ts`(70-72행 신발 ID 추출), `src/widgets/app-shell/ui/TopNav.tsx`(`emblem` 사용부), `docs/api-communication.md`(§2 엔드포인트 표와 필드 예시), `docs/pattern-data-model.md`(서버 저장 위치 한 줄), `README.md`(DB를 PostgreSQL로)
- Test: `ShoeWorkbench.reset.test.tsx`, `use-pattern-manager.shoe.test.ts`, `ShoeList.test.tsx`(없으면 생성)

**Interfaces:**
- Consumes: Task 1 `Shoe`, Task 2 `shoeDetailPath`
- `ShoeList` 열(키 → 머리글): `ftwrId` 신발ID, `modlNm` 모델명, `ftwrGroupNm` 그룹(상표), `brandCode` 상표코드, `makrCode` 제조사코드, `colctPlace` 수집처, `colctYear` 수집연도
- `ShoeInfoPanel` 입력칸(`maxLength`): 신발ID `ftwrId`(8, 등록 모드에서만 편집), 모델명 `modlNm`(500), 상표코드 `brandCode`(9), 제조사코드 `makrCode`(8), 수집처 `colctPlace`(200), 수집연도 `colctYear`(4, 숫자만)

- 신발 등록 검증 `validateShoeForm(form, mode: "new" | "edit"): string | null`(`src/entities/shoe/model/validate-shoe.ts`): 새 등록이면 `ftwrId` 필수·`^[0-9A-Za-z_-]{1,8}$`·`count` 금지, `colctYear`는 비었거나 숫자 4자리, 나머지는 최대 길이만
- [ ] **Step 1: 실패하는 테스트** — `ShoeList renders SCAS columns`(머리글 7개, 행 클릭 시 `shoeDetailPath(ftwrId)`로 이동), `renders null metadata as blank`, `rejects reserved ftwrId`(`"count"`·`"a.b"` → 메시지), 기존 shoe 테스트 fixture를 새 키로 교체
- [ ] **Step 2: 실패 확인**
- [ ] **Step 3: 구현 + 문서 수정**
- [ ] **Step 4: 남은 옛 이름 검사** — `grep -rnwE "crimeNumber|modelNumber|crimeName|findTime|requestOffice|findMethod|matchingShoes|findLocation|findYear|emblem|manufacturer|shoesName|imageNumber" src | grep -vE "components/(CrimeRegisterMain|PartialPatterns|PatternList|PatternItem|SearchResults|Sidebar|FormList|FormItem|Header|CalibrationInfo)\.jsx|useCalibration|MatchViewer|CorrespondenceMap|CrossZoomRows"` → 0줄
- [ ] **Step 5: 전체 검증** — `npx tsc --noEmit && npx vitest run && npm run build && npx eslint src` → 모두 통과
- [ ] **Step 6: Commit** — `feat(shoes): 신발 저장소를 SCAS 필드명으로 전환하고 API 문서 갱신`
