import React, { useState } from 'react';
import './PasswordVerificationModal.css';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChangePassword: (currentPwd: string, newPwd: string) => Promise<boolean>;
  title?: string;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, onChangePassword, title = 'Cambiar contraseña' }) => {
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const ok = await onChangePassword(currentPwd, newPwd);
      if (ok) {
        setCurrentPwd('');
        setNewPwd('');
        onClose();
      } else {
        setError('Error al cambiar la contraseña');
      }
    } catch (err: any) {
      setError(err?.message || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-modal-overlay">
      <div className="password-modal">
        <div className="password-modal-header">
          <h3>{title}</h3>
          <button className="password-modal-close" onClick={onClose}>✖</button>
        </div>
        <div className="password-modal-body">
          <form onSubmit={handleSubmit} className="password-modal-form">
            <div className="password-input-group">
              <label>Contraseña actual</label>
              <input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} required disabled={loading} />
            </div>
            <div className="password-input-group">
              <label>Nueva contraseña</label>
              <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required disabled={loading} />
            </div>
            {error && <div className="password-error">{error}</div>}
            <div className="password-modal-actions">
              <button type="button" onClick={onClose} className="password-btn-cancel" disabled={loading}>Cancelar</button>
              <button type="submit" className="password-btn-verify" disabled={loading || !currentPwd || !newPwd}>{loading ? 'Cambiando...' : 'Cambiar contraseña'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
