import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/widgets/app-shell";
import { CrimeRegisterRedesign as CrimeRegister } from "@/pages/crime-register";
import {
  CrimeSearchPage as CrimeSearch,
  ShoesResultPage as ShoesResult,
} from "@/pages/crime-search";
import CrimeDetail from "./pages/CrimeDetail";
import ShoesRegister from "./pages/ShoesRegister";
import PatternExtract from "./pages/PatternExtract";
import CrimeEdit from "./pages/CrimeEdit";
import ResultDetail from "./pages/ResultDetail";
import ShoesRepository from "./pages/ShoesRepository";
import ShoesEdit from "./pages/ShoesEdit";
import CrimeHistory from "./pages/CrimeHistory";
import EditorMode from "./pages/EditorMode";

import { createContext, useEffect } from "react";
import { useCrimeStore } from "@/entities/crime";

export const crimeDataContext = createContext();

function App() {
  // Bridge: the legacy context value is sourced from the Zustand store, so the
  // existing consumers and any new store-based code share one source of truth.
  // `setCrimeData` is React-setState-compatible; `setRegisterFlag` refetches.
  const crimeData = useCrimeStore((s) => s.crimeData);
  const setCrimeData = useCrimeStore((s) => s.setCrimeData);
  const setRegisterFlag = useCrimeStore((s) => s.setRegisterFlag);
  const refetch = useCrimeStore((s) => s.refetch);

  // Initial load (replaces the old `useEffect(readCrimeData, [registerFlag])`).
  useEffect(() => {
    void refetch();
  }, [refetch]);

  return (
    <crimeDataContext.Provider
      value={{ crimeData, setCrimeData, setRegisterFlag }}
    >
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
              element={<PatternExtract />}
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
            <Route path="/shoesRepository" element={<ShoesRepository />} />
            <Route
              path="/shoesRepository/:modelNumber"
              element={<ShoesRepository />}
            />
            <Route path="/shoesEdit/:modelNumber" element={<ShoesEdit />} />
          </Route>
          {/* Standalone image editor — intentionally outside the shell. */}
          <Route path="/editormode" element={<EditorMode />} />
        </Routes>
      </BrowserRouter>
    </crimeDataContext.Provider>
  );
}

export default App;
