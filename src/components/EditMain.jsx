import { useState, useRef, useEffect, useContext } from "react";
import "./EditMain.css";
import ImageLoader from "./ImageLoader";
import Preprocessing from "./Preprocessing";
import Canvas from "./Canvas";
import { crimeDataContext } from "../App"; // Assuming you have a context for crime data
import { useParams } from "react-router-dom"; // Import useParams to access route parameters
import Sidebar from "./Sidebar"; // Assuming you have a Sidebar component for navigation
import useImageProcessing from "../hooks/useImageProcessing"; // Custom hook for image processing
import LoadingModal from "./LoadingModal"; // Importing LoadingModal component

const prepareImage = (image, crimeNumber) => {
  // base64 인코딩된 이미지라면 쉼표 이후만 추출
  if (image.startsWith("data:image")) {
    return image;
  } else {
    return crimeNumber;
  }
};

const resetScrollState = {
  zoom: 0,
  contrast: 0,
  saturation: 0,
  brightness: 0,
  rotate: 0,
  binarization: 127,
};

const EditMain = ({ scrollState, setScrollState }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const { crimeData } = useContext(crimeDataContext); // Accessing crime data from context
  const { crimeNumber } = useParams(); // Assuming you have a route parameter for the crime ID

  const [buttonState, setButtonState] = useState(null);
  const [points, setPoints] = useState([]);

  // 되돌리기 메모
  const [returnMemo, setReturnMemo] = useState([]);
  const [originSize, setOriginSize] = useState([0, 0]);

  const crimeItem = crimeData.find(
    (item) => String(item.crimeNumber) === String(crimeNumber)
  );

  const handleProcessing = useImageProcessing({
    crimeNumber,
    scrollState,
    setScrollState,
    setReturnMemo,
  });

  useEffect(() => {
    if (crimeItem) {
      setReturnMemo([
        {
          image: crimeItem.image,
          zoom: crimeItem.zoom || 0,
          contrast: crimeItem.contrast || 0,
          saturation: crimeItem.saturation || 0,
          brightness: crimeItem.brightness || 0,
          rotate: crimeItem.rotate || 0,
          binarization: 127,
        },
      ]);
    }
  }, [crimeItem]);

  const handleClick = (e) => {
    if (
      buttonState === null ||
      !["배경제거", "접합장애물제거"].includes(buttonState)
    ) {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPoints((prev) => [...prev, [x, y]]);
  };

  // 배경제거 및 접합장애물제거를 위한 오른쪽 클릭 핸들러
  const handleRightClick = async (event) => {
    event.preventDefault(); // 브라우저 기본 컨텍스트 메뉴 막기
    if (buttonState !== "배경제거" && buttonState !== "접합장애물제거") {
      return; // 배경제거 또는 접합장애물제거 버튼이 눌리지 않았을 때는 아무 작업도 하지 않음
    }

    if (points.length <= 2) {
      alert("점이 3개 이상이어야 합니다.");
      return;
    }

    try {
      setIsProcessing(true); // 로딩 상태 시작

      const $editImage = document.querySelectorAll(".image-container > img")[1];
      const render_size = $editImage.getBoundingClientRect();

      const params = new URLSearchParams();
      params.append("render_size", render_size.width);
      params.append("render_size", render_size.height);

      if (buttonState === "배경제거") {
        console.log(points);
        handleProcessing({
          endpoint: "segmentation",
          body: {
            polygon: points,
            image: prepareImage(scrollState.image, crimeNumber),
          },
          params: params,
        }).finally(() => {
          setIsProcessing(false); // 로딩 상태 종료
        });
      } else if (buttonState === "접합장애물제거") {
        handleProcessing({
          endpoint: "inpainting",
          body: {
            polygon: points,
            image: prepareImage(scrollState.image, crimeNumber),
          },
          params: params,
        }).finally(() => {
          setIsProcessing(false); // 로딩 상태 종료
        });
      }

      setButtonState(null);
    } catch (error) {
      console.error("요청 중 오류 발생:", error);
      alert("요청 처리 중 오류가 발생했습니다. 콘솔을 확인하세요.");
    }

    setPoints([]); // 점 목록 초기화
  };

  // 배경 제거, 이진화, 노이즈제거 등 버튼 클릭 시 상태 변경
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    setPoints([]);

    const binarize = (type) => {
      handleProcessing({
        endpoint: "binarization",
        body: {
          image: prepareImage(
            returnMemo[returnMemo.length - 1].image,
            crimeNumber
          ),
          threshold: scrollState.binarization,
          type,
        },
      });
    };

    switch (buttonState) {
      case "배경제거": // 배경제거
        setScrollState((prev) => ({
          ...prev,
          ...resetScrollState,
        }));

        canvasRef.current.style.cursor = "crosshair";
        break;
      case "이진화": // 이진화
        canvasRef.current.style.cursor = "default";
        break;
      case "노이즈제거": // 노이즈제거
        setIsProcessing(true);
        handleProcessing({
          endpoint: "denoising",
          body: prepareImage(scrollState.image, crimeNumber),
        }).finally(() => {
          setIsProcessing(false); // 로딩 상태 종료
        });
        setButtonState(null);
        canvasRef.current.style.cursor = "default";
        break;
      case "접합장애물제거": // 접합장애물제거
        setScrollState((prev) => ({
          ...prev,
          ...resetScrollState,
        }));

        canvasRef.current.style.cursor = "crosshair";
        break;
      case "이진화(standard)":
        binarize("standard");
        break;

      case "이진화(standard_inv)":
        binarize("standard_inv");
        break;

      case "이진화(trunc)":
        binarize("trunc");
        break;

      case "이진화(tozero)":
        binarize("tozero");
        break;

      case "이진화(tozero_inv)":
        binarize("tozero_inv");
        break;
      case "저장": // 이진화 저장
        setReturnMemo((prev) => [
          ...prev,
          {
            ...scrollState,
            binarization: 127, // 이진화 상태 초기화
          },
        ]);
        setScrollState((prev) => ({
          ...prev,
          binarization: 127, // 이진화 상태 초기화
        }));
        setButtonState(null);
        break;
      case "돌아가기": // 이진화 돌리기
        setButtonState(null);
        setScrollState((prev) => ({
          ...prev,
          binarization: 127, // 이진화 상태 초기화
          image: returnMemo[returnMemo.length - 1].image, // 마지막 상태로 되돌리기
        }));
        break;

      default:
        console.log("끝");
    }
  }, [buttonState, scrollState.binarization]);

  // 되돌리기 버튼을 클릭헀을 때
  const returnClickHandler = () => {
    if (returnMemo.length > 1) {
      returnMemo.pop();
      setScrollState(returnMemo[returnMemo.length - 1]);
    }
    setButtonState(null);
  };

  return (
    <div className="EditMain">
      {isProcessing && <LoadingModal text="이미지를 처리 중입니다..." />}
      <Sidebar />
      <div className="main">
        <div className="image-swapper">
          <ImageLoader
            value="현장이미지"
            formData={crimeItem || {}}
            propsImage={crimeItem && crimeItem.image}
          />
        </div>
        <Preprocessing
          returnMemo={returnMemo}
          setReturnMemo={setReturnMemo}
          scrollState={scrollState}
          setScrollState={setScrollState}
          buttonState={buttonState}
          setButtonState={setButtonState}
          returnClickHandler={returnClickHandler}
        />
        <Canvas
          points={points}
          scrollState={scrollState}
          canvasRef={canvasRef}
          handleClick={handleClick}
          handleRightClick={handleRightClick}
          formData={crimeItem || {}} // fallback for robustness
          flex={3}
          mode="edit"
          buttonState={buttonState}
          setOriginSize={setOriginSize}
          originSize={originSize}
          imgRef={imgRef}
        />
      </div>
    </div>
  );
};

export default EditMain;
