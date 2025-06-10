import "./Button.css"; // Ensure this path is correct based on your project structure

const Button = ({ value, onClick, type = "", size = "" }) => {
  return (
    <button onClick={onClick} className={`btn ${size}`} type={type}>
      {value}
    </button>
  );
};
export default Button;
