import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CRUDTable.css';
import PasswordVerificationModal from './PasswordVerificationModal';

interface Column {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'select' | 'date' | 'boolean' | 'multiselect';
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
  afterCreate?: (createdItem: any, submittedData: any) => Promise<void> | void;
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
  onDataChange,
  afterCreate
}) => {
  const [data, setData] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'create' | 'update' | 'delete' | null>(null);
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
      setPendingAction('delete');
      setShowPasswordModal(true);
    }
  };

  // Verificación y ejecución de acción protegida por contraseña
  const handleAdminVerify = async (password: string): Promise<boolean> => {
    try {
      if (pendingAction === 'create') {
        const payload = { ...formData };
        // Enviar contraseña de admin separada para no pisar contraseñas de recursos
        (payload as any).adminContrasena = password;
        const resp = await axios.post(`http://localhost:4000/api/${endpoint}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setSuccess('Registro creado exitosamente');
        setShowCreateModal(false);
        setFormData({});
        try {
          await afterCreate?.(resp?.data?.data ?? null, formData);
        } catch (_) {}
      } else if (pendingAction === 'update') {
        if (!selectedItem) return false;
        const id = selectedItem[`id_${endpoint.slice(0, -1)}`];
        const payload = { ...formData } as any;
        (payload as any).adminContrasena = password;
        await axios.put(`http://localhost:4000/api/${endpoint}/${id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setSuccess('Registro actualizado exitosamente');
        setShowEditModal(false);
        setSelectedItem(null);
      } else if (pendingAction === 'delete') {
        if (!selectedItem) return false;
        const id = selectedItem[`id_${endpoint.slice(0, -1)}`];
        await axios.delete(`http://localhost:4000/api/${endpoint}/${id}`, {
          data: { adminContrasena: password },
          headers: { Authorization: `Bearer ${token}` }
        });

        setSuccess('Registro eliminado exitosamente');
        setSelectedItem(null);
      }

      setShowPasswordModal(false);
      setPendingAction(null);
      fetchData();
      onDataChange?.();
      setTimeout(() => setSuccess(''), 3000);
      return true;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error en la operación');
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
      case 'multiselect':
        return (
          <select
            multiple
            value={Array.isArray(value) ? value : []}
            onChange={(e) => {
              const options = Array.from(e.target.selectedOptions).map(o => o.value);
              handleInputChange(field.key, options);
            }}
            required={field.required}
            disabled={field.readonly}
          >
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
            type={(field.key.toLowerCase().includes('contrasena') ? 'password' : (field.type || 'text'))}
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            required={field.required}
            disabled={field.readonly}
            placeholder={`Ingresa ${field.label.toLowerCase()}`}
          />
        );
    }
  };

  const isFormValid = (fields: Column[]) => {
    return fields.every(field => {
      if (!field.required) return true;
      const val = formData[field.key];
      if (field.type === 'multiselect') {
        return Array.isArray(val) && val.length > 0;
      }
      if (field.type === 'boolean') {
        return typeof val === 'boolean';
      }
      return val !== undefined && val !== null && String(val).trim() !== '';
    });
  };

  const renderModal = (isEdit: boolean) => {
    const fields = isEdit ? editFields : createFields;
    const valid = isFormValid(fields);
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
                  onClick={() => {
                    setPendingAction(isEdit ? 'update' : 'create');
                    setShowPasswordModal(true);
                  }}
                  className="crud-btn-save"
                  disabled={!valid}
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
                        : (column.key.toLowerCase().includes('contrasena')
                            ? '••••••'
                            : (item[column.key] || '-'))
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
        onVerify={handleAdminVerify}
        title="Verificación de Administrador"
        message={
          pendingAction === 'delete'
            ? 'Ingresa tu contraseña para eliminar este registro'
            : pendingAction === 'update'
              ? 'Ingresa tu contraseña para actualizar este registro'
              : 'Ingresa tu contraseña para crear este registro'
        }
      />
    </div>
  );
};

export default CRUDTable;
