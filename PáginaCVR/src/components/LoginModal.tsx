import React, { useState } from "react";
import "./LoginModal.css";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterClick: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onRegisterClick }) => {
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300); // Duración de la animación
  };

  const handleRegisterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    handleClose();
    setTimeout(() => onRegisterClick(), 300);
  };

  return (
    <div className={`modal-overlay ${isClosing ? "closing" : ""}`}>
      <div className={`login-modal ${isClosing ? "closing" : ""}`}>
        <h2>Iniciar Sesión</h2>
        <form className="login-form">
          <label>
            Usuario:
            <input type="text" name="usuario" required />
          </label>
          <label>
            Contraseña:
            <input type="password" name="password" required />
          </label>
          <button type="submit" className="login-btn">
            Ingresar
          </button>
        </form>
        <p className="register-text">
          ¿No tienes una cuenta?{" "}
          <a href="#" onClick={handleRegisterClick}>
            Registrarte
          </a>
        </p>
        <button className="close-btn" onClick={handleClose}>
          ✖
        </button>
      </div>
    </div>
  );
};

export default LoginModal;

