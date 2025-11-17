import Button from "./Button";
import ImageLoader from "./ImageLoader";
import FormItem from "./FormItem";
import "./CrimeRegisterMain.css";
import React, { forwardRef, useImperativeHandle, useState } from "react";
import FormList from "./FormList";
import Sidebar from "./Sidebar";
import { handleChange, rotateImage } from "../utils/get-input-change";
import { useCalibration } from "../hooks/useCalibration";
import CalibrationInfo from "./CalibrationInfo";
import Canvas from "./Canvas";

const CrimeRegisterMain = forwardRef(
  ({ formData, setFormData, calibration, setCalibration }, ref) => {
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

    // 크롭 상태 관리
    const [isCropping, setIsCropping] = useState(false);
    const [cropApplyCounter, setCropApplyCounter] = useState(0);

    const startCrop = () => {
      if (!formData?.image) return;
      setIsCropping(true);
    };

    const applyCrop = () => {
      if (!formData?.image) return;
      setIsCropping(false);
      setCropApplyCounter((c) => c + 1);
    };

    // 부모에서 호출할 메서드 노출
    useImperativeHandle(
      ref,
      () => ({
        rotateLeft: () => handleRotateLeft(),
        rotateRight: () => handleRotateRight(),
        toggleCrop: () => (isCropping ? applyCrop() : startCrop()),
        isCropping: () => isCropping,
      }),
      [isCropping, formData]
    );

    return (
      <div className="CrimeRegisterMain">
        <Sidebar />
        <div className="main">
          <Canvas
            canvasRef={canvasRef}
            formData={formData}
            setFormData={setFormData}
            value="현장이미지"
            imgRef={imgRef}
            cropMode={isCropping}
            cropApply={cropApplyCounter}
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
  }
);

export default CrimeRegisterMain;
