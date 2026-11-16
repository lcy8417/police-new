// @MX:DEBT: [AUTO] 레거시 중앙집중형 라우터 - FSD app/ 레이어로 이행 대상이나(docs/architecture.md §4) 아직 이 파일이 Routes 정본. BrowserRouter·SessionProvider는 main.jsx로 이동
// @MX:CEILING: 라우팅이 FSD app/ 레이어(src/app/)로 이전되기 전까지 유효 — 현재 신규 라우트도 계속 이 파일에 추가됨
// @MX:UPGRADE: src/app/에 라우터 설정이 이전되고 이 파일의 Routes가 제거되면 완료
import { createElement, lazy, Suspense } from "react";
import { Routes, Route, Navigate, Outlet, useParams } from "react-router-dom";
import { AppShell } from "@/widgets/app-shell";
import {
  CrimeDetailPage as CrimeDetail,
  CrimeHistoryPage as CrimeHistory,
  ResultDetailPage as ResultDetail,
} from "@/pages/crime-search";
import { CrimeRegisterPage } from "@/pages/crime-register";
import { ShoeRepositoryPage } from "@/pages/shoe-repository";
import { LoginPage } from "@/pages/login";
import { PasswordChangePage } from "@/pages/password-change";
import { ManageUsersPage } from "@/pages/manage-users";
import { ManageLogsPage } from "@/pages/manage-logs";
import EditorMode from "./pages/EditorMode";
import { FEATURES } from "@/entities/session";
import {
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

// 패턴추출 화면은 통합 커맨드센터(`/search/:aprthngNo`)로 흡수됐다. 기존
// `/patternExtract` 경로는 detail URL로 리다이렉트해 하위 호환을 유지한다.
function PatternExtractRedirect() {
  const { aprthngNo = "" } = useParams();
  return <Navigate to={`/search/${encodeURIComponent(aprthngNo)}`} replace />;
}

// 검색 결과는 이제 통합 커맨드센터(`/search/:aprthngNo`) 안에 인라인으로
// 표시된다(검색모드). 기존 `/search/:aprthngNo/shoesResult` 경로(북마크·
// 레거시 링크)는 detail URL로 리다이렉트해 하위 호환을 유지한다.
function ShoesResultRedirect() {
  const { aprthngNo = "" } = useParams();
  return <Navigate to={`/search/${encodeURIComponent(aprthngNo)}`} replace />;
}

// 신발 등록·조회·편집은 통합 커맨드센터(`/shoesRepository`)로 흡수됐다. 레거시
// `/shoesRegister`·`/shoesEdit/:ftwrId` 경로(사이드바·북마크·레거시 링크)는
// 각각 등록 모드·편집 모드 URL로 리다이렉트해 하위 호환을 유지한다.
function ShoeRegisterRedirect() {
  return <Navigate to="/shoesRepository?mode=new" replace />;
}

function ShoesEditRedirect() {
  const { ftwrId = "" } = useParams();
  return (
    <Navigate
      to={`/shoesRepository/${encodeURIComponent(ftwrId)}?mode=edit`}
      replace
    />
  );
}

// 현장 이미지 편집은 통합 커맨드센터(`/search/:aprthngNo`)의 우측 편집 Sheet로
// 흡수됐다(신규 `features/crime-edit`). 레거시 `/edit/:aprthngNo` 경로(북마크·
// 외부 링크)는 detail URL로 리다이렉트해 하위 호환을 유지한다.
function EditRedirect() {
  const { aprthngNo = "" } = useParams();
  return <Navigate to={`/search/${encodeURIComponent(aprthngNo)}`} replace />;
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
          {/* `/search`(param 없음)와 `/search/:aprthngNo` 모두 통합 커맨드센터.
              param 없이 진입하면 빈 상태(사건 미선택)로 열려, 4열 사건 탐색 패널의
              목록에서 사건을 골라 워크벤치를 채운다. */}
          <Route path="/search" element={<CrimeDetail />} />
          <Route path="/search/:aprthngNo" element={<CrimeDetail />} />
          <Route
            path="/search/:aprthngNo/crimeHistory/:searchNo"
            element={<CrimeHistory />}
          />
          <Route
            path="/search/:aprthngNo/patternExtract"
            element={<PatternExtractRedirect />}
          />
          <Route
            path="/search/:aprthngNo/shoesResult"
            element={<ShoesResultRedirect />}
          />
          <Route
            path="/search/:aprthngNo/shoesResult/detail/:ftwrId"
            element={<ResultDetail />}
          />
          <Route path="/edit/:aprthngNo" element={<EditRedirect />} />
        </Route>

        <Route
          element={
            <RequireFeature code={FEATURES.SHOE_VIEW}>
              <Outlet />
            </RequireFeature>
          }
        >
          <Route path="/shoesRegister" element={<ShoeRegisterRedirect />} />
          <Route path="/shoesRepository" element={<ShoeRepositoryPage />} />
          <Route
            path="/shoesRepository/:ftwrId"
            element={<ShoeRepositoryPage />}
          />
          <Route path="/shoesEdit/:ftwrId" element={<ShoesEditRedirect />} />
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
