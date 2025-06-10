import FormItem from "./FormItem";
import "./FormList.css";

const FormList = ({ formData, handleChange = null, direction = "grid" }) => {
  return (
    <div className={`FormList ${direction}`}>
      {Object.keys(formData).map((key, index) => {
        if (!["image", "top", "mid", "bottom", "outline"].includes(key)) {
          return (
            <FormItem
              key={index}
              label={key}
              value={formData[key]}
              name={key}
              handleChange={handleChange}
            />
          );
        }
      })}
    </div>
  );
};

export default FormList;
