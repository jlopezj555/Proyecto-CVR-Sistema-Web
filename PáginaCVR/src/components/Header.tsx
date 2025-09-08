import { useState } from 'react'
import aboutIcon from '../assets/about-icon.svg'
import servicesIcon from '../assets/services-icon.svg'
import experienceIcon from '../assets/experience-icon.svg'
import contactIcon from '../assets/contact-icon.svg'
import loginIcon from '../assets/login-icon.svg'
import cvrLogo from '../assets/cvr-logo-blanco.svg'
import './Header.css'

interface HeaderProps {
  onLoginClick: () => void; // Prop para abrir modal
}

export const Header = ({ onLoginClick }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

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

      <div className={`menu-toggle ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <nav className={`nav-menu ${isMenuOpen ? 'active' : ''} ${isClosing ? 'closing' : ''}`}>
        <a href="#about" onClick={handleNavClick}>
          <img src={aboutIcon} alt="" className="nav-icon" />
          Acerca de
        </a>
        <a href="#services" onClick={handleNavClick}>
          <img src={servicesIcon} alt="" className="nav-icon" />
          Servicios
        </a>
        <a href="#experience" onClick={handleNavClick}>
          <img src={experienceIcon} alt="" className="nav-icon" />
          Experiencia
        </a>
        <a href="#contact" onClick={handleNavClick}>
          <img src={contactIcon} alt="" className="nav-icon" />
          Contáctenos
        </a>

        {/* Botón de login usando la prop onLoginClick */}
        <button
          className="login-button"
          onClick={() => {
            handleNavClick() // cierra el menú si estaba abierto
            onLoginClick()   // abre el modal de login
          }}
        >
          <img src={loginIcon} alt="" className="login-icon" />
          <span className="login-text-original">Iniciar Sesión</span>
        </button>
      </nav>
    </header>
  )
}
