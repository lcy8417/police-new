import PatternExtractMain from "../components/PatternExtractMain";
import Header from "../components/Header";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";

const PatternExtract = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const buttonList = [
    {
      value: "신발 검색",
      event: () => {
        navigate(`/search/${id}/shoesResult`);
      },
    },
  ];

  const [formData, setFormData] = useState({
    image: "/src/assets/00001-23-0360_1.png",
    top: [],
    mid: [],
    bottom: [],
    outline: [],
    essential: [],
  });

  return (
    <>
      <Header value="현장이미지 패턴 추출" buttonList={buttonList} />
      <PatternExtractMain formData={formData} setFormData={setFormData} />;
    </>
  );
};

export default PatternExtract;
