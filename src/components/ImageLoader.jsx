import "./ImageLoader.css";
import Button from "./Button";
import React, { useRef } from "react";
import { resizeImage } from "../utils/get-input-change";
import { useNavigate } from "react-router-dom";
import { saveEditImage } from "../services/api";

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
  calibrationCanvas = null,
  originSize = null,
  setOriginSize = null,
  disableDoubleClick = false,
}) => {
  const fileInputRef = useRef(null);

  // 더블클릭 이벤트 핸들러 - 라우팅
  const handleDoubleClick = async () => {
    console.log(formData);
    if (formData?.image) {
      try {
        let imageToSend = formData.image;

        // 이미지가 정적 URL인 경우 base64로 변환
        if (
          formData.image.startsWith("http://") ||
          formData.image.startsWith("https://")
        ) {
          const response = await fetch(formData.image);
          const blob = await response.blob();

          // blob을 base64로 변환
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });

          imageToSend = base64;
        }

        // 서버에 이미지 저장
        const id = formData.modelNumber || formData.crimeNumber;
        const folder = formData.modelNumber ? "shoes" : "crime";

        try {
          await saveEditImage({
            id: id,
            image: imageToSend,
            folder: folder,
          });

          console.log("이미지가 서버에 저장되었습니다.");

          // 쿼리 파라미터와 함께 라우팅
          const params = new URLSearchParams({
            folder: folder,
            id: id,
          });

          const url = `${
            window.location.origin
          }/editormode?${params.toString()}`;
          window.open(url, "_blank", "noopener,noreferrer");
        } catch (saveError) {
          console.error("서버 저장 중 오류:", saveError);
          alert("이미지 저장 중 오류가 발생했습니다.");
        }
      } catch (error) {
        console.error("이미지 인코딩 중 오류:", error);
        alert("이미지를 불러오는 중 오류가 발생했습니다.");
      }
    }
  };

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
            if (imgRef?.current && setOriginSize) {
              setOriginSize([
                imgRef.current.offsetWidth,
                imgRef.current.offsetHeight,
              ]);
            }
            if (onLoad) {
              onLoad();
            }
          }}
          onDoubleClick={
            formData?.image && !disableDoubleClick
              ? handleDoubleClick
              : undefined
          }
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
