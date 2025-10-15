import React, { useState, useEffect } from 'react';
import CRUDTable from './CRUDTable';
import API_CONFIG from '../config/api'

const ProcesosCRUD: React.FC = () => {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [empresaFiltro, setEmpresaFiltro] = useState<string>('');
  const [anioFiltro, setAnioFiltro] = useState<string>('');
  const [mesFiltro, setMesFiltro] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    // Cargar empresas
    fetch(`${API_CONFIG.BASE_URL}/api/empresas`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const rows = data.data || [];
        const sorted = rows.slice().sort((a: any, b: any) => (String(a.nombre_empresa || '')).localeCompare(String(b.nombre_empresa || '')));
        setEmpresas(sorted);
      })
      .catch(console.error);
  }, []);

  const columns = [
    { key: 'id_proceso', label: 'ID' },
    { key: 'nombre_proceso', label: 'Nombre del Proceso' },
    { key: 'tipo_proceso', label: 'Tipo' },
    {
      key: 'estado',
      label: 'Estado',
      render: (value: string) => {
        let color = '#3498db'; // azul por defecto (pendiente)
        let label = value;
        if (value?.toLowerCase() === 'enviado' || value?.toLowerCase() === 'completado') {
          color = '#27ae60'; // verde
          label = 'Enviado';
        } else if (value?.toLowerCase() === 'rechazado' || value?.toLowerCase() === 'cancelado') {
          color = '#e74c3c'; // rojo
          label = 'Rechazado';
        } else if (value?.toLowerCase() === 'pendiente' || value?.toLowerCase() === 'activo') {
          color = '#3498db'; // azul
          label = 'Pendiente';
        }
        return <span style={{ color, fontWeight: 700 }}>{label}</span>;
      }
    },
    { key: 'nombre_empresa', label: 'Empresa' },
    { key: 'fecha_creacion', label: 'Fecha Creación' },
    { key: 'fecha_completado', label: 'Fecha Completado' }
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
    { key: 'nombre_proceso', label: 'Nombre del Proceso', type: 'text' as const, required: true },
    { 
      key: 'tipo_proceso', 
      label: 'Tipo de Proceso', 
      type: 'select' as const, 
      required: true,
      options: [
        { value: 'Venta', label: 'Venta' },
        { value: 'Compra', label: 'Compra' }
      ]
    }
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
    { key: 'nombre_proceso', label: 'Nombre del Proceso', type: 'text' as const, required: true },
    { 
      key: 'tipo_proceso', 
      label: 'Tipo de Proceso', 
      type: 'select' as const, 
      required: true,
      options: [
        { value: 'Venta', label: 'Venta' },
        { value: 'Compra', label: 'Compra' }
      ]
    },
    { 
      key: 'estado', 
      label: 'Estado', 
      type: 'select' as const, 
      required: false,
      options: [
        { value: 'Activo', label: 'Activo' },
        { value: 'Completado', label: 'Completado' },
        { value: 'Cancelado', label: 'Cancelado' }
      ]
    }
  ];

  const meses = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
  ];

  const queryParams: Record<string, any> = {};
  if (empresaFiltro) queryParams.empresa = empresaFiltro;
  if (mesFiltro && anioFiltro) {
    // Convertir el mes seleccionado al mes anterior para que coincida con la lógica del backend
    const mesAnterior = mesFiltro === '1' ? '12' : String(parseInt(mesFiltro) - 1);
    const anioAnterior = mesFiltro === '1' ? String(parseInt(anioFiltro) - 1) : anioFiltro;
    queryParams.month = mesAnterior;
    queryParams.year = anioAnterior;
  } else if (mesFiltro) {
    // Si solo se selecciona mes sin año, usar año actual
    const mesAnterior = mesFiltro === '1' ? '12' : String(parseInt(mesFiltro) - 1);
    const anioAnterior = mesFiltro === '1' ? String(new Date().getFullYear() - 1) : String(new Date().getFullYear());
    queryParams.month = mesAnterior;
    queryParams.year = anioAnterior;
  } else if (anioFiltro) {
    queryParams.year = anioFiltro;
  }

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
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
        <div>
          <label style={{ fontWeight: 600, color: '#000' }}>Mes</label>
          <select value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid #e9ecef', backgroundColor: 'white', color: 'black' }}>
            <option value="">Todos</option>
            {meses.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontWeight: 600, color: '#000' }}>Año</label>
          <select value={anioFiltro} onChange={(e) => setAnioFiltro(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid #e9ecef', backgroundColor: 'white', color: 'black' }}>
            <option value="">Todos</option>
            {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <CRUDTable
        title="Cuadernillos"
        endpoint="procesos"
        columns={columns}
        createFields={createFields}
        editFields={editFields}
        queryParams={queryParams}
      />
    </div>
  );
};

export default ProcesosCRUD;
