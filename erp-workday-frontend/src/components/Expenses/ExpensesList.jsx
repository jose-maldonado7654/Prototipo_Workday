// src/components/Expenses/ExpensesList.jsx
import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Receipt, CheckCircle, Clock, XCircle, X, Users, Search, Eye, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const ExpensesList = () => {
  const { employee, isAdmin } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewingEmployeeId, setViewingEmployeeId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [formData, setFormData] = useState({
    report_date: new Date().toISOString().split('T')[0],
    total_amount: '',
    status: 'draft',
    notes: ''
  });

  // Si es admin, cargar todos los empleados
  useEffect(() => {
    if (isAdmin) {
      fetchAllEmployees();
      fetchAllExpenses();
    } else {
      setViewingEmployeeId(employee?.id);
    }
  }, [isAdmin, employee]);

  // Cargar gastos del empleado seleccionado
  useEffect(() => {
    if (viewingEmployeeId) {
      fetchExpenses(viewingEmployeeId);
    }
  }, [viewingEmployeeId]);

  const fetchAllEmployees = async () => {
    const { data } = await supabase
      .from('employees')
      .select('id, first_name, last_name, email, role')
      .order('first_name');
    setEmployees(data || []);
    if (data?.length > 0 && !viewingEmployeeId) {
      setViewingEmployeeId(data[0].id);
    }
  };

  const fetchAllExpenses = async () => {
    const { data } = await supabase
      .from('expense_reports')
      .select('*, employee:employees(first_name, last_name, email)')
      .order('report_date', { ascending: false });
    setAllExpenses(data || []);
  };

  const fetchExpenses = async (empId) => {
    if (!empId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('expense_reports')
        .select('*')
        .eq('employee_id', empId)
        .order('report_date', { ascending: false });
      
      setExpenses(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employee?.id) return;
    
    try {
      const { error } = await supabase.from('expense_reports').insert([{
        employee_id: viewingEmployeeId || employee.id,
        ...formData,
        total_amount: parseFloat(formData.total_amount) || 0
      }]);
      if (error) throw error;
      setShowForm(false);
      setFormData({
        report_date: new Date().toISOString().split('T')[0],
        total_amount: '',
        status: 'draft',
        notes: ''
      });
      fetchExpenses(viewingEmployeeId || employee.id);
      if (isAdmin) fetchAllExpenses();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear el reporte de gastos');
    }
  };

  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      const { error } = await supabase
        .from('expense_reports')
        .update({ status: newStatus })
        .eq('id', reportId);
      if (error) throw error;
      fetchExpenses(viewingEmployeeId || employee.id);
      if (isAdmin) fetchAllExpenses();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el estado');
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'approved':
        return { color: 'text-accent-400 bg-accent-600/20', icon: CheckCircle, label: 'Aprobado', bgHover: 'hover:bg-accent-600/30' };
      case 'reimbursed':
        return { color: 'text-blue-400 bg-blue-600/20', icon: CheckCircle, label: 'Reembolsado', bgHover: 'hover:bg-blue-600/30' };
      case 'rejected':
        return { color: 'text-red-400 bg-red-600/20', icon: XCircle, label: 'Rechazado', bgHover: 'hover:bg-red-600/30' };
      case 'submitted':
        return { color: 'text-yellow-400 bg-yellow-600/20', icon: Clock, label: 'En revisión', bgHover: 'hover:bg-yellow-600/30' };
      default:
        return { color: 'text-surface-400 bg-surface-700', icon: Receipt, label: 'Borrador', bgHover: 'hover:bg-surface-600' };
    }
  };

  const filteredEmployees = employees.filter(emp =>
    `${emp.first_name} ${emp.last_name} ${emp.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const selectedEmployeeData = employees.find(e => e.id === viewingEmployeeId);

  // Estadísticas del empleado seleccionado
  const stats = {
    total: expenses.length,
    approved: expenses.filter(e => e.status === 'approved').length,
    submitted: expenses.filter(e => e.status === 'submitted').length,
    rejected: expenses.filter(e => e.status === 'rejected').length,
    totalAmount: expenses.reduce((sum, e) => sum + (e.total_amount || 0), 0)
  };

  if (!employee?.id) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-text-tertiary">Cargando perfil de usuario...</p>
        </div>
      </div>
    );
  }

  if (loading && !isAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Reportes de Gastos</h1>
          <p className="text-text-secondary mt-1">Gestión de gastos y reembolsos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Reporte
        </button>
      </div>

      {/* Vista de Administrador: Selector de Empleado */}
      {isAdmin && (
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary-400" />
              <span className="text-text-secondary font-medium">Ver gastos de:</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Buscar empleado..."
                  className="pl-9 pr-3 py-1.5 bg-surface-700 border border-white/10 rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {filteredEmployees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => setViewingEmployeeId(emp.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    viewingEmployeeId === emp.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-surface-700 text-text-tertiary hover:bg-surface-600 hover:text-text-secondary'
                  }`}
                >
                  {emp.first_name} {emp.last_name}
                  {emp.role === 'admin' && ' 👑'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Información del Empleado Seleccionado */}
      {isAdmin && selectedEmployeeData && (
        <div className="bg-surface-800/50 rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {selectedEmployeeData.first_name?.[0]}{selectedEmployeeData.last_name?.[0]}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-display font-semibold text-white">
                {selectedEmployeeData.first_name} {selectedEmployeeData.last_name}
              </h2>
              <p className="text-text-tertiary text-sm">{selectedEmployeeData.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <p className="text-text-tertiary text-sm">Total Reportes</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <p className="text-text-tertiary text-sm">Aprobados</p>
          <p className="text-2xl font-bold text-accent-400">{stats.approved}</p>
        </div>
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <p className="text-text-tertiary text-sm">En Revisión</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.submitted}</p>
        </div>
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <p className="text-text-tertiary text-sm">Rechazados</p>
          <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
        </div>
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <p className="text-text-tertiary text-sm">Total Gastos</p>
          <p className="text-2xl font-bold text-white">${stats.totalAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Lista de Gastos */}
      <div className="grid grid-cols-1 gap-4">
        {expenses.map((expense) => {
          const statusConfig = getStatusConfig(expense.status);
          const StatusIcon = statusConfig.icon;
          
          return (
            <div key={expense.id} className="bg-surface-800 rounded-xl border border-white/10 p-6 hover:border-primary-500/30 transition-all group">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary-600/10 rounded-xl">
                    <Receipt className="w-6 h-6 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-text-tertiary text-sm">Reporte #{expense.id.slice(0, 8)}</p>
                    <p className="text-white font-display font-semibold text-xl">
                      ${expense.total_amount?.toLocaleString() || 0}
                    </p>
                    <p className="text-text-tertiary text-sm mt-1">
                      {new Date(expense.report_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    {statusConfig.label}
                  </span>
                  
                  {/* Botones de acción solo para admin */}
                  {isAdmin && expense.status === 'submitted' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateStatus(expense.id, 'approved')}
                        className="px-3 py-1 bg-accent-600/20 text-accent-400 rounded-lg text-sm hover:bg-accent-600/30 transition"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(expense.id, 'rejected')}
                        className="px-3 py-1 bg-red-600/20 text-red-400 rounded-lg text-sm hover:bg-red-600/30 transition"
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
                  
                  <button
                    onClick={() => {
                      setSelectedReport(expense);
                      setShowDetails(true);
                    }}
                    className="p-1 text-text-tertiary hover:text-text-primary transition"
                    title="Ver detalles"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {expense.notes && (
                <p className="text-text-tertiary text-sm mt-4 pt-4 border-t border-white/10">
                  {expense.notes}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {expenses.length === 0 && (
        <div className="text-center py-12 bg-surface-800 rounded-xl border border-white/10">
          <DollarSign className="w-16 h-16 text-surface-600 mx-auto mb-4" />
          <p className="text-text-tertiary">No hay reportes de gastos</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-primary-400 hover:text-primary-300"
          >
            Crear primer reporte
          </button>
        </div>
      )}

      {/* Modal de Detalles del Reporte */}
      {showDetails && selectedReport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-800 rounded-2xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-display font-bold text-white">Detalles del Reporte</h2>
              <button onClick={() => setShowDetails(false)} className="text-text-tertiary hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-text-tertiary text-sm">Número</p>
                  <p className="text-white font-medium">#{selectedReport.id.slice(0, 8)}</p>
                </div>
                <div>
                  <p className="text-text-tertiary text-sm">Fecha</p>
                  <p className="text-white font-medium">{new Date(selectedReport.report_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-text-tertiary text-sm">Monto</p>
                  <p className="text-white font-bold text-xl">${selectedReport.total_amount?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-text-tertiary text-sm">Estado</p>
                  <p className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusConfig(selectedReport.status).color}`}>
                    {getStatusConfig(selectedReport.status).label}
                  </p>
                </div>
              </div>
              {selectedReport.notes && (
                <div>
                  <p className="text-text-tertiary text-sm">Notas</p>
                  <p className="text-text-secondary mt-1">{selectedReport.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Reporte */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-800 rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-display font-bold text-white">Nuevo Reporte de Gastos</h2>
              <button onClick={() => setShowForm(false)} className="text-text-tertiary hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Fecha del Reporte</label>
                <input
                  type="date"
                  required
                  className="input"
                  value={formData.report_date}
                  onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Monto Total</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="input"
                  placeholder="0.00"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Notas</label>
                <textarea
                  rows="3"
                  className="input"
                  placeholder="Describe los gastos realizados..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Crear Reporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesList;