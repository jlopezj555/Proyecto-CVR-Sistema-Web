import React, { useEffect, useState } from 'react'
import EmpleadosCRUD from './EmpleadosCRUD'
import EmpresasCRUD from './EmpresasCRUD'
import RolesCRUD from './RolesCRUD'
import RolEtapasCRUD from './RolEtapasCRUD'
import ProcesosCRUD from './ProcesosCRUD'
import PapeleriaCRUD from './PapeleriaCRUD'
import EtapasCatalogoCRUD from './EtapasCatalogoCRUD'
import UsuariosCRUD from './UsuariosCRUD'
import EtapasProcesoView from './EtapasProcesoView'
import AsignacionesCRUD from './AsignacionesCRUD'
import './AdminView.css'
import iconDashboard from '../assets/admin-dashboard-white.svg'
import iconUsuarios from '../assets/admin-usuarios-white.svg'
import iconEmpleados from '../assets/admin-empleados-white.svg'
import iconEmpresas from '../assets/admin-empresas-white.svg'
import iconRoles from '../assets/admin-roles-white.svg'
import iconProcesos from '../assets/admin-procesos-white.svg'
import iconPapeleria from '../assets/admin-papeleria-white.svg'
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
    if (externalSection) {
      setActiveSection(externalSection)
    }
  }, [externalSection])

  const menuItems = [
    { id: 'dashboard' as AdminSection, label: 'Administración', icon: iconDashboard },
    { id: 'usuarios' as AdminSection, label: 'Usuarios', icon: iconUsuarios },
    { id: 'empleados' as AdminSection, label: 'Empleados', icon: iconEmpleados },
    { id: 'empresas' as AdminSection, label: 'Empresas', icon: iconEmpresas },
    { id: 'roles' as AdminSection, label: 'Roles', icon: iconRoles },
    { id: 'procesos' as AdminSection, label: 'Procesos', icon: iconProcesos },
    { id: 'papeleria' as AdminSection, label: 'Papelería', icon: iconPapeleria },
    { id: 'etapas-catalogo' as AdminSection, label: 'Etapas Catálogo', icon: iconEtapasCatalogo },
    { id: 'etapas-proceso' as AdminSection, label: 'Etapas Proceso', icon: iconEtapasProceso },
    { id: 'asignaciones' as AdminSection, label: 'Asignaciones', icon: iconAsignaciones },
    { id: 'rol-etapas' as AdminSection, label: 'Etapas por Rol', icon: iconRolEtapas }
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
                  <img src={iconDashboard} alt="Dashboard" className="welcome-icon-img" />
                </div>
                <div className="welcome-info">
                  <h3 className="welcome-title">Bienvenido, {nombre}</h3>
                  <p className="welcome-subtitle">Descripción de los procesos del Panel de Administración</p>
                </div>
              </div>
              <div className="welcome-content">

                <div className="admin-instructions-grid">
                  {[ 
                    { icon: iconUsuarios, title: 'Usuarios', desc: 'Gestión de usuarios del sistema. Crear, editar, activar.' },
                    { icon: iconEmpleados, title: 'Empleados', desc: 'Alta y mantenimiento de empleados vinculados a Usuarios.' },
                    { icon: iconEmpresas, title: 'Empresas', desc: 'Empresas clientes para asignación de roles y procesos.' },
                    { icon: iconRoles, title: 'Roles', desc: 'Definición de roles y permisos funcionales.' },
                    { icon: iconProcesos, title: 'Procesos', desc: 'Listado de procesos por empresa y filtros por mes asignado.' },
                    { icon: iconPapeleria, title: 'Papelería', desc: 'Registro de papelería por mes. Auto-genera proceso (Venta/Compra).' },
                    { icon: iconEtapasCatalogo, title: 'Etapas Catálogo', desc: 'Definición del catálogo de etapas disponibles.' },
                    { icon: iconEtapasProceso, title: 'Etapas Proceso', desc: 'Visualización de etapas instanciadas por proceso y progreso.' },
                    { icon: iconAsignaciones, title: 'Asignaciones', desc: 'Asignar roles a empleados por empresa.' },
                    { icon: iconRolEtapas, title: 'Etapas por Rol', desc: 'Orden y asociación de etapas a cada rol.' }
                  ].map((c, idx) => (
                    <div key={idx} className="admin-instruction-card">
                      <div className="welcome-icon-container admin-icon admin-instruction-icon">
                        <img src={c.icon} alt={c.title} className="welcome-icon-img" />
                      </div>
                      <div className="admin-instruction-text">
                        <div className="admin-instruction-title">{c.title}</div>
                        <div className="admin-instruction-desc">{c.desc}</div>
                      </div>
                    </div>
                  ))}
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

          {/* Mobile collapsible menu */}
          <details className="only-mobile" style={{ padding: '0 8px' }}>
            <summary>
              <button className="admin-mobile-menu-toggle" aria-label="Abrir menú de secciones">
                Secciones
                <span style={{ fontSize: 18, marginLeft: 8 }}>▾</span>
              </button>
            </summary>
            <div className="admin-mobile-nav">
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
            </div>
          </details>

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



