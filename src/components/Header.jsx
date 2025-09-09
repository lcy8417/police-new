import Button from "./Button";
import "./Header.css"; // Assuming you have a CSS file for styling

const Header = ({ value, buttonList = [], disabled = false }) => {
  return (
    <div className="Header">
      <h1>{value}</h1>
      <div className="button-group">
        {buttonList.map((button, index) => (
          <Button
            key={index}
            value={button.value}
            onClick={button.event ? button.event : null}
            disabled={button.disabled || disabled}
          />
        ))}
      </div>
    </div>
  );
};

export default Header;
