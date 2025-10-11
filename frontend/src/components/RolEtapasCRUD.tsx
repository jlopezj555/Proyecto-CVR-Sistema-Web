import React, { useEffect, useState } from 'react';
import CRUDTable from './CRUDTable';
import API_CONFIG from '../config/api'

const RolEtapasCRUD: React.FC = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [etapas, setEtapas] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    Promise.all([
      fetch(`${API_CONFIG.BASE_URL}/api/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(`${API_CONFIG.BASE_URL}/api/etapas-catalogo`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).catch(() => ({ data: [] }))
    ]).then(([r1, r2]) => {
      setRoles(r1.data || []);
      setEtapas(r2.data || []);
    });
  }, []);

  const columns = [
    { key: 'nombre_rol', label: 'Rol' },
    { key: 'nombre_etapa', label: 'Etapa' },
    { key: 'orden', label: 'Orden' }
  ];

  const createFields = [
    { key: 'id_rol', label: 'Rol', type: 'select' as const, required: true, options: roles.filter((r: any) => r.nombre_rol.toLowerCase() !== 'administrador').map((r: any) => ({ value: r.id_rol, label: r.nombre_rol })) },
    { key: 'id_etapas', label: 'Etapas', type: 'checkboxes' as const, required: true, options: etapas.map((e: any) => ({ value: String(e.id_etapa), label: e.nombre_etapa })) },
    { key: 'orden', label: 'Orden', type: 'text' as const, required: true }
  ];

  const editFields = [
    { key: 'orden', label: 'Orden', type: 'text' as const, required: true }
  ];

  return (
    <CRUDTable
      title="Etapas por Rol"
      endpoint="rol-etapas"
      columns={columns}
      createFields={createFields}
      editFields={editFields}
      // Deshabilitar botón Editar; solo permitir Eliminar
      disableEdit={true}
      // ID compuesto en backend: DELETE /api/rol-etapas/:idRol/:idEtapa
      getItemId={(item) => `${item.id_rol}/${item.id_etapa}`}
      afterCreate={async () => {}}
    />
  );
};

export default RolEtapasCRUD;


