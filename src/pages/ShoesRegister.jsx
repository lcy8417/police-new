import Header from "../components/Header";
import { useRef, useState } from "react";
import ShoesRegisterMain from "../components/ShoesRegisterMain";
import { onlyPatternName } from "../utils/get-input-change";

const url = import.meta.env.VITE_API_URL; // Base URL for API requests

const ShoesRegister = () => {
  const mainRef = useRef(null);
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

  const [cropping, setCropping] = useState(false);

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
    {
      value: "회전(<)",
      event: () => mainRef.current?.rotateLeft?.(),
      disabled: !formData.image,
    },
    {
      value: "회전(>)",
      event: () => mainRef.current?.rotateRight?.(),
      disabled: !formData.image,
    },
    {
      value: cropping ? "크롭 완료" : "크롭 시작",
      event: () => {
        setCropping((prev) => !prev);
        mainRef.current?.toggleCrop?.();
      },
      disabled: !formData.image,
    },
  ];

  return (
    <>
      <Header value={"신규 신발 등록"} buttonList={buttonList} />
      <ShoesRegisterMain
        ref={mainRef}
        formData={formData}
        setFormData={setFormData}
      />
    </>
  );
};
export default ShoesRegister;
