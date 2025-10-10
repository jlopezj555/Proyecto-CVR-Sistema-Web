import React, { useEffect, useState } from 'react'
import axios from 'axios'
import API_CONFIG from '../config/api'
import './AdminView.css'
import './EtapasCuentaView.css'
import iconProcesos from '../assets/admin-procesos-white.svg'
import iconPapeleria from '../assets/admin-papeleria-white.svg'
import CRUDTable from './CRUDTable'

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
  const [activeTab, setActiveTab] = useState<'procesos' | 'papeleria'>('procesos')
  const token = localStorage.getItem('token')

  // Filtros de procesos
  const [empresaFiltro, setEmpresaFiltro] = useState<string>('')
  const [anioFiltro, setAnioFiltro] = useState<string>('')
  const [mesFiltro, setMesFiltro] = useState<string>('')

  // Procesos (solo cabecera + progreso)
  const [procesos, setProcesos] = useState<ProcesoItem[]>([])
    const [loadingProc, setLoadingProc] = useState(false)
  const [progreso, setProgreso] = useState<Record<number, { porcentaje: number, total: number, completadas: number }>>({})
  const [loadingProgreso, setLoadingProgreso] = useState<Record<number, boolean>>({})
  const [empresasAsignadas, setEmpresasAsignadas] = useState<{ value: number, label: string }[]>([])
  const [expandedProcesoId, setExpandedProcesoId] = useState<number | null>(null)

  const cargarProcesos = async () => {
    setLoadingProc(true)
    try {
      // Usar los mismos nombres de params que en EtapasProcesoView (`year`, `month`)
      const params: any = {}
      if (empresaFiltro) params.empresa = empresaFiltro
      const month = mesFiltro
      const year = anioFiltro
      // si se seleccionó mes pero no año, asumir año actual (comportamiento previo)
      if (month && !year) params.year = String(new Date().getFullYear())
      if (year) params.year = year
      if (month) params.month = month

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

  useEffect(() => { cargarProcesos() }, [empresaFiltro, mesFiltro, anioFiltro])

  // Refrescar al entrar en la pestaña de procesos
  useEffect(() => {
    if (activeTab === 'procesos') cargarProcesos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const cargarMisEmpresas = async () => {
    try {
      const { data } = await axios.get<any>(`${API_CONFIG.BASE_URL}/api/mis-empresas`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const opts = (data?.data || []).map((e: any) => ({ value: e.id_empresa, label: e.nombre_empresa }))
      setEmpresasAsignadas(opts)
    } catch (e) {
      // Fallback: derivar desde procesos si el endpoint no existe
      const _err = e as any
      console.warn('Error cargando mis empresas, usando fallback:', _err)
      const fallback = Array.from(new Map(procesos.map(p => [p.id_empresa, p.nombre_empresa])).entries())
        .map(([value, label]) => ({ value: Number(value), label: String(label) }))
      setEmpresasAsignadas(fallback)
    }
  }

  useEffect(() => {
    if (activeTab === 'papeleria') cargarMisEmpresas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

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
    if (newId && !progreso[newId]) {
      cargarProgreso(newId)
    }
  }

  const formatDate = (s?: string | null) => (s ? new Date(s).toLocaleDateString('es-ES') : '-')

  return (
    <div className="admin-view-container">
      <div className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h3>Panel Secretaria</h3>
          <p>Hola, {nombre}</p>
        </div>
        <nav className="admin-nav">
          <button className={`admin-nav-item ${activeTab === 'procesos' ? 'active' : ''}`} onClick={() => setActiveTab('procesos')}>
            <span className="nav-icon"><img src={iconProcesos} alt="Procesos" className="nav-icon-img" /></span>
            <span className="nav-label">Procesos</span>
          </button>
          <button className={`admin-nav-item ${activeTab === 'papeleria' ? 'active' : ''}`} onClick={() => setActiveTab('papeleria')}>
            <span className="nav-icon"><img src={iconPapeleria} alt="Papelería" className="nav-icon-img" /></span>
            <span className="nav-label">Papelería</span>
          </button>
        </nav>
      </div>

      <div className="admin-main-content">
        <div className="admin-content-header">
          <h2>{activeTab === 'procesos' ? 'Procesos' : 'Papelería'}</h2>
          <p>{activeTab === 'procesos' ? 'Etapas de ingreso/envío de papelería' : 'Registrar, editar, y entregar papelería'}</p>
        </div>

        <div className="admin-content-body">
          {activeTab === 'procesos' && (
            <div className="etapas-cuenta-container">
              <h2>Gestión de Etapas de Procesos</h2>

              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
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
                  {procesos.map((p) => (
                    <div key={p.id_proceso} style={{ background: 'white', border: '1px solid #e9ecef', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
                      {/* Encabezado colapsable (idéntico al admin) */}
                      <button onClick={() => toggleProceso(p.id_proceso)} style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #122745 0%, #1e3a5f 100%)',
                        color: 'white', border: 'none', padding: '14px 16px',
                        borderTopLeftRadius: 12, borderTopRightRadius: 12, cursor: 'pointer', textAlign: 'left'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{p.nombre_proceso}</div>
                            <div style={{ opacity: 0.85, fontSize: 11 }}>{p.nombre_empresa} • {p.tipo_proceso}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ fontSize: 11, opacity: 0.9 }}>Creado: {formatDate(p.fecha_creacion)}</div>
                            <div style={{ fontSize: 18 }}>{expandedProcesoId === p.id_proceso ? '▴' : '▾'}</div>
                          </div>
                        </div>
                      </button>

                      {expandedProcesoId === p.id_proceso && (
                        <div className="v-scroll v-scroll-60vh" style={{ padding: 12 }}>
                          {/* Solo barra de progreso y porcentaje */}
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
                                      <button
                                        onClick={() => {
                                          // TODO: implement confirm envio
                                          if (window.confirm('¿Confirmar envío del proceso?')) {
                                            // call endpoint
                                            axios.post(`${API_CONFIG.BASE_URL}/api/procesos/${p.id_proceso}/confirmar-envio`, {}, { headers: { Authorization: `Bearer ${token}` } })
                                              .then(() => { cargarProcesos(); cargarProgreso(p.id_proceso); })
                                              .catch(err => console.error('Error confirmando envío:', err))
                                          }
                                        }}
                                        style={{ background: '#28a745', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}
                                      >
                                        Confirmar envío
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )
                            })()
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'papeleria' && (
            <>
              {/* Cargar empresas asignadas a la secretaria a partir de mis-procesos */}
              {/* Deriva empresas únicas para el select de creación */}
              <CRUDTable
                title="Papelería"
                endpoint="papeleria"
                columns={[
                  { key: 'id_papeleria', label: 'ID' },
                  { key: 'nombre_empresa', label: 'Empresa' },
                  { key: 'tipo_papeleria', label: 'Tipo' },
                  { key: 'descripcion', label: 'Descripción' },
                  { key: 'estado', label: 'Estado' },
                  { key: 'nombre_proceso', label: 'Proceso' },
                  { key: 'fecha_recepcion', label: 'Fecha Recepción' },
                  { key: 'fecha_entrega', label: 'Fecha Entrega' }
                ]}
                createFields={(() => {
                  const token = localStorage.getItem('token') || ''
                  const opcionesEmpresas = (empresasAsignadas && empresasAsignadas.length > 0)
                    ? empresasAsignadas
                    : Array.from(new Map(procesos.map(p => [p.id_empresa, p.nombre_empresa])).entries())
                        .map(([value, label]) => ({ value: Number(value), label: String(label) }))
                  return [
                    { key: 'id_empresa', label: 'Empresa', type: 'select' as const, required: true, options: opcionesEmpresas },
                    { key: 'tipo_papeleria', label: 'Tipo de Papelería', type: 'select' as const, required: true,
                      dynamicOptions: async (formData) => {
                        const empresaSel = formData['id_empresa']
                        if (!empresaSel) return []
                        try {
                          const resp = await fetch(`${API_CONFIG.BASE_URL}/api/papeleria/available-tipos?empresa=${empresaSel}`, {
                            headers: { Authorization: `Bearer ${token}` }
                          })
                          const json = await resp.json()
                          const list = json?.data || []
                          return list.map((t: string) => ({ value: t, label: t }))
                        } catch (_) {
                          return []
                        }
                      },
                      dependsOnKeys: ['id_empresa'],
                      disabledWhen: (fd) => !fd['id_empresa']
                    },
                    { key: 'descripcion', label: 'Descripción', type: 'text' as const, required: true }
                  ]
                })()}
                editFields={[
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
                ]}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default SecretariaView
