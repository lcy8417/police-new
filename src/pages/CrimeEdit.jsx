import EditMain from "../components/EditMain";
import Header from "../components/Header";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { crimeDataContext } from "../App";
import { fetchEditImageSave } from "../services/crud";

const url = "http://192.168.0.17:8000";

const CrimeEdit = () => {
  const { crimeData, setCrimeData } = useContext(crimeDataContext);
  const { crimeNumber } = useParams();

  // 현재 스크롤 상태 메모
  const [scrollState, setScrollState] = useState({
    image: null,
    zoom: 0,
    contrast: 0,
    saturation: 0,
    brightness: 0,
    rotate: 0,
    binarization: 127,
  });

  const currentCrimeData = crimeData.find(
    (item) => String(item.crimeNumber) === String(crimeNumber)
  );

  // 데이터가 준비되면 초기화
  useEffect(() => {
    if (!crimeData || crimeData.length === 0) return;

    const match = crimeData.find(
      (item) => String(item.crimeNumber) === String(crimeNumber)
    );

    if (match) {
      setScrollState({
        image: match.image || "",
        zoom: match.zoom || 0,
        contrast: match.contrast || 0,
        saturation: match.saturation || 0,
        brightness: match.brightness || 0,
        rotate: match.rotate || 0,
        binarization: 127,
      });
    }
  }, [crimeNumber, crimeData]);

  const navigate = useNavigate();

  const buttonList = [
    {
      value: "뒤로가기",
      event: () => {
        navigate(-1);
      },
    },
    {
      // 임시로 확대, 밝기 등의 상태만 저장
      value: "저장",
      event: async () => {
        await fetchEditImageSave({
          crimeNumber,
          scrollState,
        });

        navigate(`/search/${crimeNumber}`);
        setCrimeData((prevData) =>
          prevData.map((item) =>
            String(item.crimeNumber) === String(crimeNumber)
              ? { ...item, editImage: scrollState.image }
              : item
          )
        );
      },
    },
  ];

  return (
    <>
      <Header value="사건 편집" buttonList={buttonList} />
      <EditMain scrollState={scrollState} setScrollState={setScrollState} />
    </>
  );
};
export default CrimeEdit;
