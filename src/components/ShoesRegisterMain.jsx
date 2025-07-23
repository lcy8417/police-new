import "./ShoesRegisterMain.css";
import PatternList from "./PatternList";
import PatternInfo from "./PatternInfo";
import FormList from "./FormList";
import Sidebar from "./Sidebar";
import Canvas from "./Canvas";
import { handleChange } from "../utils/get-input-change";
import usePatternManager from "../hooks/usePatternManager";
import LoadingModal from "./LoadingModal"; // Importing LoadingModal component
import { useState } from "react";

const ShoesRegisterMain = ({
  formData,
  setFormData,
  propsImage = null,
  sidebar = true,
}) => {
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
  } = usePatternManager({
    formData,
    setFormData,
  });

  const [isExtracting, setIsExtracting] = useState(false);

  const handleExtractPattern = async () => {
    try {
      setIsExtracting(true);
      await extractPattern().finally(() => {
        setIsExtracting(false);
      });
    } catch (error) {
      console.error("패턴 추출 중 오류:", error);
      alert("패턴 추출 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="ShoesRegisterMain">
      {isExtracting && <LoadingModal text="패턴 추출 중..." />}
      {sidebar && <Sidebar />}
      <div className="main">
        <Canvas
          canvasRef={canvasRef}
          formData={formData}
          setFormData={setFormData}
          value="신발이미지"
          patternFunction={[handleExtractPattern, clearPattern]}
          lineState={lineState}
          setLineState={setLineState}
          propsImage={propsImage}
        />

        <PatternInfo
          selected={selected}
          setSelected={setSelected}
          formData={formData}
          deletePattern={deletePattern}
        />
        <div className="main-body-content">
          <FormList
            formData={formData}
            handleChange={(e) => handleChange(e, setFormData)}
            direction="flex"
          />
          <PatternList
            patterns={patterns}
            patternsKindSelect={patternsKindSelect}
            insertPattern={insertPattern}
            flex={3}
          />
        </div>
      </div>
    </div>
  );
};
export default ShoesRegisterMain;
