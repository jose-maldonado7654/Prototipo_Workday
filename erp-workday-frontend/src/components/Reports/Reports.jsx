// src/components/Reports/Reports.jsx
import React, { useState, useEffect } from 'react';
import { BarChart3, FileText, Download, Users, Calendar, DollarSign, TrendingUp, Building2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const Reports = () => {
  const { employee, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [headcount, setHeadcount] = useState([]);
  const [leaveStats, setLeaveStats] = useState([]);
  const [expenseStats, setExpenseStats] = useState([]);
  const [recentHires, setRecentHires] = useState([]);
  const [summary, setSummary] = useState({
    totalEmployees: 0,
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
      // 1. Headcount por departamento
      const { data: headcountData } = await supabase
        .from('headcount_by_department')
        .select('*');
      setHeadcount(headcountData || []);

      // 2. Estadísticas de ausencias por departamento
      const { data: leaveData } = await supabase
        .from('leave_summary_by_department')
        .select('*');
      setLeaveStats(leaveData || []);

      // 3. Gastos por departamento
      const { data: expenseData } = await supabase
        .from('expenses_by_department')
        .select('*');
      setExpenseStats(expenseData || []);

      // 4. Contrataciones recientes
      const { data: hiresData } = await supabase
        .from('employees')
        .select('first_name, last_name, department:departments(name), hire_date')
        .order('hire_date', { ascending: false })
        .limit(5);
      setRecentHires(hiresData || []);

      // 5. Resumen general
      const { data: employees } = await supabase
        .from('employees')
        .select('id, status');
      
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
        totalEmployees: employees?.length || 0,
        activeEmployees: employees?.filter(e => e.status === 'active').length || 0,
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

  const handleExport = () => {
    alert('Funcionalidad de exportación en desarrollo');
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
        <button
          onClick={handleExport}
          className="btn-secondary flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Exportar Reportes
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
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
          <div className="flex items-center justify-between mb-4">
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
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-600/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <p className="text-text-tertiary text-sm mb-1">Total Gastos</p>
          <p className="text-2xl font-bold text-white">${summary.totalExpenses.toLocaleString()}</p>
          <p className="text-xs text-text-tertiary mt-2">
            Todos los reportes
          </p>
        </div>

        <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-accent-600/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-accent-400" />
            </div>
          </div>
          <p className="text-text-tertiary text-sm mb-1">Salario Promedio</p>
          <p className="text-2xl font-bold text-white">${Math.round(summary.avgSalary).toLocaleString()}</p>
          <p className="text-xs text-text-tertiary mt-2">
            Por empleado activo
          </p>
        </div>
      </div>

      {/* Headcount por Departamento */}
      <div className="bg-surface-800 rounded-xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-display font-semibold text-white">Distribución por Departamento</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {headcount.map((dept, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-secondary">{dept.department_name}</span>
                  <span className="text-text-primary font-medium">
                    {dept.active_count} / {dept.employee_count} empleados
                  </span>
                </div>
                <div className="w-full bg-surface-700 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(dept.active_count / dept.employee_count) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
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
                <th className="table-header">Total Solicitudes</th>
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
                <th className="table-header">Total Reportes</th>
                <th className="table-header">Total Gastos</th>
                <th className="table-header">Gasto Promedio</th>
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
                <p className="text-sm text-text-tertiary">{hire.department?.name}</p>
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