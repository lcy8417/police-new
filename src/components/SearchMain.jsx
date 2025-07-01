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
    if (crimeData && crimeData.length > 0) {
      setFilteredData(
        crimeData?.map((item) => ({
          crimeNumber: item.crimeNumber,
          state: item.state,
          ranking: item.ranking,
          matchingShoes: item.matchingShoes,
        }))
      );

      setColumns(["사건번호", "상태(진행중/발견/불발견)", "순위", "매칭된 신발"]);
    }
  }, [crimeData]);

  const handleSearch = (e) => {
    e.preventDefault();

    setFilteredData(() => {
      return crimeData.filter((tableData) => {
        return Object.keys(searchForm).every((key) => {
          if (searchForm[key] === "") return true; // 필터링 조건이 비어있으면 통과
          return tableData[key] && String(tableData[key]) === searchForm[key];
        });
      });
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
    setFilteredData(crimeData); // 초기화 시 전체 데이터로 되돌리기
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
