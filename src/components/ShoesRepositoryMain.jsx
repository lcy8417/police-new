import SearchResults from "./SearchResults";
import { useState, useEffect } from "react";
import "./ShoesRepositoryMain.css";
import ImageLoader from "./ImageLoader";
import FormList from "./FormList";
import PartialPatterns from "./PartialPatterns";
import { useNavigate, useParams } from "react-router-dom";
import Button from "./Button";
import { fetchShoesData } from "../services/crud";
import { toPatternPaths } from "../utils/path-utils"; // 🧊 경로 유틸리티 함수 가져오기

const ShoesRepositoryMain = () => {
  const { modelNumber } = useParams();

  const navigate = useNavigate();
  const [shoesData, setShoesData] = useState([]);

  console.log("data", shoesData);

  const currentShoesData = shoesData?.find(
    (item) => String(item.modelNumber) === String(modelNumber)
  );

  const filteredData = shoesData.map((item) => ({
    modelNumber: item.modelNumber,
    findLocation: item.findLocation,
    manufacturer: item.manufacturer,
    findYear: item.findYear,
    emblem: item.emblem,
  }));

  const shoesDataForm = {
    image: "undefined",
    modelNumber: "",
    findLocation: "",
    manufacturer: "",
    findYear: "",
    emblem: "",
  };

  const columns = ["모델번호", "수집장소", "제조사", "수집년도", "상표명"];

  // 현장이미지 패턴, DB이미지 패턴을 보여주기 위한 상태
  const [currentPatterns, setCurrentPatterns] = useState([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const readShoesData = async () => {
      try {
        const data = await fetchShoesData(page);
        const updatedShoesData = data.map((item) => ({
          ...item,
          top: toPatternPaths(item.top),
          mid: toPatternPaths(item.mid),
          bottom: toPatternPaths(item.bottom),
          outline: toPatternPaths(item.outline),
        }));
        setShoesData(updatedShoesData);
      } catch (error) {
        console.error("Error fetching shoes data:", error);
      }
    };
    readShoesData();
  }, [page]);

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
      <div className="main">
        <div className="list-header">
          <Button
            value="이전"
            onClick={() => setPage(Math.max(0, parseInt(page) - 1))}
          />
          <h1>신발 리스트</h1>

          <Button value="다음" onClick={() => setPage(parseInt(page) + 1)} />
        </div>
        <SearchResults
          columns={columns}
          filteredData={filteredData || {}}
          tableClick={(crimeNumber) => {
            navigate(`/shoesRepository/${crimeNumber}`);
          }}
          doubleClick={() => {
            navigate(`/shoesEdit/${modelNumber}`);
            // const url = `${window.location.origin}/shoesEdit/${modelNumber}`;
            // window.open(url, "_blank", "noopener,noreferrer");
          }}
        />
        <div className="search-form">
          <ImageLoader
            formData={currentShoesData || shoesDataForm}
            value="측면이미지"
          />
          <PartialPatterns patternItems={currentPatterns} />

          <FormList
            formData={currentShoesData || shoesDataForm}
            direction="flex"
            readOnly
          />
        </div>
      </div>
    </div>
  );
};

export default ShoesRepositoryMain;
