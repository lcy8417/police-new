import CrimeHistoryMain from "../components/CrimeHistoryMain";
import Header from "../components/Header";

const CrimeHistory = () => {
  const buttonList = [
    {
      value: "발견 [5위]",
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
