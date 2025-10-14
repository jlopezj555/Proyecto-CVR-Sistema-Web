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
  // Estado para eliminar usuario con verificación de contraseña
  const [pwDeleteForUserId, setPwDeleteForUserId] = useState<number | null>(null);
  const [deleteRefresh, setDeleteRefresh] = useState<(() => void) | null>(null);
  const [pwDeleteError, setPwDeleteError] = useState<string>('');
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

  // Nueva acción: eliminar usuario junto con sus asignaciones
  const eliminarAccion = (item: any, refresh: () => void) => {
    const disabled = item?.id_usuario === 1; // proteger superadmin
    const onClick = async () => {
      if (disabled) return;
      console.log('eliminarAccion clicked for user', item?.id_usuario, item?.nombre_completo);
      if (!confirm(`¿Eliminar al usuario ${item.nombre_completo}? Esto también eliminará sus asignaciones.`)) return;
      // Abrir modal de verificación de contraseña antes de proceder
      setPwDeleteError('');
      setPwDeleteForUserId(item.id_usuario);
      setDeleteRefresh(() => refresh);
    };

    return (
      <button key="deleteWithAsign" className="crud-btn-delete" onClick={onClick} disabled={disabled} title={disabled ? 'No se puede eliminar este usuario' : 'Eliminar usuario y sus asignaciones'}>🗑️</button>
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
  // Ocultamos el botón de eliminar por defecto para usar la acción personalizada
  hideDeleteButton={true}
      disableDeleteFor={(item) => item?.id_usuario === 1}
      extraActionsForItem={(item, refresh) => (
        <>
          {convertirAccion(item, refresh)}
          {eliminarAccion(item, refresh)}
          {/* Mostrar botón 'Cambiar contraseña' para todos; la lógica en el modal validará si el admin puede cambiar la contraseña de otro */}
          <button key="changePwd" className="crud-btn-edit" onClick={() => setChangePwdOpenForUserId(item.id_usuario)} title="Cambiar contraseña">🔒 Cambiar contraseña</button>
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

        {/* Modal de verificación para eliminar usuario */}
        {pwDeleteForUserId !== null && (
          <PasswordVerificationModal
            isOpen={pwDeleteForUserId !== null}
            onClose={() => { setPwDeleteForUserId(null); setPwDeleteError(''); setDeleteRefresh(null); }}
            onVerify={async (pwd: string) => {
              try {
                const token = localStorage.getItem('token');
                const userId = pwDeleteForUserId as number;

                // Intentar eliminar asignaciones por endpoint específico
                try {
                  await axios.delete(`${API_CONFIG.BASE_URL}/api/usuarios/${userId}/asignaciones`, { headers: { Authorization: `Bearer ${token}` } });
                } catch (e) {
                  // Fallback: intentar borrar asignaciones buscando por usuario
                  try {
                    const res = await axios.get(`${API_CONFIG.BASE_URL}/api/asignaciones?usuario=${userId}`, { headers: { Authorization: `Bearer ${token}` } });
                    const asigns = (res as any)?.data?.data || [];
                    for (const a of asigns) {
                      await axios.delete(`${API_CONFIG.BASE_URL}/api/asignaciones/${a.id_asignacion}`, { headers: { Authorization: `Bearer ${token}` } });
                    }
                  } catch (e2) {
                    console.warn('No se pudo eliminar asignaciones automáticamente', e2);
                  }
                }

                // Ahora eliminar el usuario — enviar la contraseña en el body para que el middleware la valide
                await axios.request({
                  method: 'delete',
                  url: `${API_CONFIG.BASE_URL}/api/usuarios/${userId}`,
                  headers: { Authorization: `Bearer ${token}` },
                  data: { adminContrasena: pwd }
                });

                alert('Usuario y (posiblemente) sus asignaciones eliminadas');
                // refrescar tabla
                deleteRefresh && deleteRefresh();
                setPwDeleteForUserId(null);
                setDeleteRefresh(null);
                return true;
              } catch (err: any) {
                const msg = err?.response?.data?.message || 'Error al eliminar usuario';
                setPwDeleteError(msg);
                return false;
              }
            }}
            title="Confirmar eliminación"
            message="Ingresa tu contraseña de administrador para confirmar la eliminación de este usuario."
            errorMessage={pwDeleteError}
          />
        )}

      {changePwdOpenForUserId !== null && (
        <ChangePasswordModal
          isOpen={changePwdOpenForUserId !== null}
          onClose={() => setChangePwdOpenForUserId(null)}
          onChangePassword={async (currentPwd: string, newPwd: string) => {
            try {
              const token = localStorage.getItem('token');
              // Consultar perfil para saber si soy admin
              const myRes = await axios.get(`${API_CONFIG.BASE_URL}/api/me`, { headers: { Authorization: `Bearer ${token}` } });
              const my = (myRes as any)?.data as any;
              const myId = my?.data?.id_usuario;
              const myTipo = String(my?.data?.tipo_usuario || '').toLowerCase();

              // Si soy administrador y estoy cambiando la contraseña de otro usuario, usar endpoint admin
              if (myTipo === 'administrador' && myId !== changePwdOpenForUserId) {
                // Endpoint esperado: POST /api/usuarios/:id/cambiar-contrasena-admin (o similar). Probaremos /api/usuarios/:id/cambiar-contrasena
                try {
                  await axios.post(`${API_CONFIG.BASE_URL}/api/usuarios/${changePwdOpenForUserId}/cambiar-contrasena`, { contrasena_nueva: newPwd }, { headers: { Authorization: `Bearer ${token}` } });
                  alert('Contraseña actualizada por administrador');
                  return true;
                } catch (eAdmin: any) {
                  // Si backend no soporta endpoint, informar
                  alert(eAdmin?.response?.data?.message || 'El backend no permite cambiar contraseña de otro usuario vía admin.');
                  return false;
                }
              }

              // Si no soy admin o estoy cambiando mi propia contraseña, usar flujo existente que verifica contraseña actual
              if (myId !== changePwdOpenForUserId) {
                alert('Solo es posible cambiar la contraseña del usuario autenticado si no eres administrador. Inicia sesión como ese usuario o utiliza un administrador.');
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



