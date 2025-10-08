import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './EtapasCuentaView.css';

interface ProcesoItem {
  id_proceso: number;
  id_empresa: number;
  nombre_proceso: string;
  tipo_proceso: string;
  estado?: string;
  fecha_creacion?: string;
  fecha_completado?: string | null;
  nombre_empresa: string;
}

interface EtapaCatalogoItem {
  id_etapa: number;
  nombre_etapa: string;
  descripcion?: string;
  es_revision?: boolean;
}

interface EtapaProcesoItem {
  id_etapa_proceso: number;
  id_proceso: number;
  id_rol?: number;
  id_etapa: number;
  estado: string;
  motivo_rechazo?: string;
  etapa_origen_error?: number;
  fecha_inicio: string;
  fecha_fin?: string | null;
  nombre_rol: string;
  nombre_etapa: string;
  etapa_descripcion: string;
  etapa_origen_nombre?: string;
  responsable_nombres?: string; // Empleado(s) responsable(s) (puede ser null)
}

const EtapasProcesoView: React.FC = () => {
  const [procesos, setProcesos] = useState<ProcesoItem[]>([]);
  const [etapasPorProceso, setEtapasPorProceso] = useState<Record<number, EtapaProcesoItem[]>>({});
  const [catalogo, setCatalogo] = useState<EtapaCatalogoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [empresaFiltro, setEmpresaFiltro] = useState<string>('');
  const [anioFiltro, setAnioFiltro] = useState<string>('');
  const [mesFiltro, setMesFiltro] = useState<string>('');
  const [expandedProcesoId, setExpandedProcesoId] = useState<number | null>(null);

  const token = localStorage.getItem('token');

  const empresasDisponibles = useMemo(() => {
    const map = new Map<number, string>();
    procesos.forEach(p => map.set(p.id_empresa, p.nombre_empresa));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [procesos]);

  const fetchProcesos = async () => {
    try {
      const params: any = {};
      if (empresaFiltro) params.empresa = empresaFiltro;
      if (anioFiltro) params.year = anioFiltro;
      if (mesFiltro) params.month = mesFiltro;
      const response = await axios.get<any>('http://localhost:4000/api/procesos', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setProcesos((response.data as any).data || []);
    } catch (error) {
      console.error('Error cargando procesos:', error);
    }
  };

  const fetchCatalogo = async () => {
    try {
      const response = await axios.get<any>('http://localhost:4000/api/etapas-catalogo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const list: EtapaCatalogoItem[] = ((response.data as any)?.data || []).map((e: any) => ({
        id_etapa: e.id_etapa,
        nombre_etapa: e.nombre_etapa,
        descripcion: e.descripcion,
        es_revision: !!e.es_revision
      }));
      // Ordenar por ID ascendente
      list.sort((a, b) => a.id_etapa - b.id_etapa);
      setCatalogo(list);
    } catch (error) {
      console.error('Error cargando catálogo de etapas:', error);
      setCatalogo([]);
    }
  };

  const fetchEtapasDeProceso = async (id_proceso: number) => {
    try {
      const response = await axios.get<any>(`http://localhost:4000/api/procesos/${id_proceso}/etapas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEtapasPorProceso(prev => ({ ...prev, [id_proceso]: (response.data as any).data || [] }));
    } catch (error) {
      console.error(`Error cargando etapas del proceso ${id_proceso}:`, error);
      setEtapasPorProceso(prev => ({ ...prev, [id_proceso]: [] }));
    }
  };

  useEffect(() => {
    fetchCatalogo();
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.resolve(fetchProcesos()).then(() => setLoading(false));
  }, [empresaFiltro, anioFiltro, mesFiltro]);

  useEffect(() => {
    if (procesos.length === 0) return;
    // Cargar etapas para todos los procesos
    procesos.forEach(p => {
      if (!etapasPorProceso[p.id_proceso]) {
        fetchEtapasDeProceso(p.id_proceso);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [procesos]);

  const getEstadoColor = (estado: string | undefined) => {
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

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const toggleProceso = (procesoId: number) => {
    const newId = expandedProcesoId === procesoId ? null : procesoId;
    setExpandedProcesoId(newId);
    if (newId && !etapasPorProceso[newId]) {
      fetchEtapasDeProceso(newId);
    }
  };

  const calcularProgreso = (id_proceso: number) => {
    const total = catalogo.length || 0;
    if (total === 0) return 0;
    const etapasProceso = etapasPorProceso[id_proceso] || [];
    // Completadas en las instanciadas
    const completadas = etapasProceso.filter(e => e.estado === 'Completada').length;
    // El porcentaje se calcula respecto al total del catálogo
    return Math.round((completadas / total) * 100);
  };

  return (
    <div className="etapas-cuenta-container">
      <h2>Gestión de Etapas de Procesos</h2>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div>
          <label>Empresa</label>
          <select
            value={empresaFiltro}
            onChange={(e) => setEmpresaFiltro(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid #e9ecef', backgroundColor: 'white', color: 'black' }}
          >
            <option value="">Todas</option>
            {empresasDisponibles.map(emp => (
              <option key={emp.id} value={String(emp.id)}>{emp.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Año</label>
          <select
            value={anioFiltro}
            onChange={(e) => setAnioFiltro(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid #e9ecef', backgroundColor: 'white', color: 'black' }}
          >
            <option value="">Todos</option>
            {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(y => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Mes</label>
          <select
            value={mesFiltro}
            onChange={(e) => setMesFiltro(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid #e9ecef', backgroundColor: 'white', color: 'black' }}
          >
            <option value="">Todos</option>
            {[
              { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
              { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
              { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
              { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
            ].map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Listado de procesos con sus etapas (todas las del catálogo) */}
      {loading ? (
        <div className="loading">Cargando procesos...</div>
      ) : procesos.length === 0 ? (
        <div className="no-data">No hay procesos registrados.</div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {procesos.map((proceso) => {
            const etapasInstanciadas = etapasPorProceso[proceso.id_proceso] || [];
            const progreso = calcularProgreso(proceso.id_proceso);
            const tieneRechazada = etapasInstanciadas.some(e => e.estado === 'Rechazada');

            return (
              <div key={proceso.id_proceso} style={{ background: 'white', border: tieneRechazada ? '2.5px solid #dc3545' : '1px solid #e9ecef', borderRadius: 12, boxShadow: tieneRechazada ? '0 0 0 2px #dc3545' : '0 8px 24px rgba(0,0,0,0.06)' }}>
                {/* Encabezado del proceso (colapsable como UserView) */}
                <button onClick={() => toggleProceso(proceso.id_proceso)} style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #122745 0%, #1e3a5f 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '14px 16px',
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{proceso.nombre_proceso}</div>
                      <div style={{ opacity: 0.85, fontSize: 11 }}>{proceso.nombre_empresa} • {proceso.tipo_proceso}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontSize: 11, opacity: 0.9 }}>Creado: {formatDate(proceso.fecha_creacion)}</div>
                      <div style={{ fontSize: 18 }}>{expandedProcesoId === proceso.id_proceso ? '▴' : '▾'}</div>
                    </div>
                  </div>
                </button>

                {expandedProcesoId === proceso.id_proceso && (
                <div style={{ padding: 12 }}>
                  {/* Línea de etapas horizontal construida desde catálogo */}
                  <div style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch' }}>
                    <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 8, alignItems: 'stretch', paddingBottom: 8, minWidth: 'max-content' }}>
                      {catalogo.map((cat) => {
                      const etapa = etapasInstanciadas.find(e => e.id_etapa === cat.id_etapa);
                      const estado = etapa?.estado || 'Pendiente';
                      const color = getEstadoColor(etapa?.estado);
                      const responsable = etapa?.responsable_nombres && etapa.responsable_nombres.trim().length > 0
                        ? etapa.responsable_nombres
                        : 'Vacante';
                      const key = `${proceso.id_proceso}:${cat.id_etapa}`;

                      return (
                        <div key={key} style={{ minWidth: 160, flex: '0 0 auto' }}>
                          <div
                            style={{
                              padding: 8,
                              borderRadius: 10,
                              background: 'white',
                              border: '1px solid #dee2e6'
                            }}
                          >
                            <div style={{ fontWeight: 700, color: '#000', fontSize: 13 }}>{cat.nombre_etapa}</div>
                            <div style={{ marginTop: 4, fontSize: 11, color: '#495057' }}>Estado: <span style={{ color }}>{estado}</span></div>
                            <div style={{ marginTop: 4, fontSize: 11, color: '#495057' }}>Rol: {etapa?.nombre_rol || '-'}</div>
                            <div style={{ marginTop: 4, fontSize: 11, color: '#495057' }}>Responsable: {responsable}</div>
                            {etapa?.estado === 'Rechazada' && etapa?.motivo_rechazo && (
                              <div style={{ color: '#dc3545', marginTop: 4, fontSize: 12 }}>
                                <strong>Motivo rechazo:</strong> {etapa.motivo_rechazo}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>

                  {/* Barra de progreso animada basada en total catálogo */}
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, color: '#000', fontSize: 13 }}>Avance del proceso</span>
                    <span style={{ color: '#000', fontSize: 12 }}>{progreso}%</span>
                    </div>
                    <div style={{ position: 'relative', height: 10, background: '#e9ecef', borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          bottom: 0,
                          width: `${progreso}%`,
                          background: 'linear-gradient(90deg, #1e3a5f, #4e7ab5)',
                          borderRadius: 999,
                          transition: 'width 600ms ease'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EtapasProcesoView;
