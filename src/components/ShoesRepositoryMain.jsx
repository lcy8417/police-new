import SearchResults from "./SearchResults";
import { useState, useEffect, useContext } from "react";
import Sidebar from "./Sidebar";
import "./ShoesRepositoryMain.css";
import { shoesDataContext } from "../App";
import ImageLoader from "./ImageLoader";
import FormList from "./FormList";
import PartialPatterns from "./PartialPatterns";
import { useNavigate, useParams } from "react-router-dom";

const ShoesRepositoryMain = () => {
  const { modelNumber } = useParams();

  const navigate = useNavigate();
  const { shoesData, setShoesData } = useContext(shoesDataContext);
  const currentShoesData = shoesData.find(
    (item) => String(item.modelNumber) === String(modelNumber)
  );
  const filteredData = shoesData.map((item) => {
    return {
      modelNumber: item.modelNumber,
      fineLocation: item.fineLocation,
      manufacturer: item.manufacturer,
      findYear: item.findYear,
      emblem: item.emblem,
    };
  });

  const columns = ["모델번호", "수집장소", "제조사", "수집년도", "상표명"];

  // 현장이미지 패턴, DB이미지 패턴을 보여주기 위한 상태
  const [currentPatterns, setCurrentPatterns] = useState([]);

  // TODO: 실제 검색 결과로 연동되게 수정 필요
  useEffect(() => {
    const selectedData = {
      ...shoesData.find(
        (item) => String(item.modelNumber) === String(modelNumber)
      ),
    };

    if (selectedData) {
      // 선택 됐을때만
      setCurrentPatterns([
        {
          title: "DB이미지",
          top: currentShoesData?.top || [],
          mid: currentShoesData?.mid || [],
          bottom: currentShoesData?.bottom || [],
          outline: currentShoesData?.outline || [],
        },
      ]);
    }
  }, [shoesData, setShoesData, modelNumber, currentShoesData]);

  return (
    <div className="ShoesRepositoryMain">
      <Sidebar />
      <div className="main">
        <SearchResults
          title="신발 리스트"
          columns={columns}
          filteredData={filteredData || {}}
          tableClick={(crimeNumber) => {
            navigate(`/shoesRepository/${crimeNumber}`);
          }}
          doubleClick={() => {
            const url = `${window.location.origin}/shoesEdit/${modelNumber}`;
            window.open(url, "_blank", "noopener,noreferrer");
          }}
        />
        <div className="search-form">
          <ImageLoader
            formData={currentShoesData}
            propsImage={
              currentShoesData ? currentShoesData?.image : "buttonRemove"
            }
            value="측면이미지"
          />
          <PartialPatterns patternItems={currentPatterns} />

          <FormList
            formData={currentShoesData || {}}
            direction="flex"
            readOnly
          />
        </div>
      </div>
    </div>
  );
};

export default ShoesRepositoryMain;
