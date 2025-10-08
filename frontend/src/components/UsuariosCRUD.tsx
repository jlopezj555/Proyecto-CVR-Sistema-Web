import React from 'react';
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
      try {
        await axios.post(`${API_CONFIG.BASE_URL}/api/usuarios/${item.id_usuario}/convertir-empleado`, {}, {
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

  return (
    <CRUDTable
      title="Usuarios"
      endpoint="usuarios"
      columns={columns}
      createFields={createFields}
      editFields={editFields}
      extraActionsForItem={convertirAccion}
          />
  );
};

export default UsuariosCRUD;



