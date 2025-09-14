import React, { useState } from "react";
import "./LoginModal.css";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterClick: () => void;
  onLogin: (email: string, password: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onRegisterClick, onLogin }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [correo, SetCorreo] = useState('');
  const [contrasena, SetContrasena] = useState('');
  const [loading, setLoading] = useState(false);  

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // Inicia el estado de carga

    try {
      await onLogin(correo, contrasena);
    } finally {
      setLoading(false);
    }
  };

return (
    <div className={`modal-overlay ${isClosing ? "closing" : ""}`}>
      <div className={`login-modal ${isClosing ? "closing" : ""}`}>
        <h2>Iniciar Sesión</h2>
        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Correo:
            <input
              type="email"
              name="correo"
              value={correo}
              onChange={(e) => SetCorreo(e.target.value)}
              required
            />
          </label>
          <label>
            Contraseña:
            <input
              type="password"
              name="password"
              value={contrasena}
              onChange={(e) => SetContrasena(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
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

