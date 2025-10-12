import React, { useEffect, useState } from 'react'
import PasswordVerificationModal from './PasswordVerificationModal'
import axios from 'axios'
import API_CONFIG from '../config/api'
import './AdminView.css'
import iconEtapasProceso from '../assets/admin-etapas-proceso-white.svg'

interface ProcesoItem {
  id_proceso: number
  id_empresa: number
  id_cliente: number
  nombre_proceso: string
  tipo_proceso: string
  estado: string
  fecha_creacion: string
  fecha_completado?: string | null
  nombre_empresa: string
  cliente_nombre: string
}

interface EtapaItem {
  id_etapa_proceso: number
  id_proceso: number
  id_rol: number
  id_etapa: number
  estado: string
  fecha_inicio: string
  fecha_fin?: string | null
  nombre_etapa: string
  etapa_descripcion: string
  motivo_rechazo?: string
}

const RevisorView: React.FC<{ nombre: string }> = ({ nombre }) => {
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [pendingAccion, setPendingAccion] = useState<'aprobar' | 'rechazar' | null>(null);
  const token = localStorage.getItem('token')
  const [procesos, setProcesos] = useState<ProcesoItem[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)
  const [etapas, setEtapas] = useState<Record<number, EtapaItem[]>>({})
  const [loading, setLoading] = useState(false)
  const [loadingEtapas, setLoadingEtapas] = useState<Record<number, boolean>>({})

  // Filtros
  const [empresaFiltro, setEmpresaFiltro] = useState<string>('')
  const [anioFiltro, setAnioFiltro] = useState<string>('')
  const [mesFiltro, setMesFiltro] = useState<string>('')

  // rechazo: { [procesoId]: { etapas: { [id_etapa_proceso]: motivo }, seleccionadas: number[] } }
  const [rechazo, setRechazo] = useState<{ [procesoId: number]: { etapas: Record<number, string>, seleccionadas: number[] } }>({})
  // Eliminados: password, errorMsg, showPasswordModal
  const [accion, setAccion] = useState<'aprobar' | 'rechazar' | null>(null)
  const [procesoSeleccionado, setProcesoSeleccionado] = useState<number | null>(null)

  useEffect(() => {
    // Obtener nivel de revisión del usuario autenticado si el backend lo expone
    // fallback: intentar desde token/rol (no implementado aquí), dejar control manual por ahora
    // setNivelRevision(1|2|3)
  }, [])

  const loadProcesos = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (empresaFiltro) params.empresa = empresaFiltro
      if (mesFiltro && anioFiltro) {
        // Convertir el mes seleccionado al mes anterior para que coincida con la lógica del backend
        const mesAnterior = mesFiltro === '1' ? '12' : String(parseInt(mesFiltro) - 1)
        const anioAnterior = mesFiltro === '1' ? String(parseInt(anioFiltro) - 1) : anioFiltro
        params.month = mesAnterior
        params.year = anioAnterior
      } else if (mesFiltro) {
        // Si solo se selecciona mes sin año, usar año actual
        const mesAnterior = mesFiltro === '1' ? '12' : String(parseInt(mesFiltro) - 1)
        const anioAnterior = mesFiltro === '1' ? String(new Date().getFullYear() - 1) : String(new Date().getFullYear())
        params.month = mesAnterior
        params.year = anioAnterior
      } else if (anioFiltro) {
        params.year = anioFiltro
      }

      const { data } = await axios.get<any>(`${API_CONFIG.BASE_URL}/api/revisor/procesos-terminados`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      })
      setProcesos(data.data || [])
    } catch (e) {
      console.error('Error cargando procesos terminados:', e)
    } finally {
      setLoading(false)
    }
  }

  const loadEtapas = async (id: number) => {
    setLoadingEtapas(prev => ({ ...prev, [id]: true }))
    try {
      const { data } = await axios.get<any>(`${API_CONFIG.BASE_URL}/api/revisor/procesos/${id}/etapas`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setEtapas(prev => ({ ...prev, [id]: data.data || [] }))
    } catch (e) {
      console.error('Error cargando etapas:', e)
    } finally {
      setLoadingEtapas(prev => ({ ...prev, [id]: false }))
    }
  }

  useEffect(() => { loadProcesos() }, [empresaFiltro, mesFiltro, anioFiltro])

  const toggleExpand = (id: number) => {
    const n = expanded === id ? null : id
    setExpanded(n)
    if (n && !etapas[n]) loadEtapas(n)
  }

  // Funciones eliminadas: toggleEtapaRechazo y setMotivo, ya no se usan con el nuevo estado

  const rechazar = async (procesoId: number, pwd: string) => {
    try {
      const etapasSeleccionadas = rechazo[procesoId]?.seleccionadas || [];
      // Validar que todas las etapas seleccionadas tengan un motivo
      if (!etapasSeleccionadas.every(id => rechazo[procesoId]?.etapas[id]?.trim())) {
        console.error('Todas las etapas deben tener un motivo de rechazo');
        return false;
      }
      
      // Asegurar que los IDs sean números
      const etapasFallidas = etapasSeleccionadas.map(id => ({
        id_etapa_proceso: Number(id),
        motivo: rechazo[procesoId]?.etapas[id]?.trim() || ''
      }));
      
      const payload = {
        etapasFallidas,
        contrasena: pwd
      };
      const { data } = await axios.post<any>(`${API_CONFIG.BASE_URL}/api/revisor/procesos/${procesoId}/rechazar`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success !== false) {
        await loadProcesos();
        setExpanded(null);
        setPasswordModalOpen(false);
        setAccion(null);
        setProcesoSeleccionado(null);
      }
      return data.success !== false;
    } catch (e) { console.error('Error rechazando:', e); return false; }
  }

  const aprobar = async (procesoId: number, pwd: string) => {
    try {
      const payload = { contrasena: pwd };
      const { data } = await axios.post<any>(`${API_CONFIG.BASE_URL}/api/revisor/procesos/${procesoId}/aprobar`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success !== false) {
        await loadProcesos();
        setExpanded(null);
        setPasswordModalOpen(false);
        setAccion(null);
        setProcesoSeleccionado(null);
      }
      return data.success !== false;
    } catch (e) { console.error('Error aprobando:', e); return false; }
  }

  const formatDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString('es-ES') : '-')

  return (
    <div className="admin-view-container">
      <div className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h3>Panel Revisor</h3>
          <p>Hola, {nombre}</p>
        </div>
        <nav className="admin-nav">
          <button className={`admin-nav-item active`}>
            <span className="nav-icon"><img src={iconEtapasProceso} alt="Procesos terminados" className="nav-icon-img" /></span>
            <span className="nav-label">Procesos terminados</span>
          </button>
        </nav>
      </div>

      <div className="admin-main-content">
        <div className="admin-content-header">
          <h2>Procesos terminados</h2>
          <p>Revisión final, rechazo con motivo o aprobación</p>
        </div>

        {/* Barra de pestañas sticky similar a Admin/Secretaria */}
        <div className="admin-tabs-sticky">
          <div className="admin-tabs-scroll" tabIndex={0}>
            <button
              className={`admin-tab-btn active`}
              title="Procesos terminados"
            >
              <span className="admin-tab-icon"><img src={iconEtapasProceso} alt="Procesos terminados" /></span>
              <span className="admin-tab-label">Procesos terminados</span>
            </button>
          </div>
        </div>

        <div className="admin-content-body">
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
                {Array.from(new Map(procesos.map(p => [p.id_empresa, p.nombre_empresa])).entries()).map(([id, nombre]) => (
                  <option key={id} value={String(id)}>{nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 600, color: '#000' }}>Mes</label>
              <select value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid #e9ecef', backgroundColor: 'white', color: 'black' }}>
                <option value="">Todos</option>
                {[
                  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
                  { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
                  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
                  { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
                ].map(m => (
                  <option key={m.value} value={String(m.value)}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 600, color: '#000' }}>Año</label>
              <select value={anioFiltro} onChange={(e) => setAnioFiltro(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid #e9ecef', backgroundColor: 'white', color: 'black' }}>
                <option value="">Todos</option>
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="crud-loading">Cargando procesos...</div>
          ) : procesos.length === 0 ? (
            <div className="crud-error">No hay procesos completados.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {procesos.map(p => {
                const isEntregado = !!p.fecha_completado || p.estado === 'Completado';
                const headerBg = isEntregado
                  ? 'linear-gradient(135deg, #1f5d32 0%, #2e7d32 100%)'
                  : 'linear-gradient(135deg, #122745 0%, #1e3a5f 100%)';
                return (
                <div key={p.id_proceso} style={{ background: 'white', border: '1px solid #e9ecef', borderRadius: 12 }}>
                  <button onClick={() => toggleExpand(p.id_proceso)} style={{
                    width: '100%', background: headerBg, color: 'white',
                    border: 'none', padding: '16px 18px', borderTopLeftRadius: 12, borderTopRightRadius: 12, cursor: 'pointer', textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{p.nombre_proceso}</div>
                        <div style={{ opacity: 0.85, fontSize: 12 }}>{p.nombre_empresa} • {p.tipo_proceso}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <div style={{ fontSize: 11, opacity: 0.9 }}>Creado: {formatDate(p.fecha_creacion)}</div>
                          {p.fecha_completado && (
                            <div style={{ fontSize: 11, opacity: 0.9 }}>Entregado: {formatDate(p.fecha_completado)}</div>
                          )}
                        </div>
                        <div style={{ fontSize: 18 }}>{expanded === p.id_proceso ? '▴' : '▾'}</div>
                      </div>
                    </div>
                  </button>

                  {expanded === p.id_proceso && (
                    <div className="v-scroll v-scroll-65vh" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10, color: '#495057' }}>
                        <span><strong>Estado:</strong> {p.estado}</span>
                        <span><strong>Creado:</strong> {formatDate(p.fecha_creacion)}</span>
                        {p.fecha_completado && (<span><strong>Completado:</strong> {formatDate(p.fecha_completado)}</span>)}
                      </div>

                      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }} onClick={() => {
                          setProcesoSeleccionado(p.id_proceso);
                          setAccion('rechazar');
                        }}>Rechazar</button>
                        <button className="crud-btn-create" onClick={() => {
                          setProcesoSeleccionado(p.id_proceso);
                          setPendingAccion('aprobar');
                          setPasswordModalOpen(true);
                        }}>Aprobar</button>
                      </div>

                      {/* Si está en modo rechazar, mostrar checkboxes de etapas previas y motivo por etapa */}
                      {accion === 'rechazar' && procesoSeleccionado === p.id_proceso && (
                        <>
                          {loadingEtapas[p.id_proceso] ? (
                            <div className="crud-loading">Cargando etapas...</div>
                          ) : (
                            <div style={{ marginTop: 16 }}>
                              <label style={{ fontWeight: 600, color: '#000' }}>Selecciona las etapas a rechazar:</label>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
                                {(etapas[p.id_proceso] || [])
                                  .filter(et => et.nombre_etapa !== 'Ingreso de papelería' && et.estado === 'Completada')
                                  .map(et => (
                                    <div key={et.id_etapa_proceso} style={{ background: 'white', color: '#000', borderRadius: 8, border: '1.5px solid #e9ecef', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                      <input
                                        type="checkbox"
                                        checked={rechazo[p.id_proceso]?.seleccionadas?.includes(et.id_etapa_proceso) || false}
                                        onChange={e => {
                                          setRechazo(prev => {
                                            const actual = prev[p.id_proceso] || { etapas: {}, seleccionadas: [] };
                                            const seleccionadas = e.target.checked
                                              ? [...actual.seleccionadas, et.id_etapa_proceso]
                                              : actual.seleccionadas.filter(id => id !== et.id_etapa_proceso);
                                            return {
                                              ...prev,
                                              [p.id_proceso]: {
                                                etapas: actual.etapas,
                                                seleccionadas
                                              }
                                            };
                                          });
                                        }}
                                      />
                                      <span style={{ fontWeight: 600 }}>{et.nombre_etapa}</span>
                                      <input
                                        type="text"
                                        placeholder="Motivo específico"
                                        value={rechazo[p.id_proceso]?.etapas?.[et.id_etapa_proceso] || ''}
                                        onChange={e => {
                                          setRechazo(prev => {
                                            const actual = prev[p.id_proceso] || { etapas: {}, seleccionadas: [] };
                                            return {
                                              ...prev,
                                              [p.id_proceso]: {
                                                etapas: { ...actual.etapas, [et.id_etapa_proceso]: e.target.value },
                                                seleccionadas: actual.seleccionadas
                                              }
                                            };
                                          });
                                        }}
                                        style={{ flex: 1, marginLeft: 8, borderRadius: 6, border: '1px solid #e9ecef', padding: '6px 8px', color: '#000', background: 'white' }}
                                      />
                                    </div>
                                  ))}
                              </div>
                              <button 
                                className="crud-btn-edit" 
                                style={{ marginTop: 8, background: '#A35D2D', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }} 
                                onClick={() => {
                                  // Solo mostrar modal si hay etapas seleccionadas y todas tienen motivo
                                  const etapasSeleccionadas = rechazo[p.id_proceso]?.seleccionadas || [];
                                  const motivosCompletos = etapasSeleccionadas.every(
                                    id => rechazo[p.id_proceso]?.etapas[id]?.trim()
                                  );
                                  
                                  if (etapasSeleccionadas.length === 0) {
                                    alert('Selecciona al menos una etapa para rechazar');
                                    return;
                                  }
                                  
                                  if (!motivosCompletos) {
                                    alert('Ingresa un motivo para cada etapa seleccionada');
                                    return;
                                  }
                                  
                                  setPendingAccion('rechazar');
                                  setPasswordModalOpen(true);
                                }}
                              >
                                Confirmar rechazo
                              </button>
                            </div>
                          )}
                        </>
                      )}

                      {/* Modal de contraseña con validación */}
                      {passwordModalOpen && procesoSeleccionado === p.id_proceso && (
                        <PasswordVerificationModal
                          isOpen={passwordModalOpen}
                          onClose={() => { setPasswordModalOpen(false); setPendingAccion(null); setProcesoSeleccionado(null); }}
                          onVerify={async (pwd) => {
                            if (pendingAccion === 'aprobar') {
                              return await aprobar(p.id_proceso, pwd);
                            } else if (pendingAccion === 'rechazar') {
                              return await rechazar(p.id_proceso, pwd);
                            }
                            return false;
                          }}
                          title={pendingAccion === 'aprobar' ? 'Confirmar aprobación' : 'Confirmar rechazo'}
                          message={pendingAccion === 'aprobar' ? 'Ingresa tu contraseña para aprobar el proceso.' : 'Ingresa tu contraseña para rechazar el proceso.'}
                        />
                      )}
                    </div>
                  )}
                </div>
              )})}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RevisorView
