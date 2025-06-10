import { Link } from "react-router-dom";
import "./SideBar.css";
import Button from "./Button";

const SideBar = () => {
  return (
    <div className="SideBar">
      <div className="title">
        <h2 className="title"> {/* 경찰 마크 이모지 추가 */}</h2>
      </div>
      <div className="divider">
        <Link to="/crimeRegister">
          <Button value="사건 등록" type="nav" size="nav full-width" />
        </Link>
        <Link to="/search">
          <Button value="사건 조회" type="nav" size="nav full-width" />
        </Link>
        <Link to="/shoesRegister">
          <Button value="신발 등록" type="nav" size="nav full-width" />
        </Link>
      </div>
    </div>
  );
};

export default SideBar;
