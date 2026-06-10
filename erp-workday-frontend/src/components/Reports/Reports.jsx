// src/components/Reports/Reports.jsx
import React, { useState, useEffect } from 'react';
import { BarChart3, FileText, Download, Users, Calendar, DollarSign, TrendingUp, Building2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const Reports = () => {
  const { employee, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [headcountData, setHeadcountData] = useState([]);
  const [leaveStats, setLeaveStats] = useState([]);
  const [expenseStats, setExpenseStats] = useState([]);
  const [recentHires, setRecentHires] = useState([]);
  const [summary, setSummary] = useState({
    totalEmployees: 0,
    totalPlanned: 0,
    activeEmployees: 0,
    totalLeaveRequests: 0,
    pendingLeaveRequests: 0,
    totalExpenses: 0,
    avgSalary: 0
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // =====================================================
      // 1. HEADCOUNT CON PLANIFICACIÓN
      // =====================================================
      const { data: depts } = await supabase
        .from('departments')
        .select('id, name, planned_headcount');
      
      const { data: employees } = await supabase
        .from('employees')
        .select('id, department_id, status, hire_date, first_name, last_name');
      
      const deptData = (depts || []).map(dept => {
        const deptEmployees = (employees || []).filter(e => e.department_id === dept.id);
        const activeCount = deptEmployees.filter(e => e.status === 'active').length;
        const plannedCount = dept.planned_headcount || 0;
        const percentage = plannedCount > 0 ? (activeCount / plannedCount) * 100 : 0;
        
        let statusColor = 'text-yellow-400';
        let statusText = 'Por debajo de meta';
        if (plannedCount === 0) {
          statusColor = 'text-gray-400';
          statusText = 'Sin planificación';
        } else if (percentage >= 100) {
          statusColor = 'text-red-400';
          statusText = 'Completo / Excede meta';
        } else if (percentage >= 80) {
          statusColor = 'text-green-400';
          statusText = 'Cerca de meta';
        } else if (percentage >= 50) {
          statusColor = 'text-blue-400';
          statusText = 'En progreso';
        }
        
        return {
          id: dept.id,
          name: dept.name,
          active_count: activeCount,
          planned_count: plannedCount,
          percentage: Math.round(percentage),
          status_color: statusColor,
          status_text: statusText
        };
      });
      setHeadcountData(deptData);
      
      // =====================================================
      // 2. AUSENCIAS (usando la vista existente)
      // =====================================================
      const { data: leaveViewData } = await supabase
        .from('leave_summary_by_department')
        .select('*');
      
      if (leaveViewData && leaveViewData.length > 0) {
        setLeaveStats(leaveViewData);
      } else {
        // Si la vista no tiene datos, calcular manualmente
        const { data: leaveRequests } = await supabase
          .from('leave_requests')
          .select('*, employee:employees(department_id), start_date, end_date, status');
        
        const leaveByDept = (depts || []).map(dept => {
          const deptLeaves = (leaveRequests || []).filter(l => l.employee?.department_id === dept.id);
          return {
            department_name: dept.name,
            total_requests: deptLeaves.length,
            pending_requests: deptLeaves.filter(l => l.status === 'pending').length,
            approved_requests: deptLeaves.filter(l => l.status === 'approved').length,
            rejected_requests: deptLeaves.filter(l => l.status === 'rejected').length,
            total_days_taken: deptLeaves.reduce((sum, l) => {
              if (l.status === 'approved') {
                const days = Math.ceil((new Date(l.end_date) - new Date(l.start_date)) / (1000 * 60 * 60 * 24)) + 1;
                return sum + (days > 0 ? days : 0);
              }
              return sum;
            }, 0)
          };
        });
        setLeaveStats(leaveByDept);
      }
      
      // =====================================================
      // 3. GASTOS (usando la vista existente)
      // =====================================================
      const { data: expenseViewData } = await supabase
        .from('expenses_by_department')
        .select('*');
      
      if (expenseViewData && expenseViewData.length > 0) {
        setExpenseStats(expenseViewData);
      } else {
        // Si la vista no tiene datos, calcular manualmente
        const { data: expenses } = await supabase
          .from('expense_reports')
          .select('*, employee:employees(department_id), total_amount, status');
        
        const expenseByDept = (depts || []).map(dept => {
          const deptExpenses = (expenses || []).filter(e => e.employee?.department_id === dept.id);
          const totalAmount = deptExpenses.reduce((sum, e) => sum + (e.total_amount || 0), 0);
          return {
            department_name: dept.name,
            total_reports: deptExpenses.length,
            total_amount: totalAmount,
            average_amount: deptExpenses.length > 0 ? totalAmount / deptExpenses.length : 0,
            approved_reports: deptExpenses.filter(e => e.status === 'approved').length,
            pending_reports: deptExpenses.filter(e => e.status === 'submitted').length,
            rejected_reports: deptExpenses.filter(e => e.status === 'rejected').length
          };
        });
        setExpenseStats(expenseByDept);
      }
      
      // =====================================================
      // 4. CONTRATACIONES RECIENTES
      // =====================================================
      const recentHiresList = (employees || [])
        .filter(e => e.hire_date)
        .sort((a, b) => new Date(b.hire_date) - new Date(a.hire_date))
        .slice(0, 5)
        .map(e => ({
          first_name: e.first_name,
          last_name: e.last_name,
          department_name: depts.find(d => d.id === e.department_id)?.name || 'Sin departamento',
          hire_date: e.hire_date
        }));
      setRecentHires(recentHiresList);
      
      // =====================================================
      // 5. RESUMEN GENERAL
      // =====================================================
      const activeEmployees = (employees || []).filter(e => e.status === 'active').length;
      const totalPlanned = depts.reduce((sum, d) => sum + (d.planned_headcount || 0), 0);
      
      const { data: leaveRequests } = await supabase
        .from('leave_requests')
        .select('id, status');
      
      const { data: expenses } = await supabase
        .from('expense_reports')
        .select('total_amount');
      
      const { data: salaries } = await supabase
        .from('salary_history')
        .select('amount')
        .is('effective_to', null);
      
      setSummary({
        totalEmployees: (employees || []).length,
        totalPlanned: totalPlanned,
        activeEmployees: activeEmployees,
        totalLeaveRequests: leaveRequests?.length || 0,
        pendingLeaveRequests: leaveRequests?.filter(l => l.status === 'pending').length || 0,
        totalExpenses: expenses?.reduce((sum, e) => sum + (e.total_amount || 0), 0) || 0,
        avgSalary: salaries?.length > 0 
          ? salaries.reduce((sum, s) => sum + (s.amount || 0), 0) / salaries.length 
          : 0
      });
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBarColor = (percentage) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-yellow-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-text-tertiary">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Analítica</h1>
          <p className="text-text-secondary mt-1">Métricas y estadísticas de la empresa</p>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary-600/10 rounded-lg">
              <Users className="w-5 h-5 text-primary-400" />
            </div>
          </div>
          <p className="text-text-tertiary text-sm mb-1">Total Empleados</p>
          <p className="text-2xl font-bold text-white">{summary.totalEmployees}</p>
          <p className="text-xs text-text-tertiary mt-2">
            {summary.activeEmployees} activos
          </p>
        </div>

        <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-600/10 rounded-lg">
              <Calendar className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
          <p className="text-text-tertiary text-sm mb-1">Solicitudes de Ausencia</p>
          <p className="text-2xl font-bold text-white">{summary.totalLeaveRequests}</p>
          <p className="text-xs text-text-tertiary mt-2">
            {summary.pendingLeaveRequests} pendientes
          </p>
        </div>

        <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-600/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <p className="text-text-tertiary text-sm mb-1">Total Gastos</p>
          <p className="text-2xl font-bold text-white">${summary.totalExpenses.toLocaleString()}</p>
        </div>

        <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-accent-600/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-accent-400" />
            </div>
          </div>
          <p className="text-text-tertiary text-sm mb-1">Salario Promedio</p>
          <p className="text-2xl font-bold text-white">${Math.round(summary.avgSalary).toLocaleString()}</p>
        </div>
      </div>

      {/* Headcount por Departamento con Planificación */}
      <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-display font-semibold text-white">Planificación por Departamento</h2>
        </div>
        
        <div className="space-y-5">
          {headcountData.map((dept) => (
            <div key={dept.id}>
              <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                <div>
                  <span className="font-medium text-text-primary">{dept.name}</span>
                  <span className="text-sm text-text-tertiary ml-2">
                    {dept.active_count} / {dept.planned_count} empleados
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-medium ${dept.status_color}`}>
                    {dept.percentage}% 
                  </span>
                  <p className="text-xs text-text-tertiary">{dept.status_text}</p>
                </div>
              </div>
              {dept.planned_count > 0 ? (
                <div className="w-full bg-surface-700 rounded-full h-2.5">
                  <div
                    className={`${getBarColor(dept.percentage)} h-2.5 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(dept.percentage, 100)}%` }}
                  />
                </div>
              ) : (
                <div className="w-full bg-surface-700 rounded-full h-2.5">
                  <div className="bg-surface-500 h-2.5 rounded-full w-0"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Análisis de Ausencias por Departamento */}
      <div className="bg-surface-800 rounded-xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-display font-semibold text-white">Análisis de Ausencias</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-surface-700/50">
              <tr>
                <th className="table-header">Departamento</th>
                <th className="table-header">Total</th>
                <th className="table-header">Aprobadas</th>
                <th className="table-header">Pendientes</th>
                <th className="table-header">Rechazadas</th>
                <th className="table-header">Días Totales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {leaveStats.map((dept, index) => (
                <tr key={index} className="hover:bg-surface-700/30 transition">
                  <td className="table-cell font-medium text-white">{dept.department_name}</td>
                  <td className="table-cell">{dept.total_requests || 0}</td>
                  <td className="table-cell text-accent-400">{dept.approved_requests || 0}</td>
                  <td className="table-cell text-yellow-400">{dept.pending_requests || 0}</td>
                  <td className="table-cell text-red-400">{dept.rejected_requests || 0}</td>
                  <td className="table-cell">{dept.total_days_taken || 0}</td>
                </tr>
              ))}
              {leaveStats.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-text-tertiary">
                    No hay datos de ausencias
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gastos por Departamento */}
      <div className="bg-surface-800 rounded-xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-display font-semibold text-white">Gastos por Departamento</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-surface-700/50">
              <tr>
                <th className="table-header">Departamento</th>
                <th className="table-header">Reportes</th>
                <th className="table-header">Total Gastos</th>
                <th className="table-header">Promedio</th>
                <th className="table-header">Aprobados</th>
                <th className="table-header">Pendientes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {expenseStats.map((dept, index) => (
                <tr key={index} className="hover:bg-surface-700/30 transition">
                  <td className="table-cell font-medium text-white">{dept.department_name}</td>
                  <td className="table-cell">{dept.total_reports || 0}</td>
                  <td className="table-cell text-white font-medium">${(dept.total_amount || 0).toLocaleString()}</td>
                  <td className="table-cell">${Math.round(dept.average_amount || 0).toLocaleString()}</td>
                  <td className="table-cell text-accent-400">{dept.approved_reports || 0}</td>
                  <td className="table-cell text-yellow-400">{dept.pending_reports || 0}</td>
                </tr>
              ))}
              {expenseStats.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-text-tertiary">
                    No hay datos de gastos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contrataciones Recientes */}
      <div className="bg-surface-800 rounded-xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-display font-semibold text-white">Contrataciones Recientes</h2>
          </div>
        </div>
        <div className="divide-y divide-white/10">
          {recentHires.map((hire, index) => (
            <div key={index} className="p-4 flex items-center justify-between hover:bg-surface-700/30 transition">
              <div>
                <p className="font-medium text-white">{hire.first_name} {hire.last_name}</p>
                <p className="text-sm text-text-tertiary">{hire.department_name}</p>
              </div>
              <p className="text-sm text-text-tertiary">
                {new Date(hire.hire_date).toLocaleDateString()}
              </p>
            </div>
          ))}
          {recentHires.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-text-tertiary">No hay contrataciones recientes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;