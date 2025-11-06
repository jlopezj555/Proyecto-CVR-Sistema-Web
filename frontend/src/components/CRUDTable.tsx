import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_CONFIG from '../config/api';
import './CRUDTable.css';
import PasswordVerificationModal from './PasswordVerificationModal';

export interface Column {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'select' | 'date' | 'boolean' | 'multiselect' | 'checkboxes';
  options?: { value: any; label: string }[];
  required?: boolean;
  readonly?: boolean;
  // Opcional: opciones dinámicas dependientes de otros campos del formulario
  dynamicOptions?: (formData: TableData, token: string) => Promise<{ value: any; label: string }[]>;
  dependsOnKeys?: string[];
  // Deshabilitar el campo condicionalmente según formData
  disabledWhen?: (formData: TableData) => boolean;
  // Renderizado personalizado de la celda
  render?: (value: any, row?: TableData) => React.ReactNode;
}

interface CRUDTableProps {
  title: string;
  endpoint: string;
  columns: Column[];
  createFields: Column[];
  editFields: Column[];
  onDataChange?: () => void;
  afterCreate?: (createdItem: any, submittedData: any) => Promise<void> | void;
  extraActionsForItem?: (item: TableData, refresh: () => void) => React.ReactNode;
  queryParams?: Record<string, any>;
  filterFunction?: (row: TableData) => boolean;
  // Opcional: obtener identificador personalizado para update/delete (soporta compuesto, e.g. "idRol/idEtapa")
  getItemId?: (item: TableData) => string | number;
  // Opcional: deshabilitar botón de editar (global o por fila)
  disableEdit?: boolean | ((item: TableData) => boolean);
  // Opcional: ocultar botón de editar (global o por fila)
  hideEditButton?: boolean | ((item: TableData) => boolean);
  // Opcional: ocultar botón de eliminar (global o por fila)
  hideDeleteButton?: boolean | ((item: TableData) => boolean);
  // Opcional: construir URL de borrado personalizada
  deletePathBuilder?: (id: string | number, item: TableData) => string;
  // Opcional: decidir si se requiere contraseña para una acción específica
  shouldRequirePassword?: (action: 'create' | 'update' | 'delete', item?: TableData | null) => boolean;
  // Opcional: manejar actualización personalizada (si devuelve true, no se usa flujo por defecto)
  onUpdate?: (id: string | number, formData: TableData, token: string) => Promise<void | boolean>;
  // Opcional: deshabilitar botón de eliminar para ciertos registros
  disableDeleteFor?: (item: TableData) => boolean;
  // Opcional: validar antes de crear (devuelve true si es válido, o lanza error)
  onBeforeCreate?: (formData: TableData) => Promise<boolean>;
}

export interface TableData {
  [key: string]: any;
}

const CRUDTable: React.FC<CRUDTableProps> = ({
  title,
  endpoint,
  columns,
  createFields,
  editFields,
  onDataChange,
  afterCreate,
  extraActionsForItem,
  queryParams,
  filterFunction,
  hideEditButton = false,
  hideDeleteButton = false,
  deletePathBuilder,
  shouldRequirePassword,
  onUpdate,
  onBeforeCreate,
  disableEdit = false,
  disableDeleteFor,
  getItemId
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
  const [passwordModalError, setPasswordModalError] = useState('');
  // Mostrar mensajes de validación solo después de presionar Guardar
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  // Visibilidad de contraseñas por campo (mantener presionado el ojo)
  const [revealMap, setRevealMap] = useState<Record<string, boolean>>({});
  const revealOn = (key: string) => setRevealMap(prev => ({ ...prev, [key]: true }));
  const revealOff = (key: string) => setRevealMap(prev => ({ ...prev, [key]: false }));
  // Opciones dinámicas por campo (se actualizan según depende de otros campos)
  const [dynamicFieldOptions, setDynamicFieldOptions] = useState<Record<string, { value: any; label: string }[]>>({});
  const prevDepsRef = useRef<Record<string, string>>({});

  // Búsqueda y orden
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const token = localStorage.getItem('token');

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log(`CRUDTable - Fetching data from: ${API_CONFIG.BASE_URL}/api/${endpoint}`);
      const response = await axios.get<any>(`${API_CONFIG.BASE_URL}/api/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: queryParams || {}
      });
      console.log(`CRUDTable - Response for ${endpoint}:`, response.data);
      setData((response.data as any).data);
    } catch (error: any) {
      console.error(`CRUDTable - Error fetching ${endpoint}:`, error);
      setError(error.response?.data?.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Actualizar opciones dinámicas cuando cambie el formData o el modo del modal
  useEffect(() => {
    const tokenLocal = token || '';
    (async () => {
      const fields = (showEditModal ? editFields : createFields) || [];
      for (const field of fields) {
        if (typeof field.dynamicOptions === 'function') {
          const deps = (field.dependsOnKeys || []).map(k => String(formData[k] ?? '')).join('|');
          if (prevDepsRef.current[field.key] !== deps) {
            prevDepsRef.current[field.key] = deps;
            try {
              const opts = await field.dynamicOptions(formData, tokenLocal);
              setDynamicFieldOptions(prev => ({ ...prev, [field.key]: opts }));
              const currentVal = formData[field.key];
              if (currentVal && !opts.some(o => String(o.value) === String(currentVal))) {
                setFormData(prev => ({ ...prev, [field.key]: '' }));
              }
            } catch (e) {
              // Silenciar errores de carga de opciones dinámicas
            }
          }
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, showEditModal, showCreateModal]);

  // Refetch cuando cambien los filtros externos
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(queryParams)]);

  const handleCreate = () => {
    setFormData({});
    setShowCreateModal(true);
    setError('');
    setShowValidationErrors(false);
  };

  const isEditDisabled = (item?: TableData) => {
    if (typeof disableEdit === 'function') return !!disableEdit(item || {});
    return !!disableEdit;
  };

  const handleEdit = (item: TableData) => {
    if (isEditDisabled(item)) return;
    setSelectedItem(item);
    setFormData({ ...item });
    setShowEditModal(true);
    setError('');
    setShowValidationErrors(false);
  };

  const isDeleteDisabled = (item?: TableData) => {
    if (typeof disableDeleteFor === 'function') return disableDeleteFor(item || {});
    return false;
  };

  const handleDelete = (item: TableData) => {
    if (isDeleteDisabled(item)) return;
    if (window.confirm('¿Estás seguro de que deseas eliminar este registro?')) {
      setSelectedItem(item);
      setPendingAction('delete');
      setShowPasswordModal(true);
    }
  };

  const performDefaultUpdate = async () => {
    if (!selectedItem) return false;
    const id = typeof getItemId === 'function'
      ? getItemId(selectedItem)
      : selectedItem[`id_${endpoint.slice(0, -1)}`];
    const payload = { ...(formData || {}) } as any;
    // No enviar campo auxiliar de contraseña actual si existe en el formulario
    if ('contrasena_actual' in payload) {
      delete payload.contrasena_actual;
    }
    await axios.put<any>(`${API_CONFIG.BASE_URL}/api/${endpoint}/${id}`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    setSuccess('Registro actualizado exitosamente');
    setShowEditModal(false);
    setSelectedItem(null);
    fetchData();
    onDataChange?.();
    setTimeout(() => setSuccess(''), 3000);
    return true;
  };

  const handleAdminVerify = async (password: string): Promise<boolean> => {
    try {
      if (pendingAction === 'create') {
        const payload = { ...(formData || {}) } as any;
        payload.adminContrasena = password;
        
        // Validar antes de crear si existe onBeforeCreate
        if (typeof onBeforeCreate === 'function') {
          try {
            await onBeforeCreate(formData as TableData);
          } catch (e: any) {
            const msg = e?.message || e?.response?.data?.message || 'Error en validación previa';
            // Mostrar el mensaje tanto en el formulario como en el modal de contraseña
            setError(msg);
            setPasswordModalError(msg);
            return false;
          }
        }

        const resp = await axios.post<any>(`${API_CONFIG.BASE_URL}/api/${endpoint}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setSuccess('Registro creado exitosamente');
        setShowCreateModal(false);
        setFormData({});
        try {
          await afterCreate?.((resp?.data as any)?.data ?? null, formData);
        } catch (_) { }
      } else if (pendingAction === 'update') {
        if (!selectedItem) return false;
        const id = typeof getItemId === 'function'
          ? getItemId(selectedItem)
          : selectedItem[`id_${endpoint.slice(0, -1)}`];
        const payload = { ...(formData || {}) } as any;
        payload.adminContrasena = password;
        await axios.put<any>(`${API_CONFIG.BASE_URL}/api/${endpoint}/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setSuccess('Registro actualizado exitosamente');
        setShowEditModal(false);
        setSelectedItem(null);
      } else if (pendingAction === 'delete') {
        if (!selectedItem) return false;
        const id = typeof getItemId === 'function'
          ? getItemId(selectedItem)
          : selectedItem[`id_${endpoint.slice(0, -1)}`];
        const deleteUrl = typeof deletePathBuilder === 'function'
          ? deletePathBuilder(id, selectedItem)
          : `${API_CONFIG.BASE_URL}/api/${endpoint}/${id}`;
        // axios.delete soporta 'data' en config en axios >=0.19. Si tu versión es menor, debes actualizar axios.
        await axios.delete(deleteUrl, {
          data: { adminContrasena: password },
          headers: { Authorization: `Bearer ${token}` }
        } as any);

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
      const msg = error?.response?.data?.message || 'Error en la operación';
      setError(msg);
      setPasswordModalError(msg);
      return false;
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // eliminados filtros por columna — búsqueda global usa `searchQuery`

  const onHeaderClick = (key: string) => {
    if (sortBy === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const normalized = (v: any) => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return v.toLowerCase();
    return String(v).toLowerCase();
  };

  const filteredData = data.filter(row => {
    // búsqueda global
    const matchesSearch = !searchQuery || Object.keys(row).some(k => normalized(row[k]).includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (typeof filterFunction === 'function' && !filterFunction(row)) return false;
    return true;
  }).sort((a, b) => {
    if (!sortBy) return 0;
    const av = a[sortBy];
    const bv = b[sortBy];
    // num vs texto
    const aNum = Number(av);
    const bNum = Number(bv);
    let cmp = 0;
    if (!isNaN(aNum) && !isNaN(bNum)) {
      cmp = aNum - bNum;
    } else {
      cmp = normalized(av).localeCompare(normalized(bv), 'es');
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const renderFormField = (field: Column) => {
    const value = formData[field.key] || '';
    const disabled = !!field.readonly || (!!field.disabledWhen && field.disabledWhen(formData));
    const effOptions = dynamicFieldOptions[field.key] || field.options;

    switch (field.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            required={field.required}
            disabled={disabled}
          >
            <option value="">Seleccionar...</option>
            {effOptions?.map(option => (
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
            disabled={disabled}
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
            disabled={disabled}
          >
            {effOptions?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'checkboxes':
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {effOptions?.map(opt => {
              const current: any[] = Array.isArray(value) ? value : [];
              const checked = current.includes(String(opt.value)) || current.includes(opt.value);
              return (
                <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 8, padding: '6px 10px' }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const prev: any[] = Array.isArray(formData[field.key]) ? formData[field.key] : [];
                      const val = String(opt.value);
                      const next = e.target.checked ? Array.from(new Set([...(prev.map(String)), val])) : prev.filter((v) => String(v) !== val);
                      handleInputChange(field.key, next);
                    }}
                    disabled={disabled}
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </div>
        );
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            required={field.required}
            disabled={disabled}
          />
        );
      default:
        // Campo de contraseña con ojo para mostrar mientras se mantenga presionado
        if (field.key.toLowerCase().includes('contrasena')) {
          const isRevealed = !!revealMap[field.key];
          return (
            <div className="password-input-wrap" style={{ position: 'relative' }}>
              <input
                type={isRevealed ? 'text' : 'password'}
                value={value}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                required={field.required}
                disabled={disabled}
                placeholder={`Ingresa ${field.label.toLowerCase()}`}
                style={{ paddingRight: 36, boxSizing: 'border-box' }}
              />
              <button
                type="button"
                className="password-eye"
                aria-label={isRevealed ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={isRevealed ? 'Ocultar' : 'Mostrar'}
                onMouseDown={() => revealOn(field.key)}
                onMouseUp={() => revealOff(field.key)}
                onMouseLeave={() => revealOff(field.key)}
                onTouchStart={(e) => { e.preventDefault(); revealOn(field.key); }}
                onTouchEnd={() => revealOff(field.key)}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  opacity: 0.6,
                  cursor: 'pointer',
                  fontSize: 16,
                  lineHeight: 1,
                  color: '#000'
                }}
              >
                {isRevealed ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7z"/>
                    <circle cx="12" cy="12" r="3.5" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="currentColor" d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7 1.86 0 3.62-.43 5.21-1.2l-2.1-2.1A8.76 8.76 0 0112 17c-2.77 0-5-2.23-5-5 0-.88.23-1.71.63-2.43L6.2 8.14C7.94 6.96 9.91 6.2 12 6.2c4.98 0 9.27 2.93 11.5 7.06-.55 1.02-1.24 1.98-2.05 2.84l1.12 1.12C23 15.61 24 13.87 24 12 21.27 8.11 17 5 12 5z"/>
                    <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
            </div>
          );
        }
        // Campo normal
        return (
          <input
            type={field.type || 'text'}
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            required={field.required}
            disabled={disabled}
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

  const getFieldError = (field: Column): string => {
    const val = formData[field.key];
    if (field.required) {
      if (field.type === 'multiselect' && (!Array.isArray(val) || val.length === 0)) return 'Este campo es requerido';
      if (field.type === 'boolean' && typeof val !== 'boolean') return 'Selecciona una opción';
      if (val === undefined || val === null || String(val).trim() === '') return 'Este campo es requerido';
    }
    if (field.type === 'email' && val) {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val));
      if (!ok) return 'Correo inválido';
    }
    if (field.type === 'date' && val) {
      const d = new Date(String(val));
      if (isNaN(d.getTime())) return 'Fecha inválida';
    }
    if (field.type === 'text' && val && String(val).length > 1024) return 'Texto demasiado largo';
    return '';
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
      setShowValidationErrors(false);
    };

    return (
      <div className={`crud-modal-overlay ${isOpen ? 'open' : ''}`}>
        <div className="crud-modal">
          <div className="crud-modal-header">
            <h3>{isEdit ? 'Editar' : 'Crear'} {title}</h3>
            <button className="crud-modal-close" onClick={onClose}>✖</button>
          </div>
          
          <div className="crud-modal-body">
            <form className="crud-form" onSubmit={(e) => e.preventDefault()}>
              {fields.map(field => {
                const err = getFieldError(field);
                // Mostrar error solo después de presionar Guardar con campos vacíos
                const showErr = !!err && showValidationErrors;
                return (
                  <div key={field.key} className="crud-form-group">
                    <label>
                      {field.label}:
                      {field.required && <span className="required">*</span>}
                    </label>
                    {renderFormField(field)}
                    {showErr && (
                      <div className="crud-error" style={{ marginTop: 6, padding: '8px 12px' }}>{err}</div>
                    )}
                  </div>
                );
              })}
              
              {error && <div className="crud-error">{error}</div>}
              
              <div className="crud-modal-actions">
                <button type="button" onClick={onClose} className="crud-btn-cancel">
                  Cancelar
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    // Si hay campos requeridos vacíos, mostrar advertencias pero no abrir modal
                    if (!isFormValid(fields)) {
                      setShowValidationErrors(true);
                      return;
                    }
                    // Decidir si requerimos contraseña para esta acción
                    const requirePwd = typeof shouldRequirePassword === 'function'
                      ? shouldRequirePassword(isEdit ? 'update' : 'create', selectedItem)
                      : true;
                    if (isEdit && !requirePwd) {
                      // Flujo sin contraseña para actualización
                      (async () => {
                        try {
                          const id = selectedItem && (typeof getItemId === 'function' ? getItemId(selectedItem) : selectedItem[`id_${endpoint.slice(0, -1)}`]);
                          if (id !== undefined && onUpdate) {
                            const handled = await onUpdate(id, formData, token || '');
                            if (handled === false) {
                              await performDefaultUpdate();
                            } else {
                              // onUpdate se encargó de todo; refrescar
                              setShowEditModal(false);
                              setSelectedItem(null);
                              setSuccess('Registro actualizado exitosamente');
                              fetchData();
                              onDataChange?.();
                              setTimeout(() => setSuccess(''), 3000);
                            }
                          } else {
                            await performDefaultUpdate();
                          }
                        } catch (e: any) {
                          const msg = e?.response?.data?.message || 'Error en la actualización';
                          setError(msg);
                        }
                      })();
                    } else {
                      setPendingAction(isEdit ? 'update' : 'create');
                      setShowPasswordModal(true);
                    }
                  }}
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
      <div className="crud-table-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h2>{title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setSearchOpen(prev => !prev)} className="crud-btn-search" title="Buscar">🔎 Buscar</button>
          <button onClick={handleCreate} className="crud-btn-create">
            + Crear Nuevo
          </button>
        </div>
      </div>

      {searchOpen && (
        <div style={{ margin: '8px 0' }}>
          <input
            placeholder="Escribe para buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid #e9ecef' }}
          />
        </div>
      )}

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
                  <th key={column.key} onClick={() => onHeaderClick(column.key)} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    {column.label} {sortBy === column.key ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </th>
                ))}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={index}>
                  {columns.map(column => (
                    <td key={column.key}>
                      {column.render
                        ? column.render(item[column.key], item)
                        : column.type === 'boolean'
                          ? (item[column.key] ? 'Sí' : 'No')
                          : (column.key.toLowerCase().includes('contrasena')
                              ? '••••••'
                              : (item[column.key] || '-'))
                      }
                    </td>
                  ))}
                  <td>
                    <div className="crud-actions">
                      {!(typeof hideEditButton === 'function' ? hideEditButton(item) : hideEditButton) && !isEditDisabled(item) && (
                        <button
                          onClick={() => handleEdit(item)}
                          className="crud-btn-edit"
                          title="Editar"
                        >
                          ✏️
                        </button>
                      )}
                      {!(typeof hideDeleteButton === 'function' ? hideDeleteButton(item) : hideDeleteButton) && (
                        <button 
                          onClick={() => handleDelete(item)}
                          className={`crud-btn-delete ${typeof disableDeleteFor === 'function' && disableDeleteFor(item) ? 'disabled' : ''}`}
                          title={typeof disableDeleteFor === 'function' && disableDeleteFor(item) ? 'No se puede eliminar este registro' : 'Eliminar'}
                          disabled={typeof disableDeleteFor === 'function' && disableDeleteFor(item)}
                        >
                          🗑️
                        </button>
                      )}
                      {typeof (extraActionsForItem) === 'function' && (
                        <span>{extraActionsForItem(item, fetchData)}</span>
                      )}
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
        onClose={() => { setShowPasswordModal(false); setPasswordModalError(''); }}
        onVerify={handleAdminVerify}
        title="Verificación de Administrador"
        message={
          pendingAction === 'delete'
            ? 'Ingresa tu contraseña para eliminar este registro'
            : pendingAction === 'update'
              ? 'Ingresa tu contraseña para actualizar este registro'
              : 'Ingresa tu contraseña para crear este registro'
        }
        errorMessage={passwordModalError}
      />
    </div>
  );
};

export default CRUDTable;
