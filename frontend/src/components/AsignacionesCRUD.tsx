import React, { useState, useEffect } from 'react';
import CRUDTable from './CRUDTable';
import API_CONFIG from '../config/api';

const AsignacionesCRUD: React.FC = () => {
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);

  const [empresaFiltro, setEmpresaFiltro] = useState<string>('');
  // Eliminar filtros de mes y año (solo empresa)

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Cargar empleados
    fetch(`${API_CONFIG.BASE_URL}/api/empleados`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setEmpleados(data.data || []))
      .catch(console.error);

  // Cargar roles
    fetch(`${API_CONFIG.BASE_URL}/api/roles`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setRoles(data.data || []))
      .catch(console.error);

    // Cargar empresas
    fetch(`${API_CONFIG.BASE_URL}/api/empresas`, {
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

  // meses eliminados

  const queryParams: Record<string, any> = {};
  if (empresaFiltro) queryParams.empresa = empresaFiltro;
  // quitar month/year del query

  return (
    <div>
      {/* Filtros */}
      <div style={{
        background: 'white',
        border: '1px solid #e9ecef',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 12
      }}>
        <div>
          <label style={{ fontWeight: 600, color: '#000' }}>Empresa</label>
          <select value={empresaFiltro} onChange={(e) => setEmpresaFiltro(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid #e9ecef', backgroundColor: 'white', color: 'black' }}>
            <option value="">Todas</option>
            {empresas.map(emp => (
              <option key={emp.id_empresa} value={emp.id_empresa}>{emp.nombre_empresa}</option>
            ))}
          </select>
        </div>
        {/* Removidos filtros de Mes y Año */}
      </div>

      <CRUDTable
        title="Asignaciones de Roles y Empresas"
        endpoint="asignaciones"
        columns={columns}
        createFields={createFields}
        editFields={editFields}
        queryParams={queryParams}
      />
    </div>
  );
};

export default AsignacionesCRUD;
