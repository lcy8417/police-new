import "./FormItem.css";

const FormItem = ({
  label,
  value,
  name,
  handleChange = null,
  readOnly = false,
}) => {
  return (
    <div className="form-item">
      <h2>{label}</h2>
      <input
        name={name}
        value={value}
        onChange={handleChange || undefined}
        readOnly={readOnly || !handleChange}
      />
    </div>
  );
};

export default FormItem;
