import React from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Briefcase, ClipboardList, Clock, 
  CalendarOff, Star, DollarSign, Receipt, UserCircle, BarChart3 
} from 'lucide-react';

const modules = [
  { path: '/', icon: LayoutDashboard, name: 'Dashboard', description: 'Vista general y métricas clave' },
  { path: '/employees', icon: Users, name: 'Empleados', description: 'Gestión del talento humano' },
  { path: '/recruitment', icon: Briefcase, name: 'Reclutamiento', description: 'Procesos de selección' },
  { path: '/onboarding', icon: ClipboardList, name: 'Onboarding', description: 'Integración de nuevos empleados' },
  { path: '/time-tracking', icon: Clock, name: 'Tiempo', description: 'Registro de horas trabajadas' },
  { path: '/leave', icon: CalendarOff, name: 'Ausencias', description: 'Vacaciones y permisos' },
  { path: '/talent', icon: Star, name: 'Talento', description: 'Metas y evaluaciones' },
  { path: '/compensation', icon: DollarSign, name: 'Compensaciones', description: 'Salarios y bonos' },
  { path: '/expenses', icon: Receipt, name: 'Gastos', description: 'Reportes de gastos' },
  { path: '/self-service', icon: UserCircle, name: 'Autoservicio', description: 'Portal del empleado' },
  { path: '/analytics', icon: BarChart3, name: 'Analítica', description: 'Reportes y estadísticas' },
];

const ModuleGrid = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {modules.map((module) => (
        <Link
          key={module.path}
          to={module.path}
          className="group bg-surface-800 border border-white/10 rounded-xl p-5 hover:border-primary-500/40 hover:bg-surface-700/50 transition-all duration-200"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary-600/10 rounded-lg group-hover:bg-primary-600/20 transition-colors">
              <module.icon className="w-6 h-6 text-primary-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-semibold text-text-primary text-base mb-1">
                {module.name}
              </h3>
              <p className="text-text-tertiary text-xs font-body line-clamp-2">
                {module.description}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default ModuleGrid;