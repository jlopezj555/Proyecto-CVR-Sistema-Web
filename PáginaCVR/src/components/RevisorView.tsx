import React, { useEffect, useState } from 'react'
import axios from 'axios'
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
}

const RevisorView: React.FC<{ nombre: string }> = ({ nombre }) => {
  const token = localStorage.getItem('token')
  const [procesos, setProcesos] = useState<ProcesoItem[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)
  const [etapas, setEtapas] = useState<Record<number, EtapaItem[]>>({})
  const [loading, setLoading] = useState(false)
  const [loadingEtapas, setLoadingEtapas] = useState<Record<number, boolean>>({})

  const [rechazo, setRechazo] = useState<{ [procesoId: number]: { etapas: Set<number>, motivo: string } }>({})
  const [password, setPassword] = useState('')
  const [nivelRevision, setNivelRevision] = useState<1 | 2 | 3>(1)

  useEffect(() => {
    // Obtener nivel de revisión del usuario autenticado si el backend lo expone
    // fallback: intentar desde token/rol (no implementado aquí), dejar control manual por ahora
    // setNivelRevision(1|2|3)
  }, [])

  const loadProcesos = async () => {
    setLoading(true)
    try {
      // endpoint acepta query param nivel para filtrar según regla solicitada
      const { data } = await axios.get('http://localhost:4000/api/revisor/procesos-terminados', {
        headers: { Authorization: `Bearer ${token}` },
        params: { nivel: nivelRevision }
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
      const { data } = await axios.get(`http://localhost:4000/api/revisor/procesos/${id}/etapas`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setEtapas(prev => ({ ...prev, [id]: data.data || [] }))
    } catch (e) {
      console.error('Error cargando etapas:', e)
    } finally {
      setLoadingEtapas(prev => ({ ...prev, [id]: false }))
    }
  }

  useEffect(() => { loadProcesos() }, [nivelRevision])

  const toggleExpand = (id: number) => {
    const n = expanded === id ? null : id
    setExpanded(n)
    if (n && !etapas[n]) loadEtapas(n)
  }

  const toggleEtapaRechazo = (procesoId: number, etapaId: number) => {
    setRechazo(prev => {
      const curr = prev[procesoId] || { etapas: new Set<number>(), motivo: '' }
      const newSet = new Set(curr.etapas)
      if (newSet.has(etapaId)) newSet.delete(etapaId); else newSet.add(etapaId)
      return { ...prev, [procesoId]: { ...curr, etapas: newSet } }
    })
  }

  const setMotivo = (procesoId: number, motivo: string) => {
    setRechazo(prev => ({ ...prev, [procesoId]: { ...(prev[procesoId] || { etapas: new Set<number>(), motivo: '' }), motivo } }))
  }

  const rechazar = async (procesoId: number) => {
    try {
      const payload = {
        etapasFallidas: Array.from(rechazo[procesoId]?.etapas || []),
        motivo: rechazo[procesoId]?.motivo || '',
        contrasena: password
      }
      const { data } = await axios.post(`http://localhost:4000/api/revisor/procesos/${procesoId}/rechazar`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (data.success !== false) {
        await loadProcesos()
        setExpanded(null)
      }
    } catch (e) { console.error('Error rechazando:', e) }
  }

  const aprobar = async (procesoId: number) => {
    try {
      const payload = { contrasena: password }
      const { data } = await axios.post(`http://localhost:4000/api/revisor/procesos/${procesoId}/aprobar`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (data.success !== false) {
        await loadProcesos()
        setExpanded(null)
      }
    } catch (e) { console.error('Error aprobando:', e) }
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

        <div className="admin-content-body">
          <div style={{ background: 'white', border: '1px solid #e9ecef', borderRadius: 12, padding: 12, marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontWeight: 600, marginRight: 8 }}>Contraseña:</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '2px solid #e9ecef' }} />
            </div>
            <div>
              <label style={{ fontWeight: 600, marginRight: 8 }}>Nivel:</label>
              <select value={nivelRevision} onChange={e => setNivelRevision(Number(e.target.value) as 1 | 2 | 3)} style={{ padding: '8px 10px', borderRadius: 8, border: '2px solid #e9ecef', backgroundColor: 'white', color: 'black' }}>
                <option value={1}>Revisión 1</option>
                <option value={2}>Revisión 2</option>
                <option value={3}>Revisión 3</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="crud-loading">Cargando procesos...</div>
          ) : procesos.length === 0 ? (
            <div className="crud-error">No hay procesos completados.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {procesos.map(p => (
                <div key={p.id_proceso} style={{ background: 'white', border: '1px solid #e9ecef', borderRadius: 12 }}>
                  <button onClick={() => toggleExpand(p.id_proceso)} style={{
                    width: '100%', background: 'linear-gradient(135deg, #122745 0%, #1e3a5f 100%)', color: 'white',
                    border: 'none', padding: '16px 18px', borderTopLeftRadius: 12, borderTopRightRadius: 12, cursor: 'pointer', textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{p.nombre_proceso}</div>
                        <div style={{ opacity: 0.85, fontSize: 12 }}>{p.nombre_empresa} • {p.tipo_proceso}</div>
                      </div>
                      <div style={{ fontSize: 18 }}>{expanded === p.id_proceso ? '▴' : '▾'}</div>
                    </div>
                  </button>

                  {expanded === p.id_proceso && (
                    <div style={{ padding: 16 }}>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10, color: '#495057' }}>
                        <span><strong>Estado:</strong> {p.estado}</span>
                        <span><strong>Creado:</strong> {formatDate(p.fecha_creacion)}</span>
                        {p.fecha_completado && (<span><strong>Completado:</strong> {formatDate(p.fecha_completado)}</span>)}
                      </div>

                      {loadingEtapas[p.id_proceso] ? (
                        <div className="crud-loading">Cargando etapas...</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {(etapas[p.id_proceso] || []).map(et => (
                            <div key={et.id_etapa_proceso} style={{ padding: 10, background: 'white', border: '1px solid #dee2e6', borderRadius: 8 }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr', gap: 10 }}>
                                <input
                                  type="checkbox"
                                  checked={!!rechazo[p.id_proceso]?.etapas?.has(et.id_etapa_proceso)}
                                  onChange={() => toggleEtapaRechazo(p.id_proceso, et.id_etapa_proceso)}
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
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ marginTop: 12 }}>
                        <label style={{ fontWeight: 600 }}>Motivo del rechazo (opcional):</label>
                        <textarea value={rechazo[p.id_proceso]?.motivo || ''} onChange={e => setMotivo(p.id_proceso, e.target.value)} rows={3} style={{ width: '100%', padding: 10, borderRadius: 8, border: '2px solid #e9ecef' }} />
                      </div>

                      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="crud-btn-edit" onClick={() => rechazar(p.id_proceso)}>Rechazar</button>
                        <button className="crud-btn-create" onClick={() => aprobar(p.id_proceso)}>Aprobar</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RevisorView
