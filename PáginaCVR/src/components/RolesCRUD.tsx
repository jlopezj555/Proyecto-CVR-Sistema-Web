import React from 'react';
import CRUDTable from './CRUDTable';

const RolesCRUD: React.FC = () => {
  const columns = [
    { key: 'id_rol', label: 'ID' },
    { key: 'nombre_rol', label: 'Nombre del Rol' },
    { key: 'descripcion', label: 'Descripción' }
  ];

  const createFields = [
    { key: 'nombre_rol', label: 'Nombre del Rol', type: 'text' as const, required: true },
    { key: 'descripcion', label: 'Descripción', type: 'text' as const, required: false }
  ];

  const editFields = [
    { key: 'nombre_rol', label: 'Nombre del Rol', type: 'text' as const, required: true },
    { key: 'descripcion', label: 'Descripción', type: 'text' as const, required: false }
  ];

  return (
    <CRUDTable
      title="Roles"
      endpoint="roles"
      columns={columns}
      createFields={createFields}
      editFields={editFields}
    />
  );
};

export default RolesCRUD;
