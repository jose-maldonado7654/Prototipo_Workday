// src/components/Dashboard/Dashboard.jsx (versión que consulta directamente)
import React, { useState, useEffect } from 'react';
import { Users, Calendar, DollarSign, TrendingUp, Building2, Target } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { employee } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [summary, setSummary] = useState({
    totalEmployees: 0,
    totalPlanned: 0,
    totalLeaveRequests: 0,
    totalExpenses: 0
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
      // 1. Obtener departamentos con su planificación
      const { data: depts } = await supabase
        .from('departments')
        .select('id, name, planned_headcount');
      
      // 2. Obtener empleados por departamento
      const { data: employees } = await supabase
        .from('employees')
        .select('id, department_id, status');
      
      // 3. Procesar datos por departamento
      const deptData = (depts || []).map(dept => {
        const deptEmployees = (employees || []).filter(e => e.department_id === dept.id);
        const activeCount = deptEmployees.filter(e => e.status === 'active').length;
        const plannedCount = dept.planned_headcount || 0;
        const percentage = plannedCount > 0 ? (activeCount / plannedCount) * 100 : 0;
        
        return {
          department_id: dept.id,
          department_name: dept.name,
          active_count: activeCount,
          planned_count: plannedCount,
          percentage_of_plan: Math.round(percentage)
        };
      });
      
      setDepartments(deptData);
      
      // 4. Totales
      const totalEmployees = deptData.reduce((sum, d) => sum + d.active_count, 0);
      const totalPlanned = deptData.reduce((sum, d) => sum + d.planned_count, 0);
      
      // 5. Solicitudes pendientes
      const { data: leaveRequests } = await supabase
        .from('leave_requests')
        .select('id, status');
      
      // 6. Gastos
      const { data: expenses } = await supabase
        .from('expense_reports')
        .select('total_amount');
      
      setSummary({
        totalEmployees,
        totalPlanned,
        totalLeaveRequests: leaveRequests?.filter(l => l.status === 'pending').length || 0,
        totalExpenses: expenses?.reduce((sum, e) => sum + (e.total_amount || 0), 0) || 0
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBarColor = (percentage) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getStatusText = (percentage, active, planned) => {
    if (planned === 0) return 'Sin planificación';
    if (percentage >= 100) return 'Completo';
    if (percentage >= 80) return 'Casi completo';
    if (percentage >= 50) return 'En buen camino';
    return 'Necesita contratación';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Saludo */}
      <div>
        <h1 className="text-3xl font-display font-bold text-text-primary">
          {greeting}, {employee?.first_name || 'Usuario'}
        </h1>
        <p className="text-text-secondary text-base mt-1">Aquí tienes un resumen de hoy.</p>
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary-600/10 rounded-lg">
              <Users className="w-5 h-5 text-primary-400" />
            </div>
          </div>
          <p className="text-text-tertiary text-sm">Empleados Activos</p>
          <p className="text-2xl font-bold text-white">{summary.totalEmployees}</p>
          <p className="text-xs text-text-tertiary mt-2">
            Meta: {summary.totalPlanned} empleados
          </p>
        </div>

        <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-600/10 rounded-lg">
              <Calendar className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
          <p className="text-text-tertiary text-sm">Solicitudes Pendientes</p>
          <p className="text-2xl font-bold text-yellow-400">{summary.totalLeaveRequests}</p>
        </div>

        <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-600/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <p className="text-text-tertiary text-sm">Gastos Totales</p>
          <p className="text-2xl font-bold text-white">${summary.totalExpenses.toLocaleString()}</p>
        </div>

        <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-accent-600/10 rounded-lg">
              <Target className="w-5 h-5 text-accent-400" />
            </div>
          </div>
          <p className="text-text-tertiary text-sm">Ocupación Global</p>
          <p className="text-2xl font-bold text-white">
            {summary.totalPlanned > 0 
              ? Math.round((summary.totalEmployees / summary.totalPlanned) * 100)
              : 0}%
          </p>
        </div>
      </div>

      {/* Headcount por Departamento con Planificación */}
      <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-display font-semibold text-white">Planificación por Departamento</h2>
        </div>
        
        <div className="space-y-6">
          {departments.map((dept) => {
            const percentage = dept.percentage_of_plan;
            const barColor = getBarColor(percentage);
            const statusText = getStatusText(percentage, dept.active_count, dept.planned_count);
            
            return (
              <div key={dept.department_id}>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="font-medium text-text-primary">{dept.department_name}</span>
                    <span className="text-sm text-text-tertiary ml-2">
                      {dept.active_count} / {dept.planned_count} empleados
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-text-primary">
                      {percentage}% 
                    </span>
                    <p className="text-xs text-text-tertiary">{statusText}</p>
                  </div>
                </div>
                {dept.planned_count > 0 ? (
                  <div className="w-full bg-surface-700 rounded-full h-2.5">
                    <div
                      className={`${barColor} h-2.5 rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                ) : (
                  <div className="w-full bg-surface-700 rounded-full h-2.5">
                    <div className="bg-surface-500 h-2.5 rounded-full w-0"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-text-tertiary">&lt; 50%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-text-tertiary">50% - 79%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-text-tertiary">80% - 99%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-text-tertiary">100% o más</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;