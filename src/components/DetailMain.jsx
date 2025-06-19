import "./DetailMain.css";
import Button from "./Button";
import { useNavigate, useParams } from "react-router-dom";
import ImageLoader from "./ImageLoader"; // Assuming you have an ImageLoader component
import FormList from "./FormList"; // Assuming you have a FormList component
import { useContext, useEffect, useState } from "react";
import { crimeDataContext } from "../App"; // Assuming you have a context for crime data
import Sidebar from "./Sidebar";
import SearchResults from "./SearchResults"; // Assuming you have a SearchResults component

const MockData = [
  {
    crimeNumber: 0,
    등록일시: "2023-10-02",
    ranking: "1",
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

const url = "http://localhost:8000"; // Base URL for API requests

const DetailMain = ({ setCrimeNumber }) => {
  const navigate = useNavigate();

  const { crimeData } = useContext(crimeDataContext); // Accessing crime data from context
  const { crimeNumber } = useParams();
  const [currentCrimeData, setCurrentCrimeData] = useState({});
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    fetch(`${url}/crime/${crimeNumber}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Fetched crime data:", data);
        setHistoryData(data || []);
      })
      .catch((error) => {
        console.error("Error fetching crime data:", error);
      });
  }, [crimeNumber]);

  useEffect(() => {
    setCurrentCrimeData(
      crimeData.find(
        (data) => String(data.crimeNumber) === String(crimeNumber)
      ) || {}
    );

    setCrimeNumber(crimeNumber);
  }, [crimeData, crimeNumber, setCurrentCrimeData]);

  const columns = Object.keys(MockData[0]);

  return (
    <div className="DetailMain">
      <Sidebar />

      <div className="main">
        <div className="image-swapper">
          <ImageLoader
            value="현장이미지"
            formData={currentCrimeData}
            propsImage={currentCrimeData.image}
          />
          <div className="image-swapper-buttons">
            <Button value="현장이미지" type="button" size="full-width" />
            <Button value="편집이미지" type="button" size="full-width" />
          </div>
        </div>
        <div className="form-container">
          <FormList formData={currentCrimeData} />
          <div>
            <SearchResults
              title="검색 이력"
              columns={columns}
              filteredData={historyData || []}
              tableClick={(rowIndex) => {
                const url = `${window.location.origin}/search/${crimeNumber}/beforeResult/${rowIndex}`;
                window.open(url, "_blank", "noopener,noreferrer");
              }}
            />
          </div>
          <div className="button-container">
            <Button
              value="← 목록으로 돌아가기"
              type="button"
              onClick={() => navigate(-1)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default DetailMain;
