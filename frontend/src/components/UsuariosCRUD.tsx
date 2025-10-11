import React, { useMemo, useState } from 'react';
import axios from 'axios';
import CRUDTable from './CRUDTable';
import PasswordVerificationModal from './PasswordVerificationModal';
import API_CONFIG from '../config/api'

const UsuariosCRUD: React.FC = () => {
  const columns = [
    { key: 'id_usuario', label: 'ID' },
    { key: 'nombre_completo', label: 'Nombre completo' },
    { key: 'correo', label: 'Correo' },
    { key: 'tipo_usuario', label: 'Tipo' },
    { key: 'activo', label: 'Activo', type: 'boolean' as const },
  ];

  const createFields = [
    { key: 'nombre_completo', label: 'Nombre completo', type: 'text' as const, required: true },
    { key: 'correo', label: 'Correo', type: 'email' as const, required: true },
    { key: 'contrasena', label: 'Contraseña', type: 'text' as const, required: true },
    // Ocultar estado al crear (no incluir el campo aquí)
  ];

  const editFields = [
    { key: 'nombre_completo', label: 'Nombre completo', type: 'text' as const, required: true },
    { key: 'correo', label: 'Correo', type: 'email' as const, required: true },
    // No permitir cambiar contraseña desde administración para otros usuarios
    { key: 'activo', label: 'Activo', type: 'boolean' as const },
  ];

  const [pwOpenForUserId, setPwOpenForUserId] = useState<number | null>(null);
  const [pwError, setPwError] = useState<string>('');
  const [changePwdUserId, setChangePwdUserId] = useState<number | null>(null);
  const [newPwd, setNewPwd] = useState<string>('');
  const [newPwd2, setNewPwd2] = useState<string>('');
  const [changePwdError, setChangePwdError] = useState<string>('');

  const token = localStorage.getItem('token') || '';
  let myUserId: number | null = null;
  let myTipo: string = String(localStorage.getItem('tipo') || '');
  try {
    const payload = JSON.parse(atob((token.split('.')[1] || '').replace(/-/g, '+').replace(/_/g, '/')));
    myUserId = Number(payload?.id || 0) || null;
  } catch {}

  const convertirAccion = (item: any, refresh: () => void) => {
    const disabled = item.tipo_usuario === 'empleado';
    const onClick = async () => {
      if (disabled) return;
      setPwError('');
      setPwOpenForUserId(item.id_usuario);
    };
    const isAdmin = String(item?.tipo_usuario || '').toLowerCase() === 'administrador';
    const disabledConvert = disabled || isAdmin;
    return (
      <button className="crud-btn-edit" onClick={onClick} disabled={disabledConvert} title={disabledConvert ? 'No disponible' : 'Convertir a empleado'}>
        {disabledConvert ? '✅' : '👤→💼'}
      </button>
    );
  };

  const cambiarContrasenaAccion = (item: any) => {
    const isMyAdmin = (myUserId && Number(item?.id_usuario) === Number(myUserId) && String(item?.tipo_usuario || '').toLowerCase() === 'administrador');
    if (!isMyAdmin) return null;
    return (
      <button
        className="crud-btn-edit"
        onClick={() => { setChangePwdUserId(item.id_usuario); setNewPwd(''); setNewPwd2(''); setChangePwdError(''); }}
        title="Cambiar contraseña"
      >
        🔒
      </button>
    );
  };

  // Filtro de tipo_usuario
  const [tipoFiltro, setTipoFiltro] = useState<string>('');
  const filterFunction = useMemo(() => {
    if (!tipoFiltro) return undefined;
    return (row: any) => String(row?.tipo_usuario || '').toLowerCase() === tipoFiltro.toLowerCase();
  }, [tipoFiltro]);

  return (
    <>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <label style={{ fontWeight: 600, color: '#000' }}>Tipo de usuario:</label>
        <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '2px solid #e9ecef' }}>
          <option value="">Todos</option>
          <option value="administrador">Administrador</option>
          <option value="empleado">Empleado</option>
          <option value="cliente">Cliente</option>
        </select>
      </div>
      <CRUDTable
      title="Usuarios"
      endpoint="usuarios"
      columns={columns}
      createFields={createFields}
      editFields={editFields}
      extraActionsForItem={(item, refresh) => (
        <>
          {convertirAccion(item, refresh)}
          {cambiarContrasenaAccion(item)}
        </>
      )}
      filterFunction={filterFunction}
      />

      {/* Modal de verificación para convertir a empleado */}
      {pwOpenForUserId !== null && (
        <PasswordVerificationModal
          isOpen={pwOpenForUserId !== null}
          onClose={() => { setPwOpenForUserId(null); setPwError(''); }}
          onVerify={async (pwd: string) => {
            try {
              await axios.post(`${API_CONFIG.BASE_URL}/api/usuarios/${pwOpenForUserId}/convertir-empleado`, { adminContrasena: pwd }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
              });
              setPwOpenForUserId(null);
              setPwError('');
              // Forzar refresh visual: simple estrategia es recargar la página de tabla
              window.setTimeout(() => window.location.reload(), 250);
              return true;
            } catch (e: any) {
              const msg = e?.response?.data?.message || 'Error de autorización';
              setPwError(msg);
              return false;
            }
          }}
          title="Confirmar conversión a empleado"
          message="Ingresa tu contraseña de administrador para confirmar."
          errorMessage={pwError}
        />
      )}

      {/* Modal para cambiar contraseña (solo mi usuario admin) */}
      {changePwdUserId !== null && (
        <div className="crud-modal-overlay open">
          <div className="crud-modal" style={{ maxWidth: 520 }}>
            <div className="crud-modal-header">
              <h3>Cambiar contraseña</h3>
              <button className="crud-modal-close" onClick={() => { setChangePwdUserId(null); setChangePwdError(''); }}>✖</button>
            </div>
            <div className="crud-modal-body">
              <div className="crud-form">
                <div className="crud-form-group">
                  <label>Nueva contraseña:</label>
                  <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Ingresa nueva contraseña" />
                </div>
                <div className="crud-form-group">
                  <label>Confirmar contraseña:</label>
                  <input type="password" value={newPwd2} onChange={(e) => setNewPwd2(e.target.value)} placeholder="Repite la nueva contraseña" />
                </div>
                {changePwdError && <div className="crud-error">{changePwdError}</div>}
                <div className="crud-modal-actions">
                  <button className="crud-btn-cancel" onClick={() => { setChangePwdUserId(null); setChangePwdError(''); }}>Cancelar</button>
                  <button
                    className="crud-btn-save"
                    onClick={() => {
                      if (!newPwd || newPwd !== newPwd2) {
                        setChangePwdError('Las contraseñas no coinciden');
                        return;
                      }
                      setChangePwdError('');
                      // Abrir verificación de contraseña actual (admin)
                      setPwError('');
                      setPwOpenForUserId(-1); // usar -1 para distinguir acción de cambio de contraseña
                    }}
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reutilizar PasswordVerificationModal para confirmar cambio de contraseña */}
      {pwOpenForUserId === -1 && changePwdUserId !== null && (
        <PasswordVerificationModal
          isOpen={pwOpenForUserId === -1}
          onClose={() => { setPwOpenForUserId(null); setChangePwdError(''); }}
          onVerify={async (pwd: string) => {
            try {
              await axios.put(`${API_CONFIG.BASE_URL}/api/usuarios/${changePwdUserId}`, { contrasena: newPwd, adminContrasena: pwd }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
              });
              setPwOpenForUserId(null);
              setChangePwdUserId(null);
              setNewPwd(''); setNewPwd2('');
              return true;
            } catch (e: any) {
              const msg = e?.response?.data?.message || 'Error al actualizar contraseña';
              setChangePwdError(msg);
              return false;
            }
          }}
          title="Verificación de Administrador"
          message="Ingresa tu contraseña actual para confirmar el cambio"
          errorMessage={changePwdError}
        />
      )}
    </>
  );
};

export default UsuariosCRUD;



