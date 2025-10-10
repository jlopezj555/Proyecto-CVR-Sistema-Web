import React, { useState, useEffect } from 'react';
import CRUDTable from './CRUDTable';
import API_CONFIG from '../config/api'

const PapeleriaCRUD: React.FC = () => {
  const [empresas, setEmpresas] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_CONFIG.BASE_URL}/api/empresas`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setEmpresas(data.data || []))
      .catch(console.error);
  }, []);

  const columns = [
    { key: 'id_papeleria', label: 'ID' },
    { key: 'nombre_empresa', label: 'Empresa' },
    { key: 'tipo_papeleria', label: 'Tipo' },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'estado', label: 'Estado' },
    { key: 'nombre_proceso', label: 'Proceso' },
    { key: 'fecha_recepcion', label: 'Fecha Recepción' },
    { key: 'fecha_entrega', label: 'Fecha Entrega' }
  ];

  const token = localStorage.getItem('token') || '';

  const createFields = [
    { 
      key: 'id_empresa', 
      label: 'Empresa', 
      type: 'select' as const, 
      required: true,
      options: empresas.map(empresa => ({ value: empresa.id_empresa, label: empresa.nombre_empresa }))
    },
    { 
      key: 'tipo_papeleria', 
      label: 'Tipo de Papelería', 
      type: 'select' as const, 
      required: true,
      dynamicOptions: async (formData: Record<string, any>) => {
        const empresaSel = formData['id_empresa'];
        if (!empresaSel) return [];
        try {
          // Usar procesos admin para saber si ya existen Venta/Compra para la empresa en el mes asignado
          const params = new URLSearchParams({ empresa: String(empresaSel) });
          const resp = await fetch(`${API_CONFIG.BASE_URL}/api/procesos?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
          const json = await resp.json();
          const rows: any[] = json?.data || [];
          const tieneVenta = rows.some(p => String(p.tipo_proceso).toLowerCase() === 'venta');
          const tieneCompra = rows.some(p => String(p.tipo_proceso).toLowerCase() === 'compra');
          if (tieneVenta && tieneCompra) {
            alert('Esta empresa ya presentó su papelería completa (Venta y Compra).');
            return [];
          }
          const opts: string[] = [];
          if (!tieneVenta) opts.push('Venta');
          if (!tieneCompra) opts.push('Compra');
          return opts.map(t => ({ value: t, label: t }));
        } catch (_) {
          return [
            { value: 'Venta', label: 'Venta' },
            { value: 'Compra', label: 'Compra' }
          ];
        }
      },
      dependsOnKeys: ['id_empresa'],
      disabledWhen: (fd: Record<string, any>) => !fd['id_empresa']
    },
    { key: 'descripcion', label: 'Descripción', type: 'text' as const, required: true }
  ];

  const editFields = [
    { key: 'descripcion', label: 'Descripción', type: 'text' as const, required: true },
    { key: 'tipo_papeleria', label: 'Tipo de Papelería', type: 'select' as const, required: true, options: [
      { value: 'Venta', label: 'Venta' },
      { value: 'Compra', label: 'Compra' }
    ]},
    { key: 'estado', label: 'Estado', type: 'select' as const, required: true, options: [
      { value: 'Recibida', label: 'Recibida' },
      { value: 'En proceso', label: 'En proceso' },
      { value: 'Entregada', label: 'Entregada' }
    ]},
    { key: 'fecha_entrega', label: 'Fecha de Entrega', type: 'date' as const, required: false }
  ];

  return (
    <CRUDTable
      title="Papelería"
      endpoint="papeleria"
      columns={columns}
      createFields={createFields}
      editFields={editFields}
    />
  );
};

export default PapeleriaCRUD;
