# 로그인 · 권한 · 사용 기록 — 프론트 실행 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 로그인 화면으로 시작하고, 사용자 권한에 맞는 메뉴·화면만 보여 주며, 관리자에게 사용자·권한 관리와 사용 기록 화면을 제공한다.

**Architecture:** ① 모든 백엔드 요청을 공용 함수 `backendFetch` 하나로 모아 쿠키를 함께 보내고, 401이면 전역 "세션 끝남" 이벤트를 낸다. ② Vite 개발 서버가 API·이미지를 백엔드로 중계해 브라우저 입장에서는 같은 주소(same-origin)가 된다(설계서 §3-1). ③ `features/auth`의 `SessionProvider`가 시작 때 `GET /auth/me`로 세션을 복원하고, 라우트는 `RequireAuth` → `RequireFeature` 가드로 감싼다. ④ 새 화면은 현재 과학수사 다크 팔레트·`TechCorners`·`DotGrid`/`GlowOrb`를 쓰고, romang의 표·필터 막대·상태 칩·타임라인 구성을 따른다.

**Tech Stack:** React + TypeScript + Vite, React Router v7, TanStack Query v5, Zustand, shadcn/ui + Tailwind 4, Vitest + MSW

**Spec:** `../police-server/docs/superpowers/specs/2026-11-03-auth-rbac-activity-log-design.md`(이하 "설계서"). 서버 계약은 설계서 §6과 `police-server/docs/superpowers/plans/2026-11-03-auth-rbac-log-server.md`. 선행: `docs/superpowers/plans/2026-11-03-scas-field-rename.md` 완료.

## Global Constraints

- 저장소 규약(`CLAUDE.md`): FSD 단방향, Tailwind 전용, 인라인 `style` 금지(좌표 예외만), 한국어 문자열 리터럴, `@/` 별칭, 배럴 공개, 파일명 규칙, 작업 직후 커밋. 완료 기준: 각 Task는 그 Task 테스트 + 변경 파일 `npx eslint` + `npx tsc --noEmit`, Task 6에서 전체 `npx vitest run` + `npm run build`.
- 색: 패널 `#0B121D`, 보더 `#1E2A3C`, 액센트 `#4A9EFF`/`#3B82F6`, 실패·필수 `#EF4444`, 성공 teal `#2DD4BF`, 권한 없음 amber `#F59E0B`, 보조 글자 `#8A93A6`.
- 기능 코드 문자열은 `src/entities/session/model/features.ts` 상수만. 서버가 주는 `features`는 이미 실효 권한(`SHOE_EDIT`면 `SHOE_VIEW` 포함)이므로 프론트에서 다시 펼치지 않는다.
- 권한 없는 메뉴는 숨긴다(비활성 표시 금지).
- shadcn 부품이 필요하면 `npx shadcn@2.1.8 add <이름>`(dialog, switch, table, tabs, label, checkbox, select)으로 `src/shared/ui`에 넣고 `package-lock.json`에 고정.
- `VITE_API_URL`이 빈 값이면 모든 백엔드 URL은 상대 경로(`/crime/...`)다. 이미지 URL도 같은 규칙(`${VITE_API_URL}/crime_images/...`).

## Review Focus

- 권한 없는 화면 주소를 직접 입력해도 화면이 보이지 않고 안내 후 허용된 첫 화면으로 이동 → Task 2 `RequireFeature redirects`
- 사용 중 세션이 만료되면(어느 API든 401, 이미지 처리 API 포함) 로그인 화면으로 가고, 다시 로그인하면 원래 주소로 복귀 → Task 1 `image api 401 emits unauthorized`, Task 3 `returns to original path after re-login`
- A로 로그인했다가 로그아웃하고 B로 로그인하면 A가 보던 사건 목록·검색 결과가 남아 있지 않음 → Task 2 `logout clears caches and stores`
- 관리자가 권한을 회수하면 그 사용자가 다른 창을 보다 돌아오는(포커스) 순간 메뉴가 사라짐 → Task 2 `refreshes session on focus`
- 신발 편집 권한이 없는 사용자가 신발 화면에서 문양 추출·저장·편집 시트를 쓸 수 없음 → Task 6 `read-only workbench hides mutations`

---

### Task 1: 공용 백엔드 요청 함수 · 중계 설정 · 세션/관리자 API

**Files:**
- Create: `src/shared/api/backend-fetch.ts`(+ test), `src/entities/session/{index.ts, model/features.ts, model/types.ts, api/session-api.ts, api/session-api.test.ts}`, `src/entities/admin/{index.ts, model/types.ts, api/admin-api.ts, api/admin-api.test.ts}`
- Modify: `vite.config.js`(server.proxy·preview.proxy), `.env.example`, `src/shared/api/client.ts`, `src/services/api.js`, `src/services/crud.js`, `src/entities/match/api/match-api.ts`, `src/shared/lib/image/resolve-image.ts`, `src/pages/EditorMode.jsx`, `src/components/ImageLoader.jsx`, 백엔드 이미지를 `crossOrigin`으로 읽는 `crop-image.ts`·`use-image-natural-size.ts`·`MatchCorrespondenceViewer.tsx`(`"anonymous"` → `"use-credentials"`, 관련 테스트 기대값 포함)

**Interfaces:**
- Produces:
  - `backendFetch(path: string, init?: RequestInit) -> Promise<Response>`: `${VITE_API_URL}${path}`로 `credentials: "include"` 요청. 응답이 401이고 경로가 `/auth/login`·`/auth/me`가 아니면 `emitUnauthorized()`. 응답 객체를 그대로 반환(본문은 호출부가 읽음 — 매칭 409 구조화 오류 보존)
  - `onUnauthorized(handler) -> () => void`, `emitUnauthorized()` (같은 파일)
  - `apiGet`/`apiSend`와 `services/*.js`, `match-api.ts`, 이미지 로더 3곳의 모든 `fetch`를 `backendFetch`로 교체
  - `vite.config.js` proxy(dev·preview 동일): 키 `'^/(crime|shoes|auth|admin)(/|$|\\?)'`와 `'/crime_images/'`, `'/crime_history/'`, `'/crime_outlines/'`, `'/shoes_images/'` → `target: process.env.VITE_PROXY_TARGET ?? 'https://localhost:8000'`, `secure: false`(자체 서명 인증서), `changeOrigin: false`(서버의 `Origin` 검사가 프론트 주소를 보도록). `loadEnv`로 `.env`의 `VITE_PROXY_TARGET`를 읽는다
  - `.env.example`: `VITE_API_URL=`(빈 값, 설명: "비우면 같은 주소로 중계") + `VITE_PROXY_TARGET=https://localhost:8000`
  - `FEATURES`, `type FeatureCode`, `FEATURE_LABELS`(설계서 §2), `SessionUser = { userId; userNm; userSe: "ADMIN" | "USER"; features: FeatureCode[]; passwordChangeRequired: boolean }`
  - `login`, `logout`, `fetchMe`(401 → `null`), `changePassword`
  - `entities/admin`: `fetchUsers`, `createUser`, `updateUser`, `replaceUserFeatures`, `resetPassword`, `unlockUser`, `fetchSessions(filters)`, `fetchSessionEvents(sessionId)`, `fetchEvents(filters)`, `fetchFeatures`, `fetchActions` — 경로·본문·응답 모양은 설계서 §6, 응답은 `convertKeysToCamelCase`

- [ ] **Step 1: 실패하는 테스트** — `backend-fetch.test.ts`: `sends credentials include`, `emits unauthorized on 401`, `does not emit for /auth/me`, `image api 401 emits unauthorized`(`imageSearch`가 401을 받으면 이벤트 발생) / `session-api.test.ts`: `login returns camel user`, `fetchMe returns null on 401` / `admin-api.test.ts`: `fetchSessions passes filters as query`, `replaceUserFeatures sends features array` / `vite-proxy.test.ts`(`vite.config.js`의 정규식 키를 import해 검사): `/crime/abc`·`/crime?x=1`·`/auth/me` 일치, `/crimeRegister`·`/search/abc` 불일치
- [ ] **Step 2: 실패 확인** — `npx vitest run src/shared/api src/entities/session src/entities/admin src/services`
- [ ] **Step 3: 구현** — 정규식 키는 `export const BACKEND_PROXY_PATTERN`으로 `vite.config.js`에서 내보내 테스트가 같은 값을 쓴다
- [ ] **Step 4: 통과 확인**
- [ ] **Step 5: Commit** — `feat(auth): 공용 백엔드 요청 함수·같은 주소 중계·세션/관리자 API`

### Task 2: 세션 상태 · 라우트 가드 · 라우터 재구성 · 계정 전환 정리

**Files:**
- Create: `src/features/auth/{index.ts, model/session-store.ts, model/feature-routes.ts, model/reset-user-data.ts, ui/SessionProvider.tsx, ui/RequireAuth.tsx, ui/RequireFeature.tsx, ui/RequireAdmin.tsx, ui/NoPermissionNotice.tsx}` + 각 테스트
- Modify: `src/main.jsx`, `src/App.jsx`, `src/entities/crime/model/crime-store.ts`(`reset()` 추가), `src/widgets/crime-register-stage/ui/RegisterStage.tsx`(등록 후 목록 새로고침은 `CRIME_SEARCH`가 있을 때만)

**Interfaces:**
- Consumes: Task 1
- Produces:
  - 렌더 순서(`main.jsx`): `AppProviders → BrowserRouter → SessionProvider → App`. `App.jsx`에서 `BrowserRouter` 제거
  - `useSessionStore`: `{ user: SessionUser | null; status: "loading" | "authenticated" | "anonymous"; setUser; clear }`, `hasFeature(user, code)`(관리자는 항상 true)
  - `FEATURE_ROUTES = [CRIME_REGISTER → "/crimeRegister", CRIME_SEARCH → "/search", SHOE_VIEW → "/shoesRepository"]`, `firstAllowedPath(user) -> string | null`
  - `resetUserData()`: `queryClient.cancelQueries()` + `queryClient.clear()` + `useCrimeStore.getState().reset()` + 세대 번호 증가(`sessionGeneration`) — 로그아웃·`onUnauthorized`·다른 사용자로 바뀜 감지 시 호출. 이전 세대에서 시작한 사건 목록 요청 응답은 store에 반영하지 않음
  - `SessionProvider`: 시작 시 `fetchMe()`. `onUnauthorized` → `resetUserData()` + `clear()` + `navigate("/login", { state: { from: location } })`. 창 포커스·보호된 화면 이동·API 403 응답 시 `fetchMe()` 재확인(서버 문구 `"비밀번호를 변경해야 합니다"`면 `/password`로)
  - 사건 목록 로딩: `App.jsx`의 마운트 시 `refetch()` 삭제 → `SessionProvider`가 `status === "authenticated"`이고 `hasFeature(CRIME_SEARCH)`일 때(사용자 ID가 바뀔 때마다) `useCrimeStore.refetch()`
  - `RequireAuth`: `loading` → 전체 화면 로딩, `anonymous` → `/login`(state.from), `passwordChangeRequired` → `/password`
  - `RequireFeature({ code, children })`: 권한 없으면 `toast.error("접근 권한이 없습니다")` 후 `firstAllowedPath`, 그것도 없으면 `NoPermissionNotice`("권한이 없습니다. 관리자에게 문의하세요" + 로그아웃 버튼)
  - 라우터: `/login`·`/password`는 셸 밖(이 Task에서는 `/login`·`/password`에 임시 자리표시 컴포넌트, Task 3에서 교체). 셸 라우트 전체를 `RequireAuth`로, `/crimeRegister` = `CRIME_REGISTER`, `/search/*` = `CRIME_SEARCH`, `/shoesRepository*` = `SHOE_VIEW`, `/editormode` = `CRIME_SEARCH`, `/admin/*` = `RequireAdmin`. `/` → `firstAllowedPath`

- [ ] **Step 1: 실패하는 테스트** — `RequireFeature redirects`(`CRIME_REGISTER`만 → `/search` 진입 시 `/crimeRegister` + 토스트), `no-feature user sees notice`, `unauthorized event navigates to login with from`, `logout clears caches and stores`(쿼리 캐시 비어 있음, 사건 store 비어 있음), `stale list response ignored after reset`, `refreshes session on focus`(포커스 → `fetchMe` 호출, 응답에서 `CRIME_SEARCH`가 빠지면 현재 `/search` 화면에서 나감), `admin passes RequireAdmin`, `user blocked from /admin/users`, `crime list loads only with CRIME_SEARCH`
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
- 로그인 화면: 전체 화면 `#060B14` 바탕 + `DotGrid` + `GlowOrb` 2개. 가운데 카드(최대 너비 400px, `#0B121D`, 보더 `#1E2A3C`, `TechCorners`). 위에서부터 영문 라벨 `FORENSIC FOOTWEAR PLATFORM`(자간 넓게, `#4A9EFF`), 제목 "족적 감정 플랫폼", 아이디, 비밀번호(표시/숨김 토글), "아이디 저장" 체크(`localStorage` 키 `police.rememberedUserId`, try/catch), 로그인 버튼(로딩 중 "로그인 중…"). 오류는 버튼 위 빨간 문구(서버 `detail` 그대로). 성공 시 `resetUserData()` 후 store 설정 → `state.from` 또는 `firstAllowedPath`
- 비밀번호 변경: 같은 카드, 현재·새·새 확인. 8자 미만, UTF-8 72바이트 초과(`new TextEncoder().encode(v).length > 72`), 확인 불일치는 클라이언트에서 막음(설계서 §3 문구). 성공 시 `fetchMe()`로 store 갱신 후 첫 화면

- [ ] **Step 1: 실패하는 테스트** — `logs in and navigates to first allowed`, `shows server detail on 401`, `remembers user id`, `forces password change`(`passwordChangeRequired: true` → `/password`), `returns to original path after re-login`(401 이벤트 → 로그인 → `/search/abc` 복귀), `PasswordChangePage validates mismatch and 72 bytes`
- [ ] **Step 2: 실패 확인**
- [ ] **Step 3: 구현**
- [ ] **Step 4: 통과 확인**
- [ ] **Step 5: Commit** — `feat(auth): 로그인·비밀번호 변경 화면`

### Task 4: 사이드바 — 권한별 메뉴, 관리 구역, 사용자 블록, 로그아웃

**Files:**
- Modify: `src/widgets/app-shell/model/nav-items.ts`, `src/widgets/app-shell/ui/Sidebar.tsx`
- Create: `src/widgets/app-shell/ui/Sidebar.test.tsx`, `src/widgets/app-shell/model/nav-items.test.ts`

**Interfaces:**
- Consumes: Task 1 `logout`, Task 2 store·`resetUserData`
- `NavItem`에 `feature?: FeatureCode`, `adminOnly?: boolean`. 사건 등록=`CRIME_REGISTER`, 사건 조회=`CRIME_SEARCH`, 신발=`SHOE_VIEW`, 감정 의뢰·감정 결과=`CRIME_SEARCH`. 관리 구역(라벨 `ADMIN`): "사용자·권한"(`/admin/users`, `UserCog`), "사용 기록"(`/admin/logs`, `ScrollText`), `adminOnly: true`
- `visibleNavItems(user: SessionUser) -> NavItem[]`
- 하단 사용자 블록: `ID: KCSI_001` → `ID: {userId}`, 이름, 구분 칩(관리자=blue, 사용자=회색). 설정 버튼은 `/password`로. 로그아웃: `logout()` → `resetUserData()` → `clear()` → `/login`

- [ ] **Step 1: 실패하는 테스트** — `visibleNavItems hides forbidden`, `admin sees admin section`, `logout clears session and navigates`
- [ ] **Step 2: 실패 확인**
- [ ] **Step 3: 구현**
- [ ] **Step 4: 통과 확인**
- [ ] **Step 5: Commit** — `feat(shell): 권한별 메뉴와 실제 로그아웃`

### Task 5: 관리자 — 사용자·권한 관리 화면

**Files:**
- Create: `src/pages/admin-users/{index.ts, ui/AdminUsersPage.tsx}`, `src/features/admin-users/{index.ts, ui/UserTable.tsx, ui/UserDetailPanel.tsx, ui/FeatureToggles.tsx, ui/CreateUserDialog.tsx, ui/PasswordResetDialog.tsx, model/use-admin-users.ts}` + 테스트
- Modify: `src/App.jsx`(`/admin/users`)

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
- Create: `src/pages/admin-logs/{index.ts, ui/AdminLogsPage.tsx}`, `src/features/admin-logs/{index.ts, ui/LogFilterBar.tsx, ui/SessionTable.tsx, ui/SessionEventTimeline.tsx, ui/EventTable.tsx, ui/ResultChip.tsx, model/use-admin-logs.ts}` + 테스트
- Modify: `src/App.jsx`(`/admin/logs`), `src/pages/shoe-repository/ui/ShoeRepositoryPage.tsx`, `src/widgets/shoe-workbench/ui/ShoeWorkbench.tsx` 및 그 하위 패널

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
