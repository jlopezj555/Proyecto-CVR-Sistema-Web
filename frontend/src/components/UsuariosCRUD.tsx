import React, { useMemo, useState } from 'react';
import axios from 'axios';
import CRUDTable from './CRUDTable';
import PasswordVerificationModal from './PasswordVerificationModal';
import ChangePasswordModal from './ChangePasswordModal';
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
    // No mostrar campo "activo" al crear nuevo usuario
  ];

  const editFields = [
    { key: 'nombre_completo', label: 'Nombre completo', type: 'text' as const, required: true },
    { key: 'correo', label: 'Correo', type: 'email' as const, required: true },
    { key: 'activo', label: 'Activo', type: 'boolean' as const },
  ];

  const [pwOpenForUserId, setPwOpenForUserId] = useState<number | null>(null);
  const [convertRefresh, setConvertRefresh] = useState<(() => void) | null>(null);
  const [pwError, setPwError] = useState<string>('');
  const [changePwdOpenForUserId, setChangePwdOpenForUserId] = useState<number | null>(null);
  // Nota: eliminada la carga inicial de `myUserId`; se verifica en runtime cuando se necesita.

  const convertirAccion = (item: any, refresh: () => void) => {
    // Ocultar para administrador: no se puede convertir a empleado
    const esAdmin = String(item?.tipo_usuario || '').toLowerCase() === 'administrador';
    const actions: React.ReactNode[] = [];
    if (esAdmin) return <>{actions}</>;
    const disabled = item.tipo_usuario === 'empleado';
    const onClick = async () => {
      if (disabled) return;
      setPwError('');
      setPwOpenForUserId(item.id_usuario);
      setConvertRefresh(() => refresh);
    };
    actions.push(
      <button key="convert" className="crud-btn-edit" onClick={onClick} disabled={disabled} title={disabled ? 'Ya es empleado' : 'Convertir a empleado'}>
        {disabled ? '✅' : '👤→💼'}
      </button>
    );
    return <>{actions}</>;
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
      disableDeleteFor={(item) => item?.id_usuario === 1}
      extraActionsForItem={(item, refresh) => (
        <>
          {convertirAccion(item, refresh)}
          {/* Mostrar botón 'Cambiar contraseña' solo para el registro admin (id_usuario === 1) */}
          {item?.id_usuario === 1 && (
            <button key="changePwd" className="crud-btn-edit" onClick={() => setChangePwdOpenForUserId(item.id_usuario)} title="Cambiar contraseña">🔒 Cambiar contraseña</button>
          )}
        </>
      )}
      /* No usamos shouldRequirePassword ni onUpdate para manejo de contraseñas aquí; se hace mediante modal específico */
      filterFunction={filterFunction}
      />

      {/* Modal de verificación para convertir a empleado */}
      {pwOpenForUserId !== null && (
        <PasswordVerificationModal
          isOpen={pwOpenForUserId !== null}
          onClose={() => { setPwOpenForUserId(null); setPwError(''); setConvertRefresh(null); }}
          onVerify={async (pwd: string) => {
            try {
              await axios.post(`${API_CONFIG.BASE_URL}/api/usuarios/${pwOpenForUserId}/convertir-empleado`, { adminContrasena: pwd }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
              });
              setPwOpenForUserId(null);
              setPwError('');
              // Refrescar tabla si se pasó el callback
              convertRefresh && convertRefresh();
              setConvertRefresh(null);
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

      {changePwdOpenForUserId !== null && (
        <ChangePasswordModal
          isOpen={changePwdOpenForUserId !== null}
          onClose={() => setChangePwdOpenForUserId(null)}
          onChangePassword={async (currentPwd: string, newPwd: string) => {
            try {
              // Solo soportado por el backend para el usuario autenticado
              const token = localStorage.getItem('token');
              const my = await axios.get(`${API_CONFIG.BASE_URL}/api/me`, { headers: { Authorization: `Bearer ${token}` } }) as any;
              const myId = my?.data?.data?.id_usuario;
              if (myId !== changePwdOpenForUserId) {
                alert('Solo es posible cambiar la contraseña del usuario autenticado. Por favor inicia sesión como ese usuario o use la funcionalidad del backend.');
                return false;
              }
              await axios.post(`${API_CONFIG.BASE_URL}/api/verify-password`, { contrasena: currentPwd }, { headers: { Authorization: `Bearer ${token}` } });
              await axios.post(`${API_CONFIG.BASE_URL}/api/usuarios/me/cambiar-contrasena`, { contrasena_actual: currentPwd, contrasena_nueva: newPwd }, { headers: { Authorization: `Bearer ${token}` } });
              alert('Contraseña actualizada');
              return true;
            } catch (e: any) {
              alert(e?.response?.data?.message || 'Error cambiando la contraseña');
              return false;
            }
          }}
        />
      )}
    </>
  );
};

export default UsuariosCRUD;



