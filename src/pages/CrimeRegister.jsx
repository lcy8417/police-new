import CrimeRegisterMain from "../components/CrimeRegisterMain";
import Header from "../components/Header";
import { useState } from "react";
import { crimeDataContext } from "../App";
import { useContext } from "react";

const url = "http://localhost:8000";

const CrimeRegister = () => {
  const { setCrimeData } = useContext(crimeDataContext);
  const [editImage, setEditImage] = useState(null);
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
    const res = await fetch(`${url}/crime/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...formData,
        image: formData.image.replace(/^data:image\/[a-z]+;base64,/, ""),
      }),
    });

    if (!res.ok) {
      console.error("Image upload failed");
      return;
    }

    const blob = await res.blob(); // 🧊 서버로부터 받은 이미지 데이터
    const imageURL = URL.createObjectURL(blob); // 📸 브라우저 렌더링용 URL 생성

    setEditImage(imageURL); // 🖼️ 이미지 URL 상태 업데이트

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
  };

  return (
    <>
      <img src={editImage}></img>
      <Header
        value="신규 사건 등록"
        buttonList={[{ value: "저장", event: handleSubmit }]}
      />
      <CrimeRegisterMain formData={formData} setFormData={setFormData} />
    </>
  );
};

export default CrimeRegister;
