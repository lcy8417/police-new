import "./Button.css"; // Ensure this path is correct based on your project structure

const Button = ({ value, onClick, type = "", size = "", disabled = false }) => {
  return (
    <button
      onClick={onClick}
      className={`btn ${size} ${disabled ? "disabled" : ""}`}
      type={type}
      disabled={disabled}
    >
      {value}
    </button>
  );
};
export default Button;
