import React from 'react';
import CRUDTable from './CRUDTable';

const EmpresasCRUD: React.FC = () => {
  const columns = [
    { key: 'id_empresa', label: 'ID' },
    { key: 'nombre_empresa', label: 'Nombre de la Empresa' },
    { key: 'direccion_empresa', label: 'Dirección' },
    { key: 'telefono_empresa', label: 'Teléfono' },
    { key: 'correo_empresa', label: 'Correo' }
  ];

  const createFields = [
    { key: 'nombre_empresa', label: 'Nombre de la Empresa', type: 'text' as const, required: true },
    { key: 'direccion_empresa', label: 'Dirección', type: 'text' as const, required: true },
    { key: 'telefono_empresa', label: 'Teléfono', type: 'text' as const, required: true },
    { key: 'correo_empresa', label: 'Correo', type: 'email' as const, required: true }
  ];

  const editFields = [
    { key: 'nombre_empresa', label: 'Nombre de la Empresa', type: 'text' as const, required: true },
    { key: 'direccion_empresa', label: 'Dirección', type: 'text' as const, required: true },
    { key: 'telefono_empresa', label: 'Teléfono', type: 'text' as const, required: true },
    { key: 'correo_empresa', label: 'Correo', type: 'email' as const, required: true }
  ];

  return (
    <CRUDTable
      title="Empresas"
      endpoint="empresas"
      columns={columns}
      createFields={createFields}
      editFields={editFields}
    />
  );
};

export default EmpresasCRUD;
