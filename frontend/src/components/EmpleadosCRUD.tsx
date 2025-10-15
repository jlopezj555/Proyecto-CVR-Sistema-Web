import React, { useState, useEffect } from 'react';
import CRUDTable from './CRUDTable';
import type { Column } from './CRUDTable';
import API_CONFIG from '../config/api'

const EmpleadosCRUD: React.FC = () => {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  useEffect(() => {
    // Cargar datos de referencia para los selects
    const token = localStorage.getItem('token');
    
    // Cargar empresas
    fetch(`${API_CONFIG.BASE_URL}/api/empresas`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const rows = data.data || [];
        const sorted = rows.slice().sort((a: any, b: any) => (String(a.nombre_empresa || '')).localeCompare(String(b.nombre_empresa || '')));
        setEmpresas(sorted);
      })
      .catch(console.error);

    // Cargar roles
    fetch(`${API_CONFIG.BASE_URL}/api/roles`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setRoles(data.data || []))
      .catch(console.error);
  }, []);

  const columns: Column[] = [
    { key: 'id_empleado', label: 'ID' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'apellido', label: 'Apellido' },
    { key: 'correo', label: 'Correo' },
    { key: 'activo', label: 'Activo', type: 'boolean' as const }
  ];

  const createFields: Column[] = [
    { key: 'nombre', label: 'Nombre', type: 'text' as const, required: true },
    { key: 'apellido', label: 'Apellido', type: 'text' as const, required: true },
    { key: 'correo', label: 'Correo', type: 'email' as const, required: true },
    { key: 'contrasena', label: 'Contraseña', type: 'text' as const, required: true },
    { key: 'activo', label: 'Activo', type: 'boolean' as const }
  ];

  // Añadimos selects para usar las variables empresas y roles y evitar "noUnusedLocals"
  createFields.unshift(
    { 
      key: 'id_empresa',
      label: 'Empresa',
      type: 'select' as const,
      required: true,
      options: empresas.map(e => ({ value: e.id_empresa, label: e.nombre_empresa }))
    },
    {
      key: 'id_rol',
      label: 'Rol',
      type: 'select' as const,
      required: true,
      options: roles.map(r => ({ value: r.id_rol, label: r.nombre_rol }))
    }
  );

  const editFields: Column[] = [
    { key: 'nombre', label: 'Nombre', type: 'text' as const, required: true },
    { key: 'apellido', label: 'Apellido', type: 'text' as const, required: true },
    { key: 'correo', label: 'Correo', type: 'email' as const, required: true },
    { key: 'activo', label: 'Activo', type: 'boolean' as const }
  ];

  // Añadimos también el select de rol/empresa en edición
  editFields.unshift(
    { 
      key: 'id_empresa',
      label: 'Empresa',
      type: 'select' as const,
      required: true,
      options: empresas.map(e => ({ value: e.id_empresa, label: e.nombre_empresa }))
    },
    {
      key: 'id_rol',
      label: 'Rol',
      type: 'select' as const,
      required: true,
      options: roles.map(r => ({ value: r.id_rol, label: r.nombre_rol }))
    }
  );

  return (
    <CRUDTable
      title="Empleados"
      endpoint="empleados"
      columns={columns}
      createFields={createFields}
      editFields={editFields}
      disableEdit={true}
    />
  );
};

export default EmpleadosCRUD;
