import { useEffect, useState } from "react";
import "./Canvas.css";
import ImageLoader from "./ImageLoader";
import { updateCanvasPosition } from "../utils/get-canvas-size.js";

const Canvas = ({
  formData,
  setFormData = null,
  points = [],
  scrollState = null, // 전처리 상태
  canvasRef, // 캔버스 참조
  handleClick = null, // 왼쪽 클릭 이벤트 처리
  handleRightClick = null, // 오른쪽 클릭 이벤트 처리
  patternFunction = null, // 문양 추출, 문양 초기화 기능 추가
  propsImage = null, // props로 이미지 전달
  value = "hide", // 캔버스의 헤더로 표시할 값(hide면 무시)
  flex = 1,
  lineState = null, // 캔버스의 선 상태
  setLineState = null, // 캔버스의 선 상태를 설정하는 함수
  imgRef = null,
  mode = "patterns",
  buttonState = null,
  originSize = null,
  setOriginSize = null,
  onWheel = null, // 마우스 휠 이벤트 핸들러
}) => {
  const [imageSize, setImageSize] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });

  const filterStyle = scrollState
    ? {
        filter: `
      contrast(${100 + scrollState.contrast}%)
      saturate(${100 + scrollState.saturation}%)
      brightness(${100 + scrollState.brightness}%)
    `,
        transform: `scale(${1 + scrollState.zoom / 100})
              rotate(${(scrollState.rotate / 100) * 180}deg)
              translate(${imageOffset.x}px, ${imageOffset.y}px)
`,
        transition: isDragging ? "none" : "all 0.3s ease",
      }
    : {};

  // 이미지 드래그 핸들러들
  const handleImageMouseDown = (e) => {
    // 확대된 상태에서만 드래그 가능
    if (scrollState && scrollState.zoom > 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  const handleImageMouseMove = (e) => {
    if (isDragging && scrollState && scrollState.zoom > 0) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      setImageOffset((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleImageMouseUp = () => {
    setIsDragging(false);
  };

  // 전역 마우스 이벤트 처리
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleImageMouseMove);
      document.addEventListener("mouseup", handleImageMouseUp);
    } else {
      document.removeEventListener("mousemove", handleImageMouseMove);
      document.removeEventListener("mouseup", handleImageMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleImageMouseMove);
      document.removeEventListener("mouseup", handleImageMouseUp);
    };
  }, [isDragging]);

  // 확대/축소 시 이미지 오프셋 초기화
  useEffect(() => {
    if (scrollState && scrollState.zoom <= 0) {
      setImageOffset({ x: 0, y: 0 });
    }
  }, [scrollState?.zoom]);

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
        ctx.moveTo(point[0], point[1]);
      } else {
        ctx.lineTo(point[0], point[1]);
      }
    });
    ctx.stroke();

    // Draw dots
    points.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point[0], point[1], 4, 0, 2 * Math.PI);
      ctx.fillStyle = "blue";
      ctx.fill();
    });
  }, [points]);

  // 이미지가 변경될 때 캔버스 크기 조정
  useEffect(() => {
    const update = () =>
      updateCanvasPosition({ imgRef, canvasRef, mode, originSize });

    const img = imgRef?.current;

    if (img && !img.complete) {
      console.log("실행됨1");
      img.onload = update;
    } else {
      console.log("실행됨2");
      update();
    }

    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      if (img) img.onload = null;
    };
  }, [formData.image, buttonState, originSize]);

  useEffect(() => {
    if (!formData.image || !lineState) return;
    const { lineYs } = lineState;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255, 0, 0, 0.7)"; // 반투명 레드
    ctx.lineWidth = 7;
    ctx.setLineDash([5, 3]); // 점선 스타일

    lineYs.forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    });
  }, [lineState, formData.image, imageSize]);

  useEffect(() => {
    if (!formData.image || !lineState) return;
    const { lineYs, draggingLine } = lineState;

    const canvas = canvasRef.current;

    const handleMouseDown = (e) => {
      const y = e.offsetY;
      lineYs.forEach((lineY, idx) => {
        if (Math.abs(y - lineY) < 5) {
          setLineState((prev) => ({
            ...prev,
            draggingLine: idx,
            offsetY: lineY - y,
          }));
        }
      });
    };

    const handleMouseMove = (e) => {
      const y = e.offsetY;

      if (draggingLine !== null) {
        setLineState((prev) => {
          const newLines = [...prev["lineYs"]];
          newLines[prev["draggingLine"]] = y + prev["offsetY"];

          return {
            ...prev,
            lineYs: newLines,
            offsetY: prev.offsetY,
          };
        });
      }

      const isNearLine = lineYs.some((lineY) => Math.abs(y - lineY) < 5);
      canvas.style.cursor = isNearLine ? "pointer" : "default";
    };

    const stopDragging = () => {
      setLineState((prev) => ({
        ...prev,
        draggingLine: null,
      }));
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", stopDragging);
    canvas.addEventListener("mouseleave", stopDragging);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", stopDragging);
      canvas.removeEventListener("mouseleave", stopDragging);
    };
  }, [formData.image, lineState, setLineState]);

  return (
    <div className={`Canvas flex-${flex}`}>
      <div className="image-edit-display">
        <ImageLoader
          formData={scrollState || formData}
          setFormData={setFormData}
          value={value}
          propsImage={propsImage}
          style={scrollState && filterStyle}
          patternFunction={patternFunction}
          imgRef={imgRef}
          originSize={originSize}
          setOriginSize={setOriginSize}
          onMouseDown={handleImageMouseDown}
          scrollState={scrollState}
          isDragging={isDragging}
          disableDoubleClick={mode === "edit"}
        />
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          onContextMenu={handleRightClick}
          onWheel={onWheel}
        />
      </div>
    </div>
  );
};
export default Canvas;
