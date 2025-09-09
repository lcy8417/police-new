import React from "react";

const CalibrationInfo = ({ points, onClearPoints }) => {
  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(0,0,0,0.8)",
        color: "white",
        padding: "10px",
        borderRadius: "5px",
        zIndex: 1000,
        textAlign: "center",
      }}
    >
      <p style={{ margin: "0 0 10px 0" }}>각도보정 모드 - 4개 점 클릭</p>
      <p style={{ margin: "0 0 10px 0" }}>클릭한 점: {points.length}/4</p>
      {points.length > 0 && (
        <button
          onClick={onClearPoints}
          style={{
            padding: "5px 10px",
            background: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "3px",
            cursor: "pointer",
          }}
        >
          점 초기화
        </button>
      )}
    </div>
  );
};

export default CalibrationInfo;

