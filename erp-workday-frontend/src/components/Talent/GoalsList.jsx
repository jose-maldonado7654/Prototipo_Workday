// src/components/Talent/GoalsList.jsx
import React, { useState, useEffect } from 'react';
import { Target, Plus, CheckCircle, Circle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const GoalsList = () => {
  const { employee } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    progress_percentage: 0
  });

  useEffect(() => {
    if (employee?.id) {
      fetchGoals();
    }
  }, [employee]);

  const fetchGoals = async () => {
    if (!employee?.id) return;
    try {
      const { data } = await supabase
        .from('goals')
        .select('*')
        .eq('employee_id', employee.id)
        .order('due_date', { ascending: true });
      
      setGoals(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('goals').insert([{
        employee_id: employee.id,
        ...formData,
        status: 'not_started'
      }]);
      if (error) throw error;
      setShowForm(false);
      setFormData({ title: '', description: '', due_date: '', progress_percentage: 0 });
      fetchGoals();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear la meta');
    }
  };

  const getStatusConfig = (status, progress) => {
    if (status === 'completed') {
      return { color: 'text-accent-400', icon: CheckCircle, label: 'Completada' };
    } else if (progress >= 100) {
      return { color: 'text-accent-400', icon: CheckCircle, label: 'Completada' };
    } else if (progress > 0) {
      return { color: 'text-yellow-400', icon: Circle, label: 'En progreso' };
    }
    return { color: 'text-surface-400', icon: Circle, label: 'No iniciada' };
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
          <h1 className="text-2xl font-display font-bold text-white">Metas y Objetivos</h1>
          <p className="text-text-secondary mt-1">Seguimiento de metas profesionales</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Meta
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {goals.map((goal) => {
          const statusConfig = getStatusConfig(goal.status, goal.progress_percentage);
          const StatusIcon = statusConfig.icon;
          
          return (
            <div key={goal.id} className="bg-surface-800 rounded-xl border border-white/10 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-600/10 rounded-lg">
                    <Target className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-white">{goal.title}</h3>
                    <p className="text-sm text-text-tertiary">Vence: {new Date(goal.due_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-surface-700 ${statusConfig.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig.label}
                </span>
              </div>
              
              <p className="text-text-secondary text-sm mb-4">{goal.description}</p>
              
              <div className="mt-4">
                <div className="flex justify-between text-sm text-text-tertiary mb-2">
                  <span>Progreso</span>
                  <span>{goal.progress_percentage}%</span>
                </div>
                <div className="w-full bg-surface-700 rounded-full h-2">
                  <div 
                    className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${goal.progress_percentage}%` }}
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
          <p className="text-text-tertiary">No hay metas registradas</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-primary-400 hover:text-primary-300"
          >
            Crear primera meta
          </button>
        </div>
      )}

      {/* Modal Nueva Meta */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-800 rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-display font-bold text-white">Nueva Meta</h2>
              <button onClick={() => setShowForm(false)} className="text-text-tertiary hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                  required
                  className="input"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Crear Meta
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