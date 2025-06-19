import SearchMain from "../components/SearchMain";
import { useState } from "react";
import Header from "../components/Header";
import { useContext } from "react";
import { crimeDataContext } from "../App"; // Adjust the import path as necessary
const CrimeSearch = () => {
  const { crimeData } = useContext(crimeDataContext);

  const [searchForm, setSearchForm] = useState({
    사건등록번호: "",
    이미지번호: "",
    사건명: "",
    채취일시: "",
    채취장소: "",
    의뢰관서: "",
    채취방법: "",
    진행상태: "",
    순위: "",
  });

  return (
    <>
      {crimeData && (
        <>
          <Header value="사건 목록" />
          <SearchMain searchForm={searchForm} setSearchForm={setSearchForm} />
        </>
      )}
    </>
  );
};

export default CrimeSearch;
