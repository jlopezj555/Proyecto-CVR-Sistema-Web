import React, { useEffect, useState } from 'react'
import EmpleadosCRUD from './EmpleadosCRUD'
import EmpresasCRUD from './EmpresasCRUD'
import RolesCRUD from './RolesCRUD'
import RolEtapasCRUD from './RolEtapasCRUD'
import ClientesCRUD from './ClientesCRUD'
import ProcesosCRUD from './ProcesosCRUD'
import PapeleriaCRUD from './PapeleriaCRUD'
import EtapasCatalogoCRUD from './EtapasCatalogoCRUD'
import UsuariosCRUD from './UsuariosCRUD'
import EtapasProcesoView from './EtapasProcesoView'
import AsignacionesCRUD from './AsignacionesCRUD'
import './AdminView.css'

interface AdminViewProps {
  nombre: string
  externalSection?: AdminSection | null
  onSectionChange?: (section: AdminSection | null) => void
}

type AdminSection = 
  | 'dashboard' 
  | 'usuarios'
  | 'empleados' 
  | 'empresas' 
  | 'roles' 
  | 'procesos' 
  | 'papeleria' 
  | 'etapas-catalogo' 
  | 'etapas-proceso'
  | 'asignaciones'
  | 'rol-etapas'
  | 'clientes'

const AdminView: React.FC<AdminViewProps> = ({ nombre, externalSection = null, onSectionChange }) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('empleados')

  // Sincronizar con el header si se provee externalSection
  useEffect(() => {
    if (externalSection) {
      setActiveSection(externalSection)
    }
  }, [externalSection])

  const menuItems = [
    { id: 'dashboard' as AdminSection, label: 'Dashboard', icon: '🏠' },
    { id: 'usuarios' as AdminSection, label: 'Usuarios', icon: '👤' },
    { id: 'clientes' as AdminSection, label: 'Clientes', icon: '🧑‍💼' },
    { id: 'empleados' as AdminSection, label: 'Empleados', icon: '👥' },
    { id: 'empresas' as AdminSection, label: 'Empresas', icon: '🏢' },
    { id: 'roles' as AdminSection, label: 'Roles', icon: '🎭' },
    { id: 'procesos' as AdminSection, label: 'Procesos', icon: '⚙️' },
    { id: 'papeleria' as AdminSection, label: 'Papelería', icon: '📄' },
    { id: 'etapas-catalogo' as AdminSection, label: 'Etapas Catálogo', icon: '📝' },
    { id: 'etapas-proceso' as AdminSection, label: 'Etapas Proceso', icon: '📊' },
    { id: 'asignaciones' as AdminSection, label: 'Asignaciones', icon: '🔗' },
    { id: 'rol-etapas' as AdminSection, label: 'Etapas por Rol', icon: '🧩' }
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'empleados':
        return <EmpleadosCRUD />
      case 'usuarios':
        return <UsuariosCRUD />
      case 'empresas':
        return <EmpresasCRUD />
      case 'roles':
        return <RolesCRUD />
      case 'clientes':
        return <ClientesCRUD />
      case 'procesos':
        return <ProcesosCRUD />
      case 'papeleria':
        return <PapeleriaCRUD />
      case 'etapas-catalogo':
        return <EtapasCatalogoCRUD />
      case 'etapas-proceso':
        return <EtapasProcesoView />
      case 'asignaciones':
        return <AsignacionesCRUD />
      case 'rol-etapas':
        return <RolEtapasCRUD />
      default:
        return (
          <div className="admin-dashboard">
            <div className="admin-welcome-card">
              <div className="welcome-header">
                <div className="welcome-icon-container admin-icon">
                  <span className="welcome-icon">👑</span>
                </div>
                <div className="welcome-info">
                  <h3 className="welcome-title">Bienvenido, {nombre}</h3>
                  <p className="welcome-subtitle">Panel de Administración</p>
                </div>
              </div>
              <div className="welcome-content">
                <p className="welcome-description">
                  Usa el menú de la izquierda para abrir los módulos de administración.
                </p>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="admin-view-container">
        <div className="admin-sidebar">
          <div className="admin-sidebar-header">
            <h3>Panel Admin</h3>
            <p>Hola, {nombre}</p>
          </div>
          
          <nav className="admin-nav">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`admin-nav-item ${activeSection === item.id ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

      <div className="admin-main-content">
        <div className="admin-content-header">
          <h2>{menuItems.find(item => item.id === activeSection)?.label || 'Dashboard'}</h2>
          <p>Gestiona y administra todos los aspectos del sistema</p>
        </div>
        
        <div className="admin-content-body">
          {activeSection !== 'dashboard' && (
            <div style={{ marginBottom: '12px' }}>
              <button
                className="crud-btn-back"
                onClick={() => {
                  setActiveSection('dashboard')
                  onSectionChange && onSectionChange(null)
                }}
              >
                ← Volver al menú principal de administrador
              </button>
            </div>
          )}
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default AdminView


