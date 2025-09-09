import "./ImageLoader.css";
import Button from "./Button";
import React, { useRef } from "react";
import { resizeImage } from "../utils/get-input-change";

const ImageLoader = ({
  formData,
  setFormData = null,
  value = "현장이미지",
  propsImage = null,
  patternFunction = false,
  rotateFunction = false,
  style = {},
  onLoad = null,
  imgRef = null,
  setOriginSize = null,
  calibrationCanvas = null,
}) => {
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64data = reader.result;

        // 이미지 리사이즈 후 formData 업데이트
        try {
          const processedImage = await resizeImage(base64data);
          setFormData((prev) => ({
            ...prev,
            image: processedImage,
          }));
        } catch (error) {
          console.error("이미지 처리 중 오류 발생:", error);
          // 에러 발생 시 원본 이미지 사용
          setFormData((prev) => ({
            ...prev,
            image: base64data,
          }));
        }
      };

      reader.readAsDataURL(file);
    }
  };
  return (
    <div className="ImageLoader">
      <div className={`header ${value}`}>
        <h1>{value}</h1>
        {/* 업로드 활성화 될 때만 보이기 */}
        <div className="button-container">
          {!formData?.image && (
            <Button
              value="+업로드"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            />
          )}
          {patternFunction && (
            <>
              <Button
                value="문양추출"
                onClick={patternFunction[0]}
                type="button"
              />
              <Button
                value="문양초기화"
                onClick={patternFunction[1]}
                type="button"
              />
            </>
          )}
          {rotateFunction && (
            <>
              <Button
                value="회전(<)"
                onClick={rotateFunction[0]}
                type="button"
              />
              <Button
                value="회전(>)"
                onClick={rotateFunction[1]}
                type="button"
              />
            </>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleChange}
          accept="image/*"
          style={{ display: "none" }}
        />
      </div>

      <div className="image-container">
        <img
          src={propsImage || formData?.image || null}
          style={style}
          onLoad={() => {
            if (imgRef?.current) {
              setOriginSize([
                imgRef.current.offsetWidth,
                imgRef.current.offsetHeight,
              ]);
            }
          }}
          ref={imgRef}
        />
        {/* 각도보정 Canvas 오버랩 */}
        {calibrationCanvas && imgRef?.current && (
          <div
            className="calibration-canvas-overlay"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
            }}
          >
            {calibrationCanvas}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageLoader;
