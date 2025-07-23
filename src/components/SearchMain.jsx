import Button from "./Button";
import "./SearchMain.css"; // Assuming you have a CSS file for styling
import { useNavigate } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import FormList from "./FormList"; // Assuming you have a FormList component
import { crimeDataContext } from "../App"; // Assuming you have a context for crime data
import Sidebar from "./Sidebar"; // Assuming you have a Sidebar component for navigation
import SearchResults from "./SearchResults"; // Assuming you have a SearchResults component for displaying results

const SearchMain = ({ searchForm, setSearchForm }) => {
  const navigate = useNavigate(); // 훅 호출\

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSearchForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const { crimeData } = useContext(crimeDataContext); // Assuming you have a context for crime data
  const [filteredData, setFilteredData] = useState(crimeData);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    console.log("crimeData", crimeData);
    if (crimeData && crimeData.length > 0) {
      setFilteredData(
        crimeData?.map((item) => ({
          crimeNumber: item.crimeNumber,
          imageNumber: item.imageNumber,
          crimeName: item.crimeName,
          findTime: item.findTime,
          requestOffice: item.requestOffice,
          findMethod: item.findMethod,
          // state: item.state,
          // ranking: item.ranking,
        }))
      );

      setColumns([
        "사건등록번호",
        "이미지번호",
        "사건명",
        "채취일시",
        "의뢰관서",
        "채취방법",
        // "상태(진행중/발견/불발견)",
        // "순위",
      ]);
    }
  }, [crimeData]);

  const handleSearch = (e) => {
    e.preventDefault();

    setFilteredData(() => {
      return crimeData
        .filter((tableData) => {
          return Object.keys(searchForm).every((key) => {
            if (searchForm[key] === "") return true; // 필터링 조건이 비어있으면 통과
            return tableData[key] && String(tableData[key]) === searchForm[key];
          });
        })
        .map((filteredRow) => ({
          crimeNumber: filteredRow.crimeNumber,
          imageNumber: filteredRow.imageNumber,
          crimeName: filteredRow.crimeName,
          findTime: filteredRow.findTime,
          requestOffice: filteredRow.requestOffice,
          findMethod: filteredRow.findMethod,
          // state: filteredRow.state,
          // ranking: filteredRow.ranking,
        }));
    });
  };

  const handleClear = () => {
    setSearchForm(() => {
      const resetData = {};
      Object.keys(searchForm).forEach((key) => {
        resetData[key] = "";
      });
      return resetData;
    });
    setFilteredData(
      crimeData.map((item) => {
        return {
          crimeNumber: item.crimeNumber,
          imageNumber: item.imageNumber,
          crimeName: item.crimeName,
          findTime: item.findTime,
          requestOffice: item.requestOffice,
          findMethod: item.findMethod,
          // state: item.state,
          // ranking: item.ranking,
        };
      })
    ); // 초기화 시 전체 데이터로 되돌리기
  };

  return (
    <>
      <div className="SearchMain">
        <Sidebar />
        <div className="main">
          <FormList
            formData={searchForm}
            handleChange={handleChange}
            direction="grid"
          />
          <div className="button-container">
            <Button value="조회" type="submit" onClick={handleSearch} />
            <Button value="초기화" type="submit" onClick={handleClear} />
          </div>
          <SearchResults
            filteredData={filteredData}
            columns={columns}
            searchForm={searchForm}
            tableClick={(rowIndex) => navigate(`/search/${rowIndex}`)}
          />
        </div>
      </div>
    </>
  );
};

export default SearchMain;
