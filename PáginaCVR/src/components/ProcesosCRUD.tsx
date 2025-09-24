import React, { useState, useEffect } from 'react';
import CRUDTable from './CRUDTable';

const ProcesosCRUD: React.FC = () => {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Cargar empresas
    fetch('http://localhost:4000/api/empresas', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setEmpresas(data.data || []))
      .catch(console.error);

    // Cargar clientes
    fetch('http://localhost:4000/api/clientes', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setClientes(data.data || []))
      .catch(console.error);
  }, []);

  const columns = [
    { key: 'id_proceso', label: 'ID' },
    { key: 'nombre_proceso', label: 'Nombre del Proceso' },
    { key: 'tipo_proceso', label: 'Tipo' },
    { key: 'estado', label: 'Estado' },
    { key: 'cliente_nombre', label: 'Cliente' },
    { key: 'nombre_empresa', label: 'Empresa' },
    { key: 'fecha_creacion', label: 'Fecha Creación' },
    { key: 'fecha_completado', label: 'Fecha Completado' }
  ];

  const createFields = [
    { 
      key: 'id_empresa', 
      label: 'Empresa', 
      type: 'select' as const, 
      required: true,
      options: empresas.map(emp => ({
        value: emp.id_empresa,
        label: emp.nombre_empresa
      }))
    },
    { 
      key: 'id_cliente', 
      label: 'Cliente', 
      type: 'select' as const, 
      required: true,
      options: clientes.map(cliente => ({
        value: cliente.id_cliente,
        label: cliente.nombre_completo
      }))
    },
    { key: 'nombre_proceso', label: 'Nombre del Proceso', type: 'text' as const, required: true },
    { 
      key: 'tipo_proceso', 
      label: 'Tipo de Proceso', 
      type: 'select' as const, 
      required: true,
      options: [
        { value: 'Venta', label: 'Venta' },
        { value: 'Compra', label: 'Compra' }
      ]
    }
  ];

  const editFields = [
    { 
      key: 'id_empresa', 
      label: 'Empresa', 
      type: 'select' as const, 
      required: true,
      options: empresas.map(emp => ({
        value: emp.id_empresa,
        label: emp.nombre_empresa
      }))
    },
    { 
      key: 'id_cliente', 
      label: 'Cliente', 
      type: 'select' as const, 
      required: true,
      options: clientes.map(cliente => ({
        value: cliente.id_cliente,
        label: cliente.nombre_completo
      }))
    },
    { key: 'nombre_proceso', label: 'Nombre del Proceso', type: 'text' as const, required: true },
    { 
      key: 'tipo_proceso', 
      label: 'Tipo de Proceso', 
      type: 'select' as const, 
      required: true,
      options: [
        { value: 'Venta', label: 'Venta' },
        { value: 'Compra', label: 'Compra' }
      ]
    },
    { 
      key: 'estado', 
      label: 'Estado', 
      type: 'select' as const, 
      required: false,
      options: [
        { value: 'Activo', label: 'Activo' },
        { value: 'Completado', label: 'Completado' },
        { value: 'Cancelado', label: 'Cancelado' }
      ]
    }
  ];

  return (
    <CRUDTable
      title="Procesos"
      endpoint="procesos"
      columns={columns}
      createFields={createFields}
      editFields={editFields}
    />
  );
};

export default ProcesosCRUD;
