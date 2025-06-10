import DetailMain from "../components/DetailMain";
import Header from "../components/Header";
import { useState } from "react";
import Button from "../components/Button";
import { useNavigate } from "react-router-dom";

const CrimeDetail = () => {
  const navigate = useNavigate();

  const buttonList = [
    { value: "편집", event: () => navigate("./edit") },
    { value: "문양추출", event: () => navigate("./patternExtract") },
  ];

  const [formData, setFormData] = useState({
    image: "/src/assets/00001-23-0360_1.png",
    사건등록번호: "",
    이미지번호: "",
    사건명: "",
    작성자: "",
    채취일시: "",
    채취장소: "",
    의뢰관서: "",
    채취방법: "",
  });

  return (
    <>
      <Header value={"사건 상세 정보"} buttonList={buttonList} />
      <DetailMain formData={formData} setFormData={setFormData} />
    </>
  );
};
export default CrimeDetail;
