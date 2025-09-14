import React from 'react'

interface UserViewProps {
  nombre: string
}

const UserView: React.FC<UserViewProps> = ({ nombre }) => {
  return (
    <section className="about-section">
      <h2 className="section-title">Panel de Usuario</h2>
      <div className="cards-container">
        <div className="user-welcome-card">
          <div className="welcome-header">
            <div className="welcome-icon-container">
              <span className="welcome-icon">👤</span>
            </div>
            <div className="welcome-info">
              <h3 className="welcome-title">¡Hola, {nombre}!</h3>
              <p className="welcome-subtitle">Panel de Usuario</p>
            </div>
          </div>
          <div className="welcome-content">
            <p className="welcome-description">
              Has iniciado sesión como usuario. Desde aquí puedes acceder a todas las funcionalidades 
              disponibles para tu rol y explorar nuestros servicios.
            </p>
            <div className="welcome-features">
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <span className="feature-text">Gestionar cuentas</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🏢</span>
                <span className="feature-text">Ver empresas</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📞</span>
                <span className="feature-text">Contacto directo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default UserView


