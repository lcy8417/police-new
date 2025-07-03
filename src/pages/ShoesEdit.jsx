import ShoesRegisterMain from "../components/ShoesRegisterMain";
import Header from "../components/Header";
import { useState } from "react";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchCurrentShoes, fetchShoesEdit } from "../services/crud"; // 🧊 CRUD 서비스에서 함수 가져오기
import { toPatternPaths } from "../utils/path-utils"; // 🧊 경로 유틸리티 함수 가져오기

const ShoesEdit = () => {
  const { modelNumber } = useParams();
  const [shoesData, setShoesData] = useState([]);

  useEffect(() => {
    const getShoesInfo = async () => {
      try {
        const data = await fetchCurrentShoes(modelNumber);

        console.log(data.image);

        setShoesData({
          ...data,
          top: toPatternPaths(data.top) || [],
          mid: toPatternPaths(data.mid) || [],
          bottom: toPatternPaths(data.bottom) || [],
          outline: toPatternPaths(data.outline) || [],
        });
      } catch (error) {
        console.error("Error fetching current shoes data:", error);
      }
    };

    getShoesInfo();
  }, [modelNumber]);

  const buttonList = [
    {
      value: "수정",
      event: () => {
        (async () => {
          try {
            await fetchShoesEdit({
              modelNumber,
              body: shoesData,
            });
            alert("신발 정보가 수정되었습니다.");
          } catch (error) {
            console.error("Error updating shoes data:", error);
            alert("신발 정보 수정에 실패했습니다.");
          }
        })();
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
        formData={shoesData || {}}
        setFormData={setShoesData}
        propsImage={shoesData?.image || null}
        sidebar={false}
      />
    </>
  );
};
export default ShoesEdit;
