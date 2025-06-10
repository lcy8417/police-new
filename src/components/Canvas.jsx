import { useEffect, useState } from "react";
import "./Canvas.css";
import ImageLoader from "./ImageLoader";

const Canvas = ({
  buttonState,
  points,
  scrollState,
  setPoints,
  canvasRef,
  overlayRef,
}) => {
  const formData = {
    image: "/src/assets/00001-23-0360_1.png",
  };

  const [imageSize, setImageSize] = useState({
    width: 0,
    height: 0,
  });

  // 첫 렌더링 될 때, 이미지의 크기 설정
  // useEffect(() => {
  //   setImageSize({
  //     width: document.querySelector(".image-edit-display > img").offsetWidth,
  //     height: document.querySelector(".image-edit-display > img").offsetHeight,
  //   });
  // }, []);

  const filterStyle = {
    filter: `
      contrast(${100 + scrollState.contrast}%)
      saturate(${100 + scrollState.saturation}%)
      brightness(${100 + scrollState.brightness}%)
    `,
    transform: `scale(${1 + scrollState.zoom / 100})`,
    transition: "all 0.3s ease",
  };

  const handleClick = (e) => {
    if (buttonState === null || ![0, 3].includes(buttonState)) {
      if (overlayRef.current) {
        overlayRef.current.style.cursor = "default";
      }
      return;
    }

    if (overlayRef.current) {
      overlayRef.current.style.cursor = "crosshair";
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPoints((prev) => [...prev, { x, y }]);
  };

  // 캔버스에 점을 그리는 useEffect
  useEffect(() => {
    if (points.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((point, i) => {
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();

    // Draw dots
    points.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = "blue";
      ctx.fill();
    });
  }, [points]);

  // 배경제거 및 접합장애물제거를 위한 오른쪽 클릭 핸들러
  const handleRightClick = (event) => {
    event.preventDefault(); // 브라우저 기본 컨텍스트 메뉴 막기
    console.log("오른쪽 클릭 이벤트 발생");
    if (points.length <= 2) {
      alert("점이 3개 이상이어야 합니다.");
      return;
    }
  };

  return (
    <div className="Canvas">
      <div className="image-edit-display">
        <ImageLoader
          formData={formData}
          value="편집이미지"
          propsImage={"/src/assets/00001-23-0360_1.png"}
          style={filterStyle}
          setImageSize={setImageSize}
          onLoad={() => {
            const display = document.querySelector(".image-edit-display");

            const canvas = canvasRef.current;
            const overlay = overlayRef.current;

            const width = display.offsetWidth;
            const height = display.offsetHeight;

            canvas.width = width;
            canvas.height = height;

            console.log(width, height);
            overlay.style.width = `${width}px`;
            overlay.style.height = `${height}px`;
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            pointerEvents: "none", // 클릭을 통과시킴
          }}
        />
        <div
          className="canvas-overlay"
          ref={overlayRef}
          onClick={handleClick}
          onContextMenu={handleRightClick}
        />
      </div>
    </div>
  );
};
export default Canvas;
