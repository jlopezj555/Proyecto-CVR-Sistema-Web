import React from 'react';
import CRUDTable from './CRUDTable';

const EmpleadosCRUD: React.FC = () => {
  

  const columns = [
    { key: 'id_empleado', label: 'ID' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'apellido', label: 'Apellido' },
    { key: 'correo', label: 'Correo' },
    { key: 'activo', label: 'Activo', type: 'boolean' as const }
  ];

  const createFields = [
    { key: 'nombre', label: 'Nombre', type: 'text' as const, required: true },
    { key: 'apellido', label: 'Apellido', type: 'text' as const, required: true },
    { key: 'correo', label: 'Correo', type: 'email' as const, required: true },
    { key: 'contrasena', label: 'Contraseña', type: 'text' as const, required: true },
    { key: 'activo', label: 'Activo', type: 'boolean' as const }
  ];

  const editFields = [
    { key: 'nombre', label: 'Nombre', type: 'text' as const, required: true },
    { key: 'apellido', label: 'Apellido', type: 'text' as const, required: true },
    { key: 'correo', label: 'Correo', type: 'email' as const, required: true },
    { key: 'activo', label: 'Activo', type: 'boolean' as const }
  ];

  return (
    <CRUDTable
      title="Empleados"
      endpoint="empleados"
      columns={columns}
      createFields={createFields}
      editFields={editFields}
      allowEdit={false}
    />
  );
};

export default EmpleadosCRUD;
