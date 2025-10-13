import React, { useState, useEffect } from 'react';
import CRUDTable from './CRUDTable';
import API_CONFIG from '../config/api'

const PapeleriaCRUD: React.FC = () => {
  const [empresas, setEmpresas] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    // Preferir empresas asignadas al empleado (secretaria). Si devuelve 403 o vacío, caer a /api/empresas (admin)
    (async () => {
      try {
        const resp = await fetch(`${API_CONFIG.BASE_URL}/api/mis-empresas`, { headers: { Authorization: `Bearer ${token}` } });
        if (resp.status === 200) {
          const json = await resp.json();
          const rows = json?.data || [];
          if (rows && rows.length > 0) {
            setEmpresas(rows);
            return;
          }
        }
      } catch (e) {
        // ignore and fallback
      }

      // Fallback: listar todas las empresas (para administradores)
      try {
        const resp2 = await fetch(`${API_CONFIG.BASE_URL}/api/empresas`, { headers: { Authorization: `Bearer ${token}` } });
        const json2 = await resp2.json();
        setEmpresas(json2?.data || []);
      } catch (e) {
        console.error('Error cargando empresas:', e);
      }
    })();
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
          // Calcular mes/año del "mes asignado" (mes anterior)
          const now = new Date();
          const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const prevMonth = String(prev.getMonth() + 1);
          const prevYear = String(prev.getFullYear());

          const params = new URLSearchParams({ empresa: String(empresaSel), month: prevMonth, year: prevYear });

          // Intentar consultar procesos disponibles para el empleado (mis-procesos). Si 403 o vacío, intentar /api/procesos (admin)
          let rows: any[] = [];
          try {
            const resp = await fetch(`${API_CONFIG.BASE_URL}/api/mis-procesos?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
            if (resp.status === 200) {
              const json = await resp.json();
              rows = json?.data || [];
            } else if (resp.status === 403) {
              // probar endpoint admin
              const resp2 = await fetch(`${API_CONFIG.BASE_URL}/api/procesos?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
              const json2 = await resp2.json();
              rows = json2?.data || [];
            } else {
              const json = await resp.json();
              rows = json?.data || [];
            }
          } catch (e) {
            // fallback a endpoint admin
            const resp2 = await fetch(`${API_CONFIG.BASE_URL}/api/procesos?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
            const json2 = await resp2.json();
            rows = json2?.data || [];
          }

          const tieneVenta = rows.some(p => String(p.tipo_proceso).toLowerCase() === 'venta');
          const tieneCompra = rows.some(p => String(p.tipo_proceso).toLowerCase() === 'compra');
          if (tieneVenta && tieneCompra) {
            alert('Esta empresa ya presentó su papelería completa (Venta y Compra) para el mes asignado.');
            return [];
          }
          const opts: string[] = [];
          if (!tieneVenta) opts.push('Venta');
          if (!tieneCompra) opts.push('Compra');
          return opts.map(t => ({ value: t, label: t }));
        } catch (err) {
          console.error('Error calculando opciones tipo papelería:', err);
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
