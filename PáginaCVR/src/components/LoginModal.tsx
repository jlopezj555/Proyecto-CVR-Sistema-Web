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
  const [revealPwd, setRevealPwd] = useState(false);
  const onDown = () => setRevealPwd(true);
  const onUp = () => setRevealPwd(false);  

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
    // Forzar cierre inmediato del modal sin bloquear por animación
    setIsClosing(true);
    onClose();
    // Dar un pequeño margen para que el padre cambie estado y monte el modal de registro
    setTimeout(() => onRegisterClick(), 10);
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
    <div className={`login-modal ${isClosing ? "closing" : ""}`} style={{ background: '#2563eb', color: 'white', position: 'relative' }}>
      <h2 style={{ color: 'white', textAlign: 'center', marginBottom: 24 }}>Iniciar Sesión</h2>
      {/* Ojos fuera del textbox, arriba a la derecha */}
      <div style={{ position: 'absolute', top: 18, right: 24, zIndex: 2, display: 'flex', gap: 8 }}>
        <button
          type="button"
          className="password-eye"
          aria-label={revealPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          title={revealPwd ? 'Ocultar' : 'Mostrar'}
          onMouseDown={onDown}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onTouchStart={e => { e.preventDefault(); onDown(); }}
          onTouchEnd={onUp}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 22, color: 'white', outline: 'none' }}
        >
          {revealPwd ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7z"/>
              <circle cx="12" cy="12" r="3.5" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="white" d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7 1.86 0 3.62-.43 5.21-1.2l-2.1-2.1A8.76 8.76 0 0112 17c-2.77 0-5-2.23-5-5 0-.88.23-1.71.63-2.43L6.2 8.14C7.94 6.96 9.91 6.2 12 6.2c4.98 0 9.27 2.93 11.5 7.06-.55 1.02-1.24 1.98-2.05 2.84l1.12 1.12C23 15.61 24 13.87 24 12 21.27 8.11 17 5 12 5z"/>
              <line x1="3" y1="3" x2="21" y2="21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>
      <form className="login-form" onSubmit={handleSubmit}>
        <label>
          Correo:
          <input
            type="email"
            name="correo"
            value={correo}
            onChange={e => SetCorreo(e.target.value)}
            required
          />
        </label>
        <label>
          Contraseña:
          <div className="password-input-wrap" style={{ position: 'relative' }}>
            <input
              type={revealPwd ? 'text' : 'password'}
              name="password"
              value={contrasena}
              onChange={e => SetContrasena(e.target.value)}
              required
              style={{ boxSizing: 'border-box' }}
            />
          </div>
        </label>
        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
      <p className="register-text">
        ¿No tienes una cuenta?{' '}
        <a href="#" onClick={handleRegisterClick} style={{ color: 'white', textDecoration: 'underline' }}>
          Registrarte
        </a>
      </p>
      <button className="close-btn" onClick={handleClose} style={{ color: 'white' }}>
        ✖
      </button>
    </div>
  </div>
);
};

export default LoginModal;

