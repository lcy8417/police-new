import "./ImageLoader.css";
import Button from "./Button";
import React, { useRef } from "react";

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
}) => {
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64data = reader.result;

        // 이미지 리사이즈 함수
        const resizeImage = async (base64Image) => {
          const img = new Image();

          // 이미지 로드 완료 대기
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = base64Image;
          });

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          // 원본 이미지 크기
          const originalWidth = img.width;
          const originalHeight = img.height;

          // 1000보다 큰 변이 있는지 확인
          const maxSize = 1000;
          let newWidth, newHeight;

          if (originalWidth <= maxSize && originalHeight <= maxSize) {
            // 양 변이 모두 1000 이하면 원본 크기 유지
            newWidth = originalWidth;
            newHeight = originalHeight;
          } else {
            // 1000보다 큰 변이 있으면 리사이즈
            if (originalWidth > originalHeight) {
              // 가로가 더 긴 경우
              newWidth = maxSize;
              newHeight = (originalHeight * maxSize) / originalWidth;
            } else {
              // 세로가 더 긴 경우
              newHeight = maxSize;
              newWidth = (originalWidth * maxSize) / originalHeight;
            }
          }

          // 캔버스 크기 설정
          canvas.width = newWidth;
          canvas.height = newHeight;

          // 이미지 그리기
          ctx.drawImage(img, 0, 0, newWidth, newHeight);

          // Base64로 변환
          return canvas.toDataURL("image/png");
        };

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
      </div>
    </div>
  );
};

export default ImageLoader;
