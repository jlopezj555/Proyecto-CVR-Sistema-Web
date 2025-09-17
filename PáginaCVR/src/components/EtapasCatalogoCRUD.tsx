import React from 'react';
import CRUDTable from './CRUDTable';

const EtapasCatalogoCRUD: React.FC = () => {
  const columns = [
    { key: 'id_etapa', label: 'ID' },
    { key: 'nombre_etapa', label: 'Nombre de la Etapa' },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'es_revision', label: 'Es Revisión', type: 'boolean' as const }
  ];

  const createFields = [
    { key: 'nombre_etapa', label: 'Nombre de la Etapa', type: 'text' as const, required: true },
    { key: 'descripcion', label: 'Descripción', type: 'text' as const, required: false },
    { key: 'es_revision', label: 'Es Revisión', type: 'boolean' as const, required: false }
  ];

  const editFields = [
    { key: 'nombre_etapa', label: 'Nombre de la Etapa', type: 'text' as const, required: true },
    { key: 'descripcion', label: 'Descripción', type: 'text' as const, required: false },
    { key: 'es_revision', label: 'Es Revisión', type: 'boolean' as const, required: false }
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
