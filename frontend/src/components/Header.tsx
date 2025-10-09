import { useState, useEffect } from 'react'
import aboutIcon from '../assets/about-icon.svg'
import servicesIcon from '../assets/services-icon.svg'
import experienceIcon from '../assets/experience-icon.svg'
import contactIcon from '../assets/contact-icon.svg'
import loginIcon from '../assets/login-icon.svg'
import cvrLogo from '../assets/cvr-logo-blanco.svg'
import './Header.css'


interface HeaderProps {
  onLoginClick: () => void;
  onLogoutClick: () => void;
  isAuthenticated: boolean;
  userName?: string | null;
  userRole?: string | null;
  userType?: string | null;
  userFoto?: string | null;
  activeTab?: string | null;
  onNavSelect?: (tab: string) => void;
}

export const Header = ({ onLoginClick, onLogoutClick, isAuthenticated, userName, userRole, userType, userFoto, onNavSelect }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [showProfileMessage, setShowProfileMessage] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      setShowProfileMessage(true)
      setTimeout(() => setShowProfileMessage(false), 3000) // Hide after 3 seconds
    }
  }, [isAuthenticated])

  const toggleMenu = () => {
    if (isMenuOpen) {
      setIsClosing(true)
      setTimeout(() => {
        setIsMenuOpen(false)
        setIsClosing(false)
      }, 600) // tiempo de animación de cierre
    } else {
      setIsMenuOpen(true)
    }
  }

  const handleNavClick = () => {
    setIsMenuOpen(false)
  }

  return (
    <header className="header">
      <div className="header-logos">
        <div className="cvr-logo-container">
          <img src={cvrLogo} alt="CVR Logo" className="cvr-logo" />
        </div>
        <span className="cvr-text">25 años de experiencia</span>
      </div>

      {isAuthenticated && (
        <div className={`profile-message ${showProfileMessage ? 'visible' : ''}`}>
          Perfil de {userName}
        </div>
      )}

      {/* Ocultar hamburguesa para Administrador: solo logo + cerrar sesión */}
      {!(isAuthenticated && userRole === 'Administrador') && (
        <div className={`menu-toggle ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}

      <nav className={`nav-menu ${isMenuOpen ? 'active' : ''} ${isClosing ? 'closing' : ''}`}>
        {!isAuthenticated && (
          <>
            <a href="#about" onClick={handleNavClick}>
              <img src={aboutIcon} alt="Acerca de" className="nav-icon" />
              Acerca de
            </a>
            <a href="#services" onClick={handleNavClick}>
              <img src={servicesIcon} alt="Servicios" className="nav-icon" />
              Servicios
            </a>
            <a href="#experience" onClick={handleNavClick}>
              <img src={experienceIcon} alt="Experiencia" className="nav-icon" />
              Experiencia
            </a>
            <a href="#contact" onClick={handleNavClick}>
              <img src={contactIcon} alt="Contáctenos" className="nav-icon" />
              Contáctenos
            </a>
          </>
        )}

        {/* Para Administrador no mostrar pestañas en el header */}
        {false && isAuthenticated && userRole === 'Administrador' && (
          <></>
        )}

        {/* Eliminado AdminNavButtons del header - ahora solo en AdminView */}

        {isAuthenticated && userType === 'cliente' && (
          <>
            <a href="#about" onClick={handleNavClick}>
              <img src={aboutIcon} alt="Acerca de" className="nav-icon" />
              Acerca de
            </a>
            <a href="#services" onClick={handleNavClick}>
              <img src={servicesIcon} alt="Servicios" className="nav-icon" />
              Servicios
            </a>
            <a href="#experience" onClick={handleNavClick}>
              <img src={experienceIcon} alt="Experiencia" className="nav-icon" />
              Experiencia
            </a>
            <a href="#contact" onClick={handleNavClick}>
              <img src={contactIcon} alt="Contáctenos" className="nav-icon" />
              Contáctenos
            </a>
          </>
        )}

        {false && isAuthenticated && userRole === 'Administrador' && onNavSelect && (
        <>
        </>
        )}

        {isAuthenticated ? (
          <button
            className="login-button logout"
            onClick={() => {
              handleNavClick()
              onLogoutClick()
            }}
          >
            {userFoto ? (
              <img src={userFoto} alt="Foto de perfil" className="profile-photo" />
            ) : (
              <img src={loginIcon} alt="Cerrar sesión" className="login-icon" />
            )}
            <span className="login-text">Cerrar sesión</span>
          </button>
        ) : (
          <button
            className="login-button"
            onClick={() => {
              handleNavClick()
              onLoginClick()
            }}
          >
            <img src={loginIcon} alt="Iniciar sesión" className="login-icon" />
            <span className="login-text">Iniciar sesión</span>
          </button>
        )}
      </nav>
    </header>
  )
}
