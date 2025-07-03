import "./ResultDetailMain.css";
import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import Button from "./Button";
import ImageLoader from "./ImageLoader";
import FormList from "./FormList";
import Sidebar from "./Sidebar";
import PartialPatterns from "./PartialPatterns";
import { useContext } from "react";
import { crimeDataContext } from "../App";
import { fetchHistorySave, fetchCurrentShoes } from "../services/crud";
import { toPatternPaths } from "../utils/path-utils"; // 🧊 경로 유틸리티 함수 가져오기

const url = import.meta.env.VITE_API_URL;

const ShoesResultDetail = () => {
  const { modelNumber, crimeNumber } = useParams();
  const [searchParams] = useSearchParams();
  const ranking = searchParams.get("ranking");
  const navigator = useNavigate();

  const sideImage = {
    image: `${url}/shoes_images/S/${modelNumber}.png`,
  };
  const bottomImage = {
    image: `${url}/shoes_images/B/${modelNumber}.png`,
  };

  const { crimeData } = useContext(crimeDataContext);

  // Find the crime data for the given modelNumber
  const currentCrimeData = crimeData.find(
    (item) => String(item.crimeNumber) === String(crimeNumber)
  );

  const [shoesData, setShoesData] = useState([]);

  useEffect(() => {
    const getShoesInfo = async () => {
      try {
        const data = await fetchCurrentShoes(modelNumber);

        setShoesData({
          ...data,
          top: toPatternPaths(data.top) || [],
          mid: toPatternPaths(data.mid) || [],
          bottom: toPatternPaths(data.bottom) || [],
          outline: toPatternPaths(data.outline) || [],
        });
      } catch (error) {
        console.error("Error fetching current shoes data:", error);
      }
    };

    getShoesInfo();
  }, [modelNumber]);

  const shoesDiscover = async (ranking = null, modelNumber = null) => {
    try {
      await fetchHistorySave({
        crimeNumber,
        currentCrimeData,
        ranking,
        modelNumber,
      });
      alert("신발 정보가 저장되었습니다.");
      navigator(`/search/${crimeNumber}`);
    } catch (err) {
      console.error("저장 실패:", err);
    }
  };

  const [currentPageData, setCurrentPageData] = useState([]);
  const [currentPartial, _] = useState("상");

  // TODO: 실제 검색 결과로 연동되게 수정 필요
  useEffect(() => {
    setCurrentPageData([
      {
        title: "현장패턴",
        top: currentCrimeData?.top || [],
        mid: currentCrimeData?.mid || [],
        bottom: currentCrimeData?.bottom || [],
        outline: currentCrimeData?.outline || [],
      },
      {
        title: "DB패턴",
        top: shoesData?.top || [],
        mid: shoesData?.mid || [],
        bottom: shoesData?.bottom || [],
        outline: shoesData?.outline || [],
      },
    ]);
  }, [currentPartial, currentCrimeData, shoesData]);

  return (
    <div className="ResultDetailMain">
      <Sidebar />
      <div className="main">
        <ImageLoader
          formData={currentCrimeData}
          propsImage={currentCrimeData?.image}
        />
        <div className="gt-shoes-images">
          <div className="gt-shoes-image">
            <ImageLoader
              formData={bottomImage}
              propsImage={bottomImage?.image}
              value="바닥이미지"
            />
          </div>
          <div className="gt-shoes-image">
            <ImageLoader
              formData={sideImage}
              propsImage={sideImage?.image}
              value="측면이미지"
            />
          </div>
        </div>
        <PartialPatterns patternItems={currentPageData} />

        <div className="detail-info">
          <FormList formData={currentCrimeData || {}} direction="flex" />
          <div className="button-items">
            <Button
              value="불발견"
              size="full-width"
              onClick={() => shoesDiscover()}
            />
            <Button
              value="발견"
              size="full-width"
              onClick={() => shoesDiscover(ranking, modelNumber)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default ShoesResultDetail;
