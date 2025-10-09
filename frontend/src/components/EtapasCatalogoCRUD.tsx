import React, { useEffect, useState } from 'react';
import CRUDTable from './CRUDTable';
import API_CONFIG from '../config/api'

const EtapasCatalogoCRUD: React.FC = () => {
  const [roles, setRoles] = useState<any[]>([]);
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_CONFIG.BASE_URL}/api/roles`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setRoles(data.data || []))
      .catch(() => setRoles([]));
  }, []);
  const columns = [
    { key: 'id_etapa', label: 'ID' },
    { key: 'nombre_etapa', label: 'Nombre de la Etapa' },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'es_revision', label: 'Es Revisión', type: 'boolean' as const }
  ];

  const createFields = [
    { key: 'nombre_etapa', label: 'Nombre de la Etapa', type: 'text' as const, required: true },
    { key: 'descripcion', label: 'Descripción', type: 'text' as const, required: false },
    { key: 'es_revision', label: 'Es Revisión', type: 'boolean' as const, required: false },
    // Asignación inicial a un rol (opcional)
    { key: 'id_rol', label: 'Rol asignado', type: 'select' as const, required: false, options: roles.map(r => ({ value: r.id_rol, label: r.nombre_rol })) }
  ];

  const editFields = [
    { key: 'nombre_etapa', label: 'Nombre de la Etapa', type: 'text' as const, required: true },
    { key: 'descripcion', label: 'Descripción', type: 'text' as const, required: false },
    { key: 'es_revision', label: 'Es Revisión', type: 'boolean' as const, required: false },
    { key: 'id_rol', label: 'Rol asignado', type: 'select' as const, required: false, options: roles.map(r => ({ value: r.id_rol, label: r.nombre_rol })) }
  ];

  return (
    <CRUDTable
      title="Etapas del Catálogo"
      endpoint="etapas-catalogo"
      columns={columns}
      createFields={createFields}
      editFields={editFields}
    />
  );
};

export default EtapasCatalogoCRUD;
