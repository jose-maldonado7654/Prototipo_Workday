// src/components/Leave/LeaveRequests.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle, XCircle, Clock, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const LeaveRequests = () => {
  const { employee } = useAuth();
  const [requests, setRequests] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    policy_id: '',
    start_date: '',
    end_date: '',
    reason: ''
  });

  useEffect(() => {
    if (employee?.id) {
      fetchRequests();
      fetchPolicies();
    } else {
      setLoading(false);
    }
  }, [employee]);

  const fetchRequests = async () => {
    if (!employee?.id) return;
    try {
      const { data } = await supabase
        .from('leave_requests')
        .select('*, policy:leave_policies(name)')
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false });
      
      setRequests(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPolicies = async () => {
    const { data } = await supabase.from('leave_policies').select('*');
    setPolicies(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('leave_requests').insert([{
        employee_id: employee.id,
        ...formData,
        status: 'pending'
      }]);
      if (error) throw error;
      setShowForm(false);
      setFormData({ policy_id: '', start_date: '', end_date: '', reason: '' });
      fetchRequests();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear la solicitud');
    }
  };

  const getStatusConfig = (status) => {
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
          <h1 className="text-2xl font-display font-bold text-white">Solicitudes de Ausencia</h1>
          <p className="text-text-secondary mt-1">Vacaciones, permisos y licencias</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Solicitud
        </button>
      </div>

      <div className="bg-surface-800 rounded-xl border border-white/10 overflow-hidden">
        <div className="divide-y divide-white/10">
          {requests.map((request) => {
            const StatusIcon = getStatusConfig(request.status).icon;
            const statusConfig = getStatusConfig(request.status);
            const days = Math.ceil((new Date(request.end_date) - new Date(request.start_date)) / (1000 * 60 * 60 * 24)) + 1;
            
            return (
              <div key={request.id} className="p-4 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary-600/10 rounded-lg">
                    <Calendar className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{request.policy?.name}</p>
                    <p className="text-sm text-text-tertiary">
                      {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-text-tertiary mt-1">{days} días</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig.label}
                </span>
              </div>
            );
          })}
        </div>

        {requests.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-surface-600 mx-auto mb-4" />
            <p className="text-text-tertiary">No hay solicitudes de ausencia</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-primary-400 hover:text-primary-300"
            >
              Crear primera solicitud
            </button>
          </div>
        )}
      </div>

      {/* Modal Nueva Solicitud */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-800 rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-display font-bold text-white">Nueva Solicitud</h2>
              <button onClick={() => setShowForm(false)} className="text-text-tertiary hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Tipo de Ausencia</label>
                <select
                  required
                  className="input"
                  value={formData.policy_id}
                  onChange={(e) => setFormData({ ...formData, policy_id: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  {policies.map((policy) => (
                    <option key={policy.id} value={policy.id}>
                      {policy.name} ({policy.days_per_year} días/año)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Fecha Inicio</label>
                  <input
                    type="date"
                    required
                    className="input"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Fecha Fin</label>
                  <input
                    type="date"
                    required
                    className="input"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="label">Motivo</label>
                <textarea
                  rows="3"
                  className="input"
                  placeholder="Describe el motivo de tu ausencia..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Enviar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequests;