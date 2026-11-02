# 로그인 · 권한 · 사용 기록 — 프론트 실행 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 로그인 화면으로 시작하고, 사용자 권한에 맞는 메뉴·화면만 보여 주며, 관리자에게 사용자·권한 관리와 사용 기록 화면을 제공한다.

**Architecture:** ① 모든 백엔드 요청을 공용 함수 `backendFetch` 하나로 모아 쿠키를 함께 보내고, 401이면 "세션 끝남"(페이지 전체를 새로 불러 `/login?from=`으로), 403이면 "권한 바뀜"(세션 정보 1회 재확인) 이벤트를 낸다. 서버가 주는 이미지 주소는 루트 기준 상대 경로이며 `backendMediaUrl()`로 앞부분을 붙인다. ② Vite 개발 서버가 API·이미지를 백엔드로 중계해 브라우저 입장에서는 같은 주소(same-origin)가 된다(설계서 §3-1). ③ `features/auth`의 `SessionProvider`가 시작 때 `GET /auth/me`로 세션을 복원하고, 라우트는 `RequireAuth` → `RequireFeature` 가드로 감싼다. ④ 새 화면은 현재 과학수사 다크 팔레트·`TechCorners`·`DotGrid`/`GlowOrb`를 쓰고, romang의 표·필터 막대·상태 칩·타임라인 구성을 따른다.

**Tech Stack:** React + TypeScript + Vite, React Router v7, TanStack Query v5, Zustand, shadcn/ui + Tailwind 4, Vitest + MSW

**Spec:** `../police-server/docs/superpowers/specs/2026-11-03-auth-rbac-activity-log-design.md`(이하 "설계서"). 서버 계약은 설계서 §6과 `police-server/docs/superpowers/plans/2026-11-03-auth-rbac-log-server.md`. 선행: `docs/superpowers/plans/2026-11-03-scas-field-rename.md` 완료.

## Global Constraints

- 저장소 규약(`CLAUDE.md`): FSD 단방향, Tailwind 전용, 인라인 `style` 금지(좌표 예외만), 한국어 문자열 리터럴, `@/` 별칭, 배럴 공개, 파일명 규칙, 작업 직후 커밋. 완료 기준: 각 Task는 그 Task 테스트 + 변경 파일 `npx eslint` + `npx tsc --noEmit`, Task 6에서 전체 `npx vitest run` + `npm run build`.
- 색: 패널 `#0B121D`, 보더 `#1E2A3C`, 액센트 `#4A9EFF`/`#3B82F6`, 실패·필수 `#EF4444`, 성공 teal `#2DD4BF`, 권한 없음 amber `#F59E0B`, 보조 글자 `#8A93A6`.
- 기능 코드 문자열은 `src/entities/session/model/features.ts` 상수만. 서버가 주는 `features`는 이미 실효 권한(`SHOE_EDIT`면 `SHOE_VIEW` 포함)이므로 프론트에서 다시 펼치지 않는다.
- 권한 없는 메뉴는 숨긴다(비활성 표시 금지).
- shadcn 부품이 필요하면 `npx shadcn@2.1.8 add <이름>`(dialog, switch, table, tabs, label, checkbox, select)으로 `src/shared/ui`에 넣고 `package-lock.json`에 고정.
- `VITE_API_URL`이 빈 값이면 모든 백엔드 URL은 상대 경로(`/crime/...`)다. 이미지 URL도 같은 규칙(`backendMediaUrl("/crime_images/...")`).
- 관리자 화면 주소는 `/manage/users`, `/manage/logs`(API `/admin/*`와 겹치지 않게 — 설계서 §3-1). 목록 API는 끝에 `/`를 붙여 부른다(`/crime/`, `/shoes/?page=0`).
- 세션이 끝나면(로그아웃, 401) `window.location.assign("/login?from=" + encodeURIComponent(현재 경로))`로 **전체 새로고침** 이동한다(설계서 §7 마지막 문단). 이전 계정의 진행 중 요청·쿼리 캐시·전역 상태를 따로 지우는 코드는 만들지 않는다.
- 뒤로 가기 캐시(bfcache — 브라우저가 이전 페이지를 메모리째 보관했다가 되살리는 기능) 대비: `pagehide`에서 보호 화면 루트에 `invisible` 클래스를 즉시 붙이고, `pageshow`의 `event.persisted === true`면 즉시 `location.reload()`(`SessionProvider`에서 등록).

## Review Focus

- 권한 없는 화면 주소를 직접 입력해도 화면이 보이지 않고 안내 후 허용된 첫 화면으로 이동 → Task 2 `RequireFeature redirects`
- 사용 중 세션이 만료되면(어느 API든 401, 이미지 처리 API 포함) 로그인 화면으로 가고, 다시 로그인하면 원래 주소로 복귀 → Task 1 `image api 401 emits unauthorized`, Task 3 `returns to original path after re-login`
- A로 로그인했다가 로그아웃하고 B로 로그인하면 A가 보던 사건 목록·검색 결과가 남아 있지 않음(전체 새로고침) → Task 4 `logout does full reload`, Task 1 `401 does full reload to login with from`
- 관리자가 권한을 회수하면 그 사용자가 다른 창을 보다 돌아오는(포커스) 순간 메뉴가 사라짐 → Task 2 `refreshes session on focus`
- 신발 편집 권한이 없는 사용자가 신발 화면에서 문양 추출·저장·편집 시트를 쓸 수 없음 → Task 6 `read-only workbench hides mutations`

---

### Task 1: 공용 백엔드 요청 함수 · 중계 설정 · 세션/관리자 API

**Files:**
- Create: `src/shared/api/backend-fetch.ts`(+ test), `src/entities/session/{index.ts, model/features.ts, model/types.ts, api/session-api.ts, api/session-api.test.ts}`, `src/entities/admin/{index.ts, model/types.ts, api/admin-api.ts, api/admin-api.test.ts}`
- Modify: `vite.config.js`(server.proxy·preview.proxy), `.env.example`, `src/shared/api/client.ts`, `src/services/api.js`, `src/services/crud.js`, `src/entities/match/api/match-api.ts`, `src/shared/lib/image/resolve-image.ts`, `src/pages/EditorMode.jsx`, `src/components/ImageLoader.jsx`, 백엔드 이미지를 `crossOrigin`으로 읽는 `crop-image.ts`·`use-image-natural-size.ts`·`MatchCorrespondenceViewer.tsx`(`"anonymous"` → `"use-credentials"`, 관련 테스트 기대값 포함)

**Interfaces:**
- Produces:
  - `backendFetch(path: string, init?: RequestInit) -> Promise<Response>`: `path`는 루트 기준 상대 경로만 받음(`/`로 시작하지 않으면 `Error`). `${VITE_API_URL}${path}`로 `credentials: "include"` 요청. 401이고 경로가 `/auth/login`·`/auth/me`가 아니면 `handleSessionEnded()` 호출(= `window.location.assign("/login?from=...")`, 중복 호출 무시). 403이면 `emitForbidden({ status, detail })`(`response.clone()`으로 본문을 읽어 원래 응답은 보존). 응답 객체를 그대로 반환
  - `onForbidden(handler) -> () => void`, `emitForbidden(info)`, `handleSessionEnded()` (같은 파일). `handleSessionEnded`는 테스트에서 바꿔 끼울 수 있게 `setSessionEndedHandler(fn)` 제공
  - `backendMediaUrl(path: string | null) -> string | null`(`src/shared/api/media-url.ts`): `null`이면 `null`, 아니면 `${VITE_API_URL}${path}`. 반대 방향 `toBackendPath(url: string) -> string | null`: 루트 기준 상대 경로는 그대로, `VITE_API_URL`로 시작하는 절대 주소는 경로+쿼리만 남김, 그 외(외부 주소)는 `null`. 이미지 로더(`resolve-image.ts` 등)는 `toBackendPath`로 바꾼 값을 `backendFetch`에 넘기고, data URL·순수 base64는 기존처럼 그대로 처리. `ImageLoader.jsx`는 `saveEditImage` 전에 이 공용 로더로 base64를 만든다(경로를 그대로 서버에 보내지 않음). 서버 응답의 `image`·`pidinetOutline` 등과 직접 만드는 이미지 주소(`/shoes_images/B/...`) 모두 이 함수를 거친다. 기존 `${url}/...` 문자열 이어 붙이기를 이 함수로 교체
  - `revalidateSession() -> Promise<void>`(`src/shared/api/backend-fetch.ts`): 보호된 이미지 로드 실패 시 호출. 동시 호출은 하나로 합치고(진행 중이면 같은 Promise 반환), `GET /auth/me`가 401이면 `handleSessionEnded()`. `<img onError>`·`new Image().onerror`·이미지 로더 3곳에 연결
  - 목록 호출 경로 수정: `fetchCrimeList` → `/crime/`, `fetchShoesList` → `/shoes/?page=`, 레거시 `services/crud.js`도 동일
  - `apiGet`/`apiSend`와 `services/*.js`, `match-api.ts`, 이미지 로더 3곳의 모든 `fetch`를 `backendFetch`로 교체
  - `vite.config.js` proxy(dev·preview 동일): 키 `'^/(crime|shoes|auth|admin)(/|$|\\?)'`와 `'/crime_images/'`, `'/crime_history/'`, `'/crime_outlines/'`, `'/shoes_images/'` → `target: process.env.VITE_PROXY_TARGET ?? 'https://localhost:8000'`, `secure: false`(자체 서명 인증서), `changeOrigin: false`(서버의 `Origin` 검사가 프론트 주소를 보도록). `loadEnv`로 `.env`의 `VITE_PROXY_TARGET`를 읽는다
  - `.env.example`: `VITE_API_URL=`(빈 값, 설명: "비우면 같은 주소로 중계") + `VITE_PROXY_TARGET=https://localhost:8000`
  - `FEATURES`, `type FeatureCode`, `FEATURE_LABELS`(설계서 §2), `SessionUser = { userId; userNm; userSe: "ADMIN" | "USER"; features: FeatureCode[]; passwordChangeRequired: boolean }`
  - `login`, `logout`, `fetchMe`(401 → `null`), `changePassword`
  - `entities/admin`: `fetchUsers`, `createUser`, `updateUser`, `replaceUserFeatures`, `resetPassword`, `unlockUser`, `fetchSessions(filters)`, `fetchSessionEvents(sessionId)`, `fetchEvents(filters)`, `fetchFeatures`, `fetchActions` — 경로·본문·응답 모양은 설계서 §6, 응답은 `convertKeysToCamelCase`

- [ ] **Step 1: 실패하는 테스트** — `backend-fetch.test.ts`: `sends credentials include`, `401 does full reload to login with from`(교체한 핸들러가 `/login?from=%2Fsearch%2Fabc`로 1번만 호출), `does not end session for /auth/me`, `image api 401 ends session`(`imageSearch`), `403 emits forbidden and preserves body`, `rejects absolute path`, `revalidateSession dedupes` / `media-url.test.ts`: `prefixes VITE_API_URL`, `null stays null`, `toBackendPath handles relative, configured absolute, foreign`(빈 `VITE_API_URL`과 `https://srv:8000` 두 설정 모두) / `resolve-image.test.ts`: `loads root-relative and configured absolute`, `keeps data url` / `list paths have trailing slash`(MSW에서 `/crime/`·`/shoes/?page=0`으로 받음, 리다이렉트 없음) / `session-api.test.ts`: `login returns camel user`, `fetchMe returns null on 401` / `admin-api.test.ts`: `fetchSessions passes filters as query`, `replaceUserFeatures sends features array` / `vite-proxy.test.ts`(`vite.config.js`의 정규식 키를 import해 검사): `/crime/abc`·`/crime?x=1`·`/auth/me` 일치, `/crimeRegister`·`/search/abc` 불일치
- [ ] **Step 2: 실패 확인** — `npx vitest run src/shared/api src/entities/session src/entities/admin src/services`
- [ ] **Step 3: 구현** — 정규식 키는 `export const BACKEND_PROXY_PATTERN`으로 `vite.config.js`에서 내보내 테스트가 같은 값을 쓴다
- [ ] **Step 4: 통과 확인**
- [ ] **Step 5: Commit** — `feat(auth): 공용 백엔드 요청 함수·같은 주소 중계·세션/관리자 API`

### Task 2: 세션 상태 · 라우트 가드 · 라우터 재구성 · 계정 전환 정리

**Files:**
- Create: `src/features/auth/{index.ts, model/session-store.ts, model/feature-routes.ts, ui/SessionProvider.tsx, ui/RequireAuth.tsx, ui/RequireFeature.tsx, ui/RequireAdmin.tsx, ui/NoPermissionNotice.tsx}` + 각 테스트
- Modify: `src/main.jsx`, `src/App.jsx`, `src/entities/crime/model/crime-store.ts`(`reset()` 추가), `src/widgets/crime-register-stage/ui/RegisterStage.tsx`(등록 후 목록 새로고침은 `CRIME_SEARCH`가 있을 때만)

**Interfaces:**
- Consumes: Task 1
- Produces:
  - 렌더 순서(`main.jsx`): `AppProviders → BrowserRouter → SessionProvider → App`. `App.jsx`에서 `BrowserRouter` 제거
  - `useSessionStore`: `{ user: SessionUser | null; status: "loading" | "authenticated" | "anonymous"; setUser; clear }`, `hasFeature(user, code)`(관리자는 항상 true)
  - `FEATURE_ROUTES = [CRIME_REGISTER → "/crimeRegister", CRIME_SEARCH → "/search", SHOE_VIEW → "/shoesRepository"]`, `firstAllowedPath(user) -> string | null`
  - `SessionProvider`: 시작 시 `fetchMe()`. **이미 로그인된 상태에서** 재확인한 `fetchMe()`가 `null`이면 `handleSessionEnded()`(전체 새로고침), 돌려받은 `userId`가 현재와 다르면(다른 탭에서 다른 계정으로 로그인) store를 바꾸기 전에 `window.location.reload()`. 로그인된 상태에서는 `/login`에 들어와도 첫 화면으로 보냄(같은 문서에서 다른 계정 로그인 금지). `onForbidden` → `fetchMe()` 1회(진행 중이면 합침), 응답의 `detail`이 `"비밀번호를 변경해야 합니다"`면 `/password`로. 창 포커스·보호된 화면 이동 시에도 `fetchMe()` 재확인. 재확인 결과로 store를 갱신하면 현재 화면의 `RequireFeature`가 다시 평가됨
  - 사건 목록 로딩: `App.jsx`의 마운트 시 `refetch()` 삭제 → `SessionProvider`가 "자격"(`status === "authenticated"` && `!passwordChangeRequired` && `hasFeature(CRIME_SEARCH)`)이 false→true로 바뀔 때와 사용자 ID가 바뀔 때 `useCrimeStore.refetch()`, true→false로 바뀌면 `useCrimeStore.getState().reset()`
  - `RequireAuth`: `loading` → 전체 화면 로딩, `anonymous` → `/login?from=<현재 경로>`, `passwordChangeRequired` → `/password`
  - `RequireFeature({ code, children })`: 권한 없으면 `toast.error("접근 권한이 없습니다")` 후 `firstAllowedPath`, 그것도 없으면 `NoPermissionNotice`("권한이 없습니다. 관리자에게 문의하세요" + 로그아웃 버튼)
  - 라우터: `/login`·`/password`는 셸 밖(이 Task에서는 `/login`·`/password`에 임시 자리표시 컴포넌트, Task 3에서 교체). 셸 라우트 전체를 `RequireAuth`로, `/crimeRegister` = `CRIME_REGISTER`, `/search/*` = `CRIME_SEARCH`, `/shoesRepository*` = `SHOE_VIEW`, `/editormode` = `CRIME_SEARCH`, `/manage/*` = `RequireAdmin`. `/` → `firstAllowedPath`

- [ ] **Step 1: 실패하는 테스트** — `RequireFeature redirects`(`CRIME_REGISTER`만 → `/search` 진입 시 `/crimeRegister` + 토스트), `no-feature user sees notice`, `refreshes session on focus`(포커스 → `fetchMe` 호출, 응답에서 `CRIME_SEARCH`가 빠지면 현재 `/search` 화면에서 나감), `refreshes once on forbidden`(403 두 번 연달아 → `fetchMe` 1회), `focus-detected expiration reloads`(포커스 시 `fetchMe`가 null → `handleSessionEnded` 호출), `cross-tab account switch reloads`(다른 `userId` → `location.reload` 호출, store는 바뀌지 않음), `bfcache restore reloads`(`pageshow` `persisted=true` → `location.reload`, `pagehide` 시 보호 화면 숨김 클래스 적용), `admin passes RequireAdmin`, `user blocked from /manage/users`, `crime list loads only when eligible`(비밀번호 변경 필요 상태에서는 안 부름 → 변경 후 자격이 생기면 1회 부름 → 권한 회수 시 store 비움)
- [ ] **Step 2: 실패 확인** — `npx vitest run src/features/auth src/entities/crime src/widgets/crime-register-stage`
- [ ] **Step 3: 구현**
- [ ] **Step 4: 통과 확인** + `npx tsc --noEmit`
- [ ] **Step 5: Commit** — `feat(auth): 세션 복원·라우트 가드·계정 전환 시 데이터 초기화`

### Task 3: 로그인 화면 + 비밀번호 변경 화면

**Files:**
- Create: `src/pages/login/{index.ts, ui/LoginPage.tsx, ui/LoginPage.test.tsx}`, `src/pages/password-change/{index.ts, ui/PasswordChangePage.tsx, ui/PasswordChangePage.test.tsx}`
- Modify: `src/App.jsx`(Task 2 자리표시를 실제 화면으로)

**Interfaces:**
- Consumes: Task 1 `login`/`changePassword`/`fetchMe`, Task 2 store·`firstAllowedPath`
- 로그인 화면: 전체 화면 `#060B14` 바탕 + `DotGrid` + `GlowOrb` 2개. 가운데 카드(최대 너비 400px, `#0B121D`, 보더 `#1E2A3C`, `TechCorners`). 위에서부터 영문 라벨 `FORENSIC FOOTWEAR PLATFORM`(자간 넓게, `#4A9EFF`), 제목 "족적 감정 플랫폼", 아이디, 비밀번호(표시/숨김 토글), "아이디 저장" 체크(`localStorage` 키 `police.rememberedUserId`, try/catch), 로그인 버튼(로딩 중 "로그인 중…"). 오류는 버튼 위 빨간 문구(서버 `detail` 그대로). 성공 시 store 설정 → 쿼리 `from`(같은 사이트 내부 경로만 허용 — `/`로 시작하고 `//`로 시작하지 않을 때) 또는 `firstAllowedPath`
- 비밀번호 변경: 같은 카드, 현재·새·새 확인. 8자 미만, UTF-8 72바이트 초과(`new TextEncoder().encode(v).length > 72`), 확인 불일치는 클라이언트에서 막음(설계서 §3 문구). 성공 시 `fetchMe()`로 store 갱신 후 첫 화면

- [ ] **Step 1: 실패하는 테스트** — `logs in and navigates to first allowed`, `shows server detail on 401`, `remembers user id`, `forces password change`(`passwordChangeRequired: true` → `/password`), `returns to original path after re-login`(`/login?from=%2Fsearch%2Fabc`에서 로그인 → `/search/abc`), `ignores external from`(`from=//evil.example` → 첫 화면), `PasswordChangePage validates mismatch and 72 bytes`
- [ ] **Step 2: 실패 확인**
- [ ] **Step 3: 구현**
- [ ] **Step 4: 통과 확인**
- [ ] **Step 5: Commit** — `feat(auth): 로그인·비밀번호 변경 화면`

### Task 4: 사이드바 — 권한별 메뉴, 관리 구역, 사용자 블록, 로그아웃

**Files:**
- Modify: `src/widgets/app-shell/model/nav-items.ts`, `src/widgets/app-shell/ui/Sidebar.tsx`
- Create: `src/widgets/app-shell/ui/Sidebar.test.tsx`, `src/widgets/app-shell/model/nav-items.test.ts`

**Interfaces:**
- Consumes: Task 1 `logout`·`handleSessionEnded`, Task 2 store
- `NavItem`에 `feature?: FeatureCode`, `adminOnly?: boolean`. 사건 등록=`CRIME_REGISTER`, 사건 조회=`CRIME_SEARCH`, 신발=`SHOE_VIEW`, 감정 의뢰·감정 결과=`CRIME_SEARCH`. 관리 구역(라벨 `ADMIN`): "사용자·권한"(`/manage/users`, `UserCog`), "사용 기록"(`/manage/logs`, `ScrollText`), `adminOnly: true`
- `visibleNavItems(user: SessionUser) -> NavItem[]`
- 하단 사용자 블록: `ID: KCSI_001` → `ID: {userId}`, 이름, 구분 칩(관리자=blue, 사용자=회색). 설정 버튼은 `/password`로. 로그아웃: `logout()` 후(실패해도) `window.location.assign("/login")` 전체 새로고침

- [ ] **Step 1: 실패하는 테스트** — `visibleNavItems hides forbidden`, `admin sees admin section`, `logout does full reload`(`/login`으로 `location.assign` 1회)
- [ ] **Step 2: 실패 확인**
- [ ] **Step 3: 구현**
- [ ] **Step 4: 통과 확인**
- [ ] **Step 5: Commit** — `feat(shell): 권한별 메뉴와 실제 로그아웃`

### Task 5: 관리자 — 사용자·권한 관리 화면

**Files:**
- Create: `src/pages/manage-users/{index.ts, ui/ManageUsersPage.tsx}`, `src/features/admin-users/{index.ts, ui/UserTable.tsx, ui/UserDetailPanel.tsx, ui/FeatureToggles.tsx, ui/CreateUserDialog.tsx, ui/PasswordResetDialog.tsx, model/use-admin-users.ts}` + 테스트
- Modify: `src/App.jsx`(`/manage/users`)

**Interfaces:**
- Consumes: Task 1 `entities/admin`, Task 2 `RequireAdmin`
- `use-admin-users.ts`: `useUsersQuery()`, `useCreateUser()`, `useUpdateUser()`, `useReplaceFeatures()`, `useResetPassword()`, `useUnlockUser()` — 성공 시 사용자 목록 무효화. 자기 자신을 수정했으면 `fetchMe()`로 세션 갱신
- 좌측 `UserTable`(아이디, 이름, 구분 칩, 상태 칩[사용=teal / 잠금=amber / 중지=회색], 마지막 로그인 KST `YYYY-MM-DD HH:mm`), 상단 "사용자 추가". 우측 `UserDetailPanel`: 이름, 구분 선택, `FeatureToggles`(4개 스위치 + 저장, `SHOE_EDIT`를 켜면 `SHOE_VIEW`도 켜진 것으로 표시하고 끌 수 없게), 비밀번호 초기화 다이얼로그, 잠금 해제(잠긴 경우만), 사용 중지/재사용. 관리자 선택 시 토글 대신 "관리자는 모든 기능을 사용할 수 있습니다"
- `CreateUserDialog`: 아이디(4~20자 영문·숫자·_), 이름, 구분, 임시 비밀번호(8자+, 72바이트 이하), 기능 체크박스 4개

- [ ] **Step 1: 실패하는 테스트** — `toggles and saves features`, `creates user`, `shows server guard message`(400 `"관리자는 최소 1명 있어야 합니다"`), `admin selection hides toggles`, `unlock button only when locked`, `shoe edit implies view in toggles`
- [ ] **Step 2: 실패 확인**
- [ ] **Step 3: 구현**
- [ ] **Step 4: 통과 확인**
- [ ] **Step 5: Commit** — `feat(admin): 사용자·권한 관리 화면`

### Task 6: 관리자 — 사용 기록 화면 + 신발 화면 보기 전용 모드 + 전체 검증

**Files:**
- Create: `src/pages/manage-logs/{index.ts, ui/ManageLogsPage.tsx}`, `src/features/admin-logs/{index.ts, ui/LogFilterBar.tsx, ui/SessionTable.tsx, ui/SessionEventTimeline.tsx, ui/EventTable.tsx, ui/ResultChip.tsx, model/use-admin-logs.ts}` + 테스트
- Modify: `src/App.jsx`(`/manage/logs`), `src/pages/EditorMode.jsx`·`src/components/ImageLoader.jsx`(편집본 저장 응답의 `image_path`로 이미지를 다시 불러옴 — 파일명을 조립하지 않음, `/crime_history/`로 시작하는지 확인), `src/pages/shoe-repository/ui/ShoeRepositoryPage.tsx`, `src/widgets/shoe-workbench/ui/ShoeWorkbench.tsx` 및 그 하위 패널

**Interfaces:**
- Consumes: Task 1·2
- `LogFilterBar`: 사용자(전체 + 목록), 기간(기본 최근 7일), 결과(전체/실패만/권한 없음), 기능(`fetchActions` 목록), "필터 초기화". 결과·기능 필터는 기능 기록 탭에만 적용
- 탭: 로그인 기록 / 기능 기록. `SessionTable` 열: 사용자(이름·ID), 로그인, 로그아웃(없으면 "사용 중"), 종료 사유(로그아웃/시간 초과/만료/관리자 종료/비밀번호 초기화), IP, 이벤트 수, 실패 수(0이 아니면 빨간 숫자). 행을 펼치면 `SessionEventTimeline`(시각 열 44px | 기능 이름 + 대상 ID | `ResultChip`, 실패 행은 펼쳐서 상태 코드·오류 코드·오류 메시지)
- `EventTable` 열: 시각, 사용자, 기능, 대상, 결과, 상태 코드, 소요(ms), 오류 메시지(말줄임, 펼치면 전체)
- `ResultChip`: `SUCCESS` 성공 teal / `FAIL` 실패 red(경고 아이콘) / `DENIED` 권한 없음 amber. 50개 단위 "더 보기"
- 신발 화면 보기 전용: `ShoeWorkbench`에 `canEdit: boolean` prop(= `hasFeature(SHOE_EDIT)`). `false`이면 신규 등록 탭·문양 추출·문양 추가/삭제·입력 편집·저장/초기화·편집 시트 열기를 모두 숨기고, 해당 콜백도 실행되지 않게 막음. `?mode=new|edit`로 들어와도 보기 모드

- [ ] **Step 1: 실패하는 테스트** — `filters fail only`(쿼리 `result=FAIL`), `expands session timeline`, `ResultChip labels`, `read-only workbench hides mutations`(`canEdit=false` → 저장·추출 버튼 없음, `?mode=new` 진입 시 보기 모드)
- [ ] **Step 2: 실패 확인**
- [ ] **Step 3: 구현**
- [ ] **Step 4: 문서** — `docs/api-communication.md`에 인증 절(공용 `backendFetch`, 쿠키, 401 처리, 중계), `README.md`의 `.env` 표를 `VITE_API_URL`(빈 값 권장)·`VITE_PROXY_TARGET`으로, "처음 로그인: 서버에서 만든 관리자 계정"
- [ ] **Step 5: 전체 검증** — `npx tsc --noEmit && npx vitest run && npm run build && npx eslint src`
- [ ] **Step 6: Commit** — `feat(admin): 사용 기록 화면과 신발 화면 보기 전용 모드`
