import FormItem from "./FormItem";
import "./FormList.css";

const mappingList = {
  modelNumber: "모델 번호",
  findLocation: "수집장소",
  manufacturer: "제조사",
  findYear: "수집년도",
  emblem: "상표명",
  crimeNumber: "사건등록번호",
  imageNumber: "이미지 번호",
  crimeName: "사건 이름",
  findTime: "채취 일시",
  requestOffice: "의뢰관서",
  findMethod: "발견 방법",
  ranking: "순위",
  state: "진행상태",
  matchingShoes: "매칭된 신발",
};

const FormList = ({
  formData,
  handleChange = null,
  direction = "grid",
  readOnly = false,
}) => {
  return (
    <div className={`FormList ${direction}`}>
      {Object.keys(formData).map((key, index) => {
        if (!["id", "image", "top", "mid", "bottom", "outline"].includes(key)) {
          const label = mappingList[key] ? mappingList[key] : key; // 키가 mappingList에 있으면 해당 값으로 변경
          return (
            <FormItem
              key={index}
              label={label}
              value={formData[key]}
              name={key}
              handleChange={handleChange}
              readOnly={readOnly}
            />
          );
        }
      })}
    </div>
  );
};

export default FormList;
