import "./ImageLoader.css";
import Button from "./Button";
import React, { useRef } from "react";

const ImageLoader = ({
  formData,
  setFormData = null,
  value = "현장이미지",
  propsImage = null,
  patternFunction = false,
  style = {},
  onLoad = null,
  imgRef = null,
}) => {
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64data = reader.result;
        setFormData((prev) => ({
          ...prev,
          image: base64data,
        }));
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
          onLoad={onLoad}
          ref={imgRef}
        />
      </div>
    </div>
  );
};

export default ImageLoader;
