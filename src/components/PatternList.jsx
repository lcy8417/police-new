import Button from "./Button";
import "./PatternList.css"; // Assuming you have a CSS file for styling

const PatternsList = ({
  patterns,
  patternsKindSelect = null,
  insertPattern = null,
  flex = 1,
  title = "문양 리스트",
  buttonVisible = true,
}) => {
  return (
    <div className={`PatternList flex-${flex}`}>
      <h1>{title}</h1>
      {buttonVisible && (
        <div className="button-items">
          <Button value="무늬" onClick={patternsKindSelect} type="button" />
          <Button value="선" onClick={patternsKindSelect} type="button" />
          <Button value="윤곽" onClick={patternsKindSelect} type="button" />
          <Button value="다각" onClick={patternsKindSelect} type="button" />
          <Button value="삼각" onClick={patternsKindSelect} type="button" />
          <Button value="사각" onClick={patternsKindSelect} type="button" />
          <Button value="원" onClick={patternsKindSelect} type="button" />
          <Button value="항목" onClick={patternsKindSelect} type="button" />
        </div>
      )}
      <div className="total-pattern-items">
        {patterns.map((src, index) => {
          return (
            <img key={index} src={src} alt={src} onClick={insertPattern} />
          );
        })}
      </div>
    </div>
  );
};
export default PatternsList;
