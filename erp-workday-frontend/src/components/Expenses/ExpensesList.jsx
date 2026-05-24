// src/components/Expenses/ExpensesList.jsx
import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Receipt, CheckCircle, Clock, XCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const ExpensesList = () => {
  const { employee } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    report_date: new Date().toISOString().split('T')[0],
    total_amount: '',
    status: 'draft',
    notes: ''
  });

  useEffect(() => {
    if (employee?.id) {
      fetchExpenses();
    } else {
      setLoading(false);
    }
  }, [employee]);

  const fetchExpenses = async () => {
    if (!employee?.id) return;

    try {
      const { data } = await supabase
        .from('expense_reports')
        .select('*')
        .eq('employee_id', employee.id)
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
        employee_id: employee.id,
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
      fetchExpenses();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear el reporte de gastos');
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'approved':
        return { color: 'text-accent-400 bg-accent-600/20', icon: CheckCircle, label: 'Aprobado' };
      case 'reimbursed':
        return { color: 'text-blue-400 bg-blue-600/20', icon: CheckCircle, label: 'Reembolsado' };
      case 'rejected':
        return { color: 'text-red-400 bg-red-600/20', icon: XCircle, label: 'Rechazado' };
      case 'submitted':
        return { color: 'text-yellow-400 bg-yellow-600/20', icon: Clock, label: 'En revisión' };
      default:
        return { color: 'text-surface-400 bg-surface-700', icon: Receipt, label: 'Borrador' };
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 gap-4">
        {expenses.map((expense) => {
          const statusConfig = getStatusConfig(expense.status);
          const StatusIcon = statusConfig.icon;
          
          return (
            <div key={expense.id} className="bg-surface-800 rounded-xl border border-white/10 p-6 hover:border-primary-500/30 transition-all">
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
                
                <div className="flex items-center gap-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    {statusConfig.label}
                  </span>
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