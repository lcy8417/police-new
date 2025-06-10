import { useRef } from "react";

const useImageUpload = (onImageLoad) => {
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageLoad(reader.result); // 외부 상태 업데이트 콜백 실행
      };
      reader.readAsDataURL(file);
    }
  };

  return { fileInputRef, handleUploadClick, handleFileChange };
};

export default useImageUpload;
