import React from 'react';
import CRUDTable from './CRUDTable';

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
    { key: 'tipo_usuario', label: 'Tipo de usuario', type: 'select' as const, required: true, options: [
      { value: 'cliente', label: 'Cliente' },
      { value: 'empleado', label: 'Empleado' },
      { value: 'administrador', label: 'Administrador' },
    ] },
    { key: 'activo', label: 'Activo', type: 'boolean' as const },
  ];

  const editFields = [
    { key: 'nombre_completo', label: 'Nombre completo', type: 'text' as const, required: true },
    { key: 'correo', label: 'Correo', type: 'email' as const, required: true },
    // No permitir cambiar contraseña desde administración
    // Mostrar tipo de usuario solo lectura (no modificable)
    { key: 'tipo_usuario', label: 'Tipo de usuario', type: 'select' as const, required: true, readonly: true, options: [
      { value: 'cliente', label: 'Cliente' },
      { value: 'empleado', label: 'Empleado' },
      { value: 'administrador', label: 'Administrador' },
    ] },
    { key: 'activo', label: 'Activo', type: 'boolean' as const },
  ];

  return (
    <CRUDTable
      title="Usuarios"
      endpoint="usuarios"
      columns={columns}
      createFields={createFields}
      editFields={editFields}
    />
  );
};

export default UsuariosCRUD;



