import { useState, useCallback } from "react";

const useDragLines = (initialYs = [100, 200]) => {
  const [lineYs, setLineYs] = useState(initialYs);
  const [draggingLine, setDraggingLine] = useState(null);
  const [offsetY, setOffsetY] = useState(0);

  const startDrag = useCallback(
    (mouseY) => {
      lineYs.forEach((lineY, idx) => {
        if (Math.abs(mouseY - lineY) < 5) {
          setDraggingLine(idx);
          setOffsetY(lineY - mouseY);
        }
      });
    },
    [lineYs]
  );

  const updateDrag = useCallback(
    (mouseY) => {
      if (draggingLine !== null) {
        setLineYs((prev) => {
          const newYs = [...prev];
          newYs[draggingLine] = mouseY + offsetY;
          return newYs;
        });
      }
    },
    [draggingLine, offsetY]
  );

  const stopDrag = useCallback(() => {
    setDraggingLine(null);
  }, []);

  return {
    lineYs,
    setLineYs,
    draggingLine,
    offsetY,
    startDrag,
    updateDrag,
    stopDrag,
  };
};

export default useDragLines;
