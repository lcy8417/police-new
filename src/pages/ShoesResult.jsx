import ShoesResultMain from "../components/ShoesResultMain";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const ShoesResult = () => {
  const navigate = useNavigate();
  const [binary, setBinary] = useState("이진화보기");

  const buttonList = [
    {
      value: "뒤로가기",
      event: () => {
        navigate(-1);
      },
    },
    {
      value: binary,
      event: () => {
        setBinary((prev) =>
          prev === "이진화보기" ? "원본보기" : "이진화보기"
        );
      },
    },
  ];

  return (
    <>
      <Header value="사건검색결과조회" buttonList={buttonList} />
      <ShoesResultMain binary={binary} />
    </>
  );
};

export default ShoesResult;
