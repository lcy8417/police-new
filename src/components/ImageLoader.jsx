import "./ImageLoader.css";
import Button from "./Button";
import React, { useRef } from "react";

const ImageLoader = ({
  formData,
  setFormData = null,
  value = "현장이미지",
  propsImage = null,
  style = {},
  onLoad = null,
}) => {
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    console.log(e.target.files);
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64data = reader.result; // 여기서 base64 인코딩된 이미지
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
      <div className="header">
        <h1>{value}</h1>
        {/* 업로드 활성화 될 때만 보이기 */}
        {!propsImage && (
          <>
            <Button
              value="+업로드"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleChange}
              accept="image/*"
              style={{ display: "none" }}
            />
          </>
        )}
      </div>

      <div className="image-container">
        <img src={propsImage || formData.image} style={style} onLoad={onLoad} />
      </div>
    </div>
  );
};

export default ImageLoader;
