import React, { useState, useEffect } from 'react';
import CRUDTable from './CRUDTable';

const CuentasCRUD: React.FC = () => {
  const [empresas, setEmpresas] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    fetch('http://localhost:4000/api/empresas', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setEmpresas(data.data || []))
      .catch(console.error);
  }, []);

  const columns = [
    { key: 'id_cuenta', label: 'ID' },
    { key: 'nombre_cuenta', label: 'Nombre de la Cuenta' },
    { key: 'nombre_empresa', label: 'Empresa' }
  ];

  const createFields = [
    { 
      key: 'id_empresa', 
      label: 'Empresa', 
      type: 'select' as const, 
      required: true,
      options: empresas.map(emp => ({
        value: emp.id_empresa,
        label: emp.nombre_empresa
      }))
    },
    { key: 'nombre_cuenta', label: 'Nombre de la Cuenta', type: 'text' as const, required: true }
  ];

  const editFields = [
    { 
      key: 'id_empresa', 
      label: 'Empresa', 
      type: 'select' as const, 
      required: true,
      options: empresas.map(emp => ({
        value: emp.id_empresa,
        label: emp.nombre_empresa
      }))
    },
    { key: 'nombre_cuenta', label: 'Nombre de la Cuenta', type: 'text' as const, required: true }
  ];

  return (
    <CRUDTable
      title="Cuentas"
      endpoint="cuentas"
      columns={columns}
      createFields={createFields}
      editFields={editFields}
    />
  );
};

export default CuentasCRUD;
