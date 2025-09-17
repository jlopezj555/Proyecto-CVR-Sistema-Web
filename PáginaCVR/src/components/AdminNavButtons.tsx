import React from 'react';

const AdminNavButtons: React.FC<{ onNavSelect: (tab: string) => void }> = ({ onNavSelect }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'empleados', label: 'Empleados' },
    { id: 'empresas', label: 'Empresas' },
    { id: 'roles', label: 'Roles' },
    { id: 'cuentas', label: 'Cuentas' },
    { id: 'papeleria', label: 'Papelería' },
    { id: 'etapas-catalogo', label: 'Etapas Catálogo' },
    { id: 'etapas-cuenta', label: 'Etapas Cuenta' },
  ];

  return (
    <nav className="admin-nav">
      {menuItems.map((item) => (
        <button
          key={item.id}
          className="admin-nav-item"
          onClick={() => onNavSelect(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
};

export default AdminNavButtons;