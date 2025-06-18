import EditMain from "../components/EditMain";
import Header from "../components/Header";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useContext } from "react";
import { crimeDataContext, historyDataContext } from "../App";

const CrimeEdit = () => {
  const { crimeData } = useContext(crimeDataContext);
  const { setHistoryData } = useContext(historyDataContext);
  const { id } = useParams();
  const [editImage, setEditImage] = useState(null);

  // 현재 스크롤 상태 메모
  const [scrollState, setScrollState] = useState({
    image: crimeData[id].image,
    zoom: 0,
    contrast: 0,
    saturation: 0,
    brightness: 0,
    rotate: 0,
  });

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
        const image = new Image();
        image.crossOrigin = "anonymous"; // CORS 방지
        image.src = scrollState.image;

        image.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          const zoom = 1 + scrollState.zoom / 100;
          const width = image.width * zoom;
          const height = image.height * zoom;

          canvas.width = width;
          canvas.height = height;

          ctx.clearRect(0, 0, width, height);

          ctx.filter = `
            contrast(${100 + scrollState.contrast}%)
            brightness(${100 + scrollState.brightness}%)
            saturate(${100 + scrollState.saturation}%)
          `;

          ctx.translate(width / 2, height / 2);
          ctx.rotate((scrollState.rotate * Math.PI) / 180);
          ctx.translate(-width / 2, -height / 2);

          ctx.drawImage(image, 0, 0, width, height);

          const base64 = canvas.toDataURL("image/png");
          setEditImage(base64);
          setHistoryData((prev) => [
            ...prev,
            {
              id: "3",
              등록일시: new Date().toISOString().split("T")[0],
              순위: prev.length + 1,
            },
          ]);
        };
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
