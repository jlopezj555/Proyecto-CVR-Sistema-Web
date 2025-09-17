import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EtapasCuentaView.css';

interface EtapaCuenta {
  id_etapa_cuenta: number;
  id_cuenta: number;
  nombre: string;
  apellido: string;
  nombre_rol: string;
  nombre_etapa: string;
  etapa_descripcion: string;
  estado: string;
  motivo_rechazo?: string;
  etapa_origen_nombre?: string;
  fecha_inicio: string;
  fecha_fin?: string;
}

const EtapasCuentaView: React.FC = () => {
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [etapas, setEtapas] = useState<EtapaCuenta[]>([]);
  const [selectedCuenta, setSelectedCuenta] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchCuentas();
  }, []);

  useEffect(() => {
    if (selectedCuenta) {
      fetchEtapas(selectedCuenta);
    }
  }, [selectedCuenta]);

  const fetchCuentas = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/cuentas', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCuentas(response.data.data);
    } catch (error) {
      console.error('Error cargando cuentas:', error);
    }
  };

  const fetchEtapas = async (cuentaId: number) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:4000/api/cuentas/${cuentaId}/etapas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEtapas(response.data.data);
    } catch (error) {
      console.error('Error cargando etapas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Completada':
        return '#28a745';
      case 'En progreso':
        return '#ffc107';
      case 'Rechazada':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  return (
    <div className="etapas-cuenta-container">
      <div className="etapas-cuenta-header">
        <h2>Etapas de Cuentas</h2>
        <p>Visualiza el progreso de cada cuenta en sus diferentes etapas</p>
      </div>

      <div className="etapas-cuenta-controls">
        <div className="cuenta-selector">
          <label htmlFor="cuenta-select">Seleccionar Cuenta:</label>
          <select
            id="cuenta-select"
            value={selectedCuenta || ''}
            onChange={(e) => setSelectedCuenta(Number(e.target.value) || null)}
          >
            <option value="">-- Seleccionar una cuenta --</option>
            {cuentas.map(cuenta => (
              <option key={cuenta.id_cuenta} value={cuenta.id_cuenta}>
                {cuenta.nombre_cuenta} - {cuenta.nombre_empresa}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedCuenta && (
        <div className="etapas-cuenta-content">
          {loading ? (
            <div className="etapas-loading">Cargando etapas...</div>
          ) : etapas.length === 0 ? (
            <div className="etapas-empty">
              No hay etapas registradas para esta cuenta
            </div>
          ) : (
            <div className="etapas-timeline">
              <h3>Progreso de la Cuenta</h3>
              {etapas.map((etapa, index) => (
                <div key={etapa.id_etapa_cuenta} className="etapa-item">
                  <div className="etapa-timeline-marker">
                    <div 
                      className="etapa-status-dot"
                      style={{ backgroundColor: getEstadoColor(etapa.estado) }}
                    ></div>
                    {index < etapas.length - 1 && <div className="etapa-timeline-line"></div>}
                  </div>
                  
                  <div className="etapa-content">
                    <div className="etapa-header">
                      <h4>{etapa.nombre_etapa}</h4>
                      <span 
                        className="etapa-estado"
                        style={{ color: getEstadoColor(etapa.estado) }}
                      >
                        {etapa.estado}
                      </span>
                    </div>
                    
                    <div className="etapa-details">
                      <div className="etapa-info">
                        <p><strong>Responsable:</strong> {etapa.nombre} {etapa.apellido}</p>
                        <p><strong>Rol:</strong> {etapa.nombre_rol}</p>
                        <p><strong>Descripción:</strong> {etapa.etapa_descripcion || 'Sin descripción'}</p>
                        <p><strong>Fecha de inicio:</strong> {formatDate(etapa.fecha_inicio)}</p>
                        {etapa.fecha_fin && (
                          <p><strong>Fecha de finalización:</strong> {formatDate(etapa.fecha_fin)}</p>
                        )}
                      </div>
                      
                      {etapa.estado === 'Rechazada' && (
                        <div className="etapa-rechazo">
                          <p><strong>Motivo de rechazo:</strong> {etapa.motivo_rechazo}</p>
                          {etapa.etapa_origen_nombre && (
                            <p><strong>Etapa origen del error:</strong> {etapa.etapa_origen_nombre}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EtapasCuentaView;
