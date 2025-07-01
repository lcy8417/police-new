import "./CrimeHistoryMain.css";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ImageLoader from "./ImageLoader";
import Sidebar from "./Sidebar";
import PartialPatterns from "./PartialPatterns";
import RetrievalResults from "./RetrievalResults";
import { fetchHistoryData } from "../services/crud";
import { useContext } from "react";
import { crimeDataContext, shoesDataContext } from "../App";
import { imageSearch } from "../services/api"; // Adjust the import path as necessary

const url = "http://localhost:8000";

const CrimeHistoryMain = () => {
  const { shoesData } = useContext(shoesDataContext);
  const { crimeNumber, historyId } = useParams();

  const [currentPatterns, setCurrentPatterns] = useState([]);
  const [currentPageData, setCurrentPageData] = useState([]);
  const [page, setPage] = useState(0);
  const [historyData, setHistoryData] = useState({});

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
        const data = await imageSearch({
          crimeNumber: crimeNumber,
          body: { image: crimeNumber },
          page: page,
        });

        setCurrentPageData(data);
      } catch (error) {
        console.error("Error fetching image search data:", error);
      }
    };

    fetchData();
  }, [page]);

  useEffect(() => {
    const getHistory = async () => {
      try {
        const response = await fetchHistoryData(historyId);
        setHistoryData(response);

        const currentShoesData = response.matchingShoes
          ? shoesData.find(
              (shoe) =>
                String(shoe.modelNumber) === String(response.matchingShoes)
            )
          : {
              top: [],
              mid: [],
              bottom: [],
              outline: [],
            };

        setCurrentPatterns([
          {
            title: "현장패턴",
            top: response.top || [],
            mid: response.mid || [],
            bottom: response.bottom || [],
            outline: response.outline || [],
          },
          {
            title: "DB패턴",
            top: currentShoesData.top || [],
            mid: currentShoesData.mid || [],
            bottom: currentShoesData.bottom || [],
            outline: currentShoesData.outline || [],
          },
        ]);
      } catch (error) {
        console.error("Error fetching history data:", error);
      }
    };

    getHistory();
  }, [historyId, shoesData]);

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
        />
      </div>
    </div>
  );
};
export default CrimeHistoryMain;
