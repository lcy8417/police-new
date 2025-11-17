import "./ShoesRegisterMain.css";
import PatternList from "./PatternList";
import PatternInfo from "./PatternInfo";
import FormList from "./FormList";
import Sidebar from "./Sidebar";
import Canvas from "./Canvas";
import { handleChange, rotateImage } from "../utils/get-input-change";
import usePatternManager from "../hooks/usePatternManager";
import LoadingModal from "./LoadingModal"; // Importing LoadingModal component
import React, { useState, forwardRef, useImperativeHandle } from "react";

const ShoesRegisterMain = forwardRef(
  ({ formData, setFormData, propsImage = null, sidebar = true }, ref) => {
    const {
      canvasRef,
      patterns,
      selected,
      lineState,
      setLineState,
      setSelected,
      extractPattern,
      clearPattern,
      patternsKindSelect,
      insertPattern,
      deletePattern,
    } = usePatternManager({
      formData,
      setFormData,
    });

    const [isExtracting, setIsExtracting] = useState(false);
    const [isCropping, setIsCropping] = useState(false);
    const [cropApplyCounter, setCropApplyCounter] = useState(0);

    const handleExtractPattern = async () => {
      try {
        setIsExtracting(true);
        await extractPattern().finally(() => {
          setIsExtracting(false);
        });
      } catch (error) {
        console.error("패턴 추출 중 오류:", error);
        alert("패턴 추출 중 오류가 발생했습니다.");
      }
    };

    const handleRotateLeft = async () => {
      try {
        if (!formData?.image) return;
        const rotated = await rotateImage(formData.image, -90);
        setFormData((prev) => ({ ...prev, image: rotated }));
      } catch (e) {
        console.error("좌회전 중 오류:", e);
        alert("이미지 회전 중 오류가 발생했습니다.");
      }
    };

    const handleRotateRight = async () => {
      try {
        if (!formData?.image) return;
        const rotated = await rotateImage(formData.image, 90);
        setFormData((prev) => ({ ...prev, image: rotated }));
      } catch (e) {
        console.error("우회전 중 오류:", e);
        alert("이미지 회전 중 오류가 발생했습니다.");
      }
    };

    const startCrop = () => {
      if (!formData?.image) return;
      setIsCropping(true);
    };

    const applyCrop = () => {
      if (!formData?.image) return;
      setIsCropping(false);
      setCropApplyCounter((c) => c + 1);
    };

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
      <div className="ShoesRegisterMain">
        {isExtracting && <LoadingModal text="패턴 추출 중..." />}
        {sidebar && <Sidebar />}
        <div className="main">
          <Canvas
            canvasRef={canvasRef}
            formData={formData}
            setFormData={setFormData}
            value="신발이미지"
            patternFunction={[handleExtractPattern, clearPattern]}
            rotateFunction={[handleRotateLeft, handleRotateRight]}
            cropFunction={[startCrop, applyCrop, isCropping]}
            cropMode={isCropping}
            cropApply={cropApplyCounter}
            lineState={lineState}
            setLineState={setLineState}
            propsImage={propsImage}
          />

          <PatternInfo
            selected={selected}
            setSelected={setSelected}
            formData={formData}
            deletePattern={deletePattern}
          />
          <div className="main-body-content">
            <FormList
              formData={formData}
              handleChange={(e) => handleChange(e, setFormData)}
              direction="flex"
            />
            <PatternList
              patterns={patterns}
              patternsKindSelect={patternsKindSelect}
              insertPattern={insertPattern}
              flex={3}
            />
          </div>
        </div>
      </div>
    );
  }
);
export default ShoesRegisterMain;
