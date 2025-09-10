import { Header } from './components/Header'
import { useState } from "react";
import './App.css'
import aboutUsHome from './assets/about-us-home.png'
import VisionImagen from './assets/vision-imagen.avif'
import MisionImagen from './assets/mision-imagen.webp'
import ObjetivoGeneral from './assets/objetivo-general.jpg'
import AuditoriaHome from './assets/auditoria-home.png'
import JuridicoHome from './assets/juridico1-home.png'
import ContaHome from './assets/conta-home.png'
import ExperienciaHome from './assets/experiencia-home.png'
import Card from './components/Card'
import ExperienceCard from "./components/ExperienceCard"
import LoginModal from "./components/LoginModal";
import RegisterModal from "./components/RegisterModal";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";


function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false); 
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);

{
  return (
    <>
      {/* Pasamos la función al Header */}
      <Header onLoginClick={() => setIsLoginOpen(true)} />

      {/* Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onRegisterClick={() => setIsRegisterOpen(true)} // 
      />


      <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />

      
<div className="hero-image-container">
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
            image= {aboutUsHome}
            imageAlt="Misión empresarial"
          />
          <Card 
            title="Visión"
            text= "Brindar servicios profesionales de calidad en forma oportuna y segura, con excelencia, confidencialidad, resguardo y lealtad hacia nuestros clientes, a quienes acompañamos con asesoría profesional a través de nuestro equipo de colaboradores capacitados, brindando apoyo en las actividades económicas, financieras, administrativas, fiscales y legales."
            image={VisionImagen}
            imageAlt="Experiencia profesional"
          />
          <Card 
            title="Misión"
            text="Ser la organización líder a nivel regional, siempre a la vanguardia en la prestación de servicios contables, servicios de auditoria y aspectos legales de alto nivel, 
            satisfaciendo de forma eficaz las necesidades de cada uno de nuestros valiosos clientes."
            image={MisionImagen}
            imageAlt="Equipo de trabajo"
          />
          <Card
            title="Objetivo General"
            text="Generar información oportuna, de forma continua, ordenada y sistemática, sobre la marcha y/o desenvolvimiento de hechos económicos,
            financieros, sociales y legales suscitados en una empresa u organización, con el fin de conocer sus resultados, para una acertada toma de decisiones."
            image={ObjetivoGeneral}
            imageAlt="Equipo de trabajo"
          />
        </div>
      </section>

      <section id="services" className="about-section">
        <h2 className="section-title">Servicios</h2>
        <div className="cards-container">
          <Card 
            title="Auditoría y consultoría"
            text={
              <ul>
                <li>Peritajes Judiciales</li>
                <li>Valuación de control interno</li>
                <li>Asesoría en la planificación de impuestos y atención a requerimientos de SAT</li>
                <li>Auditoría forense</li>
                <li>Asesoría Tributaria en procesos ante las honorables Salas del Tribunal de lo Contencioso Administrativo</li>
                <li>Diagnósticos fiscales</li>
                <li>Asesoría legal-tributaria adecuada al giro de cada negocio</li>
                <li>Auditorías Externas de propósito especial y razonabilidad de Estados Financieros</li>
                <li>Expertajes Judiciales</li>
                <li>Consultoría y asesoría fiscal, financiera y administrativa</li>
                <li>Informes Gerenciales para toma de decisiones</li>
              </ul>
            }
            image={AuditoriaHome}
            imageAlt="Servicios de auditoría"
          />
          <Card 
            title="Jurídico"
            text={
              <ul>
                <li>Mercantil</li>
                <li>Civil</li>
                <li>Notariado</li>
                <li>Administrativo</li>
                <li>Laboral</li>
                <li>Seguridad social</li>
                <li>Registral</li>
                <li>Penal</li>
                <li>Defensa fiscal en materia tributaria ante SAT y Tribunales</li>
              </ul>
            }
            image={JuridicoHome}
            imageAlt="Servicios de auditoría"
          />
          <Card 
            title="Contabilidad"
            text={
              <ul>
                <li>Control de impuestos</li>
                <li>Cierre Anual Fiscal</li>
                <li>Actualización ante la SAT</li>
                <li>Contabilidades Fiscales</li>
                <li>Control de cuenta corriente</li>
                <li>Libros habilitados</li>
              </ul>
            }
            image={ContaHome}
            imageAlt="Servicios de auditoría"
          />
          {/* Puedes agregar más tarjetas de servicios aquí */}
        </div>
      </section>

      <section id="experience" className="experience-section">
        <h2 className="white-title">Experiencia</h2>
        <div className="cards-container">
          <ExperienceCard
            image={ExperienciaHome}
            imageAlt="Experiencia profesional"
            title="Licda. Cristabel Velásquez Rodríguez
            CPA & Asociados"
            subtitle="Cristabel, Contadora Pública y Auditora, ha desarrollado su profesión con valores éticos, con destacada experiencia en temas tributarios. Cuenta con 45 años de experiencia en el área fiscal, contable, consultoría gerencial administrativa y financiera, auditoría externa y forense, peritajes judiciales en área civil, penal y laboral. Ha tenido a su cargo la dirección, planificación, y ejecución de auditorías realizadas a entidades del país de los diferentes sectores económicos."
               text="SOCIA FUNDADORA Y GERENTE GENERAL-CVR ASESORÍA CONTABLE FINANCIERA S. A."
          />
          </div>
        </section>

        <section id="contact" className="contact-section">
  <h2 className="white-title">Contáctanos</h2>
  <div className="cards-container contact-container">
    
    {/* Formulario de contacto */}
    <form className="contact-form">
      <label>
        Nombre:
        <input type="text" name="nombre" required />
      </label>

      <label>
        Teléfono:
        <input type="tel" name="telefono" required />
      </label>

      <label>
        Correo electrónico:
        <input type="email" name="correo" required />
      </label>

      <label>
        Empresa:
        <input type="text" name="empresa" />
      </label>

      <label>
        Mensaje:
        <textarea name="mensaje" rows={5} required></textarea>
      </label>

      <button type="submit">Enviar</button>
    </form>

    {/* Información de la empresa */}
<div className="contact-info">
  <h3>Información de Contacto</h3>

  <div className="contact-cards">
    {/* Email */}
    <a 
      href="https://mail.google.com/mail/?view=cm&fs=1&to=info@cvrasesoria.com" 
      target="_blank" 
      rel="noopener noreferrer"
      className="contact-card"
    >
      <div className="icon-circle">
        <FaEnvelope className="contact-icon" />
      </div>
      <span>info@cvrasesoria.com</span>
    </a>

    {/* Teléfono */}
    <a 
      href="tel:+50223351609" 
      className="contact-card"
    >
      <div className="icon-circle">
        <FaPhoneAlt className="contact-icon" />
      </div>
      <span>PBX: 2335-1609</span>
    </a>

    {/* Dirección con modal */}
    <div 
      className="contact-card" 
      onClick={() => setShowMap(true)}
      style={{ cursor: "pointer" }}
    >
      <div className="icon-circle">
        <FaMapMarkerAlt className="contact-icon" />
      </div>
      <span>
        6a. Av. 0-60 Zona 4, Torre Profesional II, Oficina 303 "A", Gran Centro Comercial Zona 4.
      </span>
    </div>
  </div>
</div>


{/* Modal de Google Maps */}
{showMap && (
  <div className="modal-overlay" onClick={() => setShowMap(false)}>
    <div className="map-modal-content" onClick={(e) => e.stopPropagation()}>
      <button className="close-button" onClick={() => setShowMap(false)}>X</button>
<iframe
  src="https://www.google.com/maps?q=6a.+Av.+0-60+Zona+4,+Torre+Profesional+II,+Oficina+303+A,+Gran+Centro+Comercial+Zona+4,+Guatemala&output=embed"
  allowFullScreen
  loading="lazy"
></iframe>
    </div>
  </div>
)}



  </div>
</section>

    </>
  )
  }
}

export default App
