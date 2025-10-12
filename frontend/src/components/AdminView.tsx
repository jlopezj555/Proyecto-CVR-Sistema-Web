import React, { useEffect, useState } from 'react'
import EmpresasCRUD from './EmpresasCRUD'
import RolesCRUD from './RolesCRUD'
import RolEtapasCRUD from './RolEtapasCRUD'
import ProcesosCRUD from './ProcesosCRUD'
//import PapeleriaCRUD from './PapeleriaCRUD'
import EtapasCatalogoCRUD from './EtapasCatalogoCRUD'
import UsuariosCRUD from './UsuariosCRUD'
import EtapasProcesoView from './EtapasProcesoView'
import AsignacionesCRUD from './AsignacionesCRUD'
import './AdminView.css'
import iconDashboard from '../assets/admin-dashboard-white.svg'
import iconUsuarios from '../assets/admin-usuarios-white.svg'
import iconEmpresas from '../assets/admin-empresas-white.svg'
import iconRoles from '../assets/admin-roles-white.svg'
import iconProcesos from '../assets/admin-etapas-proceso-white.svg'
import iconEtapasCatalogo from '../assets/admin-etapas-catalogo-white.svg'
import iconEtapasProceso from '../assets/admin-etapas-proceso-white.svg'
import iconAsignaciones from '../assets/admin-asignaciones-white.svg'
import iconRolEtapas from '../assets/admin-rol-etapas-white.svg'

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

const AdminView: React.FC<AdminViewProps> = ({ nombre, externalSection = null, onSectionChange }) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard')

  // Sincronizar con el header si se provee externalSection
  useEffect(() => {
    // Restaurar sección activa desde almacenamiento si existe
    const stored = localStorage.getItem('admin_active_section') as AdminSection | null
    if (stored && menuItems.some(item => item.id === stored)) {
      setActiveSection(stored)
    }
  }, [])

  useEffect(() => {
    if (externalSection) {
      setActiveSection(externalSection)
    }
  }, [externalSection])

  // Persistir sección activa para sobrevivir recargas
  useEffect(() => {
    if (activeSection) {
      localStorage.setItem('admin_active_section', activeSection)
    }
  }, [activeSection])

  const menuItems = [
    { id: 'dashboard' as AdminSection, label: 'Administración', icon: iconDashboard },
    { id: 'usuarios' as AdminSection, label: 'Usuarios', icon: iconUsuarios },
    // Empleados eliminado a solicitud
    { id: 'empresas' as AdminSection, label: 'Empresas', icon: iconEmpresas },
    { id: 'roles' as AdminSection, label: 'Roles', icon: iconRoles },
    { id: 'procesos' as AdminSection, label: 'Cuadernillos', icon: iconProcesos },
    { id: 'etapas-catalogo' as AdminSection, label: 'Etapas Catálogo', icon: iconEtapasCatalogo },
    { id: 'etapas-proceso' as AdminSection, label: 'Etapas Proceso', icon: iconEtapasProceso },
    { id: 'asignaciones' as AdminSection, label: 'Asignaciones', icon: iconAsignaciones },
    { id: 'rol-etapas' as AdminSection, label: 'Etapas por Rol', icon: iconRolEtapas }
  ]

  const renderContent = () => {
    switch (activeSection) {
      // case 'empleados':
      //   return <EmpleadosCRUD />
      case 'usuarios':
        return <UsuariosCRUD />
      case 'empresas':
        return <EmpresasCRUD />
      case 'roles':
        return <RolesCRUD />
      case 'procesos':
        return <ProcesosCRUD />
      // case 'papeleria':
      //   return <PapeleriaCRUD />
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
                  <img src={iconDashboard} alt="Dashboard" className="welcome-icon-img" />
                </div>
                <div className="welcome-info">
                  <h3 className="welcome-title">Bienvenido, {nombre}</h3>
                  <p className="welcome-subtitle">Selecciona una sección para administrar</p>
                </div>
              </div>
              <div className="welcome-content">
                <div className="actions-grid only-mobile">
                  {menuItems.filter(mi => mi.id !== 'dashboard').map((item) => (
                    <button
                      key={item.id}
                      className="action-card"
                      onClick={() => setActiveSection(item.id)}
                    >
                      <span className="welcome-icon-container admin-icon action-icon" style={{ width: 56, height: 56 }}>
                        <img src={item.icon} alt={item.label} className="welcome-icon-img" />
                      </span>
                      <div className="action-content">
                        <h4>{item.label}</h4>
                        <p>Gestionar {item.label}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="only-desktop" style={{ textAlign: 'center', padding: '20px' }}>
                  <p style={{ fontSize: '1.1rem', color: '#666', margin: '20px 0' }}>
                    Usa la barra de navegación lateral para acceder a las diferentes secciones
                  </p>
                </div>
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

          {/* Navegación móvil: tarjetas animadas */}
          <div className="only-mobile" style={{ padding: '8px 12px 16px' }}>
            <div className="actions-grid">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`action-card ${activeSection === item.id ? 'active' : ''}`}
                >
                  <span className="welcome-icon-container admin-icon action-icon" style={{ width: 56, height: 56 }}>
                    <img src={item.icon} alt={item.label} className="welcome-icon-img" />
                  </span>
                  <div className="action-content">
                    <h4>{item.label}</h4>
                    <p>Ir a {item.label}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Desktop/Tablet horizontal nav */}
          <nav className="admin-nav only-desktop">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`admin-nav-item ${activeSection === item.id ? 'active' : ''}`}
              >
                <span className="nav-icon"><img src={item.icon} alt={item.label} className="nav-icon-img" /></span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

      <div className="admin-main-content">
        {/* En móviles ocultamos esta cabecera para promover navegación via tarjetas */}
        <div className="admin-content-header only-desktop">
          <h2>{menuItems.find(item => item.id === activeSection)?.label || 'Dashboard'}</h2>
          <p>Gestiona y administra todos los aspectos del sistema</p>
        </div>
        
        <div className="admin-content-body">
          {activeSection !== 'dashboard' && (
            <div style={{ marginBottom: '12px' }} className="only-mobile">
              <button
                className="crud-btn-back crud-btn-back-danger crud-btn-back-floating"
                onClick={() => {
                  setActiveSection('dashboard')
                  onSectionChange && onSectionChange(null)
                }}
                aria-label="Volver a menú Principal"
                title="Volver a menú Principal"
              >
                🏠
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



