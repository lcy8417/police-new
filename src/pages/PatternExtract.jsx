import PatternExtractMain from "../components/PatternExtractMain";
import Header from "../components/Header";
import { useNavigate, useParams } from "react-router-dom";
import { useContext } from "react";
import { crimeDataContext } from "../App";
import { fetchPatterns } from "../services/crud"; // Import the fetchPatterns function

const PatternExtract = () => {
  const navigate = useNavigate();
  const { crimeNumber } = useParams();
  const { crimeData } = useContext(crimeDataContext);

  const currentCrimeData = crimeData.find(
    (item) => String(item.crimeNumber) === String(crimeNumber)
  );

  const buttonList = [
    {
      value: "신발 검색",
      event: () => {
        const updatePatterns = async () => {
          await fetchPatterns(crimeNumber, currentCrimeData);
        };

        try {
          updatePatterns();
          navigate(`/search/${crimeNumber}/shoesResult`);
          alert("문양이 업데이트되었습니다.");
        } catch (error) {
          console.error("Error updating patterns:", error);
          alert("문양 업데이트 중 오류가 발생했습니다.");
        }
      },
    },
  ];

  return (
    <>
      <Header value="현장이미지 패턴 추출" buttonList={buttonList} />
      <PatternExtractMain />;
    </>
  );
};

export default PatternExtract;
