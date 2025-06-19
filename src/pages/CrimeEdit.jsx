import EditMain from "../components/EditMain";
import Header from "../components/Header";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { crimeDataContext } from "../App";

const url = "http://localhost:8000";

const CrimeEdit = () => {
  const { crimeData } = useContext(crimeDataContext);
  const { crimeNumber } = useParams();
  const [editImage, setEditImage] = useState(null);

  // 현재 스크롤 상태 메모
  const [scrollState, setScrollState] = useState({
    image: null,
    zoom: 0,
    contrast: 0,
    saturation: 0,
    brightness: 0,
    rotate: 0,
  });

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
      });
    }
  }, [crimeNumber]);

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
      event: () => {
        fetch(`${url}/crime/${crimeNumber}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...scrollState,
            image: scrollState.image.split(",")[1],
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            console.log("저장 성공:", data);
            // 저장 후에는 CrimeDetail 페이지로 이동
            navigate(`/search/${crimeNumber}`);
          })
          .catch((error) => {
            console.error("저장 실패:", error);
          });
      },
    },
  ];

  return (
    <>
      <Header value="사건 편집" buttonList={buttonList} />
      <EditMain
        scrollState={scrollState}
        setScrollState={setScrollState}
        editImage={editImage}
        setEditImage={setEditImage}
      />
    </>
  );
};
export default CrimeEdit;
