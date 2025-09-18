import React, { useState, useEffect } from 'react';
import CRUDTable from './CRUDTable';

const EmpleadosCRUD: React.FC = () => {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  useEffect(() => {
    // Cargar datos de referencia para los selects
    const token = localStorage.getItem('token');
    
    // Cargar empresas
    fetch('http://localhost:4000/api/empresas', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setEmpresas(data.data || []))
      .catch(console.error);

    // Cargar roles
    fetch('http://localhost:4000/api/roles', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setRoles(data.data || []))
      .catch(console.error);
  }, []);

  const columns = [
    { key: 'id_empleado', label: 'ID' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'apellido', label: 'Apellido' },
    { key: 'correo', label: 'Correo' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'rol', label: 'Rol' },
    { key: 'activo', label: 'Activo', type: 'boolean' as const }
  ];

  const createFields = [
    { key: 'nombre', label: 'Nombre', type: 'text' as const, required: true },
    { key: 'apellido', label: 'Apellido', type: 'text' as const, required: true },
    { key: 'correo', label: 'Correo', type: 'email' as const, required: true },
    { key: 'contrasena', label: 'Contraseña', type: 'text' as const, required: true },
    { key: 'tipo', label: 'Tipo de usuario', type: 'select' as const, required: true, options: [
      { value: 'cliente', label: 'Cliente' },
      { value: 'empleado', label: 'Empleado' }
    ] },
    { key: 'rol', label: 'Rol', type: 'select' as const, required: false, options: roles.map(r => ({ value: r.nombre || r.rol || r.id_rol, label: r.nombre || r.rol })) }
  ];

  const editFields = [
    { key: 'nombre', label: 'Nombre', type: 'text' as const, required: true },
    { key: 'apellido', label: 'Apellido', type: 'text' as const, required: true },
    { key: 'correo', label: 'Correo', type: 'email' as const, required: true },
    { key: 'tipo', label: 'Tipo de usuario', type: 'select' as const, required: true, options: [
      { value: 'cliente', label: 'Cliente' },
      { value: 'empleado', label: 'Empleado' }
    ] },
    { key: 'rol', label: 'Rol', type: 'select' as const, required: false, options: roles.map(r => ({ value: r.nombre || r.rol || r.id_rol, label: r.nombre || r.rol })) },
    { key: 'activo', label: 'Activo', type: 'boolean' as const }
  ];

  return (
    <CRUDTable
      title="Empleados"
      endpoint="empleados"
      columns={columns}
      createFields={createFields}
      editFields={editFields}
    />
  );
};

export default EmpleadosCRUD;
