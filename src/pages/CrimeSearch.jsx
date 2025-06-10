import SearchMain from "../components/SearchMain";
import { useState } from "react";
import Header from "../components/Header";

const formDemoItems = [
  {
    사건등록번호: "2023-001",
    이미지번호: "IMG-2023-001",
    사건명: "강도 사건",
    채취일시: "2023-10-01 12:00",
    채취장소: "서울 강남구",
    의뢰관서: "서울지방경찰청",
    채취방법: "현장 채취",
    진행상태: "진행 중",
    순위: "1",
  },
  {
    사건등록번호: "2023-002",
    이미지번호: "IMG-2023-002",
    사건명: "절도 사건",
    채취일시: "2023-10-02 14:30",
    채취장소: "서울 마포구",
    의뢰관서: "서울지방경찰청",
    채취방법: "현장 채취",
    진행상태: "완료",
    순위: "2",
  },
  {
    사건등록번호: "2023-003",
    이미지번호: "IMG-2023-003",
    사건명: "폭행 사건",
    채취일시: "2023-10-03 16:45",
    채취장소: "서울 용산구",
    의뢰관서: "서울지방경찰청",
    채취방법: "현장 채취",
    진행상태: "진행 중",
    순위: "3",
  },
];

const CrimeSearch = () => {
  const [formData, setFormData] = useState({
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
      <Header value={"사건 목록 "} />
      <SearchMain
        formData={formData}
        setFormData={setFormData}
        formDemoItems={formDemoItems}
      />
    </>
  );
};

export default CrimeSearch;
