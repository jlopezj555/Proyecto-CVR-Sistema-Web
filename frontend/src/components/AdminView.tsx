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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    console.log('AdminView - Rendering content for section:', activeSection);
    switch (activeSection) {
      // case 'empleados':
      //   return <EmpleadosCRUD />
      case 'usuarios':
        console.log('AdminView - Rendering UsuariosCRUD');
        return <UsuariosCRUD />
      case 'empresas':
        console.log('AdminView - Rendering EmpresasCRUD');
        return <EmpresasCRUD />
      case 'roles':
        console.log('AdminView - Rendering RolesCRUD');
        return <RolesCRUD />
      case 'procesos':
        console.log('AdminView - Rendering ProcesosCRUD');
        return <ProcesosCRUD />
      // case 'papeleria':
      //   return <PapeleriaCRUD />
      case 'etapas-catalogo':
        console.log('AdminView - Rendering EtapasCatalogoCRUD');
        return <EtapasCatalogoCRUD />
      case 'etapas-proceso':
        console.log('AdminView - Rendering EtapasProcesoView');
        return <EtapasProcesoView />
      case 'asignaciones':
        console.log('AdminView - Rendering AsignacionesCRUD');
        return <AsignacionesCRUD />
      case 'rol-etapas':
        console.log('AdminView - Rendering RolEtapasCRUD');
        return <RolEtapasCRUD />
      default:
        console.log('AdminView - Rendering Dashboard');
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
                <div style={{ textAlign: 'center', padding: '20px' }}>
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
            <div>
              <h3>Panel Admin</h3>
              <p>Hola, {nombre}</p>
            </div>
            <button 
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>

          {/* Navegación unificada para todos los dispositivos */}
          <nav className={`admin-nav ${mobileMenuOpen ? 'open' : ''}`}>
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id)
                  setMobileMenuOpen(false) // Cerrar menú móvil al seleccionar
                }}
                className={`admin-nav-item ${activeSection === item.id ? 'active' : ''}`}
              >
                <span className="nav-icon"><img src={item.icon} alt={item.label} className="nav-icon-img" /></span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

      <div className="admin-main-content">
        {/* Header para todos los dispositivos */}
        <div className="admin-content-header">
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



