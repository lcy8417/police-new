import ShoesRegisterMain from "../components/ShoesRegisterMain";
import Header from "../components/Header";
import { useState } from "react";
import { shoesDataContext } from "../App";
import { useContext } from "react";

const ShoesRegister = () => {
  const { setShoesData } = useContext(shoesDataContext);
  const [formData, setFormData] = useState({
    image: null,
    top: [],
    mid: [],
    bottom: [],
    outline: [],
    수집장소: "",
    제조사: "",
    상표명: "",
    모델번호: "",
    수집년도: "",
  });

  const buttonList = [
    {
      value: "등록",
      event: () => {
        setShoesData((prev) => [...prev, { ...formData }]);
        alert("신발 정보가 등록되었습니다.");
        setFormData({
          image: null,
          top: [],
          mid: [],
          bottom: [],
          outline: [],
          수집장소: "",
          제조사: "",
          상표명: "",
          모델번호: "",
          수집년도: "",
        });
      },
    },
  ];

  return (
    <>
      <Header value={"신규 신발 등록"} buttonList={buttonList} />
      <ShoesRegisterMain formData={formData} setFormData={setFormData} />
    </>
  );
};
export default ShoesRegister;
