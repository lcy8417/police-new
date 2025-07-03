import ShoesRegisterMain from "../components/ShoesRegisterMain";
import Header from "../components/Header";
import { useState } from "react";
import { onlyPatternName } from "../utils/get-input-change";

const url = import.meta.env.VITE_API_URL; // Base URL for API requests

const ShoesRegister = () => {
  const [formData, setFormData] = useState({
    image: null,
    top: [],
    mid: [],
    bottom: [],
    outline: [],
    findLocation: "",
    manufacturer: "",
    emblem: "",
    modelNumber: "",
    findYear: 0,
  });

  const buttonList = [
    {
      value: "등록",
      event: () => {
        if (!formData.image || !formData.modelNumber) {
          alert("이미지와 모델 번호는 필수 입력 사항입니다.");
          return;
        }
        fetch(`${url}/shoes/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            top: onlyPatternName(formData, "top"),
            mid: onlyPatternName(formData, "mid"),
            bottom: onlyPatternName(formData, "bottom"),
            outline: onlyPatternName(formData, "outline"),
            image: formData.image.split(",")[1],
          }),
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error("Image upload failed");
            }
          })
          .catch((error) => {
            console.error("Error uploading image:", error);
          });

        alert("신발 정보가 등록되었습니다.");
        window.location.reload();

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
