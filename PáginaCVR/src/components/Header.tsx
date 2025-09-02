import { useState } from 'react'
import aboutIcon from '../assets/about-icon.svg'
import servicesIcon from '../assets/services-icon.svg'
import experienceIcon from '../assets/experience-icon.svg'
import contactIcon from '../assets/contact-icon.svg'
import loginIcon from '../assets/login-icon.svg'
import cvrLogo from '../assets/cvr-logo-blanco.svg'
import './Header.css'

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className="header">
      <div className="header-logos">
        <div className="cvr-logo-container">
          <img src={cvrLogo} alt="CVR Logo" className="cvr-logo" />
        </div>
        <span className="experience-text">25 años de experiencia</span>
      </div>

      <div className="menu-toggle" onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <nav className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
        <a href="#about">
          <img src={aboutIcon} alt="" className="nav-icon" />
          Acerca de
        </a>
        <a href="#services">
          <img src={servicesIcon} alt="" className="nav-icon" />
          Servicios
        </a>
        <a href="#experience">
          <img src={experienceIcon} alt="" className="nav-icon" />
          Experiencia
        </a>
        <a href="#contact">
          <img src={contactIcon} alt="" className="nav-icon" />
          Contáctenos
        </a>
            </nav>
            <button className="login-button" style={{ marginLeft: '2rem' }}>
        <img src={loginIcon} alt="" className="login-icon" />
        <span className="login-text">Iniciar Sesión</span>
            </button>
    </header>
  )
}
