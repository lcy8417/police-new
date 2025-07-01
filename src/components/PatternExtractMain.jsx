import Button from "./Button";
import "./PatternExtractMain.css";
import { useContext, useRef } from "react";
import PatternList from "./PatternList";
import PatternInfo from "./PatternInfo";
import { crimeDataContext } from "../App";
import { useParams } from "react-router-dom";
import Sidebar from "./Sidebar";
import usePatternManager from "../hooks/usePatternManager";
import Canvas from "./Canvas";
import { imageChangeHandler } from "../utils/get-input-change";

const PatternExtractMain = () => {
  const imgRef = useRef(null);
  const { crimeData } = useContext(crimeDataContext);
  const { crimeNumber } = useParams(); // Getting the id from the route parameters
  const index = crimeData.findIndex(
    (item) => String(item.crimeNumber) === String(crimeNumber)
  );

  const currentCrimeData = crimeData[index];

  console.log("PatternExtractMain index:", index, crimeNumber);
  const {
    canvasRef,
    patterns,
    selected,
    lineState,
    setLineState,
    setSelected,
    extractPattern,
    clearPattern,
    patternsKindSelect,
    insertPattern,
    deletePattern,
    essentialCheck,
  } = usePatternManager({ index, currentData: currentCrimeData });

  return (
    <div className="PatternExtractMain">
      <Sidebar />
      <div className="main">
        <div className="image-swapper">
          <Canvas
            canvasRef={canvasRef}
            formData={currentCrimeData || {}}
            value="신발이미지"
            patternFunction={[extractPattern, clearPattern]}
            lineState={lineState}
            setLineState={setLineState}
            propsImage={(currentCrimeData && currentCrimeData.image) || null}
          />
          <div className="image-swapper-buttons">
            <Button
              value="현장이미지"
              type="button"
              size="full-width"
              onClick={() =>
                imageChangeHandler("origin", imgRef, currentCrimeData)
              }
            />
            <Button
              value="편집이미지"
              type="button"
              size="full-width"
              onClick={() =>
                imageChangeHandler("edit", imgRef, currentCrimeData)
              }
            />
          </div>
        </div>
        <PatternInfo
          selected={selected}
          setSelected={setSelected}
          deletePattern={deletePattern}
          essentialCheck={essentialCheck}
          formData={currentCrimeData}
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
