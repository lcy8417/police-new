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
import BeforeResult from "./pages/BeforeResult";

import { useState, createContext, useEffect } from "react";

export const crimeDataContext = createContext();
export const shoesDataContext = createContext();
export const historyDataContext = createContext();

const handleOpenNewTab = (url) => {
  window.open(url, "_blank", "noopener, noreferrer");
};

function App() {
  const formDemoItems = [
    {
      id: 0,
      image: "/src/assets/raw/1.png",
      사건등록번호: "2023-001",
      이미지번호: "IMG-2023-001",
      사건명: "강도 사건",
      채취일시: "2023-10-01 12:00",
      채취장소: "서울 강남구",
      의뢰관서: "서울지방경찰청",
      채취방법: "현장 채취",
      진행상태: "진행 중",
      순위: "1",
      top: [],
      mid: [],
      bottom: [],
      outline: [],
    },
    {
      id: 1,
      image: "/src/assets/raw/2.png",
      사건등록번호: "2023-002",
      이미지번호: "IMG-2023-002",
      사건명: "절도 사건",
      채취일시: "2023-10-02 14:30",
      채취장소: "서울 마포구",
      의뢰관서: "서울지방경찰청",
      채취방법: "현장 채취",
      진행상태: "완료",
      순위: "2",
      top: [],
      mid: [],
      bottom: [],
      outline: [],
    },
    {
      id: 2,
      image: "/src/assets/raw/3.png",
      사건등록번호: "2023-003",
      이미지번호: "IMG-2023-003",
      사건명: "폭행 사건",
      채취일시: "2023-10-03 16:45",
      채취장소: "서울 용산구",
      의뢰관서: "서울지방경찰청",
      채취방법: "현장 채취",
      진행상태: "진행 중",
      순위: "3",
      top: [],
      mid: [],
      bottom: [],
      outline: [],
    },
  ];
  const shoesDemoItems = [
    {
      id: 0,
      image: "/src/assets/Shoes/B/B203818.png",
      top: [],
      bottom: [],
      mid: [],
      outline: [],
      수집장소: "서울",
      제조사: "Nike",
      상표명: "Air Max",
      모델번호: "B203818",
      수집년도: "2023",
    },
    {
      id: 1,
      image: "/src/assets/Shoes/B/B203838.png",
      top: [],
      bottom: [],
      mid: [],
      outline: [],
      수집장소: "부산",
      제조사: "Adidas",
      상표명: "Ultra Boost",
      모델번호: "B203819",
      수집년도: "2022",
    },
    {
      id: 2,
      image: "/src/assets/Shoes/B/B203842.png",
      top: [],
      bottom: [],
      mid: [],
      outline: [],
      수집장소: "대구",
      제조사: "Puma",
      상표명: "RS-X",
      모델번호: "B203820",
      수집년도: "2021",
    },
  ];

  const historyItems = [
    {
      id: 0,
      등록일시: "2023-10-01",
      순위: "1",
    },
    {
      id: 1,
      등록일시: "2023-10-02",
      순위: "2",
    },
    {
      id: 2,
      등록일시: "2023-10-03",
      순위: "3",
    },
  ];

  const [crimeData, setCrimeData] = useState([...formDemoItems]);
  const [shoesData, setShoesData] = useState([...shoesDemoItems]);
  const [historyData, setHistoryData] = useState([...historyItems]);
  const [isLoading, setIsLoading] = useState(true);

  // TODO: 실제 검색 결과로 연동되게 수정 필요
  useEffect(() => {
    const shoesFiles = import.meta.glob("/src/assets/Patterns/다각/*", {
      eager: true,
    });

    setShoesData((prev) => {
      if (!prev || prev.length === 0) return prev; // 초기값이 없으면 기존 상태 반환

      const temp = [...prev];
      const imagePaths = Object.keys(shoesFiles);
      const randomImages = imagePaths
        .sort(() => 0.5 - Math.random())
        .slice(0, 8);

      return temp.map((item) => {
        const patterns = [];
        for (let i = 0; i < 8; i++) {
          patterns.push(randomImages[i]);
        }
        return {
          ...item,
          top: patterns.slice(0, 3),
          mid: patterns.slice(3, 6),
          bottom: patterns.slice(6, 8),
        };
      });
    });
    setIsLoading(false);
  }, []);

  return (
    <historyDataContext.Provider value={{ historyData, setHistoryData }}>
      <crimeDataContext.Provider value={{ crimeData, setCrimeData }}>
        <shoesDataContext.Provider value={{ shoesData, setShoesData }}>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <BrowserRouter>
              <div className="app-layout">
                <div className="page-content">
                  <Routes>
                    <Route
                      path="/"
                      element={<Navigate to="/crimeRegister" />}
                    />
                    <Route path="/crimeRegister" element={<CrimeRegister />} />
                    <Route path="/search" element={<CrimeSearch />} />
                    <Route path="/search/:id" element={<CrimeDetail />} />
                    <Route
                      path="/search/:id/beforeResult/:bid"
                      element={<BeforeResult />}
                    />
                    <Route
                      path="/search/:id/patternExtract"
                      element={<PatternExtract />}
                    />
                    <Route
                      path="/search/:id/shoesResult"
                      element={<ShoesResult />}
                    />
                    <Route
                      path="/search/:id/shoesResult/detail/:number"
                      element={<ResultDetail />}
                    />
                    <Route path="/search/:id/edit" element={<CrimeEdit />} />
                    <Route path="/shoesRegister" element={<ShoesRegister />} />
                    <Route
                      path="/shoesRepository"
                      element={<ShoesRepository />}
                    />
                    <Route
                      path="/shoesRepository/:shoesId"
                      element={<ShoesRepository />}
                    />
                    <Route path="/shoesEdit/:shoesId" element={<ShoesEdit />} />
                  </Routes>
                </div>
              </div>
            </BrowserRouter>
          )}
        </shoesDataContext.Provider>
      </crimeDataContext.Provider>
    </historyDataContext.Provider>
  );
}

export default App;
