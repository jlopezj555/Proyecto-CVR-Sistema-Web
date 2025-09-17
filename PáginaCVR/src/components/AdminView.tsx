import React, { useEffect, useState } from 'react'
import EmpleadosCRUD from './EmpleadosCRUD'
import EmpresasCRUD from './EmpresasCRUD'
import RolesCRUD from './RolesCRUD'
import CuentasCRUD from './CuentasCRUD'
import PapeleriaCRUD from './PapeleriaCRUD'
import EtapasCatalogoCRUD from './EtapasCatalogoCRUD'
import EtapasCuentaView from './EtapasCuentaView'
import './AdminView.css'

interface AdminViewProps {
  nombre: string
  externalSection?: AdminSection | null
  onSectionChange?: (section: AdminSection | null) => void
}

type AdminSection = 
  | 'dashboard' 
  | 'empleados' 
  | 'empresas' 
  | 'roles' 
  | 'cuentas' 
  | 'papeleria' 
  | 'etapas-catalogo' 
  | 'etapas-cuenta'

const AdminView: React.FC<AdminViewProps> = ({ nombre, externalSection = null, onSectionChange }) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard')

  // Sincronizar con el header si se provee externalSection
  useEffect(() => {
    if (externalSection) {
      setActiveSection(externalSection)
    }
  }, [externalSection])

  const menuItems = [
    { id: 'dashboard' as AdminSection, label: 'Dashboard', icon: '🏠' },
    { id: 'empleados' as AdminSection, label: 'Empleados', icon: '👥' },
    { id: 'empresas' as AdminSection, label: 'Empresas', icon: '🏢' },
    { id: 'roles' as AdminSection, label: 'Roles', icon: '🎭' },
    { id: 'cuentas' as AdminSection, label: 'Cuentas', icon: '📋' },
    { id: 'papeleria' as AdminSection, label: 'Papelería', icon: '📄' },
    { id: 'etapas-catalogo' as AdminSection, label: 'Etapas Catálogo', icon: '📝' },
    { id: 'etapas-cuenta' as AdminSection, label: 'Etapas Cuenta', icon: '📊' }
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'empleados':
        return <EmpleadosCRUD />
      case 'empresas':
        return <EmpresasCRUD />
      case 'roles':
        return <RolesCRUD />
      case 'cuentas':
        return <CuentasCRUD />
      case 'papeleria':
        return <PapeleriaCRUD />
      case 'etapas-catalogo':
        return <EtapasCatalogoCRUD />
      case 'etapas-cuenta':
        return <EtapasCuentaView />
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
                  Tienes acceso completo al sistema. Desde aquí puedes gestionar usuarios, 
                  empresas, cuentas y toda la información administrativa de la plataforma.
                </p>
              </div>
            </div>
            
            <div className="admin-actions-menu">
              <h3>Acciones Disponibles</h3>
              <div className="actions-grid">
                <button 
                  className="action-card"
                  onClick={() => setActiveSection('empleados')}
                >
                  <div className="action-icon">👥</div>
                  <div className="action-content">
                    <h4>Empleados</h4>
                    <p>Gestionar empleados del sistema</p>
                  </div>
                </button>
                
                <button 
                  className="action-card"
                  onClick={() => setActiveSection('empresas')}
                >
                  <div className="action-icon">🏢</div>
                  <div className="action-content">
                    <h4>Empresas</h4>
                    <p>Administrar empresas clientes</p>
                  </div>
                </button>
                
                <button 
                  className="action-card"
                  onClick={() => setActiveSection('roles')}
                >
                  <div className="action-icon">🎭</div>
                  <div className="action-content">
                    <h4>Roles</h4>
                    <p>Configurar roles del sistema</p>
                  </div>
                </button>
                
                <button 
                  className="action-card"
                  onClick={() => setActiveSection('cuentas')}
                >
                  <div className="action-icon">📋</div>
                  <div className="action-content">
                    <h4>Cuentas</h4>
                    <p>Gestionar cuentas contables</p>
                  </div>
                </button>
                
                <button 
                  className="action-card"
                  onClick={() => setActiveSection('papeleria')}
                >
                  <div className="action-icon">📄</div>
                  <div className="action-content">
                    <h4>Papelería</h4>
                    <p>Control de documentación</p>
                  </div>
                </button>
                
                <button 
                  className="action-card"
                  onClick={() => setActiveSection('etapas-catalogo')}
                >
                  <div className="action-icon">📝</div>
                  <div className="action-content">
                    <h4>Etapas Catálogo</h4>
                    <p>Configurar etapas del proceso</p>
                  </div>
                </button>
                
                <button 
                  className="action-card"
                  onClick={() => setActiveSection('etapas-cuenta')}
                >
                  <div className="action-icon">📊</div>
                  <div className="action-content">
                    <h4>Etapas Cuenta</h4>
                    <p>Ver progreso de cuentas</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="admin-view-container">
      {!externalSection && (
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
      )}

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


