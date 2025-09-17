import React, { useState } from 'react';
import './PasswordVerificationModal.css';

interface PasswordVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (password: string) => Promise<boolean>;
  title?: string;
  message?: string;
}

const PasswordVerificationModal: React.FC<PasswordVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerify,
  title = "Verificación de Administrador",
  message = "Ingresa tu contraseña para continuar con esta acción"
}) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const isValid = await onVerify(password);
      if (isValid) {
        setPassword('');
        onClose();
      } else {
        setError('Contraseña incorrecta');
      }
    } catch (error) {
      setError('Error al verificar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <div className="password-modal-overlay">
      <div className="password-modal">
        <div className="password-modal-header">
          <h3>{title}</h3>
          <button className="password-modal-close" onClick={handleClose}>
            ✖
          </button>
        </div>
        
        <div className="password-modal-body">
          <p className="password-modal-message">{message}</p>
          
          <form onSubmit={handleSubmit} className="password-modal-form">
            <div className="password-input-group">
              <label htmlFor="admin-password">Contraseña:</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña de administrador"
                required
                disabled={loading}
              />
            </div>
            
            {error && (
              <div className="password-error">
                {error}
              </div>
            )}
            
            <div className="password-modal-actions">
              <button
                type="button"
                onClick={handleClose}
                className="password-btn-cancel"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="password-btn-verify"
                disabled={loading || !password.trim()}
              >
                {loading ? 'Verificando...' : 'Verificar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordVerificationModal;
