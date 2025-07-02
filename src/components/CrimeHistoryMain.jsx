import "./CrimeHistoryMain.css";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ImageLoader from "./ImageLoader";
import PartialPatterns from "./PartialPatterns";
import RetrievalResults from "./RetrievalResults";
import { fetchHistoryData } from "../services/crud";
import { imageSearch } from "../services/api"; // Adjust the import path as necessary
import { toPatternPaths } from "../utils/path-utils"; // 🧊 경로 유틸리티 함수 가져오기
import { fetchCurrentShoes } from "../services/crud"; // Import the function to fetch current shoes data

const url = "http://localhost:8000";

const CrimeHistoryMain = () => {
  const [shoesData, setShoesData] = useState([]);
  const { crimeNumber, historyId } = useParams();

  const [currentPatterns, setCurrentPatterns] = useState([]);
  const [currentPageData, setCurrentPageData] = useState([]);
  const [page, setPage] = useState(0);
  const [historyData, setHistoryData] = useState({});
  const [totalCount, setTotalCount] = useState(0);

  const crimeImage = {
    image: `${url}/crime_images/${crimeNumber}.png`,
  };

  const editImage = {
    image: historyData.editImage ? historyData.editImage : "undefined",
  };

  const bottomImage = {
    image: historyData.matchingShoes
      ? `${url}/shoes_images/B/${historyData.matchingShoes}.png`
      : "undefined",
  };

  const sideImage = {
    image: historyData.matchingShoes
      ? `${url}/shoes_images/S/${historyData.matchingShoes.replace(
          "B",
          "S"
        )}.png`
      : "undefined",
  };

  // TODO: 실제 검색 결과로 연동되게 수정 필요
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { result, total } = await imageSearch({
          crimeNumber: crimeNumber,
          body: { image: crimeNumber },
          page: page,
        });

        console.log(total);
        setTotalCount(total);
        setCurrentPageData(result);
      } catch (error) {
        console.error("Error fetching image search data:", error);
      }
    };

    fetchData();
  }, [page]);

  useEffect(() => {
    const getHistory = async () => {
      try {
        const currentCrimeData = await fetchHistoryData(historyId);
        setHistoryData(currentCrimeData);

        if (currentCrimeData) {
          const shoesInfo = await fetchCurrentShoes(
            currentCrimeData.matchingShoes
          );
          const shoesWithPath = {
            ...shoesInfo,
            top: toPatternPaths(shoesInfo.top) || [],
            mid: toPatternPaths(shoesInfo.mid) || [],
            bottom: toPatternPaths(shoesInfo.bottom) || [],
            outline: toPatternPaths(shoesInfo.outline) || [],
          };

          setShoesData(shoesWithPath);

          setCurrentPatterns([
            {
              title: "현장패턴",
              top: currentCrimeData?.top || [],
              mid: currentCrimeData?.mid || [],
              bottom: currentCrimeData?.bottom || [],
              outline: currentCrimeData?.outline || [],
            },
            {
              title: "DB패턴",
              top: shoesWithPath.top,
              mid: shoesWithPath.mid,
              bottom: shoesWithPath.bottom,
              outline: shoesWithPath.outline,
            },
          ]);
        }
      } catch (error) {
        console.error("Error fetching history data:", error);
      }
    };

    getHistory();
  }, [historyId]); 

  return (
    <div className="CrimeHistoryMain">
      <div className="main">
        <div className="images-container">
          <div className="shoes-image">
            <ImageLoader formData={crimeImage} value="현장이미지" />
          </div>
          <div className="shoes-image">
            <ImageLoader formData={editImage} value="편집이미지" />
          </div>
        </div>
        <div className="images-container">
          <div className="shoes-image">
            <ImageLoader formData={bottomImage} value="바닥이미지" />
          </div>
          <div className="shoes-image">
            <ImageLoader formData={sideImage} value="측면이미지" />
          </div>
        </div>
        <PartialPatterns patternItems={currentPatterns} />
        <RetrievalResults
          currentPageData={currentPageData}
          page={page}
          setPage={setPage}
          clickAct={false}
          totalCount={totalCount}
        />
      </div>
    </div>
  );
};
export default CrimeHistoryMain;
