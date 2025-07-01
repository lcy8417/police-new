import "./PatternItem.css";
import { crimeDataContext } from "../App";
import { useParams } from "react-router-dom";
import { useContext } from "react";

const PatternItem = ({
  selectedIndex,
  title,
  selected,
  setSelected,
  deletePattern,
  essentialCheck = null,
  formData = null,
}) => {
  const kind = ["top", "mid", "bottom", "outline"][selectedIndex];
  const { crimeNumber } = useParams();
  const { crimeData } = useContext(crimeDataContext);
  const currentData = formData
    ? formData //신발 등록
    : crimeData.find(
        (item) => String(item.crimeNumber) === String(crimeNumber)
      ); // 범죄 데이터 조회

  // TODO: 문양 정보 추가해서
  return (
    <div
      className={`PartialPatternItem ${kind} ${
        selected === selectedIndex ? "selected" : ""
      }`}
    >
      <div onClick={() => setSelected(selectedIndex)}>{title}</div>
      <div className="pattern-item-images">
        {currentData?.[kind]?.map((item, index) => {
          item = typeof item === "string" ? [item, false] : item; // 신발 등록일때는 필수가 없으므로, string이 들어옴
          return (
            <div key={index} className="pattern-item-image">
              <img
                key={index}
                src={item[0]}
                alt={item[0]}
                onClick={() => deletePattern(kind, item[0])}
                onContextMenu={(e) => {
                  e.preventDefault();
                  essentialCheck && essentialCheck(kind, item[0]);
                }}
                className={`${kind} ${
                  item.length > 1 && item[1] ? "essential" : ""
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default PatternItem;
