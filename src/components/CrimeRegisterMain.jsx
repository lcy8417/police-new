import Button from "./Button";
import ImageLoader from "./ImageLoader";
import FormItem from "./FormItem";
import "./CrimeRegisterMain.css";
import React from "react";
import FormList from "./FormList";
import Sidebar from "./Sidebar";
import { handleChange, rotateImage } from "../utils/get-input-change";

const CrimeRegisterMain = ({ formData, setFormData }) => {
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
        />
        <FormList
          formData={formData}
          handleChange={(e) => handleChange(e, setFormData)}
        />
      </div>
    </div>
  );
};

export default CrimeRegisterMain;
