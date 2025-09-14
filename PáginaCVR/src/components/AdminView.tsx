import React from 'react'

interface AdminViewProps {
  nombre: string
}

const AdminView: React.FC<AdminViewProps> = ({ nombre }) => {
  return (
    <section className="about-section">
      <h2 className="section-title">Panel de Administración</h2>
      <div className="cards-container">
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
            <div className="welcome-features">
              <div className="feature-item admin-feature">
                <span className="feature-icon">👥</span>
                <span className="feature-text">Gestionar usuarios</span>
              </div>
              <div className="feature-item admin-feature">
                <span className="feature-icon">🏢</span>
                <span className="feature-text">Administrar empresas</span>
              </div>
              <div className="feature-item admin-feature">
                <span className="feature-icon">📊</span>
                <span className="feature-text">Ver estadísticas</span>
              </div>
              <div className="feature-item admin-feature">
                <span className="feature-icon">⚙️</span>
                <span className="feature-text">Configuración</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AdminView


