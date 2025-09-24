import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EtapasCuentaView.css';

interface EtapaProceso {
  id_etapa_proceso: number;
  id_proceso: number;
  id_rol?: number;
  id_etapa: number;
  estado: string;
  motivo_rechazo?: string;
  etapa_origen_error?: number;
  fecha_inicio: string;
  fecha_fin?: string;
  nombre_rol: string;
  nombre_etapa: string;
  etapa_descripcion: string;
  etapa_origen_nombre?: string;
  responsable_nombres?: string;
}

const EtapasProcesoView: React.FC = () => {
  const [procesos, setProcesos] = useState<any[]>([]);
  const [etapas, setEtapas] = useState<EtapaProceso[]>([]);
  const [selectedProceso, setSelectedProceso] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [empresaFiltro, setEmpresaFiltro] = useState<string>('');
  const [anioFiltro, setAnioFiltro] = useState<string>('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchProcesos();
  }, [empresaFiltro, anioFiltro]);

  useEffect(() => {
    if (selectedProceso) {
      fetchEtapas(selectedProceso);
    }
  }, [selectedProceso]);

  const fetchProcesos = async () => {
    try {
      const params: any = {};
      if (empresaFiltro) params.empresa = empresaFiltro;
      if (anioFiltro) params.year = anioFiltro;
      const response = await axios.get('http://localhost:4000/api/procesos', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setProcesos(response.data.data);
    } catch (error) {
      console.error('Error cargando procesos:', error);
    }
  };

  const fetchEtapas = async (procesoId: number) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:4000/api/procesos/${procesoId}/etapas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEtapas(response.data.data);
    } catch (error) {
      console.error('Error cargando etapas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Completada':
        return '#28a745';
      case 'En progreso':
        return '#ffc107';
      case 'Rechazada':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const etapasPorOrden = etapas; // ya vienen ordenadas asc
  const indiceActual = etapasPorOrden.findIndex(e => e.estado === 'En progreso') !== -1
    ? etapasPorOrden.findIndex(e => e.estado === 'En progreso')
    : Math.max(0, etapasPorOrden.findIndex(e => e.estado !== 'Completada'));

  return (
    <div className="etapas-cuenta-container">
      <h2>Gestión de Etapas de Procesos</h2>
      
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div>
          <label>Empresa</label>
          <select value={empresaFiltro} onChange={(e) => setEmpresaFiltro(e.target.value)}>
            <option value="">Todas</option>
            {Array.from(new Map(procesos.map(p => [p.id_empresa, p.nombre_empresa])).entries()).map(([id, name]) => (
              <option key={id} value={String(id)}>{name as any}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Año</label>
          <select value={anioFiltro} onChange={(e) => setAnioFiltro(e.target.value)}>
            <option value="">Todos</option>
            {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(y => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="proceso-selector">
        <label htmlFor="proceso-select">Seleccionar Proceso:</label>
        <select 
          id="proceso-select"
          value={selectedProceso || ''} 
          onChange={(e) => setSelectedProceso(Number(e.target.value))}
        >
          <option value="">Seleccione un proceso...</option>
          {procesos.map(proceso => (
            <option key={proceso.id_proceso} value={proceso.id_proceso}>
              {proceso.nombre_proceso} - {proceso.tipo_proceso} ({proceso.cliente_nombre})
            </option>
          ))}
        </select>
      </div>

      {selectedProceso && (
        <div className="etapas-info">
          <h3>Etapas del Proceso Seleccionado</h3>

          {/* Timeline horizontal */}
          {etapas.length > 0 && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0 16px 0', overflowX: 'auto' }}>
              {etapasPorOrden.map((e, idx) => {
                const estado = e.estado;
                const isCurrent = idx === indiceActual;
                const color = estado === 'Completada' ? '#28a745' : estado === 'En progreso' ? '#ffc107' : '#6c757d';
                const border = isCurrent ? '3px solid #1e3a5f' : '1px solid #dee2e6';
                return (
                  <div key={e.id_etapa_proceso} style={{ minWidth: 160 }}>
                    <div style={{ padding: 10, borderRadius: 10, background: 'white', border }}>
                      <div style={{ fontWeight: 700, color: '#000' }}>{e.nombre_etapa}</div>
                      <div style={{ marginTop: 6, fontSize: 12, color: '#495057' }}>Estado: <span style={{ color }}>{estado}</span></div>
                      {e.responsable_nombres && (
                        <div style={{ marginTop: 4, fontSize: 12, color: '#495057' }}>A cargo: {e.responsable_nombres}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {loading ? (
            <div className="loading">Cargando etapas...</div>
          ) : etapas.length === 0 ? (
            <div className="no-data">No hay etapas registradas para este proceso.</div>
          ) : (
            <div className="etapas-grid">
              {etapas.map(etapa => (
                <div key={etapa.id_etapa_proceso} className="etapa-card">
                  <div className="etapa-header">
                    <h4>{etapa.nombre_etapa}</h4>
                    <span 
                      className="estado-badge"
                      style={{ backgroundColor: getEstadoColor(etapa.estado) }}
                    >
                      {etapa.estado}
                    </span>
                  </div>
                  
                  <div className="etapa-details">
                    <p><strong>Descripción:</strong> {etapa.etapa_descripcion}</p>
                    <p><strong>Rol:</strong> {etapa.nombre_rol}</p>
                    <p><strong>Fecha Inicio:</strong> {formatDate(etapa.fecha_inicio)}</p>
                    {etapa.fecha_fin && (
                      <p><strong>Fecha Fin:</strong> {formatDate(etapa.fecha_fin)}</p>
                    )}
                    
                    {etapa.motivo_rechazo && (
                      <div className="rechazo-info">
                        <p><strong>Motivo de Rechazo:</strong> {etapa.motivo_rechazo}</p>
                        {etapa.etapa_origen_nombre && (
                          <p><strong>Etapa Origen del Error:</strong> {etapa.etapa_origen_nombre}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EtapasProcesoView;
