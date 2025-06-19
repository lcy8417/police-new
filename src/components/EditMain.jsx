import Button from "./Button";
import { useState, useRef, useEffect, useContext } from "react";
import "./EditMain.css";
import ImageLoader from "./ImageLoader";
import Preprocessing from "./Preprocessing";
import Canvas from "./Canvas";
import { crimeDataContext } from "../App"; // Assuming you have a context for crime data
import { useParams } from "react-router-dom"; // Import useParams to access route parameters
import Sidebar from "./Sidebar"; // Assuming you have a Sidebar component for navigation

const EditMain = ({ scrollState, setScrollState, editImage, setEditImage }) => {
  const canvasRef = useRef(null);

  const { crimeData } = useContext(crimeDataContext); // Accessing crime data from context
  const { crimeNumber } = useParams(); // Assuming you have a route parameter for the crime ID

  // 되돌리기 메모
  const [returnMemo, setReturnMemo] = useState([]);

  const crimeItem = crimeData.find(
    (item) => String(item.crimeNumber) === String(crimeNumber)
  );

  useEffect(() => {
    const currentCrime = crimeData.find(
      (data) => String(data.crimeNumber) === String(crimeNumber)
    );

    if (currentCrime) {
      setReturnMemo([
        {
          image: currentCrime.image,
          zoom: currentCrime.zoom || 0,
          contrast: currentCrime.contrast || 0,
          saturation: currentCrime.saturation || 0,
          brightness: currentCrime.brightness || 0,
          rotate: currentCrime.rotate || 0,
        },
      ]);
    }
  }, [crimeData, crimeNumber]);

  const [buttonState, setButtenState] = useState(null);
  const [points, setPoints] = useState([]);

  const handleClick = (e) => {
    if (buttonState === null || ![0, 3].includes(buttonState)) {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    console.log(x, y);

    setPoints((prev) => [...prev, [x, y]]);
  };

  // 배경제거 및 접합장애물제거를 위한 오른쪽 클릭 핸들러
  const handleRightClick = async (event) => {
    if (buttonState !== 0 && buttonState !== 3) {
      return; // 배경제거 또는 접합장애물제거 버튼이 눌리지 않았을 때는 아무 작업도 하지 않음
    }

    event.preventDefault(); // 브라우저 기본 컨텍스트 메뉴 막기
    if (points.length <= 2) {
      alert("점이 3개 이상이어야 합니다.");
      return;
    }

    try {
      const $editImage = document.querySelectorAll(".image-container > img")[1];
      const render_size = $editImage.getBoundingClientRect();

      const params = new URLSearchParams();
      params.append("render_size", render_size.width);
      params.append("render_size", render_size.height);

      const res = await fetch(
        `http://localhost:8000/crime/${crimeNumber}/segmentation?${params.toString()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            polygon: points,
            image: scrollState.image,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setScrollState((prev) => ({
        ...prev,
        image: data.image,
      }));
      setReturnMemo((prev) => [...prev, { ...scrollState, image: data.image }]);
      setEditImage(data.image);
      alert("요청이 성공적으로 처리되었습니다.");
    } catch (error) {
      console.error("요청 중 오류 발생:", error);
      alert("요청 처리 중 오류가 발생했습니다. 콘솔을 확인하세요.");
    }
  };

  // 배경 제거, 이진화, 노이즈제거 등 버튼 클릭 시 상태 변경
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    setPoints([]);

    // 배경제거, 접합장애물제거외 다른 버튼이 눌렸을 시 오버레이의 커서 스타일 설정
    if (buttonState === null || ![0, 3].includes(buttonState)) {
      if (canvasRef.current) {
        canvasRef.current.style.cursor = "default";
      }
    }

    // 배경제거, 접합장애물제거가 눌렸을 시, 오버레이의 커서 스타일 설정
    else if (canvasRef.current) {
      canvasRef.current.style.cursor = "crosshair";
    }
  }, [buttonState]);

  // 되돌리기 버튼을 클릭헀을 때
  const returnClickHandler = () => {
    if (returnMemo.length > 1) {
      returnMemo.pop();
      setScrollState(returnMemo[returnMemo.length - 1]);
    }
  };

  const imageChangeHandler = (kind) => {
    const changeImage = document.querySelector(".image-container > img");
    if (kind === "origin") {
      changeImage.src = crimeData[crimeNumber].image;
    } else if (kind === "edit") {
      console.log("editImage", editImage);
      changeImage.src = editImage ? editImage : null;
    }
  };

  return (
    <div className="EditMain">
      <Sidebar />
      <div className="main">
        <div className="image-swapper">
          <ImageLoader
            value="현장이미지"
            formData={crimeItem || {}}
            setFormData={setScrollState}
            propsImage={scrollState.image}
          />
          <div className="image-swapper-buttons">
            <Button
              value="현장이미지"
              type="button"
              size="full-width"
              onClick={() => imageChangeHandler("origin")}
            />
            <Button
              value="편집이미지"
              type="button"
              size="full-width"
              onClick={() => imageChangeHandler("edit")}
            />
          </div>
        </div>
        <Preprocessing
          returnMemo={returnMemo}
          setReturnMemo={setReturnMemo}
          scrollState={scrollState}
          setScrollState={setScrollState}
          setButtenState={setButtenState}
          returnClickHandler={returnClickHandler}
        />
        <Canvas
          points={points}
          scrollState={scrollState}
          canvasRef={canvasRef}
          handleClick={handleClick}
          handleRightClick={handleRightClick}
          formData={crimeItem || {}} // fallback for robustness
          flex={3}
        />
      </div>
    </div>
  );
};

export default EditMain;
