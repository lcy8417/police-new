import { useRef, useEffect, useState } from "react";
import { fetchPerspective } from "../services/api";

export const useCalibration = (
  formData,
  setFormData,
  setCalibration,
  calibration
) => {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [isCalibrationMode, setIsCalibrationMode] = useState(false);

  // calibration 상태가 변경될 때마다 모드 전환
  useEffect(() => {
    setIsCalibrationMode(calibration === "각도보정끄기");
    if (calibration === "각도보정키기") {
      setPoints([]); // 각도보정 모드가 꺼지면 점들 초기화
    }
  }, [calibration]);

  // 이미지가 로드될 때마다 canvas 크기 업데이트
  useEffect(() => {
    if (isCalibrationMode && imgRef?.current && canvasRef?.current) {
      const img = imgRef.current;
      const canvas = canvasRef.current;

      // 이미지의 실제 표시 크기에 맞춰 canvas 크기 조정
      canvas.width = img.offsetWidth;
      canvas.height = img.offsetHeight;

      // 점들이 있으면 다시 그리기
      if (points.length > 0) {
        setPoints([...points]);
      }
    }
  }, [
    formData.image,
    isCalibrationMode,
    imgRef?.current?.offsetWidth,
    imgRef?.current?.offsetHeight,
  ]);

  // Canvas 클릭 이벤트 처리
  const handleCanvasClick = (e) => {
    if (!isCalibrationMode || points.length >= 4) return;

    const canvas = canvasRef.current;
    const img = imgRef.current;

    if (!canvas || !img) return;

    // Canvas와 이미지의 실제 크기와 위치 가져오기
    const canvasRect = canvas.getBoundingClientRect();

    // 클릭한 위치를 canvas 좌표로 변환
    const clickX = e.clientX - canvasRect.left;
    const clickY = e.clientY - canvasRect.top;

    // Canvas의 실제 크기와 표시 크기의 비율 계산
    const scaleX = canvas.width / canvasRect.width;
    const scaleY = canvas.height / canvasRect.height;

    // 실제 canvas 좌표로 변환
    const canvasX = clickX * scaleX;
    const canvasY = clickY * scaleY;

    // 이미지 내부 좌표인지 확인 (이미지가 canvas보다 작을 수 있음)
    if (
      canvasX >= 0 &&
      canvasX <= canvas.width &&
      canvasY >= 0 &&
      canvasY <= canvas.height
    ) {
      const newPoint = { x: canvasX, y: canvasY };
      setPoints((prev) => [...prev, newPoint]);

      // 4개 점이 찍히면 API 호출
      if (points.length === 3) {
        const allPoints = [...points, newPoint].map((point) => {
          // 캔버스 좌표를 상대 좌표(0~1)로 변환
          const relativeX = point.x / canvas.width;
          const relativeY = point.y / canvas.height;

          // 실제 이미지 크기에 맞게 보정
          const actualX = relativeX * img.naturalWidth;
          const actualY = relativeY * img.naturalHeight;

          return [
            parseFloat(actualX.toFixed(2)),
            parseFloat(actualY.toFixed(2)),
          ];
        });
        handlePerspectiveRequest(allPoints);
      }
    }
  };

  // Canvas에 점들을 그리는 useEffect
  useEffect(() => {
    if (!canvasRef.current || points.length === 0 || !isCalibrationMode) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Canvas 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 점들을 X자 모양으로 그리기
    points.forEach((point, index) => {
      const size = 6; // 크기를 10에서 6으로 줄임
      const color =
        ["#ff0000", "#00ff00", "#0000ff", "#ffff00"][index] || "#ff0000";

      ctx.strokeStyle = color;
      ctx.lineWidth = 2; // 선 두께도 3에서 2로 줄임

      // X자 그리기
      ctx.beginPath();
      ctx.moveTo(point.x - size, point.y - size);
      ctx.lineTo(point.x + size, point.y + size);
      ctx.moveTo(point.x - size, point.y + size);
      ctx.lineTo(point.x + size, point.y - size);
      ctx.stroke();

      // 점 번호 표시
      ctx.fillStyle = color;
      ctx.font = "14px Arial"; // 폰트 크기도 16에서 14로 줄임
      ctx.fillText(`${index + 1}`, point.x + size + 3, point.y - size - 3);
    });
  }, [points, isCalibrationMode]);

  // Perspective API 호출
  const handlePerspectiveRequest = async (allPoints) => {
    try {
      const response = await fetchPerspective(formData.image, allPoints);
      setFormData((prev) => ({
        ...prev,
        image: response.image,
      }));

      alert("각도보정이 완료되었습니다.");
      setCalibration("각도보정키기"); // 모드 끄기
    } catch (error) {
      console.error("Perspective API 오류:", error);
      alert("각도보정에 실패했습니다.");
    }
  };

  // 점 초기화
  const clearPoints = () => {
    setPoints([]);
    // 캔버스의 점들도 모두 지우기
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  return {
    canvasRef,
    imgRef,
    points,
    isCalibrationMode,
    handleCanvasClick,
    clearPoints,
  };
};
