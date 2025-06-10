import "./ShoesRegisterMain.css";
import ImageLoader from "./ImageLoader";
import { useState, useEffect } from "react";
import PatternList from "./PatternList";
import PatternInfo from "./PatternInfo";
import FormList from "./FormList";
import filesLoad from "../hooks/useFileLoad";

const ShoesRegisterMain = ({ formData, setFormData }) => {
  const [patterns, setPatterns] = useState([]);
  const [selected, setSelected] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  // 초기 문양 로드
  useEffect(() => {
    filesLoad("무늬", setPatterns);
  }, []);

  return (
    <div className="ShoesRegisterMain">
      <ImageLoader
        formData={formData}
        setFormData={setFormData}
        value="신발이미지"
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
          handleChange={handleChange}
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
  );
};
export default ShoesRegisterMain;
