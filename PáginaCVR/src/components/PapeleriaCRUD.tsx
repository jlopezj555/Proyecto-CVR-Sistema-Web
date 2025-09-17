import React, { useState, useEffect } from 'react';
import CRUDTable from './CRUDTable';

const PapeleriaCRUD: React.FC = () => {
  const [clientes, setClientes] = useState<any[]>([]);
  const [cuentas, setCuentas] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Cargar clientes
    fetch('http://localhost:4000/api/clientes', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setClientes(data.data || []))
      .catch(console.error);

    // Cargar cuentas
    fetch('http://localhost:4000/api/cuentas', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setCuentas(data.data || []))
      .catch(console.error);
  }, []);

  const columns = [
    { key: 'id_papeleria', label: 'ID' },
    { key: 'cliente_nombre', label: 'Cliente' },
    { key: 'nombre_cuenta', label: 'Cuenta' },
    { key: 'nombre_empresa', label: 'Empresa' },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'estado', label: 'Estado' },
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
      key: 'id_cuenta', 
      label: 'Cuenta', 
      type: 'select' as const, 
      required: true,
      options: cuentas.map(cuenta => ({
        value: cuenta.id_cuenta,
        label: cuenta.nombre_cuenta
      }))
    },
    { key: 'descripcion', label: 'Descripción', type: 'text' as const, required: true }
  ];

  const editFields = [
    { key: 'descripcion', label: 'Descripción', type: 'text' as const, required: true },
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
