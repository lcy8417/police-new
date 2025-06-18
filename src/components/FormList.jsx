import FormItem from "./FormItem";
import "./FormList.css";

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
          return (
            <FormItem
              key={index}
              label={key}
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
