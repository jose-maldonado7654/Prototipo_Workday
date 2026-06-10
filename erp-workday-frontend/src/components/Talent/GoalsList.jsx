// src/components/Talent/GoalsList.jsx
import React, { useState, useEffect } from 'react';
import { Target, Plus, CheckCircle, Circle, X, Users, Search, Edit2, Trash2, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const GoalsList = () => {
  const { employee, isAdmin } = useAuth();
  const [goals, setGoals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [viewingEmployeeId, setViewingEmployeeId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    employee_id: '',
    title: '',
    description: '',
    due_date: '',
    progress_percentage: 0,
    status: 'not_started'
  });

  // Cargar datos según el rol
  useEffect(() => {
    if (isAdmin) {
      fetchAllEmployees();
    } else if (employee?.id) {
      setViewingEmployeeId(employee.id);
      fetchGoals(employee.id);
    }
  }, [isAdmin, employee]);

  // Cuando cambia el empleado seleccionado (admin), cargar sus metas
  useEffect(() => {
    if (isAdmin && viewingEmployeeId) {
      fetchGoals(viewingEmployeeId);
    }
  }, [viewingEmployeeId, isAdmin]);

  const fetchAllEmployees = async () => {
    try {
      const { data } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email, role')
        .order('first_name');
      setEmployees(data || []);
      if (data?.length > 0 && !viewingEmployeeId) {
        setViewingEmployeeId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchGoals = async (empId) => {
    if (!empId) return;
    setLoading(true);
    try {
      // Traer metas del empleado seleccionado
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('employee_id', empId)
        .order('due_date', { ascending: true });
      
      if (error) throw error;
      console.log('Metas cargadas para empleado:', empId, data);
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const targetEmployeeId = isAdmin ? formData.employee_id : employee.id;
      const goalData = {
        employee_id: targetEmployeeId,
        title: formData.title,
        description: formData.description,
        due_date: formData.due_date || null,
        progress_percentage: parseInt(formData.progress_percentage) || 0,
        status: formData.status
      };

      if (editingGoal) {
        const { error } = await supabase
          .from('goals')
          .update(goalData)
          .eq('id', editingGoal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('goals').insert([goalData]);
        if (error) throw error;
      }

      setShowForm(false);
      setEditingGoal(null);
      setFormData({ employee_id: '', title: '', description: '', due_date: '', progress_percentage: 0, status: 'not_started' });
      
      // Recargar metas del empleado actual
      if (isAdmin && viewingEmployeeId) {
        await fetchGoals(viewingEmployeeId);
      } else if (employee?.id) {
        await fetchGoals(employee.id);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar la meta');
    }
  };

  const handleUpdateProgress = async (goalId, newProgress) => {
    const newStatus = newProgress >= 100 ? 'completed' : newProgress > 0 ? 'in_progress' : 'not_started';
    
    try {
      const { error } = await supabase
        .from('goals')
        .update({ 
          progress_percentage: newProgress,
          status: newStatus,
          completed_at: newProgress >= 100 ? new Date().toISOString() : null
        })
        .eq('id', goalId);
      
      if (error) throw error;
      
      if (isAdmin && viewingEmployeeId) {
        await fetchGoals(viewingEmployeeId);
      } else if (employee?.id) {
        await fetchGoals(employee.id);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el progreso');
    }
  };

  const handleDelete = async (goalId) => {
    if (!confirm('¿Estás seguro de eliminar esta meta?')) return;
    
    try {
      const { error } = await supabase.from('goals').delete().eq('id', goalId);
      if (error) throw error;
      
      if (isAdmin && viewingEmployeeId) {
        await fetchGoals(viewingEmployeeId);
      } else if (employee?.id) {
        await fetchGoals(employee.id);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar la meta');
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      employee_id: goal.employee_id,
      title: goal.title,
      description: goal.description || '',
      due_date: goal.due_date || '',
      progress_percentage: goal.progress_percentage,
      status: goal.status
    });
    setShowForm(true);
  };

  const getStatusConfig = (status, progress) => {
    if (status === 'completed' || progress >= 100) {
      return { color: 'text-accent-400 bg-accent-600/20', icon: CheckCircle, label: 'Completada' };
    } else if (progress > 0) {
      return { color: 'text-yellow-400 bg-yellow-600/20', icon: TrendingUp, label: 'En progreso' };
    }
    return { color: 'text-surface-400 bg-surface-700', icon: Circle, label: 'No iniciada' };
  };

  const filteredEmployees = employees.filter(emp =>
    `${emp.first_name} ${emp.last_name} ${emp.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const selectedEmployeeData = employees.find(e => e.id === viewingEmployeeId);

  const stats = {
    total: goals.length,
    completed: goals.filter(g => g.status === 'completed' || g.progress_percentage >= 100).length,
    inProgress: goals.filter(g => g.status === 'in_progress' && g.progress_percentage < 100).length,
    notStarted: goals.filter(g => g.status === 'not_started' || (g.progress_percentage === 0 && g.status !== 'completed')).length,
    avgProgress: goals.length > 0 ? Math.round(goals.reduce((sum, g) => sum + (g.progress_percentage || 0), 0) / goals.length) : 0
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
        <p className="mt-4 text-text-tertiary">Cargando metas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Metas</h1>
          <p className="text-text-secondary mt-1">
            {isAdmin ? 'Gestión de metas por empleado' : 'Seguimiento de tus metas profesionales'}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingGoal(null);
            setFormData({ employee_id: isAdmin ? viewingEmployeeId || '' : employee.id, title: '', description: '', due_date: '', progress_percentage: 0, status: 'not_started' });
            setShowForm(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Meta
        </button>
      </div>

      {/* Selector de Empleado - SOLO visible para ADMIN */}
      {isAdmin && (
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary-400" />
              <span className="text-text-secondary font-medium">Ver metas de:</span>
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

      {/* Información del Empleado - SOLO visible para ADMIN */}
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

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <p className="text-text-tertiary text-sm">Total Metas</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <p className="text-text-tertiary text-sm">Completadas</p>
          <p className="text-2xl font-bold text-accent-400">{stats.completed}</p>
        </div>
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <p className="text-text-tertiary text-sm">En Progreso</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.inProgress}</p>
        </div>
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <p className="text-text-tertiary text-sm">No Iniciadas</p>
          <p className="text-2xl font-bold text-surface-400">{stats.notStarted}</p>
        </div>
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <p className="text-text-tertiary text-sm">Progreso Promedio</p>
          <p className="text-2xl font-bold text-primary-400">{stats.avgProgress}%</p>
        </div>
      </div>

      {/* Lista de Metas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {goals.map((goal) => {
          const percentage = goal.progress_percentage || 0;
          const statusConfig = getStatusConfig(goal.status, percentage);
          const StatusIcon = statusConfig.icon;
          
          return (
            <div key={goal.id} className="bg-surface-800 rounded-xl border border-white/10 p-6 hover:border-primary-500/30 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-600/10 rounded-lg">
                    <Target className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-white">{goal.title}</h3>
                    <p className="text-sm text-text-tertiary">
                      Vence: {goal.due_date ? new Date(goal.due_date).toLocaleDateString() : 'Sin fecha límite'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </span>
                  {/* Botones de acción - SOLO visibles para ADMIN */}
                  {isAdmin && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleEdit(goal)}
                        className="p-1 hover:bg-surface-700 rounded transition"
                        title="Editar meta"
                      >
                        <Edit2 className="w-3 h-3 text-text-tertiary hover:text-yellow-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="p-1 hover:bg-surface-700 rounded transition"
                        title="Eliminar meta"
                      >
                        <Trash2 className="w-3 h-3 text-text-tertiary hover:text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-text-secondary text-sm mb-4">{goal.description || 'Sin descripción'}</p>
              
              <div className="mt-4">
                <div className="flex justify-between text-sm text-text-tertiary mb-2">
                  <span>Progreso</span>
                  <div className="flex items-center gap-2">
                    <span>{percentage}%</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={percentage}
                      onChange={(e) => handleUpdateProgress(goal.id, parseInt(e.target.value))}
                      className="w-24 h-1 bg-surface-600 rounded-lg appearance-none cursor-pointer accent-primary-500"
                      title="Actualizar progreso"
                    />
                  </div>
                </div>
                <div className="w-full bg-surface-700 rounded-full h-2">
                  <div 
                    className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {goals.length === 0 && (
        <div className="text-center py-12 bg-surface-800 rounded-xl border border-white/10">
          <Target className="w-16 h-16 text-surface-600 mx-auto mb-4" />
          <p className="text-text-tertiary">No hay metas registradas para este empleado</p>
          {isAdmin && (
            <button
              onClick={() => {
                setEditingGoal(null);
                setFormData({ employee_id: viewingEmployeeId || '', title: '', description: '', due_date: '', progress_percentage: 0, status: 'not_started' });
                setShowForm(true);
              }}
              className="mt-4 text-primary-400 hover:text-primary-300"
            >
              Crear meta para este empleado
            </button>
          )}
        </div>
      )}

      {/* Modal Nueva/Editar Meta */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-800 rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-display font-bold text-white">
                {editingGoal ? 'Editar Meta' : 'Nueva Meta'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-text-tertiary hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Selector de empleado - SOLO visible para ADMIN */}
              {isAdmin && (
                <div>
                  <label className="label">Empleado</label>
                  <select
                    required
                    className="input"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  >
                    <option value="">Seleccionar...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} ({emp.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="label">Título</label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="Ej: Completar certificación"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Descripción</label>
                <textarea
                  rows="3"
                  className="input"
                  placeholder="Describe la meta..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Fecha Límite</label>
                <input
                  type="date"
                  className="input"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Progreso inicial (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input"
                  value={formData.progress_percentage}
                  onChange={(e) => setFormData({ ...formData, progress_percentage: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editingGoal ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsList;