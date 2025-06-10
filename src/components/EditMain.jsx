import Button from "./Button";
import { useState, useRef, useEffect } from "react";
import "./EditMain.css";
import ImageLoader from "./ImageLoader";
import Preprocessing from "./Preprocessing";
import Canvas from "./Canvas";

const EditMain = ({ scrollState, setScrollState }) => {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);

  // 되돌리기 메모
  const [returnMemo, setReturnMemo] = useState([
    {
      image: "/src/assets/00001-23-0360_1.png",
      zoom: 0,
      contrast: 0,
      saturation: 0,
      brightness: 0,
    },
  ]);
  const [buttonState, setButtenState] = useState(null);
  const [points, setPoints] = useState([]);

  // 다른 버튼이 눌렸을 시
  useEffect(() => {
    // 캔버스와 오버레이 초기화
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    setPoints([]);

    // 배경제거, 접합장애물제거외 다른 버튼이 눌렸을 시 오버레이의 커서 스타일 설정
    if (buttonState === null || ![0, 3].includes(buttonState)) {
      if (overlayRef.current) {
        overlayRef.current.style.cursor = "default";
      }
    }

    // 배경제거, 접합장애물제거가 눌렸을 시, 오버레이의 커서 스타일 설정
    else if (overlayRef.current) {
      overlayRef.current.style.cursor = "crosshair";
    }
  }, [buttonState]);

  // 되돌리기 버튼을 클릭헀을 때
  const returnClickHandler = () => {
    if (returnMemo.length > 1) {
      returnMemo.pop();
      setScrollState(returnMemo[returnMemo.length - 1]);
    }
  };

  return (
    <div className="EditMain">
      <div className="image-swapper">
        <ImageLoader
          value="현장이미지"
          formData={scrollState}
          setFormData={setScrollState}
          propsImage={scrollState.image}
        />
        <div className="image-swapper-buttons">
          <Button value="현장이미지" type="button" />
          <Button value="편집이미지" type="button" />
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
        buttonState={buttonState}
        points={points}
        scrollState={scrollState}
        setPoints={setPoints}
        canvasRef={canvasRef}
        overlayRef={overlayRef}
      />
    </div>
  );
};

export default EditMain;
