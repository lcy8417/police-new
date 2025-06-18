import "./Preprocessing.css";
import DraggableSlider from "./DraggableSlider";
import Button from "./Button";

const Preprocessing = ({
  returnMemo,
  setReturnMemo,
  scrollState,
  setScrollState,
  setButtenState,
  returnClickHandler,
}) => {
  return (
    <div className="Preprocessing">
      {["확대", "대비", "채도", "밝기", "회전"].map((title, index) => (
        <DraggableSlider
          key={index}
          title={title}
          mem={returnMemo}
          memSave={setReturnMemo}
          scrollState={scrollState}
          setScrollState={setScrollState}
        />
      ))}
      {["배경제거", "이진화", "노이즈제거", "접합장애물제거", "되돌리기"].map(
        (title, index) => {
          return (
            <Button
              key={index}
              value={title}
              size="full-width"
              onClick={() => {
                setButtenState(index);
                if (index === 4) {
                  returnClickHandler();
                }
              }}
            />
          );
        }
      )}
    </div>
  );
};

export default Preprocessing;
