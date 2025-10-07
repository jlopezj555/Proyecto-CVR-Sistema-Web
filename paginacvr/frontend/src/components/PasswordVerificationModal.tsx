import React, { useEffect, useState } from 'react';
import './PasswordVerificationModal.css';

interface PasswordVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (password: string) => Promise<boolean>;
  title?: string;
  message?: string;
  errorMessage?: string; // mensaje externo a mostrar (del CRUD)
}

const PasswordVerificationModal: React.FC<PasswordVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerify,
  title = "Verificación de Administrador",
  message = "Ingresa tu contraseña para continuar con esta acción",
  errorMessage
}) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revealPwd, setRevealPwd] = useState(false);
  const onDown = () => setRevealPwd(true);
  const onUp = () => setRevealPwd(false);

  // Cuando el CRUD actualiza el mensaje de error, reflejarlo en el modal
  useEffect(() => {
    if (isOpen && errorMessage) {
      setError(errorMessage);
    }
  }, [errorMessage, isOpen]);

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
        setError(errorMessage || 'Contraseña incorrecta');
      }
    } catch (e: any) {
      setError(errorMessage || 'Error al verificar la contraseña');
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
              <div className="password-input-wrap" style={{ position: 'relative' }}>
                <input
                  id="admin-password"
                  type={revealPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña de administrador"
                  required
                  disabled={loading}
                  style={{ paddingRight: 36, boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  className="password-eye"
                  aria-label={revealPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  title={revealPwd ? 'Ocultar' : 'Mostrar'}
                  onMouseDown={onDown}
                  onMouseUp={onUp}
                  onMouseLeave={onUp}
                  onTouchStart={(e) => { e.preventDefault(); onDown(); }}
                  onTouchEnd={onUp}
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
