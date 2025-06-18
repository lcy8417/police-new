import BeforeResultMain from "../components/BeforeResultMain";
import Header from "../components/Header";

const BeforeResult = () => {
  const buttonList = [
    {
      value: "발견 [5위]",
      event: () => {},
    },
  ];
  return (
    <>
      <Header value="검색이력" buttonList={buttonList} />
      <BeforeResultMain />
    </>
  );
};
export default BeforeResult;
