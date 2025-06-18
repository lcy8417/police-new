import "./ShoesRegisterMain.css";
import { useState, useEffect } from "react";
import PatternList from "./PatternList";
import PatternInfo from "./PatternInfo";
import FormList from "./FormList";
import filesLoad from "../hooks/useFileLoad";
import Sidebar from "./Sidebar";
import Canvas from "./Canvas";
import { handleChange } from "../utils/get-input-change";
import { useRef } from "react";

const ShoesRegisterMain = ({
  formData,
  setFormData,
  propsImage = null,
  sidebar = true,
}) => {
  const [patterns, setPatterns] = useState([]);
  const [selected, setSelected] = useState(null);
  const canvasRef = useRef(null);

  const [lineState, setLineState] = useState({
    lineYs: [100, 200],
    draggingLine: null,
    offsetY: 0,
  });

  const extractPattern = () => {
    console.log("패턴 추출");
  };

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
        [kinds[selected]]: [...prev[kinds[selected]], e.target.src],
      }));
    }
  };

  const deletePattern = (kind, src) => {
    setFormData((prev) => ({
      ...prev,
      [kind]: prev[kind].filter((prevSrc) => prevSrc !== src),
    }));
  };

  const clearPattern = () => {
    setFormData((prev) => ({
      ...prev,
      top: [],
      mid: [],
      bottom: [],
      outline: [],
    }));
  };
  // 기존 캔버스가 있다면 제거
  useEffect(() => {
    const imageContainer = document.querySelector(
      ".ImageLoader .image-container"
    );

    const existingCanvas = imageContainer.querySelector("canvas");
    const existingButton = imageContainer.querySelector("button");
    if (existingCanvas) existingCanvas.remove();
    if (existingButton) existingButton.remove();
  }, [formData.image]);

  // 초기 문양 리스트 로드
  useEffect(() => {
    filesLoad("무늬", setPatterns);
  }, []);

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
