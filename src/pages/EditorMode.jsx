import React, { useState, useRef, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useImageProcessing from "../hooks/useImageProcessing";
import LoadingModal from "../components/LoadingModal";
import Preprocessing from "../components/Preprocessing";
import Canvas from "../components/Canvas";
import Button from "../components/Button";
import "./EditorMode.css";

const EditorMode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const url = import.meta.env.VITE_API_URL;

  // 쿼리 파라미터 파싱
  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get("id");
  const folder = queryParams.get("folder");

  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const [buttonState, setButtonState] = useState(null);
  const [points, setPoints] = useState([]);
  const [returnMemo, setReturnMemo] = useState([]);
  const [originSize, setOriginSize] = useState([0, 0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scrollState, setScrollState] = useState({
    image: null,
    zoom: 0,
    contrast: 0,
    saturation: 0,
    brightness: 0,
    rotate: 0,
    binarization: 127,
  });

  const handleProcessing = useImageProcessing({
    crimeNumber: id,
    scrollState,
    setScrollState,
    setReturnMemo,
  });

  // 초기 이미지 설정
  useEffect(() => {
    if (id) {
      // 서버에서 이미지 가져오기
      const loadImage = async () => {
        try {
          const imageUrl = `${url}/crime_history/${folder}_${id}.png`;

          // 이미지를 fetch하여 base64로 변환
          const response = await fetch(imageUrl);
          const blob = await response.blob();

          // blob을 base64로 변환
          const imageData = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });

          setScrollState((prev) => ({
            ...prev,
            image: imageData,
          }));
          setReturnMemo([
            {
              image: imageData,
              zoom: 0,
              contrast: 0,
              saturation: 0,
              brightness: 0,
              rotate: 0,
              binarization: 127,
            },
          ]);
        } catch (error) {
          console.error("이미지 로드 중 오류:", error);
          alert("이미지를 불러오는 중 오류가 발생했습니다.");
        }
      };

      loadImage();
    }
  }, [id]);

  // EditMain.jsx에서 가져온 핸들러들
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
    event.preventDefault();
    if (buttonState !== "배경제거" && buttonState !== "접합장애물제거") {
      return;
    }

    if (points.length <= 2) {
      alert("점이 3개 이상이어야 합니다.");
      return;
    }

    try {
      setIsProcessing(true);

      // imgRef를 사용하여 이미지 크기 가져오기
      let render_size;
      if (imgRef?.current) {
        render_size = imgRef.current.getBoundingClientRect();
      } else {
        // fallback: canvas 크기 사용
        const canvas = canvasRef.current;
        if (canvas) {
          render_size = canvas.getBoundingClientRect();
        } else {
          console.error("이미지나 캔버스를 찾을 수 없습니다.");
          alert("이미지나 캔버스를 찾을 수 없습니다.");
          setIsProcessing(false);
          return;
        }
      }

      const params = new URLSearchParams();
      params.append("render_size", render_size.width);
      params.append("render_size", render_size.height);

      if (buttonState === "배경제거") {
        console.log(scrollState);
        handleProcessing({
          endpoint: "segmentation",
          body: {
            polygon: points,
            image: scrollState.image,
          },
          params: params,
        }).finally(() => {
          setIsProcessing(false);
        });
      } else if (buttonState === "접합장애물제거") {
        handleProcessing({
          endpoint: "inpainting",
          body: {
            polygon: points,
            image: scrollState.image,
          },
          params: params,
        }).finally(() => {
          setIsProcessing(false);
        });
      }

      setButtonState(null);
    } catch (error) {
      console.error("요청 중 오류 발생:", error);
      alert("요청 처리 중 오류가 발생했습니다. 콘솔을 확인하세요.");
    }

    setPoints([]);
  };

  // 마우스 휠 이벤트 핸들러 (확대/축소)
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -10 : 10;
    setScrollState((prev) => ({
      ...prev,
      zoom: Math.max(-100, Math.min(100, prev.zoom + delta)),
    }));
  };

  // EditMain.jsx에서 가져온 useEffect 로직
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setPoints([]);

    const binarize = (type) => {
      handleProcessing({
        endpoint: "binarization",
        body: {
          image: returnMemo[returnMemo.length - 1].image,
          threshold: scrollState.binarization,
          type,
        },
      });
    };

    switch (buttonState) {
      case "배경제거":
        setScrollState((prev) => ({
          ...prev,
          zoom: 0,
          contrast: 0,
          saturation: 0,
          brightness: 0,
          rotate: 0,
          binarization: 127,
        }));
        canvasRef.current.style.cursor = "crosshair";
        break;
      case "이진화":
        canvasRef.current.style.cursor = "default";
        break;

      case "노이즈제거":
        setIsProcessing(true);
        handleProcessing({
          endpoint: "denoising",
          body: { image: scrollState.image },
        }).finally(() => {
          setIsProcessing(false);
        });
        setButtonState(null);
        canvasRef.current.style.cursor = "default";
        break;
      case "접합장애물제거":
        setScrollState((prev) => ({
          ...prev,
          zoom: 0,
          contrast: 0,
          saturation: 0,
          brightness: 0,
          rotate: 0,
          binarization: 127,
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
      case "저장":
        setReturnMemo((prev) => [
          ...prev,
          {
            ...scrollState,
            binarization: 127,
          },
        ]);
        setScrollState((prev) => ({
          ...prev,
          binarization: 127,
        }));
        setButtonState(null);
        break;
      case "돌아가기":
        setButtonState(null);
        setScrollState((prev) => ({
          ...prev,
          binarization: 127,
          image: returnMemo[returnMemo.length - 1].image,
        }));
        break;
      default:
        console.log("끝");
    }
  }, [buttonState, scrollState.binarization]);

  // 되돌리기 버튼을 클릭했을 때
  const returnClickHandler = () => {
    if (returnMemo.length > 1) {
      returnMemo.pop();
      setScrollState(returnMemo[returnMemo.length - 1]);
    }
    setButtonState(null);
  };

  // 뒤로가기
  const handleGoBack = () => {
    navigate(-1);
  };

  if (!id) {
    return (
      <div className="editor-mode">
        <div className="error-message">
          <h2>ID를 찾을 수 없습니다</h2>
          <p>편집할 데이터 ID가 전달되지 않았습니다.</p>
          <Button value="뒤로가기" onClick={handleGoBack} type="button" />
        </div>
      </div>
    );
  }

  return (
    <div className="editor-mode">
      {isProcessing && <LoadingModal text="이미지를 처리 중입니다..." />}

      <div className="editor-header">
        <div className="header-info">
          <h2>이미지 편집 모드</h2>
        </div>
        <div className="header-buttons">
          <Button value="뒤로가기" onClick={handleGoBack} type="button" />
        </div>
      </div>

      <div className="editor-content">
        <div className="editor-left">
          <Preprocessing
            returnMemo={returnMemo}
            setReturnMemo={setReturnMemo}
            scrollState={scrollState}
            setScrollState={setScrollState}
            buttonState={buttonState}
            setButtonState={setButtonState}
            returnClickHandler={returnClickHandler}
          />
        </div>

        <div className="editor-right">
          <Canvas
            points={points}
            scrollState={scrollState}
            canvasRef={canvasRef}
            handleClick={handleClick}
            handleRightClick={handleRightClick}
            formData={{ image: scrollState.image }}
            flex={3}
            mode="edit"
            buttonState={buttonState}
            originSize={originSize}
            setOriginSize={setOriginSize}
            imgRef={imgRef}
            onWheel={handleWheel}
          />
        </div>
      </div>
    </div>
  );
};

export default EditorMode;
