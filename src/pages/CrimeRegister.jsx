import CrimeRegisterMain from "../components/CrimeRegisterMain";
import Header from "../components/Header";
import { useState } from "react";
import { fetchCrimeRegister } from "../services/crud"; // 🧊 CRUD 서비스에서 함수 가져오기

const CrimeRegister = () => {
  const [formData, setFormData] = useState({
    image: null,
    crimeNumber: "",
    imageNumber: "",
    crimeName: "",
    findTime: "",
    requestOffice: "",
    findMethod: "",
  });

  const handleSubmit = async () => {
    try {
      await fetchCrimeRegister(formData);
      alert("사건이 등록되었습니다.");
      // 초기화
      setFormData({
        image: null,
        crimeNumber: "",
        imageNumber: "",
        crimeName: "",
        findTime: "",
        requestOffice: "",
        findMethod: "",
      });
    } catch (error) {
      console.error("사건 등록 중 오류 발생:", error);
      alert("사건 등록에 실패했습니다. 다시 시도해주세요.");
      return;
    }
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
