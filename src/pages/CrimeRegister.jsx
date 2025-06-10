import RegisterMain from "../components/CrimeRegisterMain";
import Header from "../components/Header";
import { useState } from "react";

const CrimeRegister = () => {
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
    console.log("폼 제출:", formData);
  };

  return (
    <>
      <Header
        value="신규 사건 등록"
        buttonList={[{ value: "저장", event: handleSubmit }]}
      />
      <RegisterMain formData={formData} setFormData={setFormData} />
    </>
  );
};

export default CrimeRegister;
