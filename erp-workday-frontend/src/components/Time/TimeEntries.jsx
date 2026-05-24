// src/components/Time/TimeEntries.jsx
import React, { useState, useEffect } from 'react';
import { Clock, Plus, CheckCircle, XCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const TimeEntries = () => {
  const { employee } = useAuth();
  const [entries, setEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    entry_date: new Date().toISOString().split('T')[0],
    hours: '',
    description: ''
  });

  useEffect(() => {
    if (employee?.id) {
      fetchEntries();
      fetchProjects();
    }
  }, [employee]);

  const fetchEntries = async () => {
    if (!employee?.id) return;
    try {
      const { data } = await supabase
        .from('time_entries')
        .select('*, project:projects(name)')
        .eq('employee_id', employee.id)
        .order('entry_date', { ascending: false });
      
      setEntries(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('*');
    setProjects(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('time_entries').insert([{
        employee_id: employee.id,
        ...formData,
        status: 'pending'
      }]);
      if (error) throw error;
      setShowForm(false);
      setFormData({ project_id: '', entry_date: new Date().toISOString().split('T')[0], hours: '', description: '' });
      fetchEntries();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al registrar horas');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return { color: 'text-accent-400 bg-accent-600/20', icon: CheckCircle, label: 'Aprobado' };
      case 'rejected':
        return { color: 'text-red-400 bg-red-600/20', icon: XCircle, label: 'Rechazado' };
      default:
        return { color: 'text-yellow-400 bg-yellow-600/20', icon: Clock, label: 'Pendiente' };
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
          <h1 className="text-2xl font-display font-bold text-white">Registro de Tiempo</h1>
          <p className="text-text-secondary mt-1">Control de horas trabajadas</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Registrar Horas
        </button>
      </div>

      <div className="bg-surface-800 rounded-xl border border-white/10 overflow-hidden">
        <div className="divide-y divide-white/10">
          {entries.map((entry) => {
            const statusConfig = getStatusBadge(entry.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <div key={entry.id} className="p-4 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary-600/10 rounded-lg">
                    <Clock className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{new Date(entry.entry_date).toLocaleDateString()}</p>
                    <p className="text-sm text-text-tertiary">{entry.project?.name || 'Sin proyecto'}</p>
                    <p className="text-xs text-text-tertiary mt-1">{entry.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-medium text-white">{entry.hours} hrs</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {entries.length === 0 && (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-surface-600 mx-auto mb-4" />
            <p className="text-text-tertiary">No hay registros de tiempo</p>
          </div>
        )}
      </div>

      {/* Modal Registrar Horas */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-800 rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-display font-bold text-white">Registrar Horas</h2>
              <button onClick={() => setShowForm(false)} className="text-text-tertiary hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Proyecto</label>
                <select
                  required
                  className="input"
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Fecha</label>
                <input
                  type="date"
                  required
                  className="input"
                  value={formData.entry_date}
                  onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Horas</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  className="input"
                  placeholder="Ej: 8"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Descripción</label>
                <textarea
                  rows="3"
                  className="input"
                  placeholder="Describe el trabajo realizado..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 btn-secondary">
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
    </div>
  );
};

export default TimeEntries;