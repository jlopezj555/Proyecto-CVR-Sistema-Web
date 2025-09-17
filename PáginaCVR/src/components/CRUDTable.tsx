import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CRUDTable.css';
import PasswordVerificationModal from './PasswordVerificationModal';

interface Column {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'select' | 'date' | 'boolean';
  options?: { value: any; label: string }[];
  required?: boolean;
  readonly?: boolean;
}

interface CRUDTableProps {
  title: string;
  endpoint: string;
  columns: Column[];
  createFields: Column[];
  editFields: Column[];
  onDataChange?: () => void;
}

interface TableData {
  [key: string]: any;
}

const CRUDTable: React.FC<CRUDTableProps> = ({
  title,
  endpoint,
  columns,
  createFields,
  editFields,
  onDataChange
}) => {
  const [data, setData] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TableData | null>(null);
  const [formData, setFormData] = useState<TableData>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = localStorage.getItem('token');

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:4000/api/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => {
    setFormData({});
    setShowCreateModal(true);
    setError('');
  };

  const handleEdit = (item: TableData) => {
    setSelectedItem(item);
    setFormData({ ...item });
    setShowEditModal(true);
    setError('');
  };

  const handleDelete = (item: TableData) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este registro?')) {
      setSelectedItem(item);
      setShowPasswordModal(true);
    }
  };

  const handlePasswordVerify = async (password: string): Promise<boolean> => {
    try {
      const action = selectedItem ? 'delete' : 'create';
      const url = selectedItem 
        ? `http://localhost:4000/api/${endpoint}/${selectedItem[`id_${endpoint.slice(0, -1)}`]}`
        : `http://localhost:4000/api/${endpoint}`;
      
      const method = selectedItem ? 'DELETE' : 'POST';
      const payload = selectedItem ? { contrasena: password } : { ...formData, contrasena: password };

      await axios({
        method,
        url,
        data: payload,
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(selectedItem ? 'Registro eliminado exitosamente' : 'Registro creado exitosamente');
      setShowPasswordModal(false);
      setShowCreateModal(false);
      setSelectedItem(null);
      fetchData();
      onDataChange?.();
      
      setTimeout(() => setSuccess(''), 3000);
      return true;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error en la operación');
      return false;
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    
    setShowPasswordModal(true);
  };

  const handleUpdatePasswordVerify = async (password: string): Promise<boolean> => {
    try {
      const id = selectedItem[`id_${endpoint.slice(0, -1)}`];
      await axios.put(`http://localhost:4000/api/${endpoint}/${id}`, {
        ...formData,
        contrasena: password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Registro actualizado exitosamente');
      setShowPasswordModal(false);
      setShowEditModal(false);
      setSelectedItem(null);
      fetchData();
      onDataChange?.();
      
      setTimeout(() => setSuccess(''), 3000);
      return true;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al actualizar');
      return false;
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const renderFormField = (field: Column) => {
    const value = formData[field.key] || '';

    switch (field.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            required={field.required}
            disabled={field.readonly}
          >
            <option value="">Seleccionar...</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => handleInputChange(field.key, e.target.checked)}
            disabled={field.readonly}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            required={field.required}
            disabled={field.readonly}
          />
        );
      default:
        return (
          <input
            type={field.type || 'text'}
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            required={field.required}
            disabled={field.readonly}
            placeholder={`Ingresa ${field.label.toLowerCase()}`}
          />
        );
    }
  };

  const renderModal = (isEdit: boolean) => {
    const fields = isEdit ? editFields : createFields;
    const isOpen = isEdit ? showEditModal : showCreateModal;
    const onClose = () => {
      if (isEdit) {
        setShowEditModal(false);
        setSelectedItem(null);
      } else {
        setShowCreateModal(false);
      }
      setFormData({});
      setError('');
    };

    return (
      <div className={`crud-modal-overlay ${isOpen ? 'open' : ''}`}>
        <div className="crud-modal">
          <div className="crud-modal-header">
            <h3>{isEdit ? 'Editar' : 'Crear'} {title}</h3>
            <button className="crud-modal-close" onClick={onClose}>✖</button>
          </div>
          
          <div className="crud-modal-body">
            <form className="crud-form">
              {fields.map(field => (
                <div key={field.key} className="crud-form-group">
                  <label>
                    {field.label}:
                    {field.required && <span className="required">*</span>}
                  </label>
                  {renderFormField(field)}
                </div>
              ))}
              
              {error && <div className="crud-error">{error}</div>}
              
              <div className="crud-modal-actions">
                <button type="button" onClick={onClose} className="crud-btn-cancel">
                  Cancelar
                </button>
                <button 
                  type="button" 
                  onClick={isEdit ? handleUpdate : () => setShowPasswordModal(true)}
                  className="crud-btn-save"
                >
                  {isEdit ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="crud-table-container">
      <div className="crud-table-header">
        <h2>{title}</h2>
        <button onClick={handleCreate} className="crud-btn-create">
          + Crear Nuevo
        </button>
      </div>

      {success && <div className="crud-success">{success}</div>}
      {error && <div className="crud-error">{error}</div>}

      <div className="crud-table-wrapper">
        {loading ? (
          <div className="crud-loading">Cargando...</div>
        ) : (
          <table className="crud-table">
            <thead>
              <tr>
                {columns.map(column => (
                  <th key={column.key}>{column.label}</th>
                ))}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index}>
                  {columns.map(column => (
                    <td key={column.key}>
                      {column.type === 'boolean' 
                        ? (item[column.key] ? 'Sí' : 'No')
                        : item[column.key] || '-'
                      }
                    </td>
                  ))}
                  <td>
                    <div className="crud-actions">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="crud-btn-edit"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(item)}
                        className="crud-btn-delete"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {renderModal(false)}
      {renderModal(true)}

      <PasswordVerificationModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onVerify={selectedItem ? handleUpdatePasswordVerify : handlePasswordVerify}
        title="Verificación de Administrador"
        message="Ingresa tu contraseña para continuar con esta acción"
      />
    </div>
  );
};

export default CRUDTable;
