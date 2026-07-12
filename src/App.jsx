import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import { AppShell } from "@/widgets/app-shell";
import {
  CrimeDetailPage as CrimeDetail,
  CrimeHistoryPage as CrimeHistory,
  ResultDetailPage as ResultDetail,
} from "@/pages/crime-search";
import { CrimeRegisterPage } from "@/pages/crime-register";
import CrimeEdit from "./pages/CrimeEdit";
import { ShoeRepositoryPage } from "@/pages/shoe-repository";
import EditorMode from "./pages/EditorMode";

import { useEffect } from "react";
import { useCrimeStore } from "@/entities/crime";

// 패턴추출 화면은 통합 커맨드센터(`/search/:crimeNumber`)로 흡수됐다. 기존
// `/patternExtract` 경로는 detail URL로 리다이렉트해 하위 호환을 유지한다.
function PatternExtractRedirect() {
  const { crimeNumber = "" } = useParams();
  return <Navigate to={`/search/${crimeNumber}`} replace />;
}

// 검색 결과는 이제 통합 커맨드센터(`/search/:crimeNumber`) 안에 인라인으로
// 표시된다(검색모드). 기존 `/search/:crimeNumber/shoesResult` 경로(북마크·
// 레거시 링크)는 detail URL로 리다이렉트해 하위 호환을 유지한다.
function ShoesResultRedirect() {
  const { crimeNumber = "" } = useParams();
  return <Navigate to={`/search/${crimeNumber}`} replace />;
}

// 신발 등록·조회·편집은 통합 커맨드센터(`/shoesRepository`)로 흡수됐다. 레거시
// `/shoesRegister`·`/shoesEdit/:modelNumber` 경로(사이드바·북마크·레거시 링크)는
// 각각 등록 모드·편집 모드 URL로 리다이렉트해 하위 호환을 유지한다.
function ShoeRegisterRedirect() {
  return <Navigate to="/shoesRepository?mode=new" replace />;
}

function ShoesEditRedirect() {
  const { modelNumber = "" } = useParams();
  return (
    <Navigate to={`/shoesRepository/${modelNumber}?mode=edit`} replace />
  );
}

function App() {
  // 현장 데이터는 Zustand store가 단일 출처다(Context 브리지 제거 완료).
  // 초기 로드만 트리거하면 각 화면은 store 셀렉터로 직접 구독한다.
  const refetch = useCrimeStore((s) => s.refetch);

  // Initial load (replaces the old `useEffect(readCrimeData, [registerFlag])`).
  useEffect(() => {
    void refetch();
  }, [refetch]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Persistent shell: fixed TopNav + Sidebar, only the Outlet content swaps. */}
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/crimeRegister" replace />} />
          {/* 사건 등록은 독립 라우트다. 이관된 `RegisterStage` 위젯을 얇은 페이지가
              감싸 렌더한다(등록↔검색 통합은 되돌림). */}
          <Route path="/crimeRegister" element={<CrimeRegisterPage />} />
          {/* `/search`(param 없음)와 `/search/:crimeNumber` 모두 통합 커맨드센터.
              param 없이 진입하면 빈 상태(사건 미선택)로 열려, 4열 사건 탐색 패널의
              목록에서 사건을 골라 워크벤치를 채운다. */}
          <Route path="/search" element={<CrimeDetail />} />
          <Route path="/search/:crimeNumber" element={<CrimeDetail />} />
            <Route
              path="/search/:crimeNumber/crimeHistory/:historyId"
              element={<CrimeHistory />}
            />
            <Route
              path="/search/:crimeNumber/patternExtract"
              element={<PatternExtractRedirect />}
            />
            <Route
              path="/search/:crimeNumber/shoesResult"
              element={<ShoesResultRedirect />}
            />
            <Route
              path="/search/:crimeNumber/shoesResult/detail/:modelNumber"
              element={<ResultDetail />}
            />
            <Route path="/edit/:crimeNumber" element={<CrimeEdit />} />
            <Route path="/shoesRegister" element={<ShoeRegisterRedirect />} />
            <Route path="/shoesRepository" element={<ShoeRepositoryPage />} />
            <Route
              path="/shoesRepository/:modelNumber"
              element={<ShoeRepositoryPage />}
            />
            <Route
              path="/shoesEdit/:modelNumber"
              element={<ShoesEditRedirect />}
            />
          </Route>
          {/* Standalone image editor — intentionally outside the shell. */}
          <Route path="/editormode" element={<EditorMode />} />
        </Routes>
      </BrowserRouter>
  );
}

export default App;
