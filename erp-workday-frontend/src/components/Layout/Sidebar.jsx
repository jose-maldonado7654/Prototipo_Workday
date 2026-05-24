import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, LayoutDashboard, Users, Briefcase, 
  ClipboardList, Clock, CalendarOff, Star, DollarSign, Receipt, 
  UserCircle, BarChart3, Settings, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { employee, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/employees', icon: Users, label: 'Empleados' },
    { path: '/recruitment', icon: Briefcase, label: 'Reclutamiento' },
    { path: '/onboarding', icon: ClipboardList, label: 'Onboarding' },
    { path: '/time-tracking', icon: Clock, label: 'Tiempo' },
    { path: '/leave', icon: CalendarOff, label: 'Ausencias' },
    { path: '/talent', icon: Star, label: 'Talento' },
    { path: '/compensation', icon: DollarSign, label: 'Compensaciones' },
    { path: '/expenses', icon: Receipt, label: 'Gastos' },
    { path: '/self-service', icon: UserCircle, label: 'Autoservicio' },
    { path: '/analytics', icon: BarChart3, label: 'Analítica' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = () => {
    if (!employee) return 'U';
    return `${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`.toUpperCase();
  };

  return (
    <div 
      className={`bg-surface-800 border-r border-white/10 flex flex-col transition-all duration-300 ease-in-out relative ${
        collapsed ? 'w-[68px]' : 'w-[260px]'
      }`}
    >
      {/* Header con logo y toggle */}
      <div className={`h-16 flex items-center justify-between px-4 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-500 rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-text-primary text-lg">ERP Workday</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-500 rounded-lg flex items-center justify-center mx-auto">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`text-text-tertiary hover:text-text-primary transition-colors ${collapsed ? 'absolute -right-3 top-5' : ''}`}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Info del usuario */}
      <div className={`py-6 border-b border-white/10 ${collapsed ? 'px-2' : 'px-4'}`}>
        <div className={`flex ${collapsed ? 'justify-center' : 'items-center gap-3'}`}>
          <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-white font-bold text-sm">{getInitials()}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-text-primary font-medium text-sm truncate">
                {employee?.first_name} {employee?.last_name}
              </p>
              <p className="text-text-tertiary text-xs truncate">
                {employee?.role === 'admin' ? 'Administrador' : 'Empleado'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navegación principal */}
      <nav className="flex-1 py-4 overflow-y-auto sidebar-scrollbar">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center mx-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                isActive 
                  ? 'bg-primary-600/20 text-primary-400 border-l-2 border-primary-500' 
                  : 'text-text-tertiary hover:bg-surface-700 hover:text-text-primary'
              } ${collapsed ? 'justify-center' : 'gap-3'}`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-400' : ''}`} />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer con Configuración y Cerrar Sesión */}
      <div className="border-t border-white/10 p-3 space-y-1">
        <button
          title={collapsed ? "Configuración" : undefined}
          className={`w-full flex items-center px-3 py-2.5 rounded-lg text-text-tertiary hover:bg-surface-700 hover:text-text-primary transition-all duration-150 ${
            collapsed ? 'justify-center' : 'gap-3'
          }`}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Configuración</span>}
        </button>
        <button
          onClick={handleLogout}
          title={collapsed ? "Cerrar Sesión" : undefined}
          className={`w-full flex items-center px-3 py-2.5 rounded-lg text-text-tertiary hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 ${
            collapsed ? 'justify-center' : 'gap-3'
          }`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;