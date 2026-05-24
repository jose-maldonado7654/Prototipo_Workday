import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const location = useLocation();
  const { employee } = useAuth();

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    const moduleName = path.replace('/', '').split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    return moduleName;
  };

  const getInitials = () => {
    if (!employee) return 'U';
    return `${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`.toUpperCase();
  };

  return (
    <header className="h-16 bg-surface-800/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-10">
      {/* Breadcrumb */}
      <div>
        <h1 className="font-display font-semibold text-white text-xl">
          {getBreadcrumb()}
        </h1>
      </div>

      {/* Acciones derecha */}
      <div className="flex items-center gap-4">
        {/* Notificaciones */}
        <button className="relative text-surface-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-600 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
            3
          </span>
        </button>

        {/* Separador */}
        <div className="w-px h-6 bg-white/10"></div>

        {/* Info usuario */}
        <div className="flex items-center gap-3 cursor-pointer hover:bg-surface-700/50 px-2 py-1 rounded-lg transition-colors">
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xs">{getInitials()}</span>
          </div>
          <div className="hidden md:block">
            <p className="text-white text-sm font-medium">
              {employee?.first_name} {employee?.last_name}
            </p>
            <p className="text-surface-400 text-xs">
              {employee?.role === 'admin' ? 'Administrador' : 'Empleado'}
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-surface-400 hidden md:block" />
        </div>
      </div>
    </header>
  );
};

export default Header;