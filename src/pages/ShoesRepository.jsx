import ShoesRepositoryMain from "../components/ShoesRepositoryMain";
import Header from "../components/Header";
import { useState } from "react";

const CrimeSearch = () => {
  const [selectedRow, setSelectedRow] = useState({
    수집장소: "",
    제조사: "",
    상표명: "",
    모델번호: "",
    수집년도: "",
  });

  return (
    <>
      <Header value={"신발 조회 "} />
      <ShoesRepositoryMain
        selectedRow={selectedRow}
        setSelectedRow={setSelectedRow}
      />
    </>
  );
};

export default CrimeSearch;
