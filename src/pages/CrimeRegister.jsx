import CrimeRegisterMain from "../components/CrimeRegisterMain";
import Header from "../components/Header";
import { useState } from "react";
import { crimeDataContext } from "../App";
import { useContext } from "react";

const CrimeRegister = () => {
  const { setCrimeData } = useContext(crimeDataContext);
  const [formData, setFormData] = useState({
    image: null,
    사건등록번호: "",
    이미지번호: "",
    사건명: "",
    채취일시: "",
    채취장소: "",
    의뢰관서: "",
    채취방법: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setCrimeData((prev) => [
      ...prev,
      { ...formData, id: prev.length, 진행상태: "진행중", 순위: "1" },
    ]);
    alert("사건이 등록되었습니다.");
    setFormData({
      image: null,
      사건등록번호: "",
      이미지번호: "",
      사건명: "",
      채취일시: "",
      채취장소: "",
      의뢰관서: "",
      채취방법: "",
    });
  };

  return (
    <>
      <Header
        value="신규 사건 등록"
        buttonList={[{ value: "저장", event: handleSubmit }]}
      />
      <CrimeRegisterMain formData={formData} setFormData={setFormData} />
    </>
  );
};

export default CrimeRegister;
