// @MX:DEBT: [AUTO] 레거시 중앙집중형 라우터 - FSD app/ 레이어로 이행 대상이나(docs/architecture.md §4) 아직 이 파일이 Routes 정본. BrowserRouter·SessionProvider는 main.jsx로 이동
// @MX:CEILING: 라우팅이 FSD app/ 레이어(src/app/)로 이전되기 전까지 유효 — 현재 신규 라우트도 계속 이 파일에 추가됨
// @MX:UPGRADE: src/app/에 라우터 설정이 이전되고 이 파일의 Routes가 제거되면 완료
import { createElement, lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { AppShell, ScasAppShell } from "@/widgets/app-shell";
import {
  CasesPage,
  CrimeHistoryPage as CrimeHistory,
  LegacyCaseRedirect,
  ResultDetailPage as ResultDetail,
} from "@/pages/crime-search";
import { CrimeRegisterPage } from "@/pages/crime-register";
import { LoginPage } from "@/pages/login";
import { PasswordChangePage } from "@/pages/password-change";
import { ManageUsersPage } from "@/pages/manage-users";
import { ManageLogsPage } from "@/pages/manage-logs";
import EditorMode from "./pages/EditorMode";
import { FEATURES } from "@/entities/session";
import {
  CASES_ROUTE_FEATURES,
  CASE_VIEW_FEATURES,
  FirstAllowedRedirect,
  RequireAdmin,
  RequireAuth,
  RequireFeature,
} from "@/features/auth";

// 권한 가드 배치(설계서 §2): 셸 전체 = 로그인 필요(`RequireAuth`), 화면 묶음마다 기능 권한
// (`RequireFeature`), `/manage/*` = 관리자 전용(`RequireAdmin`). 권한 없는 주소로 들어오면
// "접근 권한이 없습니다" 안내 후 허용된 첫 화면으로 간다.
// 사건 목록 초기 로딩은 여기서 하지 않는다 — `SessionProvider`가 "사건 조회 자격"이 생길 때 부른다.

// URL 변수 정본(설계서 §3): 사건 = `:aprthngNo`(감정물 번호), 신발 = `:ftwrId`(신발 ID,
// 앞자리 0 보존 문자열), 이력 = `:searchNo`(정수). `useParams`는 디코딩된 값을 주므로
// 리다이렉트 경로를 다시 만들 때 `encodeURIComponent`로 감싼다.

// B 단계 통합(화면 이식 계획 §1 표 — 묶음 ③ · ④ 끝 넘겨주기): 옛 통합 커맨드센터(`/search/:aprthngNo` · `/edit` ·
// `/patternExtract` · `/shoesResult`)는 새 사건관리 사건 창으로(`LegacyCaseRedirect` — A1 `aprthng=`로 감정번호를 찾음),
// 옛 신발 화면(`/shoesRepository*` · `/shoesRegister` · `/shoesEdit`)은 사건관리 위 신발 DB 패널(`/cases?shoe=1`)로 넘긴다.
// 옛 이력 상세(`…/crimeHistory/:searchNo`) · 결과 상세(`…/shoesResult/detail/:ftwrId`)는 새 화면에 같은 자리가 없어 그대로 둔다.

/** `/shoesRepository/:ftwrId?mode=…` · `/shoesEdit/:ftwrId` → 신발 DB 패널 그 신발 */
function ShoePanelRedirect() {
  const { ftwrId = "" } = useParams();
  return <Navigate to={`/cases?${new URLSearchParams({ shoe: "1", ftwr: ftwrId }).toString()}`} replace />;
}

/** `/shoesRepository?mode=new` · `/shoesRegister` → 신발 DB 패널 새 신발, 그 밖 `/shoesRepository` → 패널 목록 */
function ShoeListRedirect() {
  const isNew = new URLSearchParams(useLocation().search).get("mode") === "new";
  return <Navigate to={isNew ? "/cases?shoe=1&shoeNew=1" : "/cases?shoe=1"} replace />;
}

// 부품 진열 화면(`/dev/parts`)은 개발 실행에서만 있다. 프로덕션 빌드에서는 `import.meta.env.DEV`가
// false로 바뀌어 아래 지연 import가 통째로 빠지므로 번들에 들어가지 않는다(설계서 §9).
const PartsGalleryPage = import.meta.env.DEV
  ? lazy(() => import("@/pages/dev/parts").then((m) => ({ default: m.PartsGalleryPage })))
  : null;

// 화면 진열(`/dev`, `/dev/s00` … `/dev/s14`)도 같은 방식: 개발 실행에서만, 로그인 가드 밖.
const DEV_SCREEN_PAGES = import.meta.env.DEV
  ? [
      { path: "/dev", Page: lazy(() => import("@/pages/dev/screens/index").then((m) => ({ default: m.DevIndexPage }))) },
      { path: "/dev/s00", Page: lazy(() => import("@/pages/dev/screens/s00").then((m) => ({ default: m.S00DevPage }))) },
      { path: "/dev/s01", Page: lazy(() => import("@/pages/dev/screens/s01").then((m) => ({ default: m.S01DevPage }))) },
      { path: "/dev/s02", Page: lazy(() => import("@/pages/dev/screens/s02").then((m) => ({ default: m.S02DevPage }))) },
      { path: "/dev/s03", Page: lazy(() => import("@/pages/dev/screens/s03").then((m) => ({ default: m.S03DevPage }))) },
      { path: "/dev/s04", Page: lazy(() => import("@/pages/dev/screens/s04").then((m) => ({ default: m.S04DevPage }))) },
      { path: "/dev/s05", Page: lazy(() => import("@/pages/dev/screens/s05").then((m) => ({ default: m.S05DevPage }))) },
      { path: "/dev/s06", Page: lazy(() => import("@/pages/dev/screens/s06").then((m) => ({ default: m.S06DevPage }))) },
      { path: "/dev/s07", Page: lazy(() => import("@/pages/dev/screens/s07").then((m) => ({ default: m.S07DevPage }))) },
      { path: "/dev/s10", Page: lazy(() => import("@/pages/dev/screens/s10").then((m) => ({ default: m.S10DevPage }))) },
      { path: "/dev/s13", Page: lazy(() => import("@/pages/dev/screens/s13").then((m) => ({ default: m.S13DevPage }))) },
      { path: "/dev/s14", Page: lazy(() => import("@/pages/dev/screens/s14").then((m) => ({ default: m.S14DevPage }))) },
    ]
  : [];

function App() {
  return (
    <Routes>
      {/* 부품 진열(개발 전용) — 로그인·백엔드 없이 열리도록 권한 가드 밖. */}
      {PartsGalleryPage && (
        <Route
          path="/dev/parts"
          element={
            <Suspense fallback={null}>
              <PartsGalleryPage />
            </Suspense>
          }
        />
      )}

      {DEV_SCREEN_PAGES.map(({ path, Page }) => (
        <Route
          key={path}
          path={path}
          element={
            <Suspense fallback={null}>
              {/* 목록에서 꺼낸 컴포넌트라 JSX 이름이 변수로 안 잡혀 lint 오류가 나므로 createElement 로 만든다 */}
              {createElement(Page)}
            </Suspense>
          }
        />
      ))}

      {/* 로그인·비밀번호 변경은 셸(사이드바·상단바) 밖 전체 화면. */}
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/password"
        element={
          <RequireAuth>
            <PasswordChangePage />
          </RequireAuth>
        }
      />

      {/* 새 앱 틀(남색 위 막대 한 줄 `ScasAppShell`) — 화면 이식 계획 §1: 새 라우트 `/cases`(사건관리 목록 + 사건 창 +
          신발 DB 패널)를 옛 라우트와 나란히 세운다. 옛 라우트는 넘겨주기 전까지 아래 옛 틀(`AppShell`) 그대로. */}
      <Route
        element={
          <RequireAuth>
            <ScasAppShell />
          </RequireAuth>
        }
      >
        {/* /cases = 사건 보기 권한(진행 상태 · 사건 조회 · 보기 전용) 또는 신발 보기 — 신발 분업 담당이
            `/cases?shoe=1` 신발 DB 패널로 들어오게(화면 이식 계획 §1 r2 · 잠금 §2). 사건 목록 · 창을 그릴지는 셸 안에서. */}
        <Route
          path="/cases"
          element={
            <RequireFeature anyOf={CASES_ROUTE_FEATURES}>
              <CasesPage />
            </RequireFeature>
          }
        />

        {/* 옛 통합 커맨드센터 주소 → 사건 창(이미지 · 탭). 감정번호 찾기(A1)에 사건 보기 권한이 필요 */}
        <Route
          element={
            <RequireFeature anyOf={CASE_VIEW_FEATURES}>
              <Outlet />
            </RequireFeature>
          }
        >
          <Route path="/search" element={<Navigate to="/cases" replace />} />
          <Route path="/search/:aprthngNo" element={<LegacyCaseRedirect tab="pattern" />} />
          <Route path="/search/:aprthngNo/patternExtract" element={<LegacyCaseRedirect tab="pattern" />} />
          <Route path="/search/:aprthngNo/shoesResult" element={<LegacyCaseRedirect tab="search" />} />
          <Route path="/edit/:aprthngNo" element={<LegacyCaseRedirect tab="edit" />} />
        </Route>

        {/* 옛 신발 화면 주소 → 사건관리 위 신발 DB 패널 */}
        <Route
          element={
            <RequireFeature code={FEATURES.SHOE_VIEW}>
              <Outlet />
            </RequireFeature>
          }
        >
          <Route path="/shoesRepository" element={<ShoeListRedirect />} />
          <Route path="/shoesRepository/:ftwrId" element={<ShoePanelRedirect />} />
          <Route path="/shoesRegister" element={<Navigate to="/cases?shoe=1&shoeNew=1" replace />} />
          <Route path="/shoesEdit/:ftwrId" element={<ShoePanelRedirect />} />
        </Route>
      </Route>

      {/* Persistent shell: fixed TopNav + Sidebar, only the Outlet content swaps. */}
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/" element={<FirstAllowedRedirect />} />

        {/* 사건 등록은 독립 라우트다. 이관된 `RegisterStage` 위젯을 얇은 페이지가
            감싸 렌더한다(등록↔검색 통합은 되돌림). */}
        <Route
          element={
            <RequireFeature code={FEATURES.CRIME_REGISTER}>
              <Outlet />
            </RequireFeature>
          }
        >
          <Route path="/crimeRegister" element={<CrimeRegisterPage />} />
        </Route>

        <Route
          element={
            <RequireFeature code={FEATURES.CRIME_SEARCH}>
              <Outlet />
            </RequireFeature>
          }
        >
          {/* 옛 이력 상세 · 결과 상세(새 사건 창에 같은 자리가 없어 남김). `/search`(목록 · 통합 화면)는 위에서 사건 창으로 넘긴다 */}
          <Route
            path="/search/:aprthngNo/crimeHistory/:searchNo"
            element={<CrimeHistory />}
          />
          <Route
            path="/search/:aprthngNo/shoesResult/detail/:ftwrId"
            element={<ResultDetail />}
          />
        </Route>

        {/* 관리자 화면(API `/admin/*`와 겹치지 않게 `/manage/*`). `/manage`와 없는 하위 주소는
            관리자 가드를 거친 뒤 사용자·권한 화면으로 보낸다. */}
        <Route
          path="/manage"
          element={
            <RequireAdmin>
              <Outlet />
            </RequireAdmin>
          }
        >
          <Route index element={<Navigate to="/manage/users" replace />} />
          <Route path="users" element={<ManageUsersPage />} />
          <Route path="logs" element={<ManageLogsPage />} />
          <Route path="*" element={<Navigate to="/manage/users" replace />} />
        </Route>
      </Route>

      {/* Standalone image editor — intentionally outside the shell. */}
      <Route
        path="/editormode"
        element={
          <RequireAuth>
            <RequireFeature code={FEATURES.CRIME_SEARCH}>
              <EditorMode />
            </RequireFeature>
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default App;
