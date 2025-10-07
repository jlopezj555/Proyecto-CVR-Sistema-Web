import React, { useEffect, useState } from 'react';
import CRUDTable from './CRUDTable';

const ClientesCRUD: React.FC = () => {
  const [empresas, setEmpresas] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:4000/api/empresas', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setEmpresas(data.data || []))
      .catch(() => setEmpresas([]));
  }, []);

  const columns = [
    { key: 'id_cliente', label: 'ID' },
    { key: 'nombre_completo', label: 'Nombre completo' },
    { key: 'correo', label: 'Correo' },
    { key: 'nombre_empresa', label: 'Empresa' },
    { key: 'activo', label: 'Activo', type: 'boolean' as const }
  ];

  const createFields = [
    { key: 'nombre_completo', label: 'Nombre completo', type: 'text' as const, required: true },
    { key: 'correo', label: 'Correo', type: 'email' as const, required: true },
    { key: 'contrasena', label: 'Contraseña', type: 'text' as const, required: true },
    { key: 'usuario', label: 'Usuario', type: 'text' as const, required: false },
    { key: 'id_empresa', label: 'Empresa', type: 'select' as const, required: true, options: empresas.map((e: any) => ({ value: e.id_empresa, label: e.nombre_empresa })) }
  ];

  const editFields = [
    { key: 'nombre_completo', label: 'Nombre completo', type: 'text' as const, required: true },
    { key: 'correo', label: 'Correo', type: 'email' as const, required: true },
    { key: 'id_empresa', label: 'Empresa', type: 'select' as const, required: true, options: empresas.map((e: any) => ({ value: e.id_empresa, label: e.nombre_empresa })) },
    { key: 'activo', label: 'Activo', type: 'boolean' as const }
  ];

  return (
    <CRUDTable
      title="Clientes"
      endpoint="clientes"
      columns={columns}
      createFields={createFields}
      editFields={editFields}
    />
  );
};

export default ClientesCRUD;


