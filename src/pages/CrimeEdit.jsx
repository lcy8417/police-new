import EditMain from "../components/EditMain";
import Header from "../components/Header";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CrimeEdit = () => {
  const navigate = useNavigate();
  const [scrollState, setScrollState] = useState({
    image: "/src/assets/00001-23-0360_1.png",
    zoom: 0,
    contrast: 0,
    saturation: 0,
    brightness: 0,
  });

  const buttonList = [
    {
      value: "뒤로가기",
      event: () => {
        navigate(-1);
      },
    },
    {
      value: "저장",
      event: () => {
        // 저장 로직을 여기에 추가
        console.log("저장 버튼 클릭");
      },
    },
  ];

  return (
    <>
      <Header value="사건 편집" buttonList={buttonList} />
      <EditMain scrollState={scrollState} setScrollState={setScrollState} />
    </>
  );
};
export default CrimeEdit;
