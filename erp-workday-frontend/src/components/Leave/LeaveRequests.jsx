// src/components/Leave/LeaveRequests.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle, XCircle, Clock, X, Users, Search, Filter, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import LeaveBalances from './LeaveBalances';

const LeaveRequests = () => {
  const { employee, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewingEmployeeId, setViewingEmployeeId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    policy_id: '',
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Si es admin, cargar todos los empleados y todas las solicitudes
  useEffect(() => {
    if (isAdmin) {
      fetchAllEmployees();
      fetchAllRequests();
      fetchPolicies();
    } else {
      setViewingEmployeeId(employee?.id);
    }
  }, [isAdmin, employee]);

  // Cargar solicitudes del empleado seleccionado
  useEffect(() => {
    if (viewingEmployeeId && !isAdmin) {
      fetchRequests(viewingEmployeeId);
    } else if (viewingEmployeeId && isAdmin) {
      // Para admin, filtrar las solicitudes ya cargadas
      filterRequestsByEmployee();
    }
  }, [viewingEmployeeId, isAdmin, allRequests]);

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

  const fetchAllRequests = async () => {
    try {
      const { data } = await supabase
        .from('leave_requests')
        .select('*, policy:leave_policies(name), employee:employees(first_name, last_name, email)')
        .order('created_at', { ascending: false });
      setAllRequests(data || []);
      filterRequestsByEmployee(viewingEmployeeId, data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRequestsByEmployee = (empId = viewingEmployeeId, requestsData = allRequests) => {
    if (empId && requestsData) {
      const filtered = requestsData.filter(r => r.employee_id === empId);
      setRequests(filtered);
    }
  };

  const fetchRequests = async (empId) => {
    if (!empId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('leave_requests')
        .select('*, policy:leave_policies(name)')
        .eq('employee_id', empId)
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
    setSubmitting(true);
    try {
      const targetEmployeeId = isAdmin ? viewingEmployeeId : employee.id;
      const { error } = await supabase.from('leave_requests').insert([{
        employee_id: targetEmployeeId,
        ...formData,
        status: 'pending'
      }]);
      if (error) throw error;
      setShowForm(false);
      setFormData({ policy_id: '', start_date: '', end_date: '', reason: '' });
      
      if (isAdmin) {
        await fetchAllRequests();
      } else {
        await fetchRequests(employee.id);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ 
          status: newStatus,
          approved_by: isAdmin ? employee.id : null,
          approved_at: new Date()
        })
        .eq('id', requestId);
      if (error) throw error;
      
      if (isAdmin) {
        await fetchAllRequests();
      } else {
        await fetchRequests(employee.id);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar la solicitud');
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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved': return 'bg-accent-600/20 text-accent-400 border-accent-500/30';
      case 'rejected': return 'bg-red-600/20 text-red-400 border-red-500/30';
      default: return 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const filteredEmployees = employees.filter(emp =>
    `${emp.first_name} ${emp.last_name} ${emp.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const selectedEmployeeData = employees.find(e => e.id === viewingEmployeeId);

  // Filtrar solicitudes por estado
  const filteredRequests = statusFilter === 'all' 
    ? requests 
    : requests.filter(r => r.status === statusFilter);

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  };

  // Estado de carga inicial
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
          <h1 className="text-2xl font-display font-bold text-white">Gestión de Ausencias</h1>
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

      {/* Pestañas */}
      <div className="border-b border-white/10">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
              activeTab === 'requests'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Solicitudes
              {stats.pending > 0 && (
                <span className="px-1.5 py-0.5 bg-yellow-600/20 text-yellow-400 rounded-full text-xs">
                  {stats.pending}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('balances')}
            className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
              activeTab === 'balances'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            Mis Saldos
          </button>
        </div>
      </div>

      {/* Contenido de la pestaña de Saldos */}
      {activeTab === 'balances' && <LeaveBalances />}

      {/* Contenido de la pestaña de Solicitudes */}
      {activeTab === 'requests' && (
        <>
          {/* Vista de Administrador: Selector de Empleado */}
          {isAdmin && (
            <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary-400" />
                  <span className="text-text-secondary font-medium">Ver solicitudes de:</span>
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

          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-tertiary text-sm">Total Solicitudes</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="p-2 bg-primary-600/10 rounded-lg">
                  <Calendar className="w-4 h-4 text-primary-400" />
                </div>
              </div>
            </div>
            <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-tertiary text-sm">Aprobadas</p>
                  <p className="text-2xl font-bold text-accent-400">{stats.approved}</p>
                </div>
                <div className="p-2 bg-accent-600/10 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-accent-400" />
                </div>
              </div>
            </div>
            <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-tertiary text-sm">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
                </div>
                <div className="p-2 bg-yellow-600/10 rounded-lg">
                  <Clock className="w-4 h-4 text-yellow-400" />
                </div>
              </div>
            </div>
            <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-tertiary text-sm">Rechazadas</p>
                  <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
                </div>
                <div className="p-2 bg-red-600/10 rounded-lg">
                  <XCircle className="w-4 h-4 text-red-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Filtro por estado */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                statusFilter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-700 text-text-tertiary hover:bg-surface-600'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                statusFilter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-surface-700 text-text-tertiary hover:bg-surface-600'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                statusFilter === 'approved'
                  ? 'bg-accent-600 text-white'
                  : 'bg-surface-700 text-text-tertiary hover:bg-surface-600'
              }`}
            >
              Aprobadas
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                statusFilter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-surface-700 text-text-tertiary hover:bg-surface-600'
              }`}
            >
              Rechazadas
            </button>
          </div>

          {/* Lista de solicitudes */}
          <div className="bg-surface-800 rounded-xl border border-white/10 overflow-hidden">
            <div className="divide-y divide-white/10">
              {filteredRequests.map((request) => {
                const StatusIcon = getStatusConfig(request.status).icon;
                const statusConfig = getStatusConfig(request.status);
                const days = Math.ceil((new Date(request.end_date) - new Date(request.start_date)) / (1000 * 60 * 60 * 24)) + 1;
                
                return (
                  <div key={request.id} className="p-4 hover:bg-surface-700/30 transition flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary-600/10 rounded-lg">
                        <Calendar className="w-5 h-5 text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{request.policy?.name}</p>
                        <p className="text-sm text-text-tertiary">
                          {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-text-tertiary mt-1">
                          {days} día{days !== 1 ? 's' : ''}
                        </p>
                        {isAdmin && request.employee && (
                          <p className="text-xs text-primary-400 mt-1">
                            Empleado: {request.employee.first_name} {request.employee.last_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                      
                      {/* Botones de acción solo para admin en solicitudes pendientes */}
                      {isAdmin && request.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateStatus(request.id, 'approved')}
                            className="px-3 py-1 bg-accent-600/20 text-accent-400 rounded-lg text-sm hover:bg-accent-600/30 transition"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(request.id, 'rejected')}
                            className="px-3 py-1 bg-red-600/20 text-red-400 rounded-lg text-sm hover:bg-red-600/30 transition"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredRequests.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-surface-600 mx-auto mb-4" />
                <p className="text-text-tertiary">No hay solicitudes de ausencia</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 text-primary-400 hover:text-primary-300 text-sm"
                >
                  Crear primera solicitud
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal Nueva Solicitud */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-800 rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-display font-bold text-white">Nueva Solicitud</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-text-tertiary hover:text-white transition"
              >
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
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {submitting ? 'Enviando...' : 'Enviar Solicitud'}
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