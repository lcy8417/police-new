import "./ResultDetailMain.css";
import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import Button from "./Button";
import ImageLoader from "./ImageLoader";
import FormList from "./FormList";
import Sidebar from "./Sidebar";
import PartialPatterns from "./PartialPatterns";
import { useContext } from "react";
import { crimeDataContext, shoesDataContext } from "../App";
import { fetchHistorySave } from "../services/crud";

const ShoesResultDetail = () => {
  const { modelNumber, crimeNumber } = useParams();
  const [searchParams] = useSearchParams();
  const ranking = searchParams.get("ranking");
  const navigator = useNavigate();

  const sideImage = {
    image: `http://localhost:8000/shoes_images/S/${modelNumber}.png`,
  };
  const bottomImage = {
    image: `http://localhost:8000/shoes_images/B/${modelNumber}.png`,
  };

  const { crimeData } = useContext(crimeDataContext);
  const { shoesData } = useContext(shoesDataContext);

  // Find the crime data for the given modelNumber
  const currentCrimeData = crimeData.find(
    (item) => String(item.crimeNumber) === String(crimeNumber)
  );

  const currentShoesData = shoesData.find(
    (item) => String(item.modelNumber) === String(modelNumber)
  );

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
        top: currentShoesData?.top || [],
        mid: currentShoesData?.mid || [],
        bottom: currentShoesData?.bottom || [],
        outline: currentShoesData?.outline || [],
      },
    ]);
  }, [currentPartial, currentCrimeData]);

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
