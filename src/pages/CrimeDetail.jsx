import DetailMain from "../components/DetailMain";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const CrimeDetail = () => {
  const [crimeNumber, setCrimeNumber] = useState();
  const navigate = useNavigate();
  const buttonList = [
    {
      value: "편집",
      event: () => {
        const url = `${window.location.origin}/edit/${crimeNumber}`;
        window.open(url, "_blank", "noopener,noreferrer");
      },
    },
    { value: "문양추출", event: () => navigate("./patternExtract") },
  ];

  return (
    <>
      <Header value={"사건 상세 정보"} buttonList={buttonList} />
      <DetailMain setCrimeNumber={setCrimeNumber} />
    </>
  );
};
export default CrimeDetail;
