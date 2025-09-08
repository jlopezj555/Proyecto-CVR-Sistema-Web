import React, { useState } from "react";
import "./RegisterModal.css";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  return (
    <div className={`modal-overlay ${isClosing ? "closing" : ""}`}>
      <div className={`modal-content ${isClosing ? "closing" : ""}`}>
        <h2>Crear Cuenta</h2>
        <form className="register-form">
          <label>
            Nombre completo:
            <input type="text" name="nombre" required />
          </label>

          <label>
            Correo electrónico:
            <input type="email" name="correo" required />
          </label>

          <label>
            Usuario:
            <input type="text" name="usuario" required />
          </label>

          <label>
            Contraseña:
            <input type="password" name="password" required />
          </label>

          <label>
            Confirmar contraseña:
            <input type="password" name="confirmPassword" required />
          </label>

          <button type="submit" className="register-btn">
            Registrarse
          </button>
        </form>
        <button className="close-btn" onClick={handleClose}>
          ✖
        </button>
      </div>
    </div>
  );
};

export default RegisterModal;

