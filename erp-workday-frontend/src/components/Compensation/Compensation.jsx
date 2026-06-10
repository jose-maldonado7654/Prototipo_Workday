// src/components/Compensation/Compensation.jsx
import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, TrendingUp, Calendar, Award, X, Users, Search, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const Compensation = () => {
  const { employee, isAdmin } = useAuth();
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [bonusHistory, setBonusHistory] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [compensationPlans, setCompensationPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [showBonusForm, setShowBonusForm] = useState(false);
  const [viewingEmployeeId, setViewingEmployeeId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [salaryForm, setSalaryForm] = useState({
    employee_id: '',
    amount: '',
    currency: 'USD',
    effective_from: ''
  });
  const [bonusForm, setBonusForm] = useState({
    employee_id: '',
    amount: '',
    bonus_type: '',
    payment_date: '',
    notes: ''
  });

  useEffect(() => {
    if (isAdmin) {
      fetchAllEmployees();
      fetchCompensationPlans();
      if (viewingEmployeeId) {
        fetchEmployeeCompensation(viewingEmployeeId);
      }
    } else if (employee?.id) {
      setViewingEmployeeId(employee.id);
      fetchEmployeeCompensation(employee.id);
    }
  }, [isAdmin, employee]);

  useEffect(() => {
    if (isAdmin && viewingEmployeeId) {
      fetchEmployeeCompensation(viewingEmployeeId);
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

  const fetchCompensationPlans = async () => {
    const { data } = await supabase.from('compensation_plans').select('*');
    setCompensationPlans(data || []);
  };

  const fetchEmployeeCompensation = async (empId) => {
    if (!empId) return;
    setLoading(true);
    
    try {
      const [salaryRes, bonusRes] = await Promise.all([
        supabase
          .from('salary_history')
          .select('*, compensation_plan:compensation_plans(name)')
          .eq('employee_id', empId)
          .order('effective_from', { ascending: false }),
        supabase
          .from('bonus_payments')
          .select('*')
          .eq('employee_id', empId)
          .order('payment_date', { ascending: false })
      ]);
      
      setSalaryHistory(salaryRes.data || []);
      setBonusHistory(bonusRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSalary = async (e) => {
    e.preventDefault();
    try {
      // Cerrar registro anterior del empleado
      await supabase
        .from('salary_history')
        .update({ effective_to: new Date() })
        .eq('employee_id', salaryForm.employee_id)
        .is('effective_to', null);
      
      await supabase.from('salary_history').insert([{
        ...salaryForm,
        amount: parseFloat(salaryForm.amount)
      }]);
      
      setShowSalaryForm(false);
      setSalaryForm({ employee_id: '', amount: '', currency: 'USD', effective_from: '' });
      fetchEmployeeCompensation(viewingEmployeeId);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al registrar salario');
    }
  };

  const handleAddBonus = async (e) => {
    e.preventDefault();
    try {
      await supabase.from('bonus_payments').insert([{
        ...bonusForm,
        amount: parseFloat(bonusForm.amount)
      }]);
      
      setShowBonusForm(false);
      setBonusForm({ employee_id: '', amount: '', bonus_type: '', payment_date: '', notes: '' });
      fetchEmployeeCompensation(viewingEmployeeId);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al registrar bono');
    }
  };

  const getBonusTypeLabel = (type) => {
    const types = {
      performance: '🎯 Rendimiento',
      holiday: '🎄 Aguinaldo',
      referral: '👥 Recomendación',
      special: '⭐ Especial'
    };
    return types[type] || type;
  };

  const currentSalary = salaryHistory.find(s => !s.effective_to);
  const totalBonuses = bonusHistory.reduce((sum, b) => sum + (b.amount || 0), 0);

  const filteredEmployees = employees.filter(emp =>
    `${emp.first_name} ${emp.last_name} ${emp.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const selectedEmployeeData = employees.find(e => e.id === viewingEmployeeId);

  if (loading) {
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
          <h1 className="text-2xl font-display font-bold text-white">Compensaciones</h1>
          <p className="text-text-secondary mt-1">
            {isAdmin ? 'Gestión de salarios y bonos' : 'Tu información salarial'}
          </p>
        </div>
        {/* Botones SOLO visibles para ADMIN */}
        {isAdmin && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowBonusForm(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Award className="w-4 h-4" />
              Registrar Bono
            </button>
            <button
              onClick={() => setShowSalaryForm(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Salario
            </button>
          </div>
        )}
      </div>

      {/* Selector de Empleado - SOLO visible para ADMIN */}
      {isAdmin && (
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary-400" />
              <span className="text-text-secondary font-medium">Ver compensaciones de:</span>
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

      {/* Información del Empleado Seleccionado - SOLO visible para ADMIN */}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
          <p className="text-text-tertiary text-sm mb-1">Salario Actual</p>
          <p className="text-2xl font-bold text-white">
            {currentSalary 
              ? `${currentSalary.currency || 'USD'} ${currentSalary.amount?.toLocaleString()}` 
              : 'No registrado'}
          </p>
          {currentSalary && (
            <p className="text-xs text-text-tertiary mt-2">
              Desde: {new Date(currentSalary.effective_from).toLocaleDateString()}
            </p>
          )}
        </div>
        
        <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
          <p className="text-text-tertiary text-sm mb-1">Total en Bonos</p>
          <p className="text-2xl font-bold text-white">${totalBonuses.toLocaleString()}</p>
          <p className="text-xs text-text-tertiary mt-2">{bonusHistory.length} bonos registrados</p>
        </div>
        
        <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
          <p className="text-text-tertiary text-sm mb-1">Salario Anual</p>
          <p className="text-2xl font-bold text-white">
            ${currentSalary ? (currentSalary.amount * 12).toLocaleString() : '0'}
          </p>
          <p className="text-xs text-text-tertiary mt-2">+ bonos adicionales</p>
        </div>
      </div>

      {/* Historial Salarial */}
      <div className="bg-surface-800 rounded-xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-display font-semibold text-white">Historial Salarial</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-surface-700/50">
              <tr>
                <th className="table-header">Fecha Inicio</th>
                <th className="table-header">Fecha Fin</th>
                <th className="table-header">Monto</th>
                <th className="table-header">Moneda</th>
                <th className="table-header">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {salaryHistory.map((salary) => (
                <tr key={salary.id} className="hover:bg-surface-700/30 transition">
                  <td className="table-cell">{new Date(salary.effective_from).toLocaleDateString()}</td>
                  <td className="table-cell">
                    {salary.effective_to ? new Date(salary.effective_to).toLocaleDateString() : 'Actual'}
                  </td>
                  <td className="table-cell font-medium text-white">
                    {salary.amount?.toLocaleString()}
                   </td>
                  <td className="table-cell">{salary.currency || 'USD'} </td>
                  <td className="table-cell">
                    {!salary.effective_to ? (
                      <span className="px-2 py-1 bg-accent-600/20 text-accent-400 rounded-full text-xs">Activo</span>
                    ) : (
                      <span className="px-2 py-1 bg-surface-600 text-text-tertiary rounded-full text-xs">Histórico</span>
                    )}
                   </td>
                </tr>
              ))}
              {salaryHistory.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-text-tertiary">
                    No hay historial salarial
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial de Bonos */}
      <div className="bg-surface-800 rounded-xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-display font-semibold text-white">Historial de Bonos</h2>
        </div>
        <div className="divide-y divide-white/10">
          {bonusHistory.map((bonus) => (
            <div key={bonus.id} className="p-4 flex items-center justify-between hover:bg-surface-700/30 transition">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-accent-600/10 rounded-lg">
                  <Award className="w-5 h-5 text-accent-400" />
                </div>
                <div>
                  <p className="font-medium text-white">${bonus.amount?.toLocaleString()}</p>
                  <p className="text-xs text-text-tertiary">
                    {getBonusTypeLabel(bonus.bonus_type)} • {new Date(bonus.payment_date).toLocaleDateString()}
                  </p>
                  {bonus.notes && (
                    <p className="text-xs text-text-tertiary mt-1">{bonus.notes}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {bonusHistory.length === 0 && (
            <div className="p-8 text-center">
              <Award className="w-12 h-12 text-surface-600 mx-auto mb-3" />
              <p className="text-text-tertiary">No hay bonos registrados</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nuevo Salario - SOLO visible para ADMIN */}
      {showSalaryForm && isAdmin && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-800 rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-display font-bold text-white">Registrar Salario</h2>
              <button onClick={() => setShowSalaryForm(false)} className="text-text-tertiary hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSalary} className="p-6 space-y-4">
              <div>
                <label className="label">Empleado</label>
                <select
                  required
                  className="input"
                  value={salaryForm.employee_id}
                  onChange={(e) => setSalaryForm({ ...salaryForm, employee_id: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="input"
                  placeholder="0.00"
                  value={salaryForm.amount}
                  onChange={(e) => setSalaryForm({ ...salaryForm, amount: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Moneda</label>
                <select
                  className="input"
                  value={salaryForm.currency}
                  onChange={(e) => setSalaryForm({ ...salaryForm, currency: e.target.value })}
                >
                  <option value="USD">USD - Dólar Americano</option>
                  <option value="MXN">MXN - Peso Mexicano</option>
                  <option value="COP">COP - Peso Colombiano</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>
              <div>
                <label className="label">Fecha Efectiva</label>
                <input
                  type="date"
                  required
                  className="input"
                  value={salaryForm.effective_from}
                  onChange={(e) => setSalaryForm({ ...salaryForm, effective_from: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowSalaryForm(false)} className="flex-1 btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo Bono - SOLO visible para ADMIN */}
      {showBonusForm && isAdmin && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-800 rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-display font-bold text-white">Registrar Bono</h2>
              <button onClick={() => setShowBonusForm(false)} className="text-text-tertiary hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddBonus} className="p-6 space-y-4">
              <div>
                <label className="label">Empleado</label>
                <select
                  required
                  className="input"
                  value={bonusForm.employee_id}
                  onChange={(e) => setBonusForm({ ...bonusForm, employee_id: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="input"
                  placeholder="0.00"
                  value={bonusForm.amount}
                  onChange={(e) => setBonusForm({ ...bonusForm, amount: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Tipo de Bono</label>
                <select
                  required
                  className="input"
                  value={bonusForm.bonus_type}
                  onChange={(e) => setBonusForm({ ...bonusForm, bonus_type: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  <option value="performance">🎯 Rendimiento</option>
                  <option value="holiday">🎄 Aguinaldo</option>
                  <option value="referral">👥 Recomendación</option>
                  <option value="special">⭐ Especial</option>
                </select>
              </div>
              <div>
                <label className="label">Fecha de Pago</label>
                <input
                  type="date"
                  required
                  className="input"
                  value={bonusForm.payment_date}
                  onChange={(e) => setBonusForm({ ...bonusForm, payment_date: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Notas / Motivo</label>
                <textarea
                  className="input"
                  rows="2"
                  placeholder="Ej: Bono trimestral por cumplimiento de metas..."
                  value={bonusForm.notes}
                  onChange={(e) => setBonusForm({ ...bonusForm, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowBonusForm(false)} className="flex-1 btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Registrar Bono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Compensation;