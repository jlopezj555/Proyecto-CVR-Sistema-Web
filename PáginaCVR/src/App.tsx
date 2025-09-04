import { Header } from './components/Header'
import './App.css'
import heroImage from './assets/hero-image.jpg'
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


function App() {
  return (
    <>
      <Header />
      
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
        <h2 className="section-title">Experiencia</h2>
        <div className="cards-container">
          <ExperienceCard
            image={ExperienciaHome}
            imageAlt="Experiencia profesional"
            title="Licda. Cristabel Velásquez Rodríguez
            CPA & Asociados"
            subtitle="SOCIA FUNDADORA Y GERENTE GENERAL-CVR ASESORÍA CONTABLE FINANCIERA S. A."
               text="Cristabel, Contadora Pública y Auditora, ha desarrollado su profesión con valores éticos, con destacada experiencia en temas tributarios. Cuenta con 45 años de experiencia en el área fiscal, contable, consultoría gerencial administrativa y financiera, auditoría externa y forense, peritajes judiciales en área civil, penal y laboral. Ha tenido a su cargo la dirección, planificación, y ejecución de auditorías realizadas a entidades del país de los diferentes sectores económicos."
          />
          </div>
        </section>

        <section id="contact" className="about-section">
        <h2 className="section-title">Contáctanos</h2>
        <div className="cards-container">
        <Card 
            title="¿Quienes somos?"
            text="Una organización competitiva dedicada a brindar servicios profesionales, 
            ofreciendo asesorías en las áreas administrativas, financieras, económicas, fiscales, tributarias y legales para el estricto cumplimiento de las leyes 
            positivas y vigentes en el país, a los que toda persona individual y jurídica está sujeta."
            image="/src/assets/about-us-home.png"
            imageAlt="Misión empresarial"
          />
          </div>
      </section>
    </>
  )
}

export default App
