import { Header } from './components/Header'
import { useEffect, useState } from "react";
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
import AdminView from './components/AdminView';
import UserView from './components/UserView';
import axios from 'axios';


function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false); 
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(localStorage.getItem('rol'));
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('nombre'));
  const [userType, setUserType] = useState<string | null>(localStorage.getItem('tipo'));
  const [userFoto, setUserFoto] = useState<string | null>(localStorage.getItem('foto'));
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);

  useEffect(() => {
    const storageListener = () => {
      setUserRole(localStorage.getItem('rol'))
      setUserName(localStorage.getItem('nombre'))
      setUserType(localStorage.getItem('tipo'))
      setUserFoto(localStorage.getItem('foto'))
    }
    window.addEventListener('storage', storageListener)
    return () => window.removeEventListener('storage', storageListener)
  }, [])

  // Mostrar mensaje de bienvenida para clientes
  useEffect(() => {
    if (userType === 'cliente' && userRole === 'Cliente') {
      setShowWelcomeMessage(true);
      // Ocultar mensaje después de 5 segundos
      const timer = setTimeout(() => {
        setShowWelcomeMessage(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [userType, userRole]);

  const showLoadingDialog = (message: string) => {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.innerHTML = `
      <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
        <div class="spinner" style="width: 40px; height: 40px; border: 4px solid #ccc; border-top: 4px solid #2563eb; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <p style="margin-top: 10px; font-size: 1.2rem; color: #2563eb;">${message}</p>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  };

  const showErrorDialog = (message: string) => {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.innerHTML = `
      <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid red;">
        <div style="color: red; font-size: 2rem; margin-bottom: 10px;">⚠️</div>
        <p style="margin-top: 10px; font-size: 1.2rem; color: red;">${message}</p>
      </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => document.body.removeChild(overlay), 2500);
  };

  const handleLogin = async (email: string, password: string): Promise<void> => {
    const overlay = showLoadingDialog('Iniciando sesión...');

    try {
      const response = await axios.post('http://localhost:4000/api/login', {
        correo: email,
        contrasena: password,
      });

      if (response.data.success) {
        const { nombre, rol, token, tipo, foto } = response.data;

        // Store token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('rol', rol);
        localStorage.setItem('nombre', nombre);
        localStorage.setItem('tipo', tipo);
        localStorage.setItem('foto', foto || '');

        setUserRole(rol);
        setUserName(nombre);
        setUserType(tipo);
        setUserFoto(foto || '');
        setIsLoginOpen(false);
      } else {
        showErrorDialog(response.data.message || 'Credenciales incorrectas');
      }
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      const errorMessage = error.response?.data?.message || 'Usuario o contraseña inválidos';
      showErrorDialog(errorMessage);
    } finally {
      setTimeout(() => document.body.removeChild(overlay), 2500);
    }
  };

  const handleRegisterSuccess = (userData: any) => {
    setUserRole(userData.rol);
    setUserName(userData.nombre);
    setUserType(userData.tipo);
    setUserFoto(userData.foto || '');
  };

  const handleLogout = () => {
    const overlay = showLoadingDialog('Cerrando sesión...');
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('nombre');
    localStorage.removeItem('tipo');
    localStorage.removeItem('foto');
    setUserRole(null);
    setUserName(null);
    setUserType(null);
    setUserFoto(null);
    setActiveTab(null);
    setShowWelcomeMessage(false);

    setTimeout(() => {
      document.body.removeChild(overlay);
      window.location.reload();
    }, 2500);
  };

  const handleContactSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const formData = new FormData(event.target as HTMLFormElement);
    const subject = formData.get('subject') as string;
    const message = formData.get('message') as string;

    const updatedSubject = userType === 'cliente' ? `Cliente Registrado - ${subject}` : subject;

    // Simulate sending the email
    console.log('Enviando correo con asunto:', updatedSubject);
    console.log('Mensaje:', message);

    alert('Correo enviado exitosamente.');
  };

{
  return (
    <>
      {/* Header con estado de autenticación */}
      <Header
        onLoginClick={() => setIsLoginOpen(true)}
        onLogoutClick={handleLogout}
        isAuthenticated={!!userRole}
        userName={userName}
        userRole={userRole}
        userType={userType}
        userFoto={userFoto}
        activeTab={activeTab}
        onNavSelect={(tab) => setActiveTab(tab)}
      />

      {/* Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onRegisterClick={() => setIsRegisterOpen(true)}
        onLogin={handleLogin}
      />


      <RegisterModal 
        isOpen={isRegisterOpen} 
        onClose={() => setIsRegisterOpen(false)} 
        onLoginSuccess={handleRegisterSuccess}
      />

      
<div className="hero-image-container">
  <h1 className="hero-text typing">Asesoría y Soluciones Óptimas para tus Finanzas</h1>
</div>

{/* Mensaje de bienvenida para clientes */}
{showWelcomeMessage && (
  <div className="welcome-message">
    <div className="welcome-content">
      <span className="welcome-icon">👋</span>
      <span className="welcome-text">¡Bienvenido, {userName}! Has iniciado sesión como cliente.</span>
      <button 
        className="welcome-close" 
        onClick={() => setShowWelcomeMessage(false)}
      >
        ✕
      </button>
    </div>
  </div>
)}



      {(!userRole || userType === 'cliente') && (
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
      )}

      {(!userRole || userType === 'cliente') && (
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
      )}

      {(!userRole || userType === 'cliente') && (
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
      )}

      {(!userRole || userType === 'cliente') && (
        <section id="contact" className="contact-section">
  <h2 className="white-title">Contáctanos</h2>
  <div className="cards-container contact-container">
    
    {/* Formulario de contacto */}
    <form className="contact-form" onSubmit={handleContactSubmit}>
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
      )}

      {/* Vistas por rol - Solo para empleados y administradores */}
      {userRole && userType !== 'cliente' && (
        <div>
          {userRole === 'administrador' || userRole === 'Administrador' ? (
            <AdminView 
              nombre={userName || ''} 
              externalSection={
                activeTab === 'empleados' ? 'empleados' :
                activeTab === 'empresas' ? 'empresas' :
                activeTab === 'roles' ? 'roles' :
                activeTab === 'cuentas' ? 'cuentas' :
                activeTab === 'papeleria' ? 'papeleria' :
                activeTab === 'etapas-catalogo' ? 'etapas-catalogo' :
                activeTab === 'etapas-cuenta' ? 'etapas-cuenta' :
                null
              }
              onSectionChange={(section) => {
                if (!section) {
                  setActiveTab(null)
                }
              }}
            />
          ) : (
            <div style={{ marginTop: '20px' }}>
              <h2 className="white-title">Bienvenido {userName}</h2>
              {activeTab === 'Cuentas' && <UserView nombre={userName || ''} />}
              {activeTab === 'Empresas' && <UserView nombre={userName || ''} />}
              {!activeTab && <UserView nombre={userName || ''} />}
            </div>
          )}
        </div>
      )}

    </>
  )
  }
}

export default App
