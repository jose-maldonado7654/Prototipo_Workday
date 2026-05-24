import React, { useState, useEffect } from 'react';
import { Users, Clock, Timer, CalendarOff, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import MetricCard from './MetricCard';
import ModuleGrid from './ModuleGrid';

const Dashboard = () => {
  const { employee } = useAuth();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buenos días');
    else if (hour < 18) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');
  }, []);

  const recentActivity = [
    { user: 'María González', action: 'actualizó su información de contacto', time: 'hace 2 horas', initials: 'MG' },
    { user: 'Carlos Mendoza', action: 'solicitud de vacaciones aprobada', time: 'hace 4 horas', initials: 'CM' },
    { user: 'Laura Fernández', action: 'nueva postulación para Desarrollador Backend', time: 'hace 5 horas', initials: 'LF' },
    { user: 'Roberto Sánchez', action: 'reporte de gastos #089 enviado a revisión', time: 'hace 1 día', initials: 'RS' },
    { user: 'Ana Torres', action: 'evaluación de desempeño Q2 completada', time: 'hace 2 días', initials: 'AT' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Saludo personalizado */}
      <div>
        <h1 className="text-3xl font-display font-bold text-text-primary">
          {greeting}, {employee?.first_name || 'Usuario'}
        </h1>
        <p className="text-text-secondary text-base mt-1">Aquí tienes un resumen de hoy.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard 
          title="Total Empleados" 
          value="247" 
          icon={Users} 
          trend="up" 
          trendValue="+3 este mes"
        />
        <MetricCard 
          title="Solicitudes Pendientes" 
          value="12" 
          icon={Clock} 
          trend="up" 
          trendValue="+2 hoy"
        />
        <MetricCard 
          title="Horas Registradas" 
          value="1,840" 
          icon={Timer} 
          trend="down" 
          trendValue="-5% vs anterior"
        />
        <MetricCard 
          title="Ausencias Activas" 
          value="5" 
          icon={CalendarOff} 
          trend="up" 
          trendValue="2 nuevas"
        />
      </div>

      {/* Acceso Rápido */}
      <div>
        <h2 className="text-xl font-display font-semibold text-text-primary mb-4">Acceso Rápido</h2>
        <ModuleGrid />
      </div>

      {/* Actividad Reciente */}
      <div>
        <h2 className="text-xl font-display font-semibold text-text-primary mb-4">Actividad Reciente</h2>
        <div className="bg-surface-800 rounded-xl border border-white/10 overflow-hidden">
          <div className="divide-y divide-white/10">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-4 hover:bg-surface-700/50 transition-colors">
                <div className="w-10 h-10 bg-primary-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-400 font-bold text-sm">{activity.initials}</span>
                </div>
                <div className="flex-1">
                  <p className="text-text-secondary text-sm">
                    <span className="font-semibold text-text-primary">{activity.user}</span>
                    <span className="text-text-tertiary"> {activity.action}</span>
                  </p>
                  <p className="text-text-muted text-xs mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;