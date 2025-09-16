// hooks/useImageProcessing.js
import { imageProcessing } from "../services/api";

const useImageProcessing = ({
  crimeNumber,
  scrollState,
  setScrollState,
  setReturnMemo,
}) => {
  const handleProcessing = async ({ endpoint, body = null, params = null }) => {
    try {
      if (body?.image && body.image.includes(".png")) {
        body.image = body.image.split("/").pop().split(".")[0];
      }

      if (endpoint == "denoising" && body?.image) {
        body = body.image;
      }

      console.log("dd", body, "dd");
      const image = await imageProcessing(crimeNumber, endpoint, body, params);

      setScrollState((prev) => ({ ...prev, image }));
      if (endpoint !== "binarization") {
        // 이진화는 상태를 저장하지 않음. 저장 버튼이 눌렸을 경우에만 상태를 저장
        setReturnMemo((prev) => [...prev, { ...scrollState, image }]);
      }

      if (endpoint !== "binarization") {
        alert(`${endpoint} 요청이 성공적으로 처리되었습니다.`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("요청 처리 중 오류가 발생했습니다. 콘솔을 확인하세요.");
    }
  };

  return handleProcessing;
};

export default useImageProcessing;
