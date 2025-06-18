import ShoesRegisterMain from "../components/ShoesRegisterMain";
import Header from "../components/Header";
import { useState } from "react";
import { shoesDataContext } from "../App";
import { useContext } from "react";
import { useParams } from "react-router-dom";

const ShoesEdit = () => {
  const { shoesId } = useParams();
  const { shoesData, setShoesData } = useContext(shoesDataContext);

  const [formData, setFormData] = useState({
    ...shoesData.filter((item) => parseInt(item.id) === parseInt(shoesId))[0],
  });

  const buttonList = [
    {
      value: "수정",
      event: () => {
        setShoesData((prevData) => [
          ...prevData.map((item) => {
            if (parseInt(item.id) === parseInt(shoesId)) {
              // id 비교 수정
              return { ...formData };
            }
            return item;
          }),
        ]);
        alert("신발 정보가 수정되었습니다.");
      },
    },
  ];

  return (
    <>
      <Header value={"신발 정보 수정"} buttonList={buttonList} />
      <ShoesRegisterMain
        formData={formData}
        setFormData={setFormData}
        propsImage={formData.image}
        sidebar={false}
      />
    </>
  );
};
export default ShoesEdit;
