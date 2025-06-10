import "./DetailMain.css";
import Button from "./Button";
import { useNavigate } from "react-router-dom";
import ImageLoader from "./ImageLoader"; // Assuming you have an ImageLoader component
import FormList from "./FormList"; // Assuming you have a FormList component

const DetailMain = ({ formData, setFormData }) => {
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="detail-main">
      <div className="image-swapper">
        <ImageLoader
          value="현장이미지"
          formData={formData}
          setFormData={setFormData}
          propsImage={formData.image}
        />
        <div className="image-swapper-buttons">
          <Button value="현장이미지" type="button" />
          <Button value="편집이미지" type="button" />
        </div>
      </div>
      <div className="form-container">
        <FormList formData={formData} handleChange={handleChange} />
        <Button
          value="← 목록으로 돌아가기"
          type="button"
          onClick={() => navigate(-1)}
        />
      </div>
    </div>
  );
};
export default DetailMain;
