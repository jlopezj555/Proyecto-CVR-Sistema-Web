import React, { useEffect, useState } from 'react'
import axios from 'axios'
import API_CONFIG from '../config/api'
import './AdminView.css'
import './EtapasCuentaView.css'
import iconProcesos from '../assets/admin-etapas-proceso-white.svg'
import ProcesosCRUD from './ProcesosCRUD'
import PasswordVerificationModal from './PasswordVerificationModal'

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


const SecretariaView: React.FC<{ nombre: string }> = ({ nombre }) => {
  const [activeTab, setActiveTab] = useState<'cuadernillos' | 'papeleria'>('cuadernillos')
  const token = localStorage.getItem('token')

  // Rol de sesión (leer y reaccionar a cambios)
    const [sessionRole, setSessionRole] = useState<string>(localStorage.getItem('rol') || '')

  useEffect(() => {
      const onStorage = () => setSessionRole(localStorage.getItem('rol') || '')
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  // Filtros de procesos
  const [empresaFiltro, setEmpresaFiltro] = useState<string>('')
  const [anioFiltro, setAnioFiltro] = useState<string>('')
  const [mesFiltro, setMesFiltro] = useState<string>('')

  // Procesos (solo cabecera + progreso)
  const [procesos, setProcesos] = useState<ProcesoItem[]>([])
    const [loadingProc, setLoadingProc] = useState(false)
  const [progreso, setProgreso] = useState<Record<number, { porcentaje: number, total: number, completadas: number }>>({})
  const [loadingProgreso, setLoadingProgreso] = useState<Record<number, boolean>>({})
  const [etapasPorProceso, setEtapasPorProceso] = useState<Record<number, any[]>>({})
  const [expandedProcesoId, setExpandedProcesoId] = useState<number | null>(null)
  const [confirmPwdOpenForProceso, setConfirmPwdOpenForProceso] = useState<number | null>(null)
  const [confirmPwdError, setConfirmPwdError] = useState<string>('')

  const cargarProcesos = async () => {
    setLoadingProc(true)
    try {
      const params: any = {};
      if (sessionRole) params.rol = sessionRole;
      if (empresaFiltro) params.empresa = empresaFiltro;
      // En el nuevo esquema, filtrar directamente por mes y año almacenados en Proceso
      if (mesFiltro) params.month = Number(mesFiltro);
      if (anioFiltro) params.year = Number(anioFiltro);

      const { data } = await axios.get<any>(`${API_CONFIG.BASE_URL}/api/mis-procesos`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      })
      setProcesos(data.data || [])
    } catch (e) {
      console.error('Error cargando procesos secretaria:', e)
    } finally {
      setLoadingProc(false)
    }
  }

  const cargarProgreso = async (id: number) => {
    setLoadingProgreso(prev => ({ ...prev, [id]: true }))
    try {
      const { data } = await axios.get<any>(`${API_CONFIG.BASE_URL}/api/procesos/${id}/progreso`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const payload = data?.data || { porcentaje: 0, total: 0, completadas: 0 }
      setProgreso(prev => ({ ...prev, [id]: payload }))
    } catch (e) {
      console.error('Error cargando progreso del proceso:', e)
    } finally {
      setLoadingProgreso(prev => ({ ...prev, [id]: false }))
    }
  }

  const cargarEtapasProceso = async (id: number) => {
    try {
      const params: any = {}
  if (sessionRole) params.rol = sessionRole
      const { data } = await axios.get<any>(`${API_CONFIG.BASE_URL}/api/mis-procesos/${id}/etapas`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      })
      setEtapasPorProceso(prev => ({ ...prev, [id]: data?.data || [] }))
    } catch (e) {
      console.error('Error cargando etapas del proceso:', e)
      setEtapasPorProceso(prev => ({ ...prev, [id]: [] }))
    }
  }

  // Cargar procesos cuando cambien los filtros o la pestaña
  useEffect(() => { 
    if (activeTab === 'cuadernillos') {
      cargarProcesos()
    }
  }, [empresaFiltro, mesFiltro, anioFiltro, activeTab, sessionRole])

  // Cargar progreso para todos los procesos listados
  useEffect(() => {
    if (!procesos || procesos.length === 0) return
    procesos.forEach(p => {
      if (!progreso[p.id_proceso]) cargarProgreso(p.id_proceso)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [procesos])

  
  
  
  
  
  
  
  
  
  
  
  const toggleProceso = (procesoId: number) => {
    const newId = expandedProcesoId === procesoId ? null : procesoId
    setExpandedProcesoId(newId)
    if (newId) {
      if (!progreso[newId]) {
        cargarProgreso(newId)
      }
      if (!etapasPorProceso[newId]) {
        cargarEtapasProceso(newId)
      }
    }
  }

  const formatDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString('es-ES') : '-')

  const getProcesoEstado = (proceso: ProcesoItem) => {
    const etapas = etapasPorProceso[proceso.id_proceso] || []
    const tieneRechazada = etapas.some((e: any) => e.estado === 'Rechazada')
    const isEntregado = !!proceso.fecha_completado || proceso.estado === 'Completado'
    
    if (tieneRechazada) return 'rechazado'
    if (isEntregado) return 'entregado'
    return 'normal'
  }

  const getProcesoColor = (estado: string) => {
    switch (estado) {
      case 'entregado':
        return 'linear-gradient(135deg, #1f5d32 0%, #2e7d32 100%)'
      case 'rechazado':
        return 'linear-gradient(135deg, #8B1E1E 0%, #C62828 100%)'
      default:
        return 'linear-gradient(135deg, #122745 0%, #1e3a5f 100%)'
    }
  }

  return (
    <div className="admin-view-container">
      <div className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h3>Panel Secretaria</h3>
          <p>Hola, {nombre}</p>
        </div>
        <nav className="admin-nav">
          <button className={`admin-nav-item ${activeTab === 'cuadernillos' ? 'active' : ''}`} onClick={() => setActiveTab('cuadernillos')}>
            <span className="nav-icon"><img src={iconProcesos} alt="Cuadernillos" className="nav-icon-img" /></span>
            <span className="nav-label">Cuadernillos</span>
          </button>
          <button className={`admin-nav-item ${activeTab === 'papeleria' ? 'active' : ''}`} onClick={() => setActiveTab('papeleria')}>
            <span className="nav-icon"><img src={iconProcesos} alt="Papelería" className="nav-icon-img" /></span>
            <span className="nav-label">Papelería</span>
          </button>
        </nav>
      </div>

      <div className="admin-main-content">
        <div className="admin-content-header">
          <h2>{activeTab === 'cuadernillos' ? 'Cuadernillos' : 'Papelería'}</h2>
          <p>Etapas de ingreso/envío de papelería</p>
        </div>
        {/* Barra de pestañas sticky debajo del header */}
        <div className="admin-tabs-sticky">
          <div className="admin-tabs-scroll" tabIndex={0}>
            <button
              className={`admin-tab-btn${activeTab === 'cuadernillos' ? ' active' : ''}`}
              onClick={() => setActiveTab('cuadernillos')}
              title="Cuadernillos"
            >
              <span className="admin-tab-icon"><img src={iconProcesos} alt="Cuadernillos" /></span>
              <span className="admin-tab-label">Cuadernillos</span>
            </button>
            <button
              className={`admin-tab-btn${activeTab === 'papeleria' ? ' active' : ''}`}
              onClick={() => setActiveTab('papeleria')}
              title="Papelería"
            >
              <span className="admin-tab-icon"><img src={iconProcesos} alt="Papelería" /></span>
              <span className="admin-tab-label">Papelería</span>
            </button>
          </div>
        </div>
        <div className="admin-content-body">
          {activeTab === 'cuadernillos' && (
            <div className="etapas-cuenta-container">
              <h2>Gestión de Cuadernillos</h2>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                <div>
                  <label>Empresa</label>
                  <select value={empresaFiltro} onChange={(e) => setEmpresaFiltro(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid #e9ecef', backgroundColor: 'white', color: 'black' }}>
                    <option value="">Todas</option>
                    {Array.from(new Map(procesos.map(p => [p.id_empresa, p.nombre_empresa])).entries()).map(([id, nombre]) => (
                      <option key={id} value={String(id)}>{nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Año</label>
                  <select value={anioFiltro} onChange={(e) => setAnioFiltro(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid #e9ecef', backgroundColor: 'white', color: 'black' }}>
                    <option value="">Todos</option>
                    {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(y => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Mes</label>
                  <select value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid #e9ecef', backgroundColor: 'white', color: 'black' }}>
                    <option value="">Todos</option>
                    {[{value:1,label:'Enero'},{value:2,label:'Febrero'},{value:3,label:'Marzo'},{value:4,label:'Abril'},{value:5,label:'Mayo'},{value:6,label:'Junio'},{value:7,label:'Julio'},{value:8,label:'Agosto'},{value:9,label:'Septiembre'},{value:10,label:'Octubre'},{value:11,label:'Noviembre'},{value:12,label:'Diciembre'}].map(m => (
                      <option key={m.value} value={String(m.value)}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {loadingProc ? (
                <div className="loading">Cargando procesos...</div>
              ) : procesos.length === 0 ? (
                <div className="no-data">No hay procesos registrados.</div>
              ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                  {procesos.map((p) => {
                    const estadoProceso = getProcesoEstado(p)
                    const headerBg = getProcesoColor(estadoProceso)
                    const isEntregado = estadoProceso === 'entregado'
                    const tieneRechazada = estadoProceso === 'rechazado'
                    return (
                    <div key={p.id_proceso} style={{ 
                      background: 'white', 
                      border: tieneRechazada ? '2.5px solid #dc3545' : '1px solid #e9ecef', 
                      borderRadius: 12, 
                      boxShadow: tieneRechazada ? '0 0 0 2px #dc3545' : '0 8px 24px rgba(0,0,0,0.06)' 
                    }}>
                      {/* Encabezado colapsable */}
                      <button onClick={() => toggleProceso(p.id_proceso)} style={{
                        width: '100%',
                        background: headerBg,
                        color: 'white', border: 'none', padding: '14px 16px',
                        borderTopLeftRadius: 12, borderTopRightRadius: 12, cursor: 'pointer', textAlign: 'left'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{p.nombre_proceso}</div>
                            <div style={{ opacity: 0.85, fontSize: 11 }}>{p.nombre_empresa} • {p.tipo_proceso}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                              <div style={{ fontSize: 11, opacity: 0.9 }}>Creado: {formatDate(p.fecha_creacion)}</div>
                              {isEntregado && (
                                <div style={{ fontSize: 11, opacity: 0.9 }}>Entregado: {formatDate(p.fecha_completado)}</div>
                              )}
                            </div>
                            <div style={{ fontSize: 18 }}>{expandedProcesoId === p.id_proceso ? '▴' : '▾'}</div>
                          </div>
                        </div>
                      </button>

                      {expandedProcesoId === p.id_proceso && (
                        <div style={{ padding: 12 }}>
                          {/* Etapas del proceso con scroll horizontal */}
                          <div style={{ marginBottom: 16 }}>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: '#000' }}>Etapas del Proceso</h4>
                            <div style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden', paddingBottom: 8 }}>
                              <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 8, alignItems: 'stretch', minWidth: 'max-content' }}>
                                {(etapasPorProceso[p.id_proceso] || []).map((etapa: any) => (
                                  <div key={etapa.id_etapa_proceso} style={{ minWidth: 140, flex: '0 0 auto', background: 'white', border: '1px solid #dee2e6', borderRadius: 10, padding: 8, textAlign: 'center' }}>
                                    <div style={{ fontWeight: 700, color: '#000', fontSize: 13 }}>{etapa.nombre_etapa}</div>
                                    <div style={{ marginTop: 4, fontSize: 11, color: '#495057' }}>Estado: <span style={{ color: etapa.estado === 'Completada' ? '#28a745' : etapa.estado === 'En progreso' ? '#ffc107' : etapa.estado === 'Rechazada' ? '#dc3545' : '#6c757d' }}>{etapa.estado}</span></div>
                                    {etapa.nombre_rol && (
                                      <div style={{ marginTop: 4, fontSize: 11, color: '#495057' }}>Rol: {etapa.nombre_rol}</div>
                                    )}
                                    <div style={{ marginTop: 4, fontSize: 11, color: '#495057' }}>Responsable: {etapa.responsable_nombres || 'Vacante'}</div>
                                    {etapa.estado === 'Rechazada' && etapa.motivo_rechazo && (
                                      <div style={{ color: '#dc3545', marginTop: 4, fontSize: 12 }}>
                                        <strong>Motivo rechazo:</strong> {etapa.motivo_rechazo}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Barra de progreso */}
                          {loadingProgreso[p.id_proceso] ? (
                            <div className="loading">Calculando progreso...</div>
                          ) : (
                            (() => {
                              const prog = progreso[p.id_proceso]
                              const pct = prog?.porcentaje ?? 0
                              const completadas = prog?.completadas ?? 0
                              const total = prog?.total ?? 0
                              const isAlmostComplete = completadas === total - 1 && pct < 100
                              return (
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ fontWeight: 600, color: '#000', fontSize: 13 }}>Avance del proceso</span>
                                    <span style={{ color: '#000', fontSize: 12 }}>{pct}%</span>
                                  </div>
                                  <div style={{ position: 'relative', height: 10, background: '#e9ecef', borderRadius: 999, overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${pct}%`, background: 'linear-gradient(90deg, #1e3a5f, #4e7ab5)', borderRadius: 999, transition: 'width 600ms ease' }} />
                                  </div>
                                  {isAlmostComplete && (
                                    <div style={{ marginTop: 12 }}>
                                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <span style={{ color: 'black', fontWeight: 600 }}>¡Solo falta una etapa para completar el proceso!</span>
                                        <button
                                          className="crud-btn-save"
                                          onClick={() => setConfirmPwdOpenForProceso(p.id_proceso)}
                                          title="Confirmar envío"
                                          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                                        >
                                          Confirmar envío
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })()
                          )}
                        </div>
                      )}
                    </div>
                  )})}
                </div>
              )}
            </div>
          )}
          {activeTab === 'papeleria' && (
            <div>
              <ProcesosCRUD />
            </div>
          )}
          {/* Modal de verificación para confirmar envío */}
          {confirmPwdOpenForProceso !== null && (
            <PasswordVerificationModal
              isOpen={confirmPwdOpenForProceso !== null}
              onClose={() => { setConfirmPwdOpenForProceso(null); setConfirmPwdError(''); }}
              onVerify={async (pwd: string) => {
                try {
                  await axios.post(`${API_CONFIG.BASE_URL}/api/procesos/${confirmPwdOpenForProceso}/confirmar-envio`, { contrasena: pwd }, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  setConfirmPwdOpenForProceso(null);
                  setConfirmPwdError('');
                  await cargarProcesos();
                  return true;
                } catch (e: any) {
                  const msg = e?.response?.data?.message || 'Error al confirmar envío';
                  setConfirmPwdError(msg);
                  return false;
                }
              }}
              title="Confirmar envío"
              message="Ingresa tu contraseña para confirmar el envío de este cuadernillo."
              errorMessage={confirmPwdError}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default SecretariaView
