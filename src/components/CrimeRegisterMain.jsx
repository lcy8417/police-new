import Button from "./Button";
import ImageLoader from "./ImageLoader";
import FormItem from "./FormItem";
import "./CrimeRegisterMain.css";
import React from "react";
import FormList from "./FormList";
import Sidebar from "./Sidebar";
import { handleChange, rotateImage } from "../utils/get-input-change";
import { useCalibration } from "../hooks/useCalibration";
import CalibrationInfo from "./CalibrationInfo";

const CrimeRegisterMain = ({
  formData,
  setFormData,
  calibration,
  setCalibration,
}) => {
  // 각도보정 훅 사용
  const {
    canvasRef,
    imgRef,
    points,
    isCalibrationMode,
    handleCanvasClick,
    clearPoints,
  } = useCalibration(formData, setFormData, setCalibration, calibration);

  // 이미지 회전 함수

  // 좌회전 (90도 반시계방향)
  const handleRotateLeft = async () => {
    if (formData.image) {
      const rotatedImage = await rotateImage(formData.image, -90);
      setFormData((prev) => ({
        ...prev,
        image: rotatedImage,
      }));
    }
  };

  // 우회전 (90도 시계방향)
  const handleRotateRight = async () => {
    if (formData.image) {
      const rotatedImage = await rotateImage(formData.image, 90);
      setFormData((prev) => ({
        ...prev,
        image: rotatedImage,
      }));
    }
  };

  return (
    <div className="CrimeRegisterMain">
      <Sidebar />
      <div className="main">
        <ImageLoader
          formData={formData}
          setFormData={setFormData}
          rotateFunction={
            formData.image && [handleRotateLeft, handleRotateRight]
          }
          imgRef={imgRef}
          calibrationCanvas={
            isCalibrationMode &&
            imgRef?.current &&
            (() => {
              const img = imgRef.current;
              const container = img.parentElement;

              // 이미지의 실제 위치 계산
              const containerRect = container.getBoundingClientRect();
              const imgRect = img.getBoundingClientRect();

              // 컨테이너 내에서의 이미지 상대 위치
              const imgTop = imgRect.top - containerRect.top;
              const imgLeft = imgRect.left - containerRect.left;

              return (
                <canvas
                  ref={canvasRef}
                  width={img.offsetWidth}
                  height={img.offsetHeight}
                  onClick={handleCanvasClick}
                  style={{
                    position: "absolute",
                    top: imgTop,
                    left: imgLeft,
                    width: img.offsetWidth,
                    height: img.offsetHeight,
                    cursor: "crosshair",
                    pointerEvents: "auto",
                    border: "3px solid #ccc",
                    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
                  }}
                />
              );
            })()
          }
        />

        {/* 각도보정 모드일 때 정보 표시 */}
        {isCalibrationMode && formData.image && (
          <CalibrationInfo points={points} onClearPoints={clearPoints} />
        )}

        <FormList
          formData={formData}
          handleChange={(e) => handleChange(e, setFormData)}
        />
      </div>
    </div>
  );
};

export default CrimeRegisterMain;
