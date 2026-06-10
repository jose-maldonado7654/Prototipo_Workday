// src/components/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, DollarSign, TrendingUp, Building2, 
  Target, Clock, CheckCircle, Award, Briefcase,
  UserPlus, CalendarPlus, Clock3, FileText
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { employee, isAdmin } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    headcount: [],
    totalEmployees: 0,
    totalPlanned: 0,
    occupancyRate: 0,
    pendingLeave: 0,
    totalExpenses: 0,
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buenos días');
    else if (hour < 18) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');
    
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Headcount por departamento (solo resumen)
      const { data: depts } = await supabase
        .from('departments')
        .select('id, name, planned_headcount');
      
      const { data: employees } = await supabase
        .from('employees')
        .select('id, department_id, status, first_name, last_name');
      
      const headcountData = (depts || []).slice(0, 4).map(dept => {
        const deptEmployees = (employees || []).filter(e => e.department_id === dept.id);
        const activeCount = deptEmployees.filter(e => e.status === 'active').length;
        const plannedCount = dept.planned_headcount || 0;
        const percentage = plannedCount > 0 ? (activeCount / plannedCount) * 100 : 0;
        
        let statusColor = 'bg-yellow-500';
        if (plannedCount === 0) statusColor = 'bg-gray-500';
        else if (percentage >= 100) statusColor = 'bg-red-500';
        else if (percentage >= 80) statusColor = 'bg-green-500';
        else if (percentage >= 50) statusColor = 'bg-blue-500';
        
        return {
          name: dept.name,
          active: activeCount,
          planned: plannedCount,
          percentage: Math.round(percentage),
          statusColor
        };
      });
      
      // 2. Totales generales
      const totalEmployees = (employees || []).filter(e => e.status === 'active').length;
      const totalPlanned = (depts || []).reduce((sum, d) => sum + (d.planned_headcount || 0), 0);
      const occupancyRate = totalPlanned > 0 ? Math.round((totalEmployees / totalPlanned) * 100) : 0;
      
      // 3. Ausencias pendientes
      const { data: pendingLeave } = await supabase
        .from('leave_requests')
        .select('id')
        .eq('status', 'pending');
      
      // 4. Gastos totales
      const { data: expenses } = await supabase
        .from('expense_reports')
        .select('total_amount');
      const totalExpenses = expenses?.reduce((sum, e) => sum + (e.total_amount || 0), 0) || 0;
      
      // 5. Actividad reciente (últimas 5 acciones)
      const { data: recentLeave } = await supabase
        .from('leave_requests')
        .select('*, employee:employees(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(3);
      
      const { data: recentTime } = await supabase
        .from('time_entries')
        .select('*, employee:employees(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(2);
      
      const recentActivities = [
        ...(recentLeave || []).map(l => ({
          type: 'ausencia',
          employee: `${l.employee?.first_name} ${l.employee?.last_name}`,
          action: `solicitó ${l.policy_id === 'Vacaciones' ? 'vacaciones' : 'ausencia'}`,
          time: new Date(l.created_at).toLocaleDateString(),
          icon: Calendar
        })),
        ...(recentTime || []).map(t => ({
          type: 'tiempo',
          employee: `${t.employee?.first_name} ${t.employee?.last_name}`,
          action: `registró ${t.hours} horas de trabajo`,
          time: new Date(t.created_at).toLocaleDateString(),
          icon: Clock
        }))
      ].slice(0, 5);
      
      setDashboardData({
        headcount: headcountData,
        totalEmployees,
        totalPlanned,
        occupancyRate,
        pendingLeave: pendingLeave?.length || 0,
        totalExpenses,
        recentActivities
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tarjetas principales (solo 4 KPIs clave)
  const mainCards = [
    { 
      title: 'Empleados Activos', 
      value: dashboardData.totalEmployees, 
      icon: Users, 
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      link: '/employees'
    },
    { 
      title: 'Pendientes', 
      value: dashboardData.pendingLeave, 
      icon: Calendar, 
      color: 'from-yellow-500 to-yellow-600',
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-400',
      link: '/leave'
    },
    { 
      title: 'Gastos', 
      value: `$${dashboardData.totalExpenses.toLocaleString()}`, 
      icon: DollarSign, 
      color: 'from-green-500 to-green-600',
      bg: 'bg-green-500/10',
      text: 'text-green-400',
      link: '/expenses'
    },
    { 
      title: 'Ocupación', 
      value: `${dashboardData.occupancyRate}%`, 
      icon: TrendingUp, 
      color: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      link: '/analytics'
    }
  ];

  // Acciones rápidas (sin sobrecargar)
  const quickActions = [
    { icon: UserPlus, label: 'Nuevo Empleado', path: '/employees', color: 'bg-blue-500/20 text-blue-400' },
    { icon: CalendarPlus, label: 'Solicitar Ausencia', path: '/leave', color: 'bg-yellow-500/20 text-yellow-400' },
    { icon: Clock3, label: 'Registrar Horas', path: '/time-tracking', color: 'bg-green-500/20 text-green-400' },
    { icon: FileText, label: 'Nuevo Gasto', path: '/expenses', color: 'bg-red-500/20 text-red-400' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-text-tertiary">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con saludo personalizado */}
      <div className="bg-gradient-to-r from-primary-600/20 to-primary-800/20 rounded-2xl p-6 border border-primary-500/30">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">
              {greeting}, {employee?.first_name || 'Usuario'}! 👋
            </h1>
            <p className="text-text-secondary mt-1">
              Resumen ejecutivo de {isAdmin ? 'la empresa' : 'tu actividad'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">
                {employee?.first_name?.[0]}{employee?.last_name?.[0]}
              </span>
            </div>
            <div>
              <p className="text-white font-medium">{employee?.first_name} {employee?.last_name}</p>
              <p className="text-text-tertiary text-sm">{employee?.role === 'admin' ? 'Administrador' : 'Empleado'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {mainCards.map((card, index) => (
          <Link key={index} to={card.link}>
            <div className="bg-surface-800 rounded-xl border border-white/10 p-6 hover:border-primary-500/30 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 ${card.bg} rounded-xl`}>
                  <card.icon className={`w-6 h-6 ${card.text}`} />
                </div>
              </div>
              <p className="text-text-tertiary text-sm mb-1">{card.title}</p>
              <p className="text-3xl font-display font-bold text-white">{card.value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Headcount Resumido (solo top 4 departamentos) */}
        <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-display font-semibold text-white">Headcount por Departamento</h2>
            </div>
            <Link to="/analytics" className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
              Ver detalles →
            </Link>
          </div>
          <div className="space-y-4">
            {dashboardData.headcount.map((dept, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-white">{dept.name}</span>
                  <span className="text-sm text-text-tertiary">{dept.active}/{dept.planned}</span>
                </div>
                <div className="w-full bg-surface-700 rounded-full h-1.5">
                  <div
                    className={`${dept.statusColor} h-1.5 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(dept.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 text-center">
            <p className="text-xs text-text-tertiary">
              Ocupación global: <span className="text-primary-400 font-medium">{dashboardData.occupancyRate}%</span> 
              {' '}({dashboardData.totalEmployees}/{dashboardData.totalPlanned} empleados)
            </p>
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-display font-semibold text-white">Actividad Reciente</h2>
            </div>
            <Link to="/analytics" className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
              Ver más →
            </Link>
          </div>
          <div className="space-y-3">
            {dashboardData.recentActivities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-center gap-3 p-3 bg-surface-700/30 rounded-lg">
                  <div className="p-2 bg-primary-600/10 rounded-lg">
                    <Icon className="w-4 h-4 text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">
                      <span className="font-medium">{activity.employee}</span> {activity.action}
                    </p>
                    <p className="text-xs text-text-tertiary">{activity.time}</p>
                  </div>
                </div>
              );
            })}
            {dashboardData.recentActivities.length === 0 && (
              <p className="text-center text-text-tertiary py-4">No hay actividad reciente</p>
            )}
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
        <h2 className="text-lg font-display font-semibold text-white mb-4">⚡ Acciones Rápidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.path}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-surface-700/50 hover:bg-surface-700 transition-all group"
            >
              <div className={`p-2 rounded-lg ${action.color} group-hover:scale-110 transition`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-xs text-text-secondary text-center">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer con navegación a Analítica */}
      <div className="bg-surface-800/50 rounded-xl border border-white/10 p-4 text-center">
        <p className="text-text-tertiary text-sm">
          📊 ¿Necesitas más métricas? Visita el módulo de 
          <Link to="/analytics" className="text-primary-400 hover:text-primary-300 mx-1">
            Analítica
          </Link>
          para reportes detallados por departamento, análisis de ausencias y gastos.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;