import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import { AppShell } from "@/widgets/app-shell";
import { CrimeRegisterRedesign as CrimeRegister } from "@/pages/crime-register";
import {
  CrimeSearchPage as CrimeSearch,
  CrimeDetailPage as CrimeDetail,
  ShoesResultPage as ShoesResult,
  CrimeHistoryPage as CrimeHistory,
  ResultDetailPage as ResultDetail,
} from "@/pages/crime-search";
import ShoesRegister from "./pages/ShoesRegister";
import CrimeEdit from "./pages/CrimeEdit";
import { ShoeRepositoryPage } from "@/pages/shoe-repository";
import ShoesEdit from "./pages/ShoesEdit";
import EditorMode from "./pages/EditorMode";

import { useEffect } from "react";
import { useCrimeStore } from "@/entities/crime";

// 패턴추출 화면은 통합 커맨드센터(`/search/:crimeNumber`)로 흡수됐다. 기존
// `/patternExtract` 경로는 detail URL로 리다이렉트해 하위 호환을 유지한다.
function PatternExtractRedirect() {
  const { crimeNumber = "" } = useParams();
  return <Navigate to={`/search/${crimeNumber}`} replace />;
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
          <Route path="/" element={<Navigate to="/crimeRegister" />} />
          <Route path="/crimeRegister" element={<CrimeRegister />} />
          <Route path="/search" element={<CrimeSearch />} />
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
              element={<ShoesResult />}
            />
            <Route
              path="/search/:crimeNumber/shoesResult/detail/:modelNumber"
              element={<ResultDetail />}
            />
            <Route path="/edit/:crimeNumber" element={<CrimeEdit />} />
            <Route path="/shoesRegister" element={<ShoesRegister />} />
            <Route path="/shoesRepository" element={<ShoeRepositoryPage />} />
            <Route
              path="/shoesRepository/:modelNumber"
              element={<ShoeRepositoryPage />}
            />
            <Route path="/shoesEdit/:modelNumber" element={<ShoesEdit />} />
          </Route>
          {/* Standalone image editor — intentionally outside the shell. */}
          <Route path="/editormode" element={<EditorMode />} />
        </Routes>
      </BrowserRouter>
  );
}

export default App;
