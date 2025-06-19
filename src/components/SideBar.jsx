import { Link } from "react-router-dom";
import "./Sidebar.css";
import Button from "./Button";
import { useState } from "react";

const Sidebar = () => {
  const [clickIndex, setClickIndex] = useState(null);

  const removeCanvas = () => {
    return;
    const canvas = document.querySelector("canvas");
    if (canvas) {
      canvas.remove();
    }
  };

  return (
    <div className="Sidebar">
      <div className="title">
        <h2 className="title"> {/* 경찰 마크 이모지 추가 */}</h2>
      </div>
      <div className="divider">
        <Link to="/crimeRegister">
          <Button
            value="사건 등록"
            type="nav"
            // onClick={removeCanvas}
            size={`nav full-width ${clickIndex === 0 ? "click" : ""}`}
          />
        </Link>
        <Link to="/search">
          <Button
            value="사건 조회"
            type="nav"
            target="_blank"
            size={`nav full-width ${clickIndex === 1 ? "click" : ""}`}
            // onClick={removeCanvas}
          />
        </Link>
        <Link to="/shoesRegister">
          <Button
            value="신발 등록"
            type="nav"
            size={`nav full-width ${clickIndex === 2 ? "click" : ""}`}
            // onClick={removeCanvas}
          />
        </Link>
        <Link to="/shoesRepository/0">
          <Button
            value="신발 조회"
            type="nav"
            size={`nav full-width ${clickIndex === 3 ? "click" : ""}`}
            // onClick={removeCanvas}
          />
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
