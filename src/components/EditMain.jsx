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
  const { id } = useParams(); // Assuming you have a route parameter for the crime ID

  // 되돌리기 메모
  const [returnMemo, setReturnMemo] = useState([
    {
      image: crimeData[id].image,
      zoom: 0,
      contrast: 0,
      saturation: 0,
      brightness: 0,
      rotate: 0,
    },
  ]);
  const [buttonState, setButtenState] = useState(null);
  const [points, setPoints] = useState([]);

  const handleClick = (e) => {
    if (buttonState === null || ![0, 3].includes(buttonState)) {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPoints((prev) => [...prev, { x, y }]);
  };

  // 배경제거 및 접합장애물제거를 위한 오른쪽 클릭 핸들러
  const handleRightClick = (event) => {
    event.preventDefault(); // 브라우저 기본 컨텍스트 메뉴 막기
    if (points.length <= 2) {
      alert("점이 3개 이상이어야 합니다.");
      return;
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
      changeImage.src = crimeData[id].image;
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
            formData={scrollState}
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
          formData={crimeData[id]}
          flex={3}
        />
      </div>
    </div>
  );
};

export default EditMain;
