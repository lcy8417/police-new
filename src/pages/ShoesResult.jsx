import ShoesResultMain from "../components/ShoesResultMain";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

const ShoesResult = () => {
  const navigate = useNavigate();

  const buttonList = [
    {
      value: "뒤로가기",
      event: () => {
        navigate(-1);
      },
    },
  ];

  return (
    <>
      <Header value="사건검색결과조회" buttonList={buttonList} />
      <ShoesResultMain />
    </>
  );
};

export default ShoesResult;
