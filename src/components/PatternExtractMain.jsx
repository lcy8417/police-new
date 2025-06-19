import Button from "./Button";
import "./PatternExtractMain.css";
import { useState, useContext } from "react";
import PatternList from "./PatternList";
import PatternInfo from "./PatternInfo";
import { crimeDataContext } from "../App";
import { useParams } from "react-router-dom";
import Sidebar from "./Sidebar";
import usePatternManager from "../hooks/usePatternManager";
import Canvas from "./Canvas";

const PatternExtractMain = () => {
  const { crimeData } = useContext(crimeDataContext);
  const { crimeNumber } = useParams(); // Getting the id from the route parameters
  const index = crimeData.findIndex(
    (item) => item.crimeNumber === parseInt(crimeNumber)
  );

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
  } = usePatternManager({ index });

  return (
    <div className="PatternExtractMain">
      <Sidebar />
      <div className="main">
        <div className="image-swapper">
          <Canvas
            canvasRef={canvasRef}
            formData={crimeData[crimeNumber] || {}}
            value="신발이미지"
            patternFunction={[extractPattern, clearPattern]}
            lineState={lineState}
            setLineState={setLineState}
            propsImage={
              (crimeData[crimeNumber] && crimeData[crimeNumber].image) || null
            }
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
