# API·데이터통신 규약 — 경찰 신발자국 매칭 프론트엔드

**한 줄 요약**: 무거운 처리(패턴 추출·이미지 검색·각도 보정·유사도)는 **별도 FastAPI 백엔드**가 한다. 이 저장소는 그 백엔드와 HTTP로 통신하는 **순수 클라이언트**이고, 모든 요청은 공용 함수 `backendFetch` 하나를 거쳐 로그인 쿠키와 함께 나간다(§1-1). 통신 계층이 **두 규약(camelCase 변환 / 무변환)**으로 갈리니 항상 어느 계층인지 확인한다.

> `.env`의 `VITE_API_URL`은 **비워 두는 것이 기본**이다(같은 주소 중계 — 브라우저는 프론트 주소만 보고, Vite가 `/crime`·`/shoes`·`/auth`·`/admin`·`/files`·이미지 폴더 요청을 `VITE_PROXY_TARGET`으로 넘긴다). 주소를 분리할 때만 `https://<서버>:8000`을 넣는다(서버 쪽 쿠키 설정 필요).

---

## 0. 지켜야 할 것 (체크리스트)

| # | 규칙 | 강제 |
|---|---|---|
| 1 | 새 읽기쿼리는 `entities/{name}/api`에 `useQuery`로 (TanStack v5) | 필수(신규) |
| 2 | **CRUD·리스트 응답은 camelCase 변환**(`convertKeysToCamelCase`) — `services/crud.js`·`entities/*/api` | 필수 |
| 3 | **이미지 처리 엔드포인트(`services/api.js`)는 camelCase 변환 안 함** — snake/camel 혼재 주의 | 필수(인지) |
| 4 | 이미지는 **base64 data URL**로 오가며, POST 전 `data:image/...;base64,` 접두어 제거 | 필수 |
| 5 | 문양추출 `line_ys`·`render_size`는 **정수** + 이미지 범위 내 clamp (§4) | 필수(백엔드 크래시 방지) |
| 6 | 타임스탬프는 **KST 하드코딩**(`toKstIso` / `+09:00`) | 필수 |
| 7 | 검색 쿼리 키에 **디바운스된 문양 시그니처** + settled 게이트(§5) | 필수(이중요청 방지) |

---

## 1. 스택 — fetch + TanStack Query v5

- 모든 서버 상태(캐시·로딩·에러)는 `useQuery`/`useMutation`이 관리. 컴포넌트에서 raw fetch·`useState` 로딩 플래그 금지.
- 공용 클라이언트: `src/shared/api/client.ts` — `apiGet<T>(path)`, `apiSend(path, method, body)`, `stripDataUrlPrefix`, `stripDataUrl`. 실제 요청은 아래 `backendFetch`가 보낸다.

---

## 1-1. 인증 · 세션 · 중계 (설계서 `police-server/docs/superpowers/specs/2026-11-03-auth-rbac-activity-log-design.md`)

**결론: 백엔드 요청은 `backendFetch`(`src/shared/api/backend-fetch.ts`) 하나로만 보낸다.** 직접 `fetch`를 쓰면 쿠키·세션 만료 처리가 빠진다.

| 상황 | `backendFetch`가 하는 일 | 화면 결과 |
|---|---|---|
| 모든 요청 | `${VITE_API_URL}${path}`로 `credentials: "include"`(쿠키 포함). `path`는 `/`로 시작하는 루트 기준 경로만 받는다 | — |
| 401(세션 없음·만료) — `/auth/login`·`/auth/me` 제외 | `handleSessionEnded()` → `window.location.assign("/login?from=<현재 주소>")` (**전체 새로고침**, 중복 호출 무시) | 로그인 화면 → 다시 로그인하면 원래 주소로 |
| 403(권한 바뀜) | `emitForbidden` → `SessionProvider`가 `GET /auth/me`를 1번 다시 읽음 | 메뉴·화면 권한 갱신. `"비밀번호를 변경해야 합니다"`면 `/password` |
| 보호된 이미지 로드 실패 | `revalidateSession()`(동시 호출 1개로 합침)이 `/auth/me` 확인 | 세션이 끝났으면 위 401과 같음 |

- **쿠키**: 로그인 성공 시 서버가 HttpOnly 세션 쿠키를 심는다. 화면 코드는 토큰을 직접 다루지 않는다.
- **이미지 주소**: 서버는 루트 기준 상대 경로(`/crime_images/...`, `/shoes_images/B/...`, `/crime_outlines/...`, `/crime_history/...`)를 준다. 표시용은 `backendMediaUrl(path)`, 코드로 내려받을 때는 `toBackendPath(url)` → `backendFetch`. 백엔드 이미지를 canvas로 읽을 때 `crossOrigin="use-credentials"`.
- **중계(proxy)**: `vite.config.js`의 `BACKEND_PROXY_PATTERN`(`^/(crime|shoes|auth|admin|files)(/|$|\?)` — `/files`는 증거 파일 API: 원본 올리기 `POST /files/original`·열람 `GET /files/{id}`)과 이미지 폴더 4개를 개발·미리보기 서버가 `VITE_PROXY_TARGET`으로 넘긴다(`secure: false` — 자체 서명 인증서, `changeOrigin: false` — 서버의 요청 출처 검사가 프론트 주소를 보게). 화면 주소 `/crimeRegister`·`/shoesRepository`·`/manage/*`는 중계하지 않는다.
- **목록 API는 끝에 `/`**: `/crime/`, `/shoes/?page=0`(리다이렉트 없이 바로 응답).
- **권한**: 서버가 주는 `features`는 실효 권한(`SHOE_EDIT`면 `SHOE_VIEW` 포함)이다. 프론트는 `hasFeature(user, FEATURES.X)`(관리자는 항상 true)로 메뉴·라우트·버튼을 가린다. 기능 코드 문자열은 `src/entities/session/model/features.ts` 상수만 쓴다.

**인증·관리자 API**(응답 snake → `convertKeysToCamelCase`, 요청 본문 camel 그대로):

| 엔드포인트 | 본문 / 응답 | 프론트 함수 |
|---|---|---|
| `POST /auth/login` | `{userId, password}` → `{user_id, user_nm, user_se, features, password_change_required}` | `login` |
| `POST /auth/logout` · `GET /auth/me` · `POST /auth/password` | — / 위와 같은 모양(401이면 `null`) / `{currentPassword, newPassword}` → 204 | `logout`·`fetchMe`·`changePassword` (`entities/session`) |
| `GET·POST /admin/users`, `PUT /admin/users/{id}`, `PUT …/features`, `POST …/password-reset`·`…/unlock` | 사용자 목록·추가·수정(`{userNm, userSe, useAt}`)·권한 교체(`{features}`)·임시 비밀번호(`{tempPassword}`)·잠금 해제 | `fetchUsers`·`createUser`·`updateUser`·`replaceUserFeatures`·`resetPassword`·`unlockUser` (`entities/admin`) |
| `GET /admin/sessions?user_id&from&to&page`, `GET /admin/sessions/{id}/events`, `GET /admin/events?user_id&result&action_code&from&to&page` | 로그인 기록·기능 기록(50개씩 최신순, `page`는 0부터, 전체 개수 없음 — 50개 미만이면 마지막). 날짜는 KST `YYYY-MM-DD`(끝 날짜 포함) | `fetchSessions`·`fetchSessionEvents`·`fetchEvents` |
| `GET /admin/features` · `GET /admin/actions` | 기능 목록 · 기능 이름표(사용 기록 "기능" 필터) | `fetchFeatures`·`fetchActions` |
| K1 `GET /admin/events?…&target_id` | 대상 번호 거르기(감정물 번호 · 신발 ID 앞부분, 감정번호와 정확히 같으면 그 의뢰의 숫자 번호들까지) | `fetchEvents`(`target_id` 거르기) |
| K2 `GET /admin/audit-events?event_se&actor_id&target_id&target_se&from&to&page` | 중요 행위(감사) 50개씩 최신순 — `event_se` 여러 번 = 그중 하나, 응답에 사슬 지문 `row_hash` | `fetchAuditEvents` · `useAuditEventsQuery`(`entities/admin`) |
| K3 `GET /admin/audit-events/verify?from_id&to_id` | 감사 사슬 구간 검증 `{ checked, broken_at, last_hash }` | `verifyAuditChain` · `useAuditVerifyQuery` |

- 관리자 화면 주소는 `/manage/users`·`/manage/logs`(API `/admin/*`와 겹치지 않게). 서버 거절 문구(예 400 `"관리자는 최소 1명 있어야 합니다"`, 409 `"이미 등록된 아이디입니다"`)는 `ApiError.detail` 그대로 폼·패널 안에 보인다(전역 토스트는 `mutation.meta.inlineError`로 끔).

---

## 2. ⚠ 두 API 계층, 두 규약 (최대 혼선 지점)

### (A) CRUD·리스트 — camelCase 변환함
- `src/services/crud.js`(레거시, 아직 활성) + `src/entities/{crime,shoe}/api`(타입드 승격).
- 서버는 snake_case, 응답을 **`convertKeysToCamelCase`**(`shared/lib`)로 camelCase 변환해서 쓴다.
- crud.js exports: `fetchCrimeData`·`fetchShoesData`·`fetchCurrentShoes`·`fetchHistoryData`·`fetchCrimeRegister`·`fetchPatterns`(PUT 문양 저장). (호출처가 없던 레거시 이력 저장·편집 이미지 저장·신발 수정 함수는 삭제 — 아래 entities 래퍼를 쓴다.)
- entities 타입드 래퍼(신규 정본): `fetchCrimeList`/`fetchCrimeDetail`/`fetchCrimeHistory`/`registerCrime`/`saveCrimeHistory`/`saveCrimeEditImage`(`entities/crime/api/crime-api.ts`), `fetchShoesList`/`fetchShoesCount`/`fetchShoeDetail`/`updateShoe`/`registerShoe`(`entities/shoe/api/shoe-api.ts`). 이들은 `apiGet`/`apiSend`+`convertKeysToCamelCase` 조합.
- **오류 문구**: `apiGet`/`apiSend`는 서버가 400·409를 주면 `ApiError(status, detail)`를 throw한다(`shared/api/client.ts`). 화면은 `detail`(한국어, 예 `"이미 등록된 번호입니다"`)을 그대로 보여 준다(사건 등록 `RegisterStage`, 신발 저장 `ShoeWorkbench`).

**필드 이름 = SCAS 열 이름**(정본: `police-server/docs/superpowers/specs/2026-11-03-scas-postgres-design.md` §4·§5). 서버는 snake로 응답하고 프론트는 camel로 변환해 쓴다. URL 경로(`/crime/...`, `/shoes/...`)는 그대로다.

| 대상 | 서버 응답 키(snake) → 프론트(camel) | 비고 |
|---|---|---|
| 사건(감정물) | `aprthng_no`→`aprthngNo`, `apprsl_reqest_no`→`apprslReqestNo`, `pick_dt`→`pickDt`, `pick_place`→`pickPlace`, `pick_mth_code`→`pickMthCode`, `crime_nm`→`crimeNm`, `rqest_grfc_nm`→`rqestGrfcNm`, `process_sttus`→`processSttus`, `edit_image`→`editImage`, `extracted_raw`→`extractedRaw`, `pidinet_outline`→`pidinetOutline`, `frst_regist_dt`→`frstRegistDt` | `pickDt`는 `"YYYY-MM-DDTHH:MM:SS"` 또는 `null`. 문양은 `[["s21b", 1], ...]`(이름, 필수 0/1 정수) |
| 이력(사건 상세의 목록) | `search_no`→`searchNo`(정수), `frst_regist_dt`→`frstRegistDt`, `ranking`, `mtchg_id`→`mtchgId`(`null`=매칭 없이 저장) | 이력 상세 `GET /crime/history/{search_no}`: `editImage, mtchgId, top/mid/bottom/outline, extractedRaw, pidinetOutline` |
| 신발 | `ftwr_id`→`ftwrId`, `ftwr_group_id`→`ftwrGroupId`, `ftwr_group_nm`→`ftwrGroupNm`, `modl_nm`→`modlNm`, `brand_code`→`brandCode`, `makr_code`→`makrCode`, `colct_place`→`colctPlace`, `colct_year`→`colctYear`, `sexdstn_se`→`sexdstnSe`, `swing_se`→`swingSe`, `ftwr_size`→`ftwrSize` | `ftwrId` 외 메타데이터는 `string \| null` — 화면은 `null`을 빈 칸으로 표시. 문양은 이름 문자열 배열 |

예시(신발 목록 한 행, camel 변환 후):

```json
{ "ftwrId": "00758", "ftwrGroupId": "G038", "ftwrGroupNm": "crocs(크록스)-038", "modlNm": null,
  "brandCode": "B0038", "makrCode": null, "colctPlace": null, "colctYear": "2019",
  "image": "/shoes_images/B/00758.png", "top": ["s21b"], "mid": [], "bottom": [], "outline": [] }
```

**요청 본문(프론트 → 서버, camelCase 그대로)**:

| 엔드포인트 | 본문 키 | 프론트 함수 |
|---|---|---|
| `POST /crime/register` | `image, aprthngNo, apprslReqestNo, pickDt, pickPlace, pickMthCode, crimeNm, rqestGrfcNm` | `registerCrime` |
| `PUT /crime/{aprthng_no}` | `top, mid, bottom, outline, extracted_raw` | `putCrimePatterns` / 레거시 `fetchPatterns` |
| `POST /crime/{aprthng_no}`(이력 저장) | `top, mid, bottom, outline, ranking, mtchgId, editImage, extractedRaw` → 응답 `{"search_no": n}` | `saveCrimeHistory` |
| `POST /shoes/register` | `image, ftwrId, colctPlace, colctYear, makrCode, brandCode, modlNm, top, mid, bottom, outline` | `registerShoe` |
| `PUT /shoes/{ftwr_id}` | 위에서 `image, ftwrId` 제외 | `updateShoe` |

**ID 규칙**(설계서 §5): ID는 **문자열**이다 — `Number()`·`parseInt` 금지(`ftwrId="00758"`의 앞자리 0 보존). 단 `searchNo`만 숫자. `aprthngNo`·`apprslReqestNo`(1~20자)와 `ftwrId`(1~8자)는 영문·숫자·`-`·`_`만, `ftwrId`는 예약어 `count`(`GET /shoes/count`와 겹침) 금지. 화면 검증은 `validateCrimeRegister`(사건)·`validateShoeForm`(신발)이 서버보다 먼저 한다. 그래도 화면 링크·API 경로·정적 이미지 URL에는 방어용 `encodeURIComponent`를 쓴다(`searchDetailPath`·`shoeRepositoryPath`·`sceneImageUrl`·`shoeImageUrl`).

### (B) 이미지 처리 — 변환 안 함
- `src/services/api.js` exports: `imageProcessing`·`patternsExtract`·`imageSearch`·`imageLoad`·`fetchPerspective`·`fetchSimilarity`·`saveEditImage`.
- **camelCase 변환을 하지 않는다.** 같은 필드가 한 곳에선 snake_case, 다른 곳에선 camelCase로 나타날 수 있으니 이 차이를 항상 염두에.

**엔드포인트 카탈로그**(`POST` `/crime/:aprthngNo/...` 위주 — 경로 변수 값은 감정물 번호 `aprthngNo`, `encodeURIComponent` 적용):
| 함수 | 엔드포인트 | body/쿼리 |
|---|---|---|
| `patternsExtract` | `POST /crime/:aprthngNo/patterns_extract` | `{ image, line_ys, render_size, type }` (§4). 신발은 경로에 `shoes`, `image`에 data URL 또는 **원본 `ftwrId` 문자열**(서버 이미지 URL에서 파일명을 잘라 내지 않는다) |
| `imageSearch` | `POST /crime/:aprthngNo/search?page&similarity` | `{ image, top, mid, bottom, outline }` — **필수 문양만**(이름 배열). 응답 `result[]`는 `{ ftwr_id, similarity }` → 프론트 항목 `{ ftwrId, image, similarity }`(`image`는 `/shoes_images/{B\|Shoerinsics}/<ftwrId>.png`) |
| `imageLoad` | `GET /crime/:aprthngNo/image_load?edit` | — (검색·표시용 현장/편집 이미지) |
| `fetchPerspective` | `POST /crime/demo/perspective` | 4점 각도보정(polygon·render_size·image) |
| `fetchSimilarity` | `POST /crime/:aprthngNo/similarity?ftwr_id=` | 쿼리 `ftwr_id`(옛 `model_number`) |
| `saveEditImage` | `POST /crime/:id/edit-save` | `{ image, save_name }` → `{ message, image_path: "/crime_history/<번호>_<정리된 이름>.png" }`. 서버가 파일 이름을 정리하므로 편집 화면(`EditorMode`)은 **이름을 조립하지 않고** `image_path`(`crimeHistoryPath`로 `/crime_history/` 아래인지 확인)로 다시 불러온다. 잘못된 이름은 400 `"저장 경로가 올바르지 않습니다"` |

- 정렬·매칭(`entities/alignment`, `entities/match`)도 이 계층(무변환)이다: 쿼리 `?ftwr_id=`, `GET /crime/:aprthngNo/alignment/latest` 응답 `ftwrId`, `POST /crime/:aprthngNo/match_top10` 응답 `{ matches, aprthng_no, ftwr_id }`(409 `detail`도 같은 키).
- `imageSearch` 응답 `similarity`는 **퍼센트(0~100)**(예 69.99). UI는 0~1을 가정하므로 소비 측에서 `>1이면 /100` 정규화(`RetrievalResultsGrid`).

---

## 2-1. B 단계 API(A~K) — 어느 계층 · 어느 함수

정본: `police-server/docs/superpowers/specs/2026-11-17-pilot-b-stage-api-design.md` §4(번호 A1 · D1 …). 경로 앞부분 `/requests` · `/codes` · `/review-steps` · `/report-versions`도 개발 중계(`BACKEND_PROXY_PATTERN`)에 들어 있다. **계층 표시**: (A) = CRUD 계층(응답 snake → `convertKeysToCamelCase`, 요청 본문 camel), (B) = 이미지 처리 계층(무변환). 쓰기는 **기대 판 번호 `rowVersion`**(또는 판정 `expectedExamId`)을 싣고, 409(「다른 사람이 먼저 고쳤습니다」 · 「접수 먼저 하세요」 …)는 서버 문구 그대로 보이고 다시 읽는다.

| 묶음 | 경로 | 계층 | 프론트(배럴) |
|---|---|---|---|
| A 사건 | A1 `GET /requests`(키셋 — `q · no · aprthng · flow · result · awaiting · unsearched · mine · src · cursor · limit`, 전체 건수 없음) · A2 `GET /requests/{id}` · A3 `PUT /requests/{id}` · A4 `POST /requests/{id}/receive` · A6 `POST /crime/register` · A7 `GET /codes/{group}`(`ORG` = 관서) · A8 `PUT /crime/{no}/info` | (A) | `useRequestList` · `useRequestDetail`(`@/entities/request`), `useSaveCaseInfo`(A3 → A8 순서) · `useReceiveRequest`(`@/features/case-info`), `registerCrime`(`@/entities/crime`), `useCodes`(`@/entities/code`) |
| B 이미지 | B1 `POST /files/original`(multipart) · B2 `GET /files/{id}` · B3 `GET /crime/{no}/edits` · B4 `POST …/edits` · B5 `POST …/edits/revert` | (A) — B1 은 응답이 이미 camel | `uploadOriginal` · `useEditHistory` · `editFileUrl`(`@/entities/crime`), `useSaveEditStep` · `useRevertEdit`(`@/features/crime-edit`) |
| C 문양 | C1 `GET /crime/{no}/patterns` · C2 `PUT /crime/{no}`(`meta` · `soleText` · `rowVersion`) · C4 `GET /codes/pattern-kinds`(키 = 문양 이름이라 무변환) | (A) | `useCrimePatterns`(`@/entities/crime`), `useSavePatterns`(`@/features/patterns-extract`), `usePatternKinds`(`@/entities/code`) |
| C3 추출 | `POST /crime/{no}/patterns_extract`(좌표 계약 §4 그대로, 응답 머리 실행 번호) | (B) | `extractCrimeWithRun` · `extractShoeWithRun`(`@/features/patterns-extract`) |
| D 검색 | D1 `POST /crime/{no}/search`(`query · pending · record · inputFileId` …) · D2 `GET /crime/{no}` · D3 `GET /crime/history/{search_no}` · D4 `GET …/results?page&size` | D1 (B), D2~D4 (A) | `useRunSearch`(`@/features/crime-search`), `useSearchHistory` · `fetchSearchResultsPage`(`@/entities/crime`) |
| E 본 위치 · 확인대상 | E1 `PUT /crime/history/{search_no}/seen` · E2 `GET /crime/{no}/targets` · E3 `POST …/targets` · E4 `DELETE …/targets/{search_no}/{ftwr_id}` | (A) | `useSaveSeen`(`@/features/crime-search`), `useTargets`(`@/entities/crime`), `useToggleTarget`(`@/features/targets`) |
| F 대조 | F1 `POST /crime/{no}/similarity?ftwr_id=&record=true` · F2 `GET /crime/{no}/comparisons?ftwr_id=` | F1 (B), F2 (A) | `useRecordComparison`(`@/features/crime-search`), `useComparisons`(`@/entities/crime`) |
| G 판정 | G1 `GET /requests/{id}/confirm` · G2 `PUT /crime/{no}/examination`(`result · opinionCn · expectedExamId · rowVersion`) · G3 `GET /crime/{no}/examinations` · G4 `POST /requests/{id}/reopen` | (A) | `useConfirmView`(`@/entities/request`), `useSaveJudgement`(`@/features/judgement`), `useExamHistory`(`@/entities/crime`). G4 화면은 범위 밖 |
| H 교차 검증 | H1 `GET /requests/{id}/reviewers` · H2 `POST /requests/{id}/cross-review` · H3 `GET /review-steps` · H4 `POST /review-steps/{id}/decision` · H5 `POST /review-steps/{id}/withdraw` | (A) | `useReviewers`(`@/entities/request`), `useRequestCrossReview` · `useWithdrawCrossReview`(`@/features/cross-review`). H3 · H4 화면은 범위 밖 |
| I 감정서 | I1 `GET /requests/{id}/report` · I2 `POST …/report/versions` · I3 `PUT /report-versions/{id}` · I4 `POST /report-versions/{id}/send` · I5 `POST /requests/{id}/report/correct` | (A) | 화면 범위 밖(API · 서버 테스트만) |
| J 신발 | J1 `GET /shoes/?…`(거르기 `ftwr_id · makr_code · brand_code · sex · regist_org · approval · pattern_input · group_nm · stage` …) · J2 `GET /shoes/count` · J4 · J5 그대로 · J6 `PUT /shoes/{id}/patterns` · J7 `POST /shoes/{id}/approve` · J8 `GET /shoes/stages` | (A) | `fetchShoesList` · `shoeFilterQuery` · `fetchShoeStages`(`@/entities/shoe`), `saveShoePatterns` · `approveShoe`(`@/features/shoe-repository`) |
| K 기록 | K1 `GET /admin/events?target_id=` · K2 `GET /admin/audit-events` · K3 `GET /admin/audit-events/verify` | (A) | `fetchAuditEvents` · `verifyAuditChain` · `useAuditEventsQuery` · `useAuditVerifyQuery`(`@/entities/admin`) |

- `/cases`(새 사건관리)는 전역 사건 store(`GET /crime/` 전체)를 쓰지 않는다 — 목록 A1 · 창 A2 · 탭마다 위 쿼리. 전체 목록 자동 조회는 옛 화면 주소에서만(`SessionProvider`).
- 쿼리 키: 의뢰 쪽은 모두 `["request", …]` 아래 — 판정 · 접수 · 사건 정보 · 문양 · 편집 · 검색 기록 저장 뒤 `["request"]` 를 무효화해 목록 · 창 · 결과 확인이 함께 새로 읽는다.

## 3. 이미지 파이프라인 (base64 + canvas)

- 이미지는 **base64 data URL**로 오간다. **모든 POST 전 `data:image/...;base64,` 접두어 제거**(`stripDataUrl`/`stripDataUrlPrefix`, 레거시는 수동 `.split(",")`). 참고: `registerCrime`·`registerShoe`·`saveCrimeHistory`(`editImage`)·`saveCrimeEditImage`·레거시 `fetchCrimeRegister`·`saveEditImage`.
- 클라이언트 변환은 canvas 기반:
  - `hooks/useCalibration.js` — 4점 **각도 보정**(canvas 좌표 → 상대 좌표 → `naturalWidth/Height` 픽셀 → `/crime/demo/perspective` POST).
  - `components/Canvas.jsx` — 크롭·회전.
  - `utils/get-input-change.js`의 `rotateImage`/`resizeImage` — 오프스크린 canvas 회전 + 최대 1000px 다운스케일(둘 다 base64 반환).

---

## 4. ⚠ 문양추출 좌표 계약 (백엔드 크래시 방지 — 실제 사고)

`patternsExtract` body의 `line_ys`(상/중/하 경계선 y)·`render_size`는 **정수 + 이미지 범위 내**여야 한다. 정본 소유: `features/patterns-extract/model/use-pattern-manager.ts`.

- **정수 필수**: `getBoundingClientRect()`·드래그 좌표는 소수(서브픽셀)라, 전송 전 `Math.round`. 소수를 보내면 백엔드 Pydantic이 `int_from_float`(422)로 거절.
- **범위 clamp 필수**: 두 경계선을 `[1, renderH-1]`로 clamp하고 오름차순 보장. 범위를 벗어나면 서버가 이미지 밖을 슬라이스 → NumPy 빈 배열 → `Image.fromarray`가 `tile cannot extend outside image`(500)로 크래시. (네 영역 top/mid/bottom/all 모두 최소 1행 확보.)
- **좌표계 불변식**: `PatternCanvas`의 `recompute()`(canvas 비트맵 = 표시 이미지 rect), `toCanvasY`, `<canvas absolute inset-0 size-full>`, img 사이징(`h-full w-auto object-contain`)은 **절대 바꾸지 않는다**. 추출은 `canvasRef.getBoundingClientRect()`를 `render_size`로, `lineState.lineYs`를 `line_ys`로 보내므로 두 값의 좌표계가 일치해야 한다. 시각 오버레이(틴트·신발 영역 도구·라벨)는 `pointer-events-none` 순수 장식이며 좌표 판정·전송에 관여 금지.
- 순수 좌표 수학은 `features/patterns-extract/lib/line-geometry.ts`(vitest로 경계값 검증).

---

## 5. 검색 — 필수 문양 실시간 재검색 (이중요청 함정)

통합 커맨드센터의 인라인 검색(`CrimeDetailPage`)은 essential(필수) 문양을 바꿀 때마다 재검색한다. 정본 패턴:

- 검색 body 문양 = `filteredPatterns(currentCrimeData)`(필수 토글만, 이름 배열).
- **쿼리 키에 디바운스된 문양 시그니처**를 실어 재조회 구동: `patternsKey = useDebouncedValue(JSON.stringify(searchPatterns), 300)`(`shared/lib/use-debounced-value`).
- **키와 body는 동일 소스**에서: body는 `JSON.parse(patternsKey)`로. 키(디바운스)와 body(라이브)가 어긋나면 요청이 두 번 나간다.
- **settled 게이트**: `enabled: … && patternsKey === JSON.stringify(searchPatterns)`. 디바운스가 라이브와 일치할 때만 발사 → 스테일 값으로 먼저 나가는 빈 요청(이중요청) 원천 차단.
- 필수 0개여도 빈 body로 전체 검색 가능(가드 없음).

---

## 6. KST 타임존 — 하드코딩

- 타임스탬프는 KST 고정: `shared/lib/kst.ts`의 `toKstIso`(`new Date(Date.now() + 9*60*60*1000).toISOString().replace("Z","+09:00")`). 새 타임스탬프도 이 방식.
- 이력 저장 시각(`frstRegistDt`)은 이제 **서버 시각**을 쓰므로 프론트가 보내지 않는다(설계서 §4-4·§4-5).

---

## 7. snake ↔ camel 변환

- CRUD 응답은 `convertKeysToCamelCase`(`shared/lib/case.ts`). **수동 매핑 금지.** 변환 후엔 camelCase로 접근(snake로 접근하면 조용히 `undefined`).
- 이미지 API(`services/api.js`)는 변환 안 하므로, 그 응답은 서버 원형(snake) 그대로 다룬다.
