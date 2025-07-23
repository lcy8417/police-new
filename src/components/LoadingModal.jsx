// components/LoadingModal.jsx
import "./LoadingModal.css";

const LoadingModal = ({ text = "처리 중입니다..." }) => {
  return (
    <div className="loading-modal">
      <div className="modal-content">
        <div className="spinner" />
        <p>{text}</p>
      </div>
    </div>
  );
};

export default LoadingModal;
