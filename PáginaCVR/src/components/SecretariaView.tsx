import React, { useEffect, useState } from 'react'
import axios from 'axios'
import './AdminView.css'
import iconProcesos from '../assets/admin-procesos-white.svg'
import iconPapeleria from '../assets/admin-papeleria-white.svg'
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

const SecretariaView: React.FC<{ nombre: string }> = ({ nombre }) => {
  const [activeTab, setActiveTab] = useState<'procesos' | 'papeleria'>('procesos')
  const token = localStorage.getItem('token')

  // Procesos y etapas filtradas (solo ingreso/envío de papelería)
  const [procesos, setProcesos] = useState<ProcesoItem[]>([])
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [etapas, setEtapas] = useState<Record<number, EtapaItem[]>>({})
  const [loadingProc, setLoadingProc] = useState(false)
  const [loadingEtapas, setLoadingEtapas] = useState<Record<number, boolean>>({})

  const cargarProcesos = async () => {
    setLoadingProc(true)
    try {
      // Reutilizamos mis-procesos (empleado) para empresas asignadas
      const { data } = await axios.get('http://localhost:4000/api/mis-procesos', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setProcesos(data.data || [])
    } catch (e) {
      console.error('Error cargando procesos secretaria:', e)
    } finally {
      setLoadingProc(false)
    }
  }

  const cargarEtapas = async (id: number) => {
    setLoadingEtapas(prev => ({ ...prev, [id]: true }))
    try {
      const { data } = await axios.get(`http://localhost:4000/api/mis-procesos/${id}/etapas`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      // Filtrar solo etapas de ingreso/envío de papelería por nombre
      const filtered = (data.data || []).filter((e: EtapaItem) => {
        const n = (e.nombre_etapa || '').toLowerCase()
        return n.includes('ingreso') || n.includes('envío') || n.includes('envio') || n.includes('papeler')
      })
      setEtapas(prev => ({ ...prev, [id]: filtered }))
    } catch (e) {
      console.error('Error cargando etapas secretaria:', e)
    } finally {
      setLoadingEtapas(prev => ({ ...prev, [id]: false }))
    }
  }

  useEffect(() => { cargarProcesos() }, [])

  const toggleExpand = (id: number) => {
    const newId = expandedId === id ? null : id
    setExpandedId(newId)
    if (newId && !etapas[newId]) cargarEtapas(newId)
  }

  // Papelería CRUD (lista + crear + editar + eliminar + marcar entregada)
  const [papeleria, setPapeleria] = useState<any[]>([])
  const [empresas, setEmpresas] = useState<any[]>([])
  const [form, setForm] = useState({ id_cliente: '', id_empresa: '', tipo_papeleria: 'Venta', descripcion: '' })
  const [loadingPap, setLoadingPap] = useState(false)
  const [creating, setCreating] = useState(false)

  // edición/eliminación
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ descripcion: '', tipo_papeleria: 'Venta', estado: 'Recibida', fecha_entrega: '' })
  const [pendingAction, setPendingAction] = useState<'update' | 'delete' | null>(null)
  const [showPwd, setShowPwd] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)

  const cargarPapeleria = async () => {
    setLoadingPap(true)
    try {
      // usar endpoints de admin para tener mismas capacidades
      const { data } = await axios.get('http://localhost:4000/api/papeleria', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPapeleria(data.data || [])
    } catch (e) {
      console.error('Error listando papelería secretaria:', e)
    } finally {
      setLoadingPap(false)
    }
  }

  const cargarCatalogos = async () => {
    try {
      const [emp] = await Promise.all([
        axios.get('http://localhost:4000/api/empresas', { headers: { Authorization: `Bearer ${token}` } })
      ])
      setEmpresas(emp.data.data || [])
    } catch (e) {
      console.error('Error cargando catálogos:', e)
    }
  }

  useEffect(() => {
    if (activeTab === 'papeleria') {
      cargarPapeleria()
      cargarCatalogos()
    }
  }, [activeTab])

  const crearPapeleria = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      await axios.post('http://localhost:4000/api/papeleria', { id_empresa: form.id_empresa, tipo_papeleria: form.tipo_papeleria, descripcion: form.descripcion }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setForm({ id_cliente: '', id_empresa: '', tipo_papeleria: 'Venta', descripcion: '' })
      await cargarPapeleria()
    } catch (e) {
      console.error('Error creando papelería:', e)
    } finally {
      setCreating(false)
    }
  }

  const abrirEditar = (item: any) => {
    setEditingId(item.id_papeleria)
    setEditForm({
      descripcion: item.descripcion || '',
      tipo_papeleria: item.tipo_papeleria || 'Venta',
      estado: item.estado || 'Recibida',
      fecha_entrega: item.fecha_entrega ? item.fecha_entrega.substring(0, 10) : ''
    })
  }

  const solicitarActualizar = (item: any) => {
    setSelectedItem(item)
    setPendingAction('update')
    setShowPwd(true)
  }

  const solicitarEliminar = (item: any) => {
    setSelectedItem(item)
    setPendingAction('delete')
    setShowPwd(true)
  }

  const onVerify = async (password: string): Promise<boolean> => {
    try {
      if (!selectedItem) return false
      if (pendingAction === 'update') {
        const id = selectedItem.id_papeleria
        const payload = { ...editForm, adminContrasena: password }
        await axios.put(`http://localhost:4000/api/papeleria/${id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } else if (pendingAction === 'delete') {
        const id = selectedItem.id_papeleria
        await axios.delete(`http://localhost:4000/api/papeleria/${id}`,
          { data: { adminContrasena: password }, headers: { Authorization: `Bearer ${token}` } }
        )
      }
      setShowPwd(false)
      setPendingAction(null)
      setSelectedItem(null)
      setEditingId(null)
      await cargarPapeleria()
      return true
    } catch (e) {
      console.error('Error en operación protegida:', e)
      return false
    }
  }

  const marcarEntregada = async (id_papeleria: number) => {
    try {
      await axios.put(`http://localhost:4000/api/papeleria/${id_papeleria}`, { estado: 'Entregada', fecha_entrega: new Date().toISOString().substring(0,10) }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      await cargarPapeleria()
    } catch (e) { console.error('Error marcando entregada:', e) }
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
            <>
              {loadingProc ? (
                <div className="crud-loading">Cargando procesos...</div>
              ) : procesos.length === 0 ? (
                <div className="crud-error">No hay procesos</div>
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
                          <div style={{ fontSize: 18 }}>{expandedId === p.id_proceso ? '▴' : '▾'}</div>
                        </div>
                      </button>
                      {expandedId === p.id_proceso && (
                        <div style={{ padding: 16 }}>
                          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10, color: '#495057' }}>
                            <span><strong>Estado:</strong> {p.estado}</span>
                            <span><strong>Creado:</strong> {formatDate(p.fecha_creacion)}</span>
                            {p.fecha_completado && <span><strong>Completado:</strong> {formatDate(p.fecha_completado)}</span>}
                          </div>
                          {loadingEtapas[p.id_proceso] ? (
                            <div className="crud-loading">Cargando etapas...</div>
                          ) : (etapas[p.id_proceso]?.length || 0) === 0 ? (
                            <div className="crud-error">No hay etapas de papelería asignadas</div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {etapas[p.id_proceso]!.map(et => (
                                <div key={et.id_etapa_proceso} style={{ padding: 10, background: 'white', border: '1px solid #dee2e6', borderRadius: 8 }}>
                                  <div style={{ fontWeight: 600, color: '#000' }}>{et.nombre_etapa}</div>
                                  <div style={{ fontSize: 13, color: '#495057' }}>{et.etapa_descripcion}</div>
                                  <div style={{ fontSize: 12, color: '#6c757d', marginTop: 4 }}>
                                    <span><strong>Estado:</strong> {et.estado}</span>{' • '}
                                    <span><strong>Inicio:</strong> {formatDate(et.fecha_inicio)}</span>{' • '}
                                    <span><strong>Fin:</strong> {formatDate(et.fecha_fin)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'papeleria' && (
            <>
              <div style={{ background: 'white', border: '1px solid #e9ecef', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <h3 style={{ marginTop: 0, color: '#2c3e50' }}>Registrar papelería</h3>
                <form onSubmit={crearPapeleria} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
                  <div>
                    <label>Empresa</label>
                    <select required value={form.id_empresa} onChange={(e) => setForm({ ...form, id_empresa: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '2px solid #e9ecef', backgroundColor: 'white', color: 'black' }}>
                      <option value="">Seleccione</option>
                      {empresas.map(emp => <option key={emp.id_empresa} value={emp.id_empresa}>{emp.nombre_empresa}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Tipo</label>
                    <select required value={form.tipo_papeleria} onChange={(e) => setForm({ ...form, tipo_papeleria: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '2px solid #e9ecef', backgroundColor: 'white', color: 'black' }}>
                      <option value="Venta">Venta</option>
                      <option value="Compra">Compra</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>Descripción</label>
                    <input required value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '2px solid #e9ecef' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
                    <button disabled={creating} className="crud-btn-create" type="submit">{creating ? 'Guardando...' : 'Guardar'}</button>
                  </div>
                </form>
              </div>

              {loadingPap ? (
                <div className="crud-loading">Cargando papelería...</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
                  {papeleria.map(p => (
                    <div key={p.id_papeleria} style={{ background: 'white', border: '1px solid #e9ecef', borderRadius: 12, padding: 12 }}>
                      <div style={{ fontWeight: 700, color: '#000' }}>{p.descripcion}</div>
                      <div style={{ fontSize: 12, color: '#6c757d' }}>{p.nombre_empresa} • {p.tipo_papeleria}</div>
                      <div style={{ fontSize: 12, color: '#6c757d' }}>Recibida: {formatDate(p.fecha_recepcion)} • Entrega: {formatDate(p.fecha_entrega)}</div>
                      <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ padding: '4px 8px', borderRadius: 8, background: '#f8f9fa', border: '1px solid #dee2e6' }}>{p.estado}</span>
                        {p.estado !== 'Entregada' && (
                          <button className="crud-btn-edit" onClick={() => marcarEntregada(p.id_papeleria)}>Marcar Entregada</button>
                        )}
                        <button className="crud-btn-edit" onClick={() => abrirEditar(p)}>Editar</button>
                        <button className="crud-btn-delete" onClick={() => solicitarEliminar(p)}>Eliminar</button>
                      </div>

                      {editingId === p.id_papeleria && (
                        <div style={{ marginTop: 10, background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 10, padding: 10 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10 }}>
                            <div>
                              <label>Descripción</label>
                              <input value={editForm.descripcion} onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '2px solid #e9ecef' }} />
                            </div>
                            <div>
                              <label>Tipo</label>
                              <select value={editForm.tipo_papeleria} onChange={(e) => setEditForm({ ...editForm, tipo_papeleria: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '2px solid #e9ecef', backgroundColor: 'white', color: 'black' }}>
                                <option value="Venta">Venta</option>
                                <option value="Compra">Compra</option>
                              </select>
                            </div>
                            <div>
                              <label>Estado</label>
                              <select value={editForm.estado} onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '2px solid #e9ecef', backgroundColor: 'white', color: 'black' }}>
                                <option value="Recibida">Recibida</option>
                                <option value="En proceso">En proceso</option>
                                <option value="Entregada">Entregada</option>
                              </select>
                            </div>
                            <div>
                              <label>Fecha de Entrega</label>
                              <input type="date" value={editForm.fecha_entrega} onChange={(e) => setEditForm({ ...editForm, fecha_entrega: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '2px solid #e9ecef', background: 'white', color: 'black' }} />
                            </div>
                          </div>
                          <div style={{ marginTop: 10, textAlign: 'right' }}>
                            <button className="crud-btn-save" onClick={() => solicitarActualizar(p)}>Guardar cambios</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <PasswordVerificationModal
                isOpen={showPwd}
                onClose={() => { setShowPwd(false); setPendingAction(null); setSelectedItem(null) }}
                onVerify={onVerify}
                title="Verificación de Administrador"
                message={pendingAction === 'delete' ? 'Ingresa tu contraseña para eliminar este registro' : 'Ingresa tu contraseña para actualizar este registro'}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default SecretariaView
