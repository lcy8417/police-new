import PatternList from "./PatternList";
import { useState } from "react";
import Button from "./Button";
import "./PartialPatterns.css"; // Assuming you have a CSS file for styling

const PartialPatterns = ({ patternItems }) => {
  const [currentPartial, setCurrentParial] = useState("상");
  const kinds = ["상", "중", "하", "윤곽"];
  const kindMapping = {
    상: "top",
    중: "mid",
    하: "bottom",
    윤곽: "outline",
  };

  const partialChange = (e) => {
    const currentIndex = kinds.indexOf(currentPartial);

    if (e.target.textContent === "<") {
      setCurrentParial(kinds[(currentIndex - 1 + kinds.length) % kinds.length]);
    } else if (e.target.textContent === ">") {
      setCurrentParial(kinds[(currentIndex + 1) % kinds.length]);
    }
  };

  return (
    <div className="PartialPatterns">
      <div className="header-buttons">
        <Button value="<" onClick={partialChange} />
        <h3>문양 비교</h3>
        <Button value=">" onClick={partialChange} />
      </div>
      <div className="patterns-container">
        <h3 className="partial-kind">{currentPartial}</h3>
        {patternItems.map((item, index) => {
          return (
            <PatternList
              key={index}
              patterns={item && item[kindMapping[currentPartial]]}
              title={item.title}
              buttonVisible={false}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PartialPatterns;
