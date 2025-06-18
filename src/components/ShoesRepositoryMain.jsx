import SearchResults from "./SearchResults";
import { useState, useEffect, useContext } from "react";
import Sidebar from "./Sidebar";
import "./ShoesRepositoryMain.css";
import { shoesDataContext } from "../App";
import ImageLoader from "./ImageLoader";
import FormList from "./FormList";
import PartialPatterns from "./PartialPatterns";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";

const ShoesRepositoryMain = ({ selectedRow, setSelectedRow }) => {
  const { shoesId } = useParams(); // Get the selected ID from the URL parameters

  const navigate = useNavigate(); // Hook to navigate programmatically
  const { shoesData } = useContext(shoesDataContext); // Using the context to get shoes data
  const filteredData = shoesData.map((item) => {
    return {
      id: item.id,
      수집장소: item.수집장소,
      제조사: item.제조사,
      모델번호: item.모델번호,
      수집년도: item.수집년도,
      상표명: item.상표명,
    };
  });
  const columns = [
    "id",
    "수집장소",
    "제조사",
    "모델번호",
    "수집년도",
    "상표명",
  ];

  // 현장이미지 패턴, DB이미지 패턴을 보여주기 위한 상태
  const [currentPageData, setCurrentPageData] = useState([]);

  // TODO: 실제 검색 결과로 연동되게 수정 필요
  useEffect(() => {
    const selectedData = {
      ...shoesData.filter((item) => String(item.id) === String(shoesId))[0],
    };

    if (shoesId >= 0) {
      // 선택 됐을때만
      setCurrentPageData([
        {
          title: "DB이미지",
          top: selectedData.top,
          mid: selectedData.mid,
          bottom: selectedData.bottom,
        },
      ]);
    }

    setSelectedRow({ ...shoesData[shoesId] });
  }, [shoesData, shoesId, setSelectedRow]);

  return (
    <div className="ShoesRepositoryMain">
      <Sidebar />
      <div className="main">
        <SearchResults
          title="신발 리스트"
          columns={columns}
          filteredData={filteredData}
          tableClick={(id) => {
            setSelectedRow({ ...shoesData[id] });
            navigate(`/shoesRepository/${id}`);
          }}
          doubleClick={(id) => {
            const url = `${window.location.origin}/shoesEdit/${id}`;
            window.open(url, "_blank", "noopener,noreferrer");
          }}
        />
        <div className="search-form">
          <ImageLoader
            formData={selectedRow}
            propsImage={shoesId >= 0 ? selectedRow.image : "buttonRemove"}
            value="측면이미지"
          />
          <PartialPatterns patternItems={currentPageData} />
          {selectedRow && (
            <FormList formData={{ ...selectedRow }} direction="flex" readOnly />
          )}
        </div>
      </div>
    </div>
  );
};

export default ShoesRepositoryMain;
