import Button from "./Button";
import "./PatternExtractMain.css"; // Assuming you have a CSS file for styling
import { useState, useEffect } from "react";
import PatternList from "./PatternList"; // Assuming you have a PatternList component for displaying patterns
import PatternInfo from "./PatternInfo"; // Importing the patterns path utility
import filesLoad from "../hooks/useFileLoad";
import ImageLoader from "./ImageLoader"; // Assuming you have an ImageLoader component for handling image uploads

const PatternExtractMain = ({ formData, setFormData }) => {
  const [patterns, setPatterns] = useState([]);
  const [selected, setSelected] = useState(null);

  const patternsKindSelect = (e) => {
    const kind = e.target.textContent;
    filesLoad(kind, setPatterns);
  };

  const insertPattern = (e) => {
    const kinds = ["top", "mid", "bottom", "outline"];

    if (
      selected !== null &&
      !formData[kinds[selected]].includes(e.target.src)
    ) {
      setFormData((prev) => ({
        ...prev,
        [kinds[selected]]: [...prev[kinds[selected]], [e.target.src, 0]],
      }));
    }
  };

  const deletePattern = (kind, src) => {
    console.log(kind, src);
    setFormData((prev) => ({
      ...prev,
      [kind]: prev[kind].filter((item) => item[0] !== src), // src 값과 비교하여 필터링
    }));
  };

  // 오른쪽 클릭 시 필수 여부 토글
  const essentialCheck = (kind, src) => {
    setFormData((prev) => {
      return {
        ...prev,
        [kind]: prev[kind].map((item) => {
          if (item[0] === src) {
            return [item[0], !item[1]];
          }
          return item;
        }),
      };
    });
  };

  useEffect(() => {
    filesLoad("무늬", setPatterns);
  }, []);

  return (
    <div className="pattern-extract-main">
      <div className="image-swapper">
        <ImageLoader
          value="현장이미지"
          formData={formData}
          setFormData={setFormData}
          propsImage={formData.image}
        />
        <div className="image-swapper-buttons">
          <Button value="현장이미지" type="button" />
          <Button value="편집이미지" type="button" />
        </div>
      </div>
      <PatternInfo
        selected={selected}
        setSelected={setSelected}
        formData={formData}
        deletePattern={deletePattern}
        essentialCheck={essentialCheck}
      />
      <PatternList
        patterns={patterns}
        patternsKindSelect={patternsKindSelect}
        insertPattern={insertPattern}
      />
    </div>
  );
};
export default PatternExtractMain;
