import React, { useState } from "react";
import axios from "axios";
import API_CONFIG from '../config/api';
import "./RegisterModal.css";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (userData: any) => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [revealPwd, setRevealPwd] = useState(false);
  const [revealPwd2, setRevealPwd2] = useState(false);
  const onDown1 = () => setRevealPwd(true);
  const onUp1 = () => setRevealPwd(false);
  const onDown2 = () => setRevealPwd2(true);
  const onUp2 = () => setRevealPwd2(false);

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();

    const formData = new FormData(event.target as HTMLFormElement);
    const nombre = formData.get("nombre") as string;
    const correo = formData.get("correo") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setDialogMessage("Las contraseñas no coinciden.");
      setShowErrorDialog(true);
      return;
    }

    try {
  const response = await axios.post<any>(`${API_CONFIG.BASE_URL}/api/register`, {
        nombre,
        correo,
        password,
      });

      if (response.data && response.data.success) {
        setDialogMessage(`Bienvenido ${response.data.nombre}`);
        setShowSuccessDialog(true);
        
        // Guardar sesión en cliente pero forzar rol/tipo como usuario normal (cliente)
        // para evitar que un registro público se convierta automáticamente en empleado.
        if (onLoginSuccess && response.data.token) {
          localStorage.setItem('token', response.data.token);
          // Forzamos rol/tipo cliente para nuevos registros desde UI
          localStorage.setItem('rol', 'Cliente');
          localStorage.setItem('nombre', response.data.nombre);
          localStorage.setItem('tipo', 'cliente');
          localStorage.setItem('foto', response.data.foto || '');

          onLoginSuccess({
            nombre: response.data.nombre,
            rol: 'Cliente',
            tipo: 'cliente',
            foto: response.data.foto || ''
          });
        }
        
        setTimeout(() => {
          setShowSuccessDialog(false);
          onClose();
        }, 2000);
      }
    } catch (error: any) {
      const err = error as any
      if (err && err.response && err.response.data) {
        setDialogMessage(err.response.data.message || 'Error en el registro');
      } else {
        setDialogMessage("Hubo un error al registrar el usuario.");
      }
      setShowErrorDialog(true);
    }
  };

  const closeSuccessDialog = () => {
    setShowSuccessDialog(false);
    onClose();
  };

  const closeErrorDialog = () => {
    setShowErrorDialog(false);
  };

  return (
    <>
      <div className={`register-overlay ${isClosing ? "closing" : ""}`}>
        <div className={`register-content ${isClosing ? "closing" : ""}`}>
          <h2>Crear Cuenta</h2>
          <form className="register-form" onSubmit={handleRegister}>
            <label>
              Nombre completo:
              <input type="text" name="nombre" required />
            </label>

            <label>
              Correo electrónico:
              <input type="email" name="correo" required />
            </label>

            <label>
              Contraseña:
              <div className="password-input-wrap" style={{ position: 'relative' }}>
                <input type={revealPwd ? 'text' : 'password'} name="password" required style={{ paddingRight: 36, boxSizing: 'border-box' }} />
                <button
                  type="button"
                  className="password-eye"
                  aria-label={revealPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  title={revealPwd ? 'Ocultar' : 'Mostrar'}
                  onMouseDown={onDown1}
                  onMouseUp={onUp1}
                  onMouseLeave={onUp1}
                  onTouchStart={(e) => { e.preventDefault(); onDown1(); }}
                  onTouchEnd={onUp1}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', opacity: 0.6, cursor: 'pointer', fontSize: 16, color: '#000' }}
                >
                  {revealPwd ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7z"/>
                      <circle cx="12" cy="12" r="3.5" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="currentColor" d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7 1.86 0 3.62-.43 5.21-1.2l-2.1-2.1A8.76 8.76 0 0112 17c-2.77 0-5-2.23-5-5 0-.88.23-1.71.63-2.43L6.2 8.14C7.94 6.96 9.91 6.2 12 6.2c4.98 0 9.27 2.93 11.5 7.06-.55 1.02-1.24 1.98-2.05 2.84l1.12 1.12C23 15.61 24 13.87 24 12 21.27 8.11 17 5 12 5z"/>
                      <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </label>

            <label>
              Confirmar contraseña:
              <div className="password-input-wrap" style={{ position: 'relative' }}>
                <input type={revealPwd2 ? 'text' : 'password'} name="confirmPassword" required style={{ paddingRight: 36, boxSizing: 'border-box' }} />
                <button
                  type="button"
                  className="password-eye"
                  aria-label={revealPwd2 ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  title={revealPwd2 ? 'Ocultar' : 'Mostrar'}
                  onMouseDown={onDown2}
                  onMouseUp={onUp2}
                  onMouseLeave={onUp2}
                  onTouchStart={(e) => { e.preventDefault(); onDown2(); }}
                  onTouchEnd={onUp2}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', opacity: 0.6, cursor: 'pointer', fontSize: 16, color: '#000' }}
                >
                  {revealPwd2 ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7z"/>
                      <circle cx="12" cy="12" r="3.5" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="currentColor" d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7 1.86 0 3.62-.43 5.21-1.2l-2.1-2.1A8.76 8.76 0 0112 17c-2.77 0-5-2.23-5-5 0-.88.23-1.71.63-2.43L6.2 8.14C7.94 6.96 9.91 6.2 12 6.2c4.98 0 9.27 2.93 11.5 7.06-.55 1.02-1.24 1.98-2.05 2.84l1.12 1.12C23 15.61 24 13.87 24 12 21.27 8.11 17 5 12 5z"/>
                      <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </label>

            <button type="submit" className="register-btn">
              Registrarse
            </button>
          </form>
          <button className="register-close-btn" onClick={handleClose}>
            ✖
          </button>
        </div>
      </div>

      {showSuccessDialog && (
        <div className="register-dialog-overlay">
          <div className="register-dialog success-dialog">
            <div className="dialog-icon success-icon">✓</div>
            <div className="dialog-message">{dialogMessage}</div>
            <button className="dialog-close-btn" onClick={closeSuccessDialog}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {showErrorDialog && (
        <div className="register-dialog-overlay">
          <div className="register-dialog error-dialog">
            <div className="dialog-icon error-icon">✗</div>
            <div className="dialog-message">{dialogMessage}</div>
            <button className="dialog-close-btn" onClick={closeErrorDialog}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default RegisterModal;

