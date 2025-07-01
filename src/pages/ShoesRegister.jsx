import ShoesRegisterMain from "../components/ShoesRegisterMain";
import Header from "../components/Header";
import { useState } from "react";
import { onlyPatternName } from "../utils/get-input-change";
import { shoesDataContext } from "../App";
import { useContext } from "react";

const url = "http://localhost:8000";

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

  const { shoesData, setShoesData } = useContext(shoesDataContext);

  const buttonList = [
    {
      value: "등록",
      event: () => {
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
            setShoesData((prevData) => [
              ...prevData,
              {
                ...formData,
              },
            ]);
          })
          .catch((error) => {
            console.error("Error uploading image:", error);
          });

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
