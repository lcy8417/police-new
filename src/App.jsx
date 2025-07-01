import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import CrimeRegister from "./pages/CrimeRegister";
import CrimeSearch from "./pages/CrimeSearch";
import CrimeDetail from "./pages/CrimeDetail";
import ShoesRegister from "./pages/ShoesRegister";
import PatternExtract from "./pages/PatternExtract";
import CrimeEdit from "./pages/CrimeEdit";
import ShoesResult from "./pages/ShoesResult";
import ResultDetail from "./pages/ResultDetail";
import ShoesRepository from "./pages/ShoesRepository";
import ShoesEdit from "./pages/ShoesEdit";
import CrimeHistory from "./pages/CrimeHistory";

import { useState, createContext, useEffect } from "react";
import { fetchCrimeData } from "./services/crud"; // 🧊 CRUD 서비스에서 함수 가져오기

const url = "http://localhost:8000";
const patternsRoot = "/src/assets/Patterns/전체/";
const pathInsert = (item) => {
  return [patternsRoot + item[0] + ".png", item[1]];
};

export const crimeDataContext = createContext();
export const shoesDataContext = createContext();
export const historyDataContext = createContext();

function App() {
  const [crimeData, setCrimeData] = useState([]);
  const [shoesData, setShoesData] = useState([]);

  // 범죄 데이터 초기화
  useEffect(() => {
    // 서버에서 범죄 데이터 가져오기
    const readCrimeData = async () => {
      try {
        const data = await fetchCrimeData();
        // 처음 불러올 때, top, mid, bottom, outline 필드가 없을 수 있으므로 초기화
        // 또한 불러올 문양은 이름만 있으므로, 경로를 넣어줌
        const updatedData = data.map((item) => ({
          ...item,
          top: item.top.map(pathInsert) || [],
          mid: item.mid.map(pathInsert) || [],
          bottom: item.bottom.map(pathInsert) || [],
          outline: item.outline.map(pathInsert) || [],
        }));
        setCrimeData(updatedData);
      } catch (error) {
        console.error("Error fetching crime data:", error);
      }
    };
    readCrimeData();

    fetch(`${url}/shoes`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const updatedShoesData = data.map((item) => ({
          ...item,
          top: item.top
            ? item.top.map((pattern) => `${patternsRoot}/${pattern}.png`)
            : [],
          mid: item.mid
            ? item.mid.map((pattern) => `${patternsRoot}/${pattern}.png`)
            : [],
          bottom: item.bottom
            ? item.bottom.map((pattern) => `${patternsRoot}/${pattern}.png`)
            : [],
          outline: item.outline
            ? item.outline.map((pattern) => `${patternsRoot}/${pattern}.png`)
            : [],
        }));
        setShoesData(updatedShoesData);
      })
      .catch((error) => {
        console.error("Error fetching shoes data:", error);
      });
  }, []);

  return (
    <crimeDataContext.Provider value={{ crimeData, setCrimeData }}>
      <shoesDataContext.Provider value={{ shoesData, setShoesData }}>
        <BrowserRouter>
          <div className="app-layout">
            <div className="page-content">
              <Routes>
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
              </Routes>
            </div>
          </div>
        </BrowserRouter>
      </shoesDataContext.Provider>
    </crimeDataContext.Provider>
  );
}

export default App;
