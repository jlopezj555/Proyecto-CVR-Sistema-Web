import React, { useState, useEffect } from 'react';
import CRUDTable from './CRUDTable';

const PapeleriaCRUD: React.FC = () => {
  const [clientes, setClientes] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Cargar clientes
    fetch('http://localhost:4000/api/clientes', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setClientes(data.data || []))
      .catch(console.error);

    // Cargar empresas
    fetch('http://localhost:4000/api/empresas', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setEmpresas(data.data || []))
      .catch(console.error);
  }, []);

  const columns = [
    { key: 'id_papeleria', label: 'ID' },
    { key: 'cliente_nombre', label: 'Cliente' },
    { key: 'nombre_empresa', label: 'Empresa' },
    { key: 'tipo_papeleria', label: 'Tipo' },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'estado', label: 'Estado' },
    { key: 'nombre_proceso', label: 'Proceso' },
    { key: 'fecha_recepcion', label: 'Fecha Recepción' },
    { key: 'fecha_entrega', label: 'Fecha Entrega' }
  ];

  const createFields = [
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
    { 
      key: 'id_empresa', 
      label: 'Empresa', 
      type: 'select' as const, 
      required: true,
      options: empresas.map(empresa => ({
        value: empresa.id_empresa,
        label: empresa.nombre_empresa
      }))
    },
    { 
      key: 'tipo_papeleria', 
      label: 'Tipo de Papelería', 
      type: 'select' as const, 
      required: true,
      options: [
        { value: 'Venta', label: 'Venta' },
        { value: 'Compra', label: 'Compra' }
      ]
    },
    { key: 'descripcion', label: 'Descripción', type: 'text' as const, required: true }
  ];

  const editFields = [
    { key: 'descripcion', label: 'Descripción', type: 'text' as const, required: true },
    { 
      key: 'tipo_papeleria', 
      label: 'Tipo de Papelería', 
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
      required: true,
      options: [
        { value: 'Recibida', label: 'Recibida' },
        { value: 'En proceso', label: 'En proceso' },
        { value: 'Entregada', label: 'Entregada' }
      ]
    },
    { key: 'fecha_entrega', label: 'Fecha de Entrega', type: 'date' as const, required: false }
  ];

  return (
    <CRUDTable
      title="Papelería"
      endpoint="papeleria"
      columns={columns}
      createFields={createFields}
      editFields={editFields}
    />
  );
};

export default PapeleriaCRUD;
