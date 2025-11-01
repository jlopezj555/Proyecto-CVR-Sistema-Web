import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CRUDTable from './CRUDTable';
import type { TableData } from './CRUDTable';
import API_CONFIG from '../config/api'

interface Empresa {
  id_empresa: number;
  nombre_empresa: string;
}

interface Etapa {
  id_etapa: number;
  nombre_etapa: string;
  descripcion_etapa?: string;
  estado: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  id_proceso: number;
}

interface Proceso {
  id_proceso: number;
  nombre_proceso: string;
  descripcion_proceso?: string;
  tipo_proceso: 'Venta' | 'Compra';
  estado: string;
  mes: number;
  anio: number;
  id_empresa: number;
  nombre_empresa: string;
  fecha_creacion: string;
  fecha_completado?: string;
}

const ProcesosCRUD: React.FC = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaFiltro, setEmpresaFiltro] = useState<string>('');
  const [anioFiltro, setAnioFiltro] = useState<string>('');
  const [mesFiltro, setMesFiltro] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    // Cargar todas las empresas para el formulario de creación
    fetch(`${API_CONFIG.BASE_URL}/api/empresas/all`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const rows = ((data as any)?.data || []) as Empresa[];
        // Ordenar empresas alfabéticamente por nombre antes de guardarlas
        const empresasOrdenadas = [...rows].sort((a, b) => 
          a.nombre_empresa.localeCompare(b.nombre_empresa)
        );
        setEmpresas(empresasOrdenadas);
      })
      .catch(console.error);
  }, []);

  const meses = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
  ];

  const columns = [
    { key: 'id_proceso', label: 'ID' },
    { key: 'nombre_proceso', label: 'Nombre del Proceso' },
    { key: 'descripcion_proceso', label: 'Descripción' },
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
    { key: 'mes', label: 'Mes' },
    { key: 'anio', label: 'Año' },
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
    { key: 'descripcion_proceso', label: 'Descripción', type: 'text' as const, required: false },
    { key: 'mes', label: 'Mes asignado', type: 'select' as const, required: true, options: meses.map(m => ({ value: m.value, label: m.label })) },
    { key: 'anio', label: 'Año asignado', type: 'select' as const, required: true, options: Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(y => ({ value: y, label: String(y) })) },
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
    { key: 'descripcion_proceso', label: 'Descripción', type: 'text' as const, required: false },
    { key: 'mes', label: 'Mes asignado', type: 'select' as const, required: true, options: meses.map(m => ({ value: m.value, label: m.label })) },
    { key: 'anio', label: 'Año asignado', type: 'select' as const, required: true, options: Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(y => ({ value: y, label: String(y) })) },
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

  // Construir queryParams para todos los componentes
  const queryParams: Record<string, any> = {};
  if (empresaFiltro) queryParams.empresa = empresaFiltro;
  if (mesFiltro) queryParams.month = mesFiltro;
  if (anioFiltro) queryParams.year = anioFiltro;

  // Estado para años y meses disponibles
  const [aniosDisponibles, setAniosDisponibles] = useState<number[]>([]);
  const [mesesDisponibles, setMesesDisponibles] = useState<number[]>([]);

  // Función para cargar procesos y actualizar filtros disponibles
  const cargarProcesos = async () => {
    const token = localStorage.getItem('token');

    const queryString = Object.entries(queryParams)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/procesos${queryString ? `?${queryString}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        // Actualizar años y meses disponibles para los filtros
        setAniosDisponibles(data.metadata?.availableYears || []);
        setMesesDisponibles(data.metadata?.availableMonths || []);
      }
    } catch (error) {
      console.error('Error cargando procesos:', error);
    }
  };

  // Llamar a cargarProcesos cuando cambien los filtros
  useEffect(() => {
    cargarProcesos();
  }, [empresaFiltro, mesFiltro, anioFiltro]);

  // Control de visibilidad especial para encargada/o de impresión
  const sessionRole = (localStorage.getItem('rol') || '').toLowerCase();
  const isImpresora = sessionRole.includes('impres');

  // Si es impresora, precargar etapas para poder filtrar procesos según la regla
  const [etapasPorProceso, setEtapasPorProceso] = useState<Record<number, Etapa[]>>({});
  const [loadingEtapas, setLoadingEtapas] = useState(false);

  useEffect(() => {
    if (!isImpresora) return;
    let mounted = true;
    (async () => {
      setLoadingEtapas(true);
      try {
        const token = localStorage.getItem('token');
        // Obtener todos los procesos con los mismos params que CRUDTable
        const resp = await axios.get<any>(`${API_CONFIG.BASE_URL}/api/procesos`, { headers: { Authorization: `Bearer ${token}` }, params: queryParams });
        const procesos = ((resp.data as any)?.data || []) as Proceso[];
        const etapasMap: Record<number, any[]> = {};
        // Traer etapas por proceso (paralelo)
        await Promise.all(procesos.map(async (p: Proceso) => {
          try {
            const r = await axios.get<any>(`${API_CONFIG.BASE_URL}/api/procesos/${p.id_proceso}/etapas`, { headers: { Authorization: `Bearer ${token}` } });
            etapasMap[p.id_proceso] = ((r.data as any)?.data || []) as Etapa[];
          } catch (e) {
            etapasMap[p.id_proceso] = [];
          }
        }));
        if (mounted) setEtapasPorProceso(etapasMap);
      } catch (e) {
        console.error('Error preloading procesos/etapas for impresora:', e);
      } finally {
        if (mounted) setLoadingEtapas(false);
      }
    })();
    return () => { mounted = false };
    // Recalcular cuando cambian los filtros (queryParams)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(queryParams), isImpresora]);

  const filterForImpresora = (row: TableData) => {
    if (!isImpresora) return true;
    // Si aún no cargamos las etapas del proceso, ocultarlo hasta tener datos
    const etapas = etapasPorProceso[row.id_proceso];
    if (!etapas) return false;
    // Buscar la etapa de impresión (nombre que contenga 'impres' o 'cuadern')
    const idx = etapas.findIndex((e) => String(e.nombre_etapa || '').toLowerCase().includes('impres') || String(e.nombre_etapa || '').toLowerCase().includes('cuadern'));
    if (idx === -1) return false; // si no hay etapa de impresión, no mostrar
    // Todas las etapas anteriores a la etapa de impresión deben estar completas
    for (let i = 0; i < idx; i++) {
      const est = etapas[i];
      if (!est || String(est.estado || '').toLowerCase() !== 'completada') return false;
    }
    return true;
  };

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
            {mesesDisponibles.map(mesNum => {
              const mes = meses.find(m => m.value === mesNum);
              return (
                <option key={mesNum} value={mesNum}>{mes ? mes.label : `Mes ${mesNum}`}</option>
              );
            })}
          </select>
        </div>
        <div>
          <label style={{ fontWeight: 600, color: '#000' }}>Año</label>
          <select value={anioFiltro} onChange={(e) => setAnioFiltro(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid #e9ecef', backgroundColor: 'white', color: 'black' }}>
            <option value="">Todos</option>
            {aniosDisponibles.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {isImpresora && loadingEtapas && (
        <div style={{ padding: 12, background: 'white', borderRadius: 8, marginBottom: 12 }}>Cargando procesos y etapas para verificación de impresión...</div>
      )}

      <CRUDTable
        title="Cuadernillos"
        endpoint="procesos"
        columns={columns}
        createFields={createFields}
        editFields={editFields}
        queryParams={queryParams}
        filterFunction={filterForImpresora}
        onBeforeCreate={async (data) => {
          // Validar que no exista un proceso del mismo tipo para la misma empresa en el mismo mes/año
          const token = localStorage.getItem('token');
          try {
            const response = await axios.get(`${API_CONFIG.BASE_URL}/api/procesos`, {
              headers: { Authorization: `Bearer ${token}` },
              params: {
                empresa: data.id_empresa,
                month: data.mes,
                year: data.anio,
                tipo: data.tipo_proceso
              }
            });
            const procesos = ((response.data as any)?.data || []) as Proceso[];
            if (procesos.length > 0) {
              throw new Error(`Ya existe un proceso de tipo ${data.tipo_proceso} para esta empresa en el mes ${data.mes} del año ${data.anio}`);
            }
            return true;
          } catch (error: any) {
            if (error?.response) {
              throw new Error(error.response.data.message || 'Error validando proceso');
            }
            throw error;
          }
        }}
        onUpdate={async (id: string | number, formData: TableData, token: string) => {
          // Si no cambia empresa, mes, año o tipo, permitir la edición directamente
          const response = await axios.get(`${API_CONFIG.BASE_URL}/api/procesos/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const originalData = (response.data as any)?.data as Proceso;
          
          if (
            formData.id_empresa === originalData.id_empresa &&
            formData.mes === originalData.mes &&
            formData.anio === originalData.anio &&
            formData.tipo_proceso === originalData.tipo_proceso
          ) {
            return false; // Usar el flujo normal de actualización
          }

          // Si cambia alguno de estos campos, validar que no exista otro proceso
          try {
            const existingResponse = await axios.get(`${API_CONFIG.BASE_URL}/api/procesos`, {
              headers: { Authorization: `Bearer ${token}` },
              params: {
                empresa: formData.id_empresa,
                month: formData.mes,
                year: formData.anio,
                tipo: formData.tipo_proceso
              }
            });
            const procesos = ((existingResponse.data as any)?.data || []) as Proceso[];
            // Filtrar excluyendo el proceso actual
            const procesosConflicto = procesos.filter((p: Proceso) => p.id_proceso !== originalData.id_proceso);
            if (procesosConflicto.length > 0) {
              throw new Error(`Ya existe un proceso de tipo ${formData.tipo_proceso} para esta empresa en el mes ${formData.mes} del año ${formData.anio}`);
            }
            
            // Si no hay conflictos, permitir la actualización
            return false; // Usar el flujo normal de actualización
          } catch (error: any) {
            if (error?.response) {
              throw new Error(error.response.data.message || 'Error validando proceso');
            }
            throw error;
          }
        }}
      />
    </div>
  );
};

export default ProcesosCRUD;
