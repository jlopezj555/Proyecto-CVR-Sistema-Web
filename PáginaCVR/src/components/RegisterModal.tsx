import React, { useState } from "react";
import axios from "axios";
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
    const usuario = formData.get("usuario") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setDialogMessage("Las contraseñas no coinciden.");
      setShowErrorDialog(true);
      return;
    }

    try {
      const response = await axios.post("http://localhost:4000/api/register", {
        nombre,
        correo,
        usuario,
        password,
      });

      if (response.data.success) {
        setDialogMessage(`¡Registro exitoso! Bienvenido, ${response.data.nombre}`);
        setShowSuccessDialog(true);
        
        // Login automático después del registro
        if (onLoginSuccess && response.data.token) {
          // Guardar datos en localStorage
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('rol', response.data.rol);
          localStorage.setItem('nombre', response.data.nombre);
          localStorage.setItem('tipo', response.data.tipo);
          
          // Llamar callback de login exitoso
          onLoginSuccess({
            nombre: response.data.nombre,
            rol: response.data.rol,
            tipo: response.data.tipo
          });
        }
        
        // Cerrar el modal después de 2 segundos
        setTimeout(() => {
          setShowSuccessDialog(false);
          onClose();
        }, 2000);
      }
    } catch (error: any) {
      if (error.response && error.response.data) {
        setDialogMessage(error.response.data.message);
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
          <button className="register-close-btn" onClick={handleClose}>
            ✖
          </button>
        </div>
      </div>

      {/* Diálogo de éxito */}
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

      {/* Diálogo de error */}
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

