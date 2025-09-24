import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import './AdminView.css'
import PasswordVerificationModal from './PasswordVerificationModal'

interface UserViewProps {
  nombre: string
}

interface ProcesoItem {
  id_proceso: number
  id_empresa: number
  id_cliente?: number
  nombre_proceso: string
  tipo_proceso: string
  estado?: string
  fecha_creacion?: string
  fecha_completado?: string | null
  nombre_empresa: string
  cliente_nombre?: string
  nombre_rol?: string
}

interface EtapaAsignadaItem {
  id_etapa_proceso: number
  id_proceso: number
  id_asignacion?: number
  id_rol?: number
  id_etapa: number
  estado: string
  fecha_inicio: string
  fecha_fin?: string | null
  nombre_etapa: string
  etapa_descripcion: string
  nombre_rol: string
}

type EstadoEtapa = 'Pendiente' | 'En progreso' | 'Completada' | 'Rechazada'

const UserView: React.FC<UserViewProps> = ({ nombre }) => {
  const [procesos, setProcesos] = useState<ProcesoItem[]>([])
  const [loadingProcesos, setLoadingProcesos] = useState(false)
  const [expandedProcesoId, setExpandedProcesoId] = useState<number | null>(null)
  const [etapasPorProceso, setEtapasPorProceso] = useState<Record<number, EtapaAsignadaItem[]>>({})
  const [loadingEtapas, setLoadingEtapas] = useState<Record<number, boolean>>({})

  // Filtros
  const [empresaFiltro, setEmpresaFiltro] = useState<string>('')
  const [rolFiltro, setRolFiltro] = useState<string>('')
  const [mesFiltro, setMesFiltro] = useState<string>('')
  const [anioFiltro, setAnioFiltro] = useState<string>('')

  // Modal de contraseña
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [pendingEtapaId, setPendingEtapaId] = useState<number | null>(null)

  const token = localStorage.getItem('token')

  const empresasDisponibles = useMemo(() => {
    const map = new Map<number, string>()
    procesos.forEach(p => map.set(p.id_empresa, p.nombre_empresa))
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [procesos])

  const rolesDisponibles = useMemo(() => {
    const set = new Set<string>()
    procesos.forEach(p => p.nombre_rol && set.add(p.nombre_rol))
    return Array.from(set.values())
  }, [procesos])

  const cargarProcesos = async () => {
    setLoadingProcesos(true)
    try {
      const params: any = {}
      if (empresaFiltro) params.empresa = empresaFiltro
      if (rolFiltro) params.rol = rolFiltro
      if (mesFiltro && anioFiltro) {
        params.month = mesFiltro
        params.year = anioFiltro
      }
      const { data } = await axios.get('http://localhost:4000/api/mis-procesos', {
        headers: { Authorization: `Bearer ${token}` },
        params
      })
      setProcesos(data.data || [])
    } catch (error) {
      console.error('Error cargando procesos del usuario:', error)
    } finally {
      setLoadingProcesos(false)
    }
  }

  const cargarEtapas = async (procesoId: number) => {
    setLoadingEtapas(prev => ({ ...prev, [procesoId]: true }))
    try {
      const { data } = await axios.get(`http://localhost:4000/api/mis-procesos/${procesoId}/etapas`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setEtapasPorProceso(prev => ({ ...prev, [procesoId]: data.data || [] }))
    } catch (error) {
      console.error('Error cargando etapas del proceso:', error)
    } finally {
      setLoadingEtapas(prev => ({ ...prev, [procesoId]: false }))
    }
  }

  useEffect(() => {
    cargarProcesos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaFiltro, rolFiltro, mesFiltro, anioFiltro])

  const toggleExpand = (procesoId: number) => {
    const newId = expandedProcesoId === procesoId ? null : procesoId
    setExpandedProcesoId(newId)
    if (newId && !etapasPorProceso[newId]) {
      cargarEtapas(newId)
    }
  }

  const solicitarCompletarEtapa = (etapaId: number, estadoActual: EstadoEtapa) => {
    if (estadoActual === 'Completada') return
    setPendingEtapaId(etapaId)
    setPasswordModalOpen(true)
  }

  const verificarContrasena = async (password: string) => {
    try {
      const resp = await axios.post(
        'http://localhost:4000/api/verify-password',
        { contrasena: password },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      return !!resp.data?.success
    } catch (e) {
      return false
    }
  }

  const onVerifyAndUpdate = async (password: string) => {
    if (!pendingEtapaId) return false
    try {
      const resp = await axios.put(
        `http://localhost:4000/api/etapas-proceso/${pendingEtapaId}`,
        { estado: 'Completada', contrasena: password },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (resp.data?.success) {
        if (expandedProcesoId) await cargarEtapas(expandedProcesoId)
        return true
      }
      return false
    } catch (error) {
      console.error('Error actualizando etapa:', error)
      return false
    }
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-ES')
  }

  return (
    <div className="admin-view-container">
      {/* Sidebar: solo 1 pestaña "Procesos" para mantener el diseño */}
      <div className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h3>Panel Usuario</h3>
          <p>Hola, {nombre}</p>
        </div>
        <nav className="admin-nav">
          <button className={`admin-nav-item active`}>
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Procesos</span>
          </button>
        </nav>
      </div>

      <div className="admin-main-content">
        <div className="admin-content-header">
          <h2>Procesos</h2>
          <p>Tus procesos en empresas asignadas</p>
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
              <select value={empresaFiltro} onChange={(e) => setEmpresaFiltro(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid #e9ecef' }}>
                <option value="">Todas</option>
                {empresasDisponibles.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 600, color: '#000' }}>Rol</label>
              <select value={rolFiltro} onChange={(e) => setRolFiltro(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid #e9ecef' }}>
                <option value="">Todos</option>
                {rolesDisponibles.map(rol => (
                  <option key={rol} value={rol}>{rol}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 600, color: '#000' }}>Mes</label>
              <select value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid #e9ecef' }}>
                <option value="">Todos</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 600, color: '#000' }}>Año</label>
              <select value={anioFiltro} onChange={(e) => setAnioFiltro(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid #e9ecef' }}>
                <option value="">Todos</option>
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Lista de procesos */}
          {loadingProcesos ? (
            <div className="crud-loading">Cargando procesos...</div>
          ) : procesos.length === 0 ? (
            <div className="crud-error">No hay procesos asignados.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {procesos.map(proceso => (
                <div key={proceso.id_proceso} style={{
                  background: 'white',
                  border: '1px solid #e9ecef',
                  borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
                }}>
                  <button onClick={() => toggleExpand(proceso.id_proceso)} style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #122745 0%, #1e3a5f 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '16px 18px',
                    borderTopLeftRadius: 12,
                    borderTopRightRadius: 12,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{proceso.nombre_proceso}</div>
                        <div style={{ opacity: 0.85, fontSize: 12 }}>{proceso.nombre_empresa} • {proceso.tipo_proceso}</div>
                      </div>
                      <div style={{ fontSize: 18 }}>{expandedProcesoId === proceso.id_proceso ? '▴' : '▾'}</div>
              </div>
                  </button>

                  {expandedProcesoId === proceso.id_proceso && (
                    <div style={{ padding: 16 }}>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10, color: '#495057' }}>
                        <span><strong>Estado:</strong> {proceso.estado || 'Activo'}</span>
                        <span><strong>Creado:</strong> {formatDate(proceso.fecha_creacion)}</span>
                        {proceso.fecha_completado && (
                          <span><strong>Completado:</strong> {formatDate(proceso.fecha_completado)}</span>
                        )}
                        {proceso.nombre_rol && (
                          <span><strong>Tu rol:</strong> {proceso.nombre_rol}</span>
                        )}
              </div>

                      {/* Línea de tiempo horizontal */}
                      <div>
                        <h4 style={{ margin: '8px 0 12px 0', color: '#2c3e50' }}>Etapas asignadas</h4>
                        {etapasPorProceso[proceso.id_proceso] && etapasPorProceso[proceso.id_proceso].length > 0 && (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, overflowX: 'auto' }}>
                            {etapasPorProceso[proceso.id_proceso]!.map((et, idx) => {
                              const estado = et.estado
                              const color = estado === 'Completada' ? '#28a745' : estado === 'En progreso' ? '#ffc107' : '#6c757d'
                              const isCurrent = estado === 'En progreso'
                              // Resaltar si la etapa corresponde a algún rol del empleado en la empresa del proceso
                              const isMine = true // el endpoint ya filtra por roles del empleado en esa empresa
                              const border = isCurrent ? '3px solid #1e3a5f' : isMine ? '2px dashed #1e3a5f' : '1px solid #dee2e6'
                              return (
                                <div key={`timeline-${et.id_etapa_proceso}`} style={{ minWidth: 160 }}>
                                  <div style={{ padding: 10, borderRadius: 10, background: 'white', border }}>
                                    <div style={{ fontWeight: 700, color: '#000' }}>{et.nombre_etapa}</div>
                                    <div style={{ marginTop: 6, fontSize: 12, color: '#495057' }}>Estado: <span style={{ color }}>{estado}</span></div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                        {loadingEtapas[proceso.id_proceso] ? (
                          <div className="crud-loading">Cargando etapas...</div>
                        ) : (etapasPorProceso[proceso.id_proceso]?.length || 0) === 0 ? (
                          <div className="crud-error">No tienes etapas asignadas en este proceso.</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {etapasPorProceso[proceso.id_proceso]!.map(et => {
                              const checked = et.estado === 'Completada'
                              return (
                                <div key={et.id_etapa_proceso} style={{ display: 'grid', gridTemplateColumns: '24px 1fr', gap: 10, alignItems: 'start' }}>
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={checked}
                                    onChange={() => solicitarCompletarEtapa(et.id_etapa_proceso, et.estado as EstadoEtapa)}
                                    style={{ marginTop: 4 }}
                                  />
                                  <div>
                                    <div style={{ fontWeight: 600, color: '#000' }}>{et.nombre_etapa}</div>
                                    <div style={{ fontSize: 13, color: '#495057' }}>{et.etapa_descripcion}</div>
                                    <div style={{ fontSize: 12, color: '#6c757d', marginTop: 4 }}>
                                      <span><strong>Estado:</strong> {et.estado}</span>{' • '}
                                      <span><strong>Inicio:</strong> {formatDate(et.fecha_inicio)}</span>{' • '}
                                      <span><strong>Fin:</strong> {formatDate(et.fecha_fin)}</span>
              </div>
            </div>
          </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de contraseña */}
      <PasswordVerificationModal
        isOpen={passwordModalOpen}
        onClose={() => { setPasswordModalOpen(false); setPendingEtapaId(null) }}
        onVerify={onVerifyAndUpdate}
        title="Verificación de Usuario"
        message="Confirma tu contraseña para marcar la etapa como completada"
      />
    </div>
  )
}

export default UserView


