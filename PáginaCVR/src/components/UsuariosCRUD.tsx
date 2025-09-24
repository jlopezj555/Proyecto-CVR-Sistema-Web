import React from 'react';
import axios from 'axios';
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
      { value: 'empleado', label: 'Empleado' }
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
      { value: 'empleado', label: 'Empleado' }
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
      afterCreate={async (created, submitted) => {
        try {
          if ((submitted?.tipo_usuario === 'empleado') && submitted?.nombre_completo && submitted?.correo && submitted?.contrasena) {
            const token = localStorage.getItem('token');
            const [nombre, ...rest] = String(submitted.nombre_completo).split(' ');
            const apellido = rest.join(' ') || '';
            await axios.post('http://localhost:4000/api/empleados', {
              nombre,
              apellido,
              correo: submitted.correo,
              contrasena: submitted.contrasena,
              activo: true
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
          }
        } catch (e) {
          // Silencioso: el admin verá el empleado al refrescar si fue creado
        }
      }}
    />
  );
};

export default UsuariosCRUD;



