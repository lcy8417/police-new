import SearchMain from "../components/SearchMain";
import { useState } from "react";
import Header from "../components/Header";
import { useContext } from "react";
import { crimeDataContext } from "../App"; // Adjust the import path as necessary
const CrimeSearch = () => {
  const { crimeData } = useContext(crimeDataContext);

  const [searchForm, setSearchForm] = useState({
    crimeNumber: "",
    imageNumber: "",
    crimeName: "",
    findTime: "",
    requestOffice: "",
    findMethod: "",
    state: "",
    ranking: "",
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
