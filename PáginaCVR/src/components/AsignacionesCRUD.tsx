import React, { useState, useEffect } from 'react';
import CRUDTable from './CRUDTable';

const AsignacionesCRUD: React.FC = () => {
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Cargar empleados
    fetch('http://localhost:4000/api/empleados', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setEmpleados(data.data || []))
      .catch(console.error);

    // Cargar roles
    fetch('http://localhost:4000/api/roles', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setRoles(data.data || []))
      .catch(console.error);

    // Cargar empresas
    fetch('http://localhost:4000/api/empresas', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setEmpresas(data.data || []))
      .catch(console.error);
  }, []);

  const columns = [
    { key: 'id_asignacion', label: 'ID' },
    { key: 'nombre', label: 'Empleado' },
    { key: 'apellido', label: 'Apellido' },
    { key: 'correo', label: 'Correo' },
    { key: 'nombre_rol', label: 'Rol' },
    { key: 'nombre_empresa', label: 'Empresa' },
    { key: 'estado', label: 'Estado' },
    { key: 'fecha_asignacion', label: 'Fecha Asignación' }
  ];

  const createFields = [
    { 
      key: 'id_empleado', 
      label: 'Empleado', 
      type: 'select' as const, 
      required: true,
      options: empleados.map(emp => ({
        value: emp.id_empleado,
        label: `${emp.nombre} ${emp.apellido}`
      }))
    },
    { 
      key: 'id_rol', 
      label: 'Rol', 
      type: 'select' as const, 
      required: true,
      options: roles.map(rol => ({
        value: rol.id_rol,
        label: rol.nombre_rol
      }))
    },
    { 
      key: 'id_empresa', 
      label: 'Empresa', 
      type: 'select' as const, 
      required: true,
      options: empresas.map(empresa => ({
        value: empresa.id_empresa,
        label: empresa.nombre_empresa
      }))
    }
  ];

  const editFields = [
    { 
      key: 'estado', 
      label: 'Estado', 
      type: 'select' as const, 
      required: true,
      options: [
        { value: 'Activo', label: 'Activo' },
        { value: 'Inactivo', label: 'Inactivo' }
      ]
    }
  ];

  return (
    <CRUDTable
      title="Asignaciones de Roles y Empresas"
      endpoint="asignaciones"
      columns={columns}
      createFields={createFields}
      editFields={editFields}
    />
  );
};

export default AsignacionesCRUD;
