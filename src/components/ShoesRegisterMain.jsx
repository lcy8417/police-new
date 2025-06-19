import "./ShoesRegisterMain.css";
import PatternList from "./PatternList";
import PatternInfo from "./PatternInfo";
import FormList from "./FormList";
import Sidebar from "./Sidebar";
import Canvas from "./Canvas";
import { handleChange } from "../utils/get-input-change";
import usePatternManager from "../hooks/usePatternManager";

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

  return (
    <div className="ShoesRegisterMain">
      {sidebar && <Sidebar />}
      <div className="main">
        <Canvas
          canvasRef={canvasRef}
          formData={formData}
          setFormData={setFormData}
          value="신발이미지"
          patternFunction={[extractPattern, clearPattern]}
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
