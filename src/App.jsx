import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import CrimeRegister from "./pages/CrimeRegister";
import CrimeSearch from "./pages/CrimeSearch";
import CrimeDetail from "./pages/CrimeDetail";
import ShoesRegister from "./pages/ShoesRegister";
import SideBar from "./components/SideBar";
import PatternExtract from "./pages/PatternExtract";
import CrimeEdit from "./pages/CrimeEdit";
import ShoesResult from "./pages/ShoesResult";
import ResultDetail from "./pages/ResultDetail";

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <SideBar />
        <div className="page-content">
          <Routes>
            <Route path="/crimeRegister" element={<CrimeRegister />} />
            <Route path="/search" element={<CrimeSearch />} />
            <Route path="/search/:id" element={<CrimeDetail />} />
            <Route
              path="/search/:id/patternExtract"
              element={<PatternExtract />}
            />
            <Route path="/search/:id/shoesResult" element={<ShoesResult />} />
            <Route
              path="/search/:id/shoesResult/:page/detail/:number"
              element={<ResultDetail />}
            />
            <Route path="/search/:id/edit" element={<CrimeEdit />} />
            <Route path="/shoesRegister" element={<ShoesRegister />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
