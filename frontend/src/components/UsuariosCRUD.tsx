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
    // No mostrar campo "activo" al crear nuevo usuario
  ];

  const editFields = [
    { key: 'nombre_completo', label: 'Nombre completo', type: 'text' as const, required: true },
    { key: 'correo', label: 'Correo', type: 'email' as const, required: true },
    { key: 'activo', label: 'Activo', type: 'boolean' as const },
  ];

  const [pwOpenForUserId, setPwOpenForUserId] = useState<number | null>(null);
  const [pwChangeOpen, setPwChangeOpen] = useState<boolean>(false);
  const [pwError, setPwError] = useState<string>('');
  const [myUserId, setMyUserId] = useState<number | null>(null);

  // Obtener mi id de usuario para permitir cambiar solo mi propia contraseña (si soy admin)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    axios.get(`${API_CONFIG.BASE_URL}/api/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setMyUserId(res?.data?.data?.id_usuario ?? null))
      .catch(() => setMyUserId(null));
  }, []);

  const convertirAccion = (item: any, refresh: () => void) => {
    const token = localStorage.getItem('token');
    // Ocultar para administrador: no se puede convertir a empleado
    const esAdmin = String(item?.tipo_usuario || '').toLowerCase() === 'administrador';
    const showChangePwd = esAdmin && myUserId === item.id_usuario;
    const actions: React.ReactNode[] = [];
    if (showChangePwd) {
      actions.push(
        <button
          key="change"
          className="crud-btn-edit"
          title="Cambiar mi contraseña"
          onClick={() => { setPwError(''); setPwChangeOpen(true); }}
        >
          🔒
        </button>
      );
    }
    if (esAdmin) return <>{actions}</>;
    const disabled = item.tipo_usuario === 'empleado';
    const onClick = async () => {
      if (disabled) return;
      setPwError('');
      setPwOpenForUserId(item.id_usuario);
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
      extraActionsForItem={convertirAccion}
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
              // Refrescar tabla sin recargar toda la página
              refresh();
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

      {/* Modal para validar contraseña actual y luego definir nueva (solo admin propio) */}
      {pwChangeOpen && (
        <PasswordVerificationModal
          isOpen={pwChangeOpen}
          onClose={() => { setPwChangeOpen(false); setPwError(''); }}
          onVerify={async (pwdActual: string) => {
            try {
              // Validar contraseña actual del usuario
              await axios.post(`${API_CONFIG.BASE_URL}/api/verify-password`, { contrasena: pwdActual }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
              });
              const nueva = window.prompt('Nueva contraseña:') || '';
              if (!nueva || nueva.trim().length < 6) {
                setPwError('La nueva contraseña debe tener al menos 6 caracteres');
                return false;
              }
              await axios.post(`${API_CONFIG.BASE_URL}/api/usuarios/me/cambiar-contrasena`, {
                contrasena_actual: pwdActual,
                contrasena_nueva: nueva
              }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
              });
              setPwChangeOpen(false);
              setPwError('');
              return true;
            } catch (e: any) {
              const msg = e?.response?.data?.message || 'Error cambiando contraseña';
              setPwError(msg);
              return false;
            }
          }}
          title="Cambiar mi contraseña"
          message="Confirma tu contraseña actual para continuar."
          errorMessage={pwError}
        />
      )}
    </>
  );
};

export default UsuariosCRUD;



