import ShoesResultDetailMain from "../components/ResultDetailMain";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";

const ShoesResultDetail = () => {
  const buttonList = [
    {
      value: "이전",
      event: () => {
        navigate(-1);
      },
    },
  ];
  const navigate = useNavigate();
  return (
    <>
      <Header value="검색결과상세보기" buttonList={buttonList} />
      <ShoesResultDetailMain />
    </>
  );
};
export default ShoesResultDetail;
