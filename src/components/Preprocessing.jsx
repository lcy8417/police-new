import "./Preprocessing.css";
import DraggableSlider from "./DraggableSlider";
import Button from "./Button";
import { useState, useEffect } from "react";

const Preprocessing = ({
  returnMemo,
  setReturnMemo,
  scrollState,
  setScrollState,
  buttonState,
  setButtonState,
  returnClickHandler,
}) => {
  const [visibleScroll, setVisibleScroll] = useState([
    "확대",
    "대비",
    "채도",
    "밝기",
    "회전",
  ]);

  const [visubleButton, setVisibleButton] = useState([
    "배경제거",
    "이진화",
    "노이즈제거",
    "접합장애물제거",
    "되돌리기",
  ]);

  useEffect(() => {
    if (buttonState === "되돌리기") return;

    // 버튼 상태에 따라 표시할 슬라이더와 버튼을 조정
    if (
      ["배경제거", "노이즈제거", "접합장애물제거"].includes(buttonState) ||
      buttonState === null
    ) {
      setVisibleScroll(["확대", "대비", "채도", "밝기", "회전"]);
      setVisibleButton([
        "배경제거",
        "이진화",
        "노이즈제거",
        "접합장애물제거",
        "되돌리기",
      ]);
    } else if (
      [
        "이진화",
        "저장",
        "이진화(standard)",
        "이진화(standard_inv)",
        "이진화(trunc)",
        "이진화(tozero)",
        "이진화(tozero_inv)",
      ].includes(buttonState)
    ) {
      setVisibleScroll(["확대", "회전", "이진화"]);
      setVisibleButton([
        "이진화(standard)",
        "이진화(standard_inv)",
        "이진화(trunc)",
        "이진화(tozero)",
        "이진화(tozero_inv)",
        "저장",
        "돌아가기",
      ]);
    }
  }, [buttonState]);

  return (
    <div className="Preprocessing">
      {visibleScroll?.map((title, index) => (
        <DraggableSlider
          key={index}
          title={title}
          mem={returnMemo}
          memSave={setReturnMemo}
          scrollState={scrollState}
          setScrollState={setScrollState}
          min={title === "이진화" ? 0 : -100}
          max={title === "이진화" ? 255 : 100}
          buttonState={buttonState}
        />
      ))}

      {visubleButton?.map((title, index) => (
        // 되돌리기는 항상 표시
        <Button
          key={index}
          value={title}
          size="full-width"
          onClick={() => {
            setButtonState(title);
            if (title === "되돌리기") {
              returnClickHandler();
            }
          }}
        />
      ))}
    </div>
  );
};

export default Preprocessing;
