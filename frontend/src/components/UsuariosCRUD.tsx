import React, { useMemo, useState } from 'react';
import axios from 'axios';
import CRUDTable from './CRUDTable';
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
    { key: 'activo', label: 'Activo', type: 'boolean' as const },
  ];

  const editFields = [
    { key: 'nombre_completo', label: 'Nombre completo', type: 'text' as const, required: true },
    { key: 'correo', label: 'Correo', type: 'email' as const, required: true },
    // No permitir cambiar contraseña desde administración
    { key: 'activo', label: 'Activo', type: 'boolean' as const },
  ];

  const convertirAccion = (item: any, refresh: () => void) => {
    const token = localStorage.getItem('token');
    const disabled = item.tipo_usuario === 'empleado';
    const onClick = async () => {
      if (disabled) return;
      const ok = window.confirm('Esta acción requiere autorización. ¿Deseas proceder para convertir a empleado?');
      if (!ok) return;
      try {
        // Abrimos modal de verificación de admin mediante endpoint que ya valida adminContrasena si el backend lo requiere
        const adminPwd = window.prompt('Ingresa tu contraseña de administrador para confirmar:') || '';
        await axios.post(`${API_CONFIG.BASE_URL}/api/usuarios/${item.id_usuario}/convertir-empleado`, { adminContrasena: adminPwd }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        refresh();
      } catch (e) {
        // Ignorar: UI base
      }
    };
    return (
      <button className="crud-btn-edit" onClick={onClick} disabled={disabled} title={disabled ? 'Ya es empleado' : 'Convertir a empleado'}>
        {disabled ? '✅' : '👤→💼'}
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
      extraActionsForItem={convertirAccion}
      filterFunction={filterFunction}
      />
    </>
  );
};

export default UsuariosCRUD;



