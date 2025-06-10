import "./FormItem.css";

const FormItem = ({ label, value, name, handleChange = null }) => {
  return (
    <div className="form-item">
      <h2>{label}</h2>
      <input name={name} value={value} onChange={handleChange} />
    </div>
  );
};

export default FormItem;
