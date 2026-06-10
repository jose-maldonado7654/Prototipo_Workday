// src/components/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, DollarSign, TrendingUp, Building2, Target, 
  Clock, CheckCircle, XCircle, Briefcase, Award, TrendingDown,
  Eye, UserPlus, CalendarPlus, Clock3, FileText, BarChart3
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { employee, isAdmin } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    headcount: [],
    leaveStats: { total: 0, pending: 0, approved: 0, rejected: 0 },
    expenseStats: { total: 0, amount: 0 },
    recentHires: [],
    pendingApprovals: [],
    upcomingBirthdays: [],
    totalEmployees: 0,
    totalPlanned: 0,
    occupancyRate: 0
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
      // 1. Obtener empleados por departamento con planificación
      const { data: depts } = await supabase
        .from('departments')
        .select('id, name, planned_headcount');
      
      const { data: employees } = await supabase
        .from('employees')
        .select('id, department_id, status, first_name, last_name, email, hire_date, birth_date');
      
      // Procesar headcount
      const headcountData = (depts || []).map(dept => {
        const deptEmployees = (employees || []).filter(e => e.department_id === dept.id);
        const activeCount = deptEmployees.filter(e => e.status === 'active').length;
        const plannedCount = dept.planned_headcount || 0;
        const percentage = plannedCount > 0 ? (activeCount / plannedCount) * 100 : 0;
        
        let statusColor = 'bg-yellow-500';
        let statusText = 'Por debajo de meta';
        if (plannedCount === 0) {
          statusColor = 'bg-gray-500';
          statusText = 'Sin planificación';
        } else if (percentage >= 100) {
          statusColor = 'bg-red-500';
          statusText = 'Completo';
        } else if (percentage >= 80) {
          statusColor = 'bg-green-500';
          statusText = 'Cerca de meta';
        } else if (percentage >= 50) {
          statusColor = 'bg-blue-500';
          statusText = 'En progreso';
        }
        
        return {
          name: dept.name,
          active: activeCount,
          planned: plannedCount,
          percentage: Math.round(percentage),
          statusColor,
          statusText
        };
      });
      
      // 2. Estadísticas de ausencias
      const { data: leaveRequests } = await supabase
        .from('leave_requests')
        .select('status');
      
      const leaveStats = {
        total: leaveRequests?.length || 0,
        pending: leaveRequests?.filter(l => l.status === 'pending').length || 0,
        approved: leaveRequests?.filter(l => l.status === 'approved').length || 0,
        rejected: leaveRequests?.filter(l => l.status === 'rejected').length || 0
      };
      
      // 3. Estadísticas de gastos
      const { data: expenses } = await supabase
        .from('expense_reports')
        .select('total_amount');
      
      const expenseStats = {
        total: expenses?.length || 0,
        amount: expenses?.reduce((sum, e) => sum + (e.total_amount || 0), 0) || 0
      };
      
      // 4. Contrataciones recientes (últimos 3 meses)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const recentHires = (employees || [])
        .filter(e => e.hire_date && new Date(e.hire_date) > threeMonthsAgo)
        .sort((a, b) => new Date(b.hire_date) - new Date(a.hire_date))
        .slice(0, 5)
        .map(e => ({
          name: `${e.first_name} ${e.last_name}`,
          email: e.email,
          hire_date: e.hire_date,
          department: depts?.find(d => d.id === e.department_id)?.name || 'Sin departamento'
        }));
      
      // 5. Próximos cumpleaños (próximos 30 días)
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setDate(today.getDate() + 30);
      
      const upcomingBirthdays = (employees || [])
        .filter(e => e.birth_date)
        .map(e => {
          const birthDate = new Date(e.birth_date);
          const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
          const daysUntil = Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24));
          return { ...e, daysUntil, birthDate: thisYearBirthday };
        })
        .filter(e => e.daysUntil >= 0 && e.daysUntil <= 30)
        .sort((a, b) => a.daysUntil - b.daysUntil)
        .slice(0, 5)
        .map(e => ({
          name: `${e.first_name} ${e.last_name}`,
          daysUntil: e.daysUntil,
          department: depts?.find(d => d.id === e.department_id)?.name || 'Sin departamento'
        }));
      
      // 6. Solicitudes pendientes de aprobación (solo para admin)
      let pendingApprovals = [];
      if (isAdmin) {
        const { data: pendingLeave } = await supabase
          .from('leave_requests')
          .select('*, employee:employees(first_name, last_name)')
          .eq('status', 'pending')
          .limit(5);
        
        const { data: pendingTime } = await supabase
          .from('time_entries')
          .select('*, employee:employees(first_name, last_name)')
          .eq('status', 'pending')
          .limit(5);
        
        pendingApprovals = [
          ...(pendingLeave || []).map(l => ({
            type: 'ausencia',
            id: l.id,
            employee: `${l.employee?.first_name} ${l.employee?.last_name}`,
            description: l.policy_id,
            date: l.start_date
          })),
          ...(pendingTime || []).map(t => ({
            type: 'tiempo',
            id: t.id,
            employee: `${t.employee?.first_name} ${t.employee?.last_name}`,
            description: `${t.hours} horas`,
            date: t.entry_date
          }))
        ].slice(0, 5);
      }
      
      // 7. Totales generales
      const totalEmployees = (employees || []).filter(e => e.status === 'active').length;
      const totalPlanned = (depts || []).reduce((sum, d) => sum + (d.planned_headcount || 0), 0);
      const occupancyRate = totalPlanned > 0 ? Math.round((totalEmployees / totalPlanned) * 100) : 0;
      
      setDashboardData({
        headcount: headcountData,
        leaveStats,
        expenseStats,
        recentHires,
        upcomingBirthdays,
        pendingApprovals,
        totalEmployees,
        totalPlanned,
        occupancyRate
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tarjetas principales
  const mainCards = [
    { 
      title: 'Empleados Activos', 
      value: dashboardData.totalEmployees, 
      icon: Users, 
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      subtext: `Meta: ${dashboardData.totalPlanned} empleados`
    },
    { 
      title: 'Solicitudes Pendientes', 
      value: dashboardData.leaveStats.pending, 
      icon: Calendar, 
      color: 'from-yellow-500 to-yellow-600',
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-400',
      subtext: `${dashboardData.leaveStats.total} totales`
    },
    { 
      title: 'Gastos Totales', 
      value: `$${dashboardData.expenseStats.amount.toLocaleString()}`, 
      icon: DollarSign, 
      color: 'from-green-500 to-green-600',
      bg: 'bg-green-500/10',
      text: 'text-green-400',
      subtext: `${dashboardData.expenseStats.total} reportes`
    },
    { 
      title: 'Ocupación Global', 
      value: `${dashboardData.occupancyRate}%`, 
      icon: TrendingUp, 
      color: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      subtext: `${dashboardData.totalEmployees} / ${dashboardData.totalPlanned} empleados`
    }
  ];

  // Acciones rápidas
  const quickActions = [
    { icon: UserPlus, label: 'Nuevo Empleado', path: '/employees', color: 'bg-blue-500/20 text-blue-400' },
    { icon: CalendarPlus, label: 'Solicitar Ausencia', path: '/leave', color: 'bg-yellow-500/20 text-yellow-400' },
    { icon: Clock3, label: 'Registrar Horas', path: '/time-tracking', color: 'bg-green-500/20 text-green-400' },
    { icon: FileText, label: 'Reporte Gastos', path: '/expenses', color: 'bg-red-500/20 text-red-400' },
    { icon: Target, label: 'Nueva Meta', path: '/talent', color: 'bg-purple-500/20 text-purple-400' },
    { icon: BarChart3, label: 'Ver Reportes', path: '/analytics', color: 'bg-indigo-500/20 text-indigo-400' }
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
              {isAdmin 
                ? 'Aquí tienes el resumen general de la empresa' 
                : 'Aquí tienes un resumen de tu actividad'}
            </p>
          </div>
          <div className="flex items-center gap-2">
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
          <div key={index} className="bg-surface-800 rounded-xl border border-white/10 p-6 hover:border-primary-500/30 transition-all hover:-translate-y-0.5 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 ${card.bg} rounded-xl`}>
                <card.icon className={`w-6 h-6 ${card.text}`} />
              </div>
              <TrendingUp className="w-4 h-4 text-text-tertiary" />
            </div>
            <p className="text-text-tertiary text-sm mb-1">{card.title}</p>
            <p className="text-3xl font-display font-bold text-white">{card.value}</p>
            <p className="text-xs text-text-tertiary mt-2">{card.subtext}</p>
          </div>
        ))}
      </div>

      {/* Acciones rápidas */}
      <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
        <h2 className="text-lg font-display font-semibold text-white mb-4">⚡ Acciones Rápidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Planificación por Departamento */}
        <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-display font-semibold text-white">Planificación por Departamento</h2>
          </div>
          <div className="space-y-5">
            {dashboardData.headcount.map((dept, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="font-medium text-white">{dept.name}</span>
                    <span className="text-sm text-text-tertiary ml-2">
                      {dept.active} / {dept.planned} empleados
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-white">{dept.percentage}%</span>
                    <p className="text-xs text-text-tertiary">{dept.statusText}</p>
                  </div>
                </div>
                <div className="w-full bg-surface-700 rounded-full h-2">
                  <div
                    className={`${dept.statusColor} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(dept.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-text-tertiary">&lt; 50% (Necesita contratación)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-text-tertiary">80% - 99% (Cerca de meta)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-text-tertiary">100%+ (Completo)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas de Ausencias */}
        <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-display font-semibold text-white">Estadísticas de Ausencias</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-surface-700/30 rounded-xl">
              <p className="text-3xl font-bold text-white">{dashboardData.leaveStats.total}</p>
              <p className="text-sm text-text-tertiary">Total Solicitudes</p>
            </div>
            <div className="text-center p-4 bg-surface-700/30 rounded-xl">
              <p className="text-3xl font-bold text-yellow-400">{dashboardData.leaveStats.pending}</p>
              <p className="text-sm text-text-tertiary">Pendientes</p>
            </div>
            <div className="text-center p-4 bg-surface-700/30 rounded-xl">
              <p className="text-3xl font-bold text-green-400">{dashboardData.leaveStats.approved}</p>
              <p className="text-sm text-text-tertiary">Aprobadas</p>
            </div>
            <div className="text-center p-4 bg-surface-700/30 rounded-xl">
              <p className="text-3xl font-bold text-red-400">{dashboardData.leaveStats.rejected}</p>
              <p className="text-sm text-text-tertiary">Rechazadas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contrataciones Recientes */}
        <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <UserPlus className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-display font-semibold text-white">Contrataciones Recientes</h2>
          </div>
          <div className="space-y-4">
            {dashboardData.recentHires.map((hire, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-surface-700/30 rounded-lg">
                <div>
                  <p className="font-medium text-white">{hire.name}</p>
                  <p className="text-xs text-text-tertiary">{hire.department}</p>
                </div>
                <p className="text-sm text-text-tertiary">
                  {new Date(hire.hire_date).toLocaleDateString()}
                </p>
              </div>
            ))}
            {dashboardData.recentHires.length === 0 && (
              <p className="text-center text-text-tertiary py-4">No hay contrataciones recientes</p>
            )}
          </div>
        </div>

        {/* Próximos Cumpleaños */}
        <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-display font-semibold text-white">Próximos Cumpleaños</h2>
          </div>
          <div className="space-y-4">
            {dashboardData.upcomingBirthdays.map((birthday, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-surface-700/30 rounded-lg">
                <div>
                  <p className="font-medium text-white">{birthday.name}</p>
                  <p className="text-xs text-text-tertiary">{birthday.department}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary-400" />
                  <p className="text-sm text-primary-400">
                    {birthday.daysUntil === 0 ? 'Hoy!' : `En ${birthday.daysUntil} días`}
                  </p>
                </div>
              </div>
            ))}
            {dashboardData.upcomingBirthdays.length === 0 && (
              <p className="text-center text-text-tertiary py-4">No hay cumpleaños próximos</p>
            )}
          </div>
        </div>
      </div>

      {/* Solicitudes Pendientes de Aprobación (solo admin) */}
      {isAdmin && dashboardData.pendingApprovals.length > 0 && (
        <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-display font-semibold text-white">Pendientes de Aprobación</h2>
          </div>
          <div className="space-y-3">
            {dashboardData.pendingApprovals.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-yellow-600/10 rounded-lg border border-yellow-500/30">
                <div className="flex items-center gap-3">
                  {item.type === 'ausencia' ? (
                    <Calendar className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-400" />
                  )}
                  <div>
                    <p className="font-medium text-white">{item.employee}</p>
                    <p className="text-xs text-text-tertiary">
                      {item.type === 'ausencia' ? `Solicitud de ausencia` : `Registro de ${item.description}`}
                    </p>
                  </div>
                </div>
                <Link
                  to={item.type === 'ausencia' ? '/leave' : '/time-tracking'}
                  className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  Revisar
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer informativo */}
      <div className="bg-surface-800/50 rounded-xl border border-white/10 p-4 text-center">
        <p className="text-text-tertiary text-xs">
          📊 Datos actualizados en tiempo real desde Supabase • Última actualización: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;