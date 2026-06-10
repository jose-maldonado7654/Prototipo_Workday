// src/components/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Users, Calendar, DollarSign, TrendingUp, Building2, Target } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { employee } = useAuth();
  const [headcountData, setHeadcountData] = useState([]);
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
      // Obtener headcount con planificación
      const { data: headcountData } = await supabase
        .from('headcount_with_plan')
        .select('*');
      setHeadcountData(headcountData || []);
      
      // Calcular totales
      const totalEmployees = headcountData?.reduce((sum, d) => sum + (d.active_count || 0), 0) || 0;
      const totalPlanned = headcountData?.reduce((sum, d) => sum + (d.planned_count || 0), 0) || 0;
      
      // Obtener solicitudes de ausencia pendientes
      const { data: leaveRequests } = await supabase
        .from('leave_requests')
        .select('id, status');
      
      // Obtener gastos
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
    if (percentage >= 100) return 'Completo - Vacante cerrada';
    if (percentage >= 80) return 'Casi completo';
    if (percentage >= 50) return 'En buen camino';
    if (planned === 0) return 'Sin planificación';
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
          {headcountData.map((dept) => {
            const percentage = dept.percentage_of_plan || 0;
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
                <div className="w-full bg-surface-700 rounded-full h-2.5">
                  <div
                    className={`${barColor} h-2.5 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-text-tertiary">≥ 50%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-text-tertiary">≥ 80%</span>
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