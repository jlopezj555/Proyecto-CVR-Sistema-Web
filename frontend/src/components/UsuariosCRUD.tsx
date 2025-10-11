import React, { useMemo, useState, useEffect } from 'react';
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
    // Si el usuario es administrador y es su propio registro, podrá cambiar su contraseña desde aquí
    { key: 'contrasena_actual', label: 'Contraseña actual', type: 'text' as const, required: false },
    { key: 'contrasena', label: 'Nueva contraseña', type: 'text' as const, required: false },
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
    // Ya no mostramos botón separado; el cambio de contraseña se gestiona en el modal de edición
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
      extraActionsForItem={(item, refresh) => (
        <>
          {convertirAccion(item, refresh)}
        </>
      )}
      shouldRequirePassword={(action, item) => {
        // Solo omitir modal si es actualización de su propia contraseña (admin propio) y hay campos de contraseña
        if (action === 'update' && item && myUserId === item.id_usuario && String(item.tipo_usuario).toLowerCase() === 'administrador') {
          const hasPwdFields = !!(formData?.contrasena || formData?.contrasena_actual);
          return !hasPwdFields; // si hay campos de contraseña, NO requerir modal; de lo contrario, sí
        }
        return true;
      }}
      onUpdate={async (id, formData, token) => {
        // Si es el propio admin y proporciona contrasena_actual + contrasena, usar flujo dedicado
        const esPropioAdmin = myUserId === formData.id_usuario || myUserId === id;
        if (esPropioAdmin && String(formData.tipo_usuario || '').toLowerCase() === 'administrador') {
          const nueva = String(formData.contrasena || '').trim();
          const actual = String(formData.contrasena_actual || '').trim();
          if (nueva || actual) {
            if (!actual) {
              alert('Debes ingresar tu contraseña actual');
              return true; // handled (no continuar con default)
            }
            if (!nueva || nueva.length < 6) {
              alert('La nueva contraseña debe tener al menos 6 caracteres');
              return true; // handled
            }
            // Validar actual y cambiar
            await axios.post(`${API_CONFIG.BASE_URL}/api/verify-password`, { contrasena: actual }, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            await axios.post(`${API_CONFIG.BASE_URL}/api/usuarios/me/cambiar-contrasena`, {
              contrasena_actual: actual,
              contrasena_nueva: nueva
            }, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            alert('Contraseña actualizada');
            return true; // handled
          }
        }
        return false; // no handled, usar flujo por defecto
      }}
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
    </>
  );
};

export default UsuariosCRUD;



