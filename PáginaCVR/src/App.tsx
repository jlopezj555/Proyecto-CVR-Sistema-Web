import { useState } from 'react'
import './App.css'
import './components/Header.css'
import aboutIcon from './assets/about-icon.svg'
import servicesIcon from './assets/services-icon.svg'
import experienceIcon from './assets/experience-icon.svg'
import contactIcon from './assets/contact-icon.svg'
import loginIcon from './assets/login-icon.svg'
import cvrLogo from './assets/cvr-logo-blanco.svg'
import heroImage from './assets/hero-image.jpg' // Importa tu imagen aquí
import Card from './components/Card';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="header">
        <div className="header-logos">
          <div className="cvr-logo-container">
            <img src={cvrLogo} alt="CVR Logo" className="cvr-logo" />
          </div>
        </div>

        <div className="menu-toggle" onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <nav className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <span className="experience-text">25 años de experiencia</span>
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
        </nav>

        <button className="login-button">
          <img src={loginIcon} alt="Iniciar Sesión" className="login-icon" />
          Iniciar Sesión
        </button>
      </header>
      
      <div className="hero-image-container">
        <img src={heroImage} alt="Hero" className="hero-image" />
        <h1 className="hero-text typing">Asesoría y Soluciones Óptimas para tus Finanzas</h1>
      </div>

      <section id="about" className="about-section">
        <h2 className="section-title">Acerca de Nosotros</h2>
        <div className="cards-container">
          <Card 
            title="¿Quienes somos?"
            text="Una organización competitiva dedicada a brindar servicios profesionales, 
            ofreciendo asesorías en las áreas administrativas, financieras, económicas, fiscales, tributarias y legales para el estricto cumplimiento de las leyes 
            positivas y vigentes en el país, a los que toda persona individual y jurídica está sujeta."
            image="/src/assets/about-us-home.png"
            imageAlt="Misión empresarial"
          />
          <Card 
            title="Visión"
            text= "Brindar servicios profesionales de calidad en forma oportuna y segura, con excelencia, confidencialidad, resguardo y lealtad hacia nuestros clientes, a quienes acompañamos con asesoría profesional a través de nuestro equipo de colaboradores capacitados, brindando apoyo en las actividades económicas, financieras, administrativas, fiscales y legales."
            image="/src/assets/vision-imagen.avif"
            imageAlt="Experiencia profesional"
          />
          <Card 
            title="Misión"
            text="Ser la organización líder a nivel regional, siempre a la vanguardia en la prestación de servicios contables, servicios de auditoria y aspectos legales de alto nivel, 
            satisfaciendo de forma eficaz las necesidades de cada uno de nuestros valiosos clientes."
            image="/src/assets/mision-imagen.webp"
            imageAlt="Equipo de trabajo"
          />
          <Card
            title="Objetivo General"
            text="Contamos con profesionales altamente calificados y comprometidos con la excelencia en el servicio."
            image="/src/assets/equipo.jpg"
            imageAlt="Equipo de trabajo"
          />


        </div>
      </section>

      <div>
        <a href="https://vite.dev" target="_blank">
        </a>
        <a href="https://react.dev" target="_blank">
        </a>
      </div>
    </>
  )
}

export default App
