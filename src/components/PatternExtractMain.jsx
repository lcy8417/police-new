import Button from "./Button";
import "./PatternExtractMain.css"; // Assuming you have a CSS file for styling
import { useState, useEffect, useContext } from "react";
import PatternList from "./PatternList"; // Assuming you have a PatternList component for displaying patterns
import PatternInfo from "./PatternInfo"; // Importing the patterns path utility
import filesLoad from "../hooks/useFileLoad";
import ImageLoader from "./ImageLoader"; // Assuming you have an ImageLoader component for handling image uploads
import { crimeDataContext } from "../App"; // Importing the context for crime data
import { useParams } from "react-router-dom"; // Importing useParams to get route parameters
import Sidebar from "./Sidebar"; // Assuming you have a Sidebar component for navigation

const PatternExtractMain = () => {
  const [patterns, setPatterns] = useState([]);
  const [selected, setSelected] = useState(null);

  const { crimeData, setCrimeData } = useContext(crimeDataContext);
  const { id } = useParams(); // Getting the id from the route parameters

  const index = crimeData.findIndex((item) => item.id === parseInt(id));

  const patternsKindSelect = (e) => {
    const kind = e.target.textContent;
    filesLoad(kind, setPatterns);
  };

  const insertPattern = (e) => {
    const kind = ["top", "mid", "bottom", "outline"][selected];

    const exists = crimeData[index][kind].some(
      (item) => item[0] === e.target.src
    );

    if (selected !== null && !exists) {
      setCrimeData((prev) => {
        if (index === -1) return prev; // id가 없는 경우 기존 상태 반환

        return prev.map((item, i) =>
          i === index
            ? {
                ...item,
                [kind]: [...item[kind], [e.target.src, 0]], // 새로운 데이터 추가
              }
            : item
        );
      });
    }
  };

  const deletePattern = (kind, src) => {
    setCrimeData((prev) => {
      if (index === -1) return prev; // id가 없는 경우 기존 상태 반환

      return prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [kind]: item[kind].filter((subItem) => subItem[0] !== src),
            }
          : item
      );
    });
  };

  // 오른쪽 클릭 시 필수 여부 토글
  const essentialCheck = (kind, src) => {
    setCrimeData((prev) => {
      if (index === -1) return prev; // id가 없는 경우 기존 상태 반환

      return prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [kind]: item[kind].map((subItem) => {
                if (subItem[0] === src) {
                  return [subItem[0], !subItem[1]];
                }
                return subItem;
              }),
            }
          : item
      );
    });
  };

  useEffect(() => {
    filesLoad("무늬", setPatterns);
  }, []);

  return (
    <div className="PatternExtractMain">
      <Sidebar />
      <div className="main">
        <div className="image-swapper">
          <ImageLoader
            value="현장이미지"
            formData={crimeData[id]}
            propsImage={crimeData[id].image}
          />
          <div className="image-swapper-buttons">
            <Button value="현장이미지" type="button" size="full-width" />
            <Button value="편집이미지" type="button" size="full-width" />
          </div>
        </div>
        <PatternInfo
          selected={selected}
          setSelected={setSelected}
          deletePattern={deletePattern}
          essentialCheck={essentialCheck}
        />
        <PatternList
          patterns={patterns}
          patternsKindSelect={patternsKindSelect}
          insertPattern={insertPattern}
        />
      </div>
    </div>
  );
};
export default PatternExtractMain;
