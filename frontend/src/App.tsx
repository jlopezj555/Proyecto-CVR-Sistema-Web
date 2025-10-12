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
import SecretariaView from './components/SecretariaView';
import RevisorView from './components/RevisorView';
import axios from 'axios';
import API_CONFIG from './config/api';


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
  const [rolePickerOpen, setRolePickerOpen] = useState(false);
  const [roleOptions, setRoleOptions] = useState<string[]>([]);
  const IDLE_LIMIT_MS = 10 * 60 * 1000; // 10 minutos

  useEffect(() => {
    const storageListener = () => {
      setUserRole(localStorage.getItem('rol'))
      setUserName(localStorage.getItem('nombre'))
      setUserType(localStorage.getItem('tipo'))
      setUserFoto(localStorage.getItem('foto'))
    }
    window.addEventListener('storage', storageListener)
    //Sincronizar al enfocar (iOS/Android no dispara 'storage' de forma confiable)
    const onFocus = () => storageListener()
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('storage', storageListener)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  // Inactividad: cerrar sesión automáticamente después de 10 minutos (persistente entre pestañas/cierres)
  useEffect(() => {
    // Si hay sesión, inicializar marca de actividad
    if (userRole) {
      if (!localStorage.getItem('lastActivity')) {
        localStorage.setItem('lastActivity', Date.now().toString())
      }
    } else {
      localStorage.removeItem('lastActivity')
    }

    const updateActivity = () => {
      if (userRole) {
        localStorage.setItem('lastActivity', Date.now().toString())
      }
    }

    const checkIdleAndLogout = () => {
      if (!userRole) return;
      const last = parseInt(localStorage.getItem('lastActivity') || '0', 10)
      const now = Date.now()
      if (last && now - last >= IDLE_LIMIT_MS) {
        handleLogout()
      }
    }

    // Eventos de actividad del usuario
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const
    activityEvents.forEach(evt => window.addEventListener(evt, updateActivity, { passive: true }))

    // Revisión periódica (cada 30s)
    const intervalId = window.setInterval(checkIdleAndLogout, 30 * 1000)

    // Al cambiar visibilidad, revisar inmediatamente
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkIdleAndLogout()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', checkIdleAndLogout)

    // Al montar (o cuando cambie userRole), validar inactividad de inmediato
    checkIdleAndLogout()

    return () => {
      activityEvents.forEach(evt => window.removeEventListener(evt, updateActivity))
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', checkIdleAndLogout)
    }
  }, [userRole])

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

  // Modo admin/empleado: desactivar fondo hero fijo para evitar superposición
  useEffect(() => {
    const adminMode = !!userRole && userType !== 'cliente';
    if (adminMode) {
      document.body.classList.add('admin-mode');
    } else {
      document.body.classList.remove('admin-mode');
    }
    return () => {
      document.body.classList.remove('admin-mode');
    };
  }, [userRole, userType]);

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
      const response = await axios.post<any>(`${API_CONFIG.BASE_URL}/api/login`, {
        correo: email,
        contrasena: password,
      });

      if ((response.data as any).success) {
        const { nombre, rol, token, tipo, foto, roles } = (response.data as any);

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
        // Si empleado con roles múltiples (por ejemplo Contador/Digitador y Revisor), ofrecer selector
        if (tipo === 'empleado') {
          try {
            const { data } = await axios.get<any>(`${API_CONFIG.BASE_URL}/api/mis-roles`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const roles: string[] = (data?.data || []).map((r: any) => r.nombre_rol);
            const tieneRevisor = roles.some(r => r.toLowerCase().includes('revisor'));
            const tieneNoRevisor = roles.some(r => !r.toLowerCase().includes('revisor'));
            if (tieneRevisor && tieneNoRevisor) {
              setRoleOptions(roles);
              setRolePickerOpen(true);
            }
          } catch (_) {}
        }

        setIsLoginOpen(false);
        // Registrar actividad inicial al iniciar sesión
        localStorage.setItem('lastActivity', Date.now().toString());
      } else {
  showErrorDialog((response.data as any).message || 'Credenciales incorrectas');
      }
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
  const errorMessage = (error.response?.data as any)?.message || 'Usuario o contraseña inválidos';
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

  const handleContactSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const payload = {
      nombre: String(formData.get('nombre') || ''),
      telefono: String(formData.get('telefono') || ''),
      correo: String(formData.get('correo') || ''),
      empresa: String(formData.get('empresa') || ''),
      mensaje: String(formData.get('mensaje') || ''),
    };

    const overlay = showLoadingDialog('Enviando mensaje...');
    try {
  await axios.post<any>(`${API_CONFIG.BASE_URL}/api/contact`, payload);
      // Feedback de éxito
      alert('Mensaje enviado. Gracias por contactarnos.');
      form.reset();
    } catch (error: any) {
      console.error('Error enviando contacto:', error);
  const errorMessage = (error?.response?.data as any)?.message || 'No se pudo enviar el mensaje, intenta nuevamente.';
      showErrorDialog(errorMessage);
    } finally {
      setTimeout(() => document.body.removeChild(overlay), 800);
    }
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

      {/* Selector de rol al iniciar sesión, cuando corresponda */}
      {rolePickerOpen && (
        <div className="password-modal-overlay">
          <div className="password-modal">
            <div className="password-modal-header">
              <h3>Elegir rol de sesión</h3>
              <button className="password-modal-close" onClick={() => setRolePickerOpen(false)}>✖</button>
            </div>
            <div className="password-modal-body">
              <p className="password-modal-message">Selecciona cómo deseas iniciar sesión:</p>
              <div style={{ display: 'grid', gap: 8 }}>
                {roleOptions.map((r) => (
                  <button
                    key={r}
                    className="password-btn-verify"
                    onClick={() => {
                      // Si elige un rol que contiene 'revisor' ir a RevisorView, de lo contrario UserView
                      const isRevisor = r.toLowerCase().includes('revisor');
                      localStorage.setItem('rol', isRevisor ? r : 'Empleado');
                      setUserRole(isRevisor ? r : 'Empleado');
                      setRolePickerOpen(false);
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}


      <RegisterModal 
        isOpen={isRegisterOpen} 
        onClose={() => setIsRegisterOpen(false)} 
        onLoginSuccess={handleRegisterSuccess}
      />
      
      {(!userRole || userType === 'cliente') && (
        <div className="hero-image-container">
          <h1 className="hero-text typing">Asesoría y Soluciones Óptimas para tus Finanzas</h1>
        </div>
      )}

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
      href="https://mail.google.com/mail/?view=cm&fs=1&to=impuestos@cvrasesoria.com.gt" 
      target="_blank" 
      rel="noopener noreferrer"
      className="contact-card"
    >
      <div className="icon-circle">
        <FaEnvelope className="contact-icon" />
      </div>
      <span>impuestos@cvrasesoria.com.gt</span>
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
<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3860.549060121114!2d-90.5165068!3d14.6247455!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8589a23ab88536ef%3A0x195a64415ba0d954!2sGran%20Centro%20Comercial%20zona%204!5e0!3m2!1ses-419!2sgt!4v1759809700440!5m2!1ses-419!2sgt" 
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
              externalSection={null}
              onSectionChange={(section) => {
                if (!section) {
                  setActiveTab(null)
                }
              }}
            />
          ) : userRole?.toLowerCase().includes('secretaria') ? (
            <SecretariaView nombre={userName || ''} />
          ) : userRole?.toLowerCase().includes('revisor') ? (
            <RevisorView nombre={userName || ''} />
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
