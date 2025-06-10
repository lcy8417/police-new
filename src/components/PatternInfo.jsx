import "./PatternInfo.css";
import PatternItem from "./PatternItem";

const PatternInfo = ({
  selected,
  setSelected,
  formData,
  deletePattern,
  essentialCheck = null,
}) => {
  const kinds = ["상", "중", "하", "윤곽"];
  return (
    <div className="PatternInfo">
      <div className="title">
        <h1>문양 정보</h1>
      </div>

      <div className="pattern-items">
        {kinds.map((kind, index) => (
          <PatternItem
            key={index}
            selectedIndex={index}
            title={kind}
            selected={selected}
            setSelected={setSelected}
            formData={formData}
            deletePattern={deletePattern}
            essentialCheck={essentialCheck}
          />
        ))}
      </div>
    </div>
  );
};

export default PatternInfo;
