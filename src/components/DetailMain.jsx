import "./DetailMain.css";
import Button from "./Button";
import { useNavigate, useParams } from "react-router-dom";
import ImageLoader from "./ImageLoader"; // Assuming you have an ImageLoader component
import FormList from "./FormList"; // Assuming you have a FormList component
import { useContext, useState } from "react";
import { crimeDataContext, historyDataContext } from "../App"; // Assuming you have a context for crime data
import Sidebar from "./Sidebar";
import SearchResults from "./SearchResults"; // Assuming you have a SearchResults component

const MockData = [
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

const DetailMain = () => {
  const navigate = useNavigate();

  const { crimeData } = useContext(crimeDataContext); // Accessing crime data from context
  const { historyData } = useContext(historyDataContext); // Accessing crime data from context
  const { id } = useParams(); // Assuming you have a route parameter for the crime ID
  const [filteredData, setFilteredData] = useState(historyData);
  const columns = Object.keys(MockData[0]);

  return (
    <div className="DetailMain">
      <Sidebar />

      <div className="main">
        <div className="image-swapper">
          <ImageLoader
            value="현장이미지"
            formData={crimeData[id]}
            propsImage={crimeData[id].image}
          />
          <div className="image-swapper-buttons">
            <Button value="현장이미지" type="button" size="full-width" />
            <Button value="편집이미지" type="button" size="full-width" />
          </div>
        </div>
        <div className="form-container">
          <FormList formData={crimeData[id]} />
          <div>
            <SearchResults
              title="검색 이력"
              columns={columns}
              filteredData={filteredData}
              tableClick={(rowIndex) => {
                const url = `${window.location.origin}/search/${id}/beforeResult/${rowIndex}`;
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
