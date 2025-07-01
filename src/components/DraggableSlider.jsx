import React, { useRef, useState } from "react";
import "./DraggableSlider.css";

const titleName = {
  확대: "zoom",
  대비: "contrast",
  채도: "saturation",
  밝기: "brightness",
  회전: "rotate",
  이진화: "binarization",
};

const sliderActiveList = [
  "이진화",
  "이진화(standard)",
  "이진화(standard_inv)",
  "이진화(trunc)",
  "이진화(tozero)",
  "이진화(tozero_inv)",
];

const DraggableSlider = ({
  title,
  min = -100,
  max = 100,
  mem,
  memSave,
  scrollState,
  setScrollState,
  buttonState,
}) => {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const startDrag = (e) => {
    if (buttonState !== null && !sliderActiveList.includes(buttonState)) return;
    setDragging(true);
    e.preventDefault();
  };

  const stopDrag = async () => {
    if (buttonState !== null && !sliderActiveList.includes(buttonState)) return;
    let prevScrollState = mem[mem.length - 1];

    if (
      prevScrollState[titleName[title]] !==
      Math.round(scrollState[titleName[title]])
    ) {
      prevScrollState = {
        ...prevScrollState,
        [titleName[title]]: Math.round(scrollState[titleName[title]]),
      };

      if (title !== "이진화") {
        memSave([...mem, prevScrollState]);
      }
    }

    setDragging(false);
  };

  const onDrag = (e) => {
    if (
      !dragging ||
      !trackRef.current ||
      (buttonState !== null && !sliderActiveList.includes(buttonState))
    )
      return;

    const track = trackRef.current;
    const rect = track.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const clampedX = Math.max(0, Math.min(relativeX, rect.width));
    const value = min + (clampedX / rect.width) * (max - min);

    setScrollState((prev) => ({
      ...prev,
      [titleName[title]]: Math.round(value),
    }));
  };

  return (
    <div className="draggable-slider">
      <h3>{title}</h3>
      <div
        className="slider-track"
        ref={trackRef}
        onMouseMove={onDrag}
        onMouseLeave={stopDrag}
        onMouseUp={stopDrag}
      >
        <div
          className="slider-thumb"
          style={{
            left: `${
              ((scrollState[titleName[title]] - min) / (max - min)) * 100
            }%`,
          }}
          onMouseDown={startDrag}
        />
        <div className="slider-value">
          {Math.round(scrollState[titleName[title]])}
        </div>
      </div>
    </div>
  );
};

export default DraggableSlider;
