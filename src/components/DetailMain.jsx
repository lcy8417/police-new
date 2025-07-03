import "./DetailMain.css";
import Button from "./Button";
import { useNavigate, useParams } from "react-router-dom";
import ImageLoader from "./ImageLoader"; // Assuming you have an ImageLoader component
import FormList from "./FormList"; // Assuming you have a FormList component
import { useContext, useEffect, useState, useRef } from "react";
import { crimeDataContext } from "../App"; // Assuming you have a context for crime data
import Sidebar from "./Sidebar";
import SearchResults from "./SearchResults"; // Assuming you have a SearchResults component
import { imageChangeHandler } from "../utils/get-input-change"; // Assuming you have a utility function for image handling

const url = import.meta.env.VITE_API_URL; // Base URL for API requests

const DetailMain = ({ setCrimeNumber }) => {
  const navigate = useNavigate();

  const imgRef = useRef(null); // Reference for the image element
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

  const columns = ["id", "등록일시", "순위", "매칭된 신발 정보"];

  return (
    <div className="DetailMain">
      <Sidebar />

      <div className="main">
        <div className="image-swapper">
          <ImageLoader
            value="현장이미지"
            formData={currentCrimeData}
            propsImage={currentCrimeData.image}
            imgRef={imgRef}
          />
          <div className="image-swapper-buttons">
            <Button
              value="현장이미지"
              type="button"
              size="full-width"
              onClick={() =>
                imageChangeHandler("origin", imgRef, currentCrimeData)
              }
            />
            <Button
              value="편집이미지"
              type="button"
              size="full-width"
              onClick={() =>
                imageChangeHandler("edit", imgRef, currentCrimeData)
              }
            />
          </div>
        </div>
        <div className="form-container">
          <FormList formData={currentCrimeData} />
          <SearchResults
            title="검색 이력"
            columns={columns}
            filteredData={historyData || []}
            tableClick={(rowIndex) => {
              const ranking = historyData.find(
                (data) => data.id === rowIndex
              )?.ranking;
              const url = `${window.location.origin}/search/${crimeNumber}/crimeHistory/${rowIndex}?ranking=${ranking}`;
              window.open(url, "_blank", "noopener,noreferrer");
            }}
          />
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
