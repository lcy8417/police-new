import ShoesRegisterMain from "../components/ShoesRegisterMain";
import Header from "../components/Header";
import { useState } from "react";
import { shoesDataContext } from "../App";
import { useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { onlyPatternName } from "../utils/get-input-change";

const url = "http://localhost:8000";

const ShoesEdit = () => {
  const { modelNumber } = useParams();
  const { shoesData, setShoesData } = useContext(shoesDataContext);

  const [formData, setFormData] = useState({});

  useEffect(() => {
    const currentShoesData = shoesData.find(
      (item) => String(item.modelNumber) === String(modelNumber)
    );
    if (currentShoesData) {
      const { modelNumber, ...restShoesData } = currentShoesData || {}; // 모델 번호를 제외한 나머지 데이터를 추출

      setFormData({
        ...restShoesData,
        top: restShoesData?.top || [],
        mid: restShoesData?.mid || [],
        bottom: restShoesData?.bottom || [],
        outline: restShoesData?.outline || [],
      });
    }
  }, [shoesData, setShoesData, modelNumber]);

  const buttonList = [
    {
      value: "수정",
      event: () => {
        fetch(`${url}/shoes/${modelNumber}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            top: onlyPatternName(formData, "top"),
            mid: onlyPatternName(formData, "mid"),
            bottom: onlyPatternName(formData, "bottom"),
            outline: onlyPatternName(formData, "outline"),
          }),
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error("수정 요청 실패");
            }
            // 서버에서 수정된 신발 데이터를 가져와서 상태 업데이트
            setShoesData((prevData) =>
              prevData.map((item) =>
                item.modelNumber === modelNumber
                  ? {
                      ...formData,
                    }
                  : item
              )
            );
            return res.json();
          })
          .catch((error) => {
            console.error("Error updating shoes data:", error);
          });

        alert("신발 정보가 수정되었습니다.");
      },
    },
  ];

  return (
    <>
      <Header
        value={`신발 정보 수정 (모델명: ${modelNumber})`}
        buttonList={buttonList}
      />
      <ShoesRegisterMain
        formData={formData || {}}
        setFormData={setFormData}
        propsImage={formData?.image || null}
        sidebar={false}
      />
    </>
  );
};
export default ShoesEdit;
