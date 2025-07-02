import CrimeHistoryMain from "../components/CrimeHistoryMain";
import Header from "../components/Header";
import { useSearchParams } from "react-router-dom";

const CrimeHistory = () => {
  const [searchParams] = useSearchParams();
  const ranking = searchParams.get("ranking");

  const buttonList = [
    {
      value: `발견 [${ranking}위]`,
      event: () => {},
    },
  ];
  return (
    <>
      <Header value="검색이력" buttonList={buttonList} />
      <CrimeHistoryMain />
    </>
  );
};
export default CrimeHistory;
