// src/components/Time/TimeEntries.jsx
import React, { useState, useEffect } from 'react';
import { Clock, Plus, CheckCircle, XCircle, X, Users, Search, Eye, Calendar, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const TimeEntries = () => {
  const { employee, isAdmin } = useAuth();
  const [entries, setEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewingEmployeeId, setViewingEmployeeId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    project_id: '',
    entry_date: new Date().toISOString().split('T')[0],
    hours: '',
    description: ''
  });

  // Cargar datos según el rol
  useEffect(() => {
    if (isAdmin) {
      fetchAllEmployees();
      fetchAllTimeEntries();
      fetchProjects();
    } else if (employee?.id) {
      setViewingEmployeeId(employee.id);
      fetchTimeEntries(employee.id);
      fetchProjects();
    }
  }, [isAdmin, employee]);

  useEffect(() => {
    if (isAdmin && viewingEmployeeId) {
      fetchTimeEntries(viewingEmployeeId);
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

  const fetchAllTimeEntries = async () => {
    try {
      const { data } = await supabase
        .from('time_entries')
        .select('*, project:projects(name), employee:employees(first_name, last_name)')
        .order('entry_date', { ascending: false });
      console.log('All time entries:', data);
    } catch (error) {
      console.error('Error fetching all entries:', error);
    }
  };

  const fetchTimeEntries = async (empId) => {
    if (!empId) return;
    setLoading(true);
    try {
      let query = supabase
        .from('time_entries')
        .select('*, project:projects(name)');
      
      if (!isAdmin) {
        query = query.eq('employee_id', empId);
      } else {
        query = query.eq('employee_id', empId);
      }
      
      const { data, error } = await query.order('entry_date', { ascending: false });
      
      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching time entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data } = await supabase.from('projects').select('*');
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const targetEmployeeId = isAdmin ? viewingEmployeeId : employee.id;
    
    try {
      const { error } = await supabase.from('time_entries').insert([{
        employee_id: targetEmployeeId,
        ...formData,
        hours: parseFloat(formData.hours),
        status: 'pending'
      }]);
      
      if (error) throw error;
      
      setShowForm(false);
      setFormData({ project_id: '', entry_date: new Date().toISOString().split('T')[0], hours: '', description: '' });
      fetchTimeEntries(targetEmployeeId);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al registrar las horas');
    }
  };

  const handleUpdateStatus = async (entryId, newStatus) => {
    try {
      const { error } = await supabase
        .from('time_entries')
        .update({ status: newStatus })
        .eq('id', entryId);
      
      if (error) throw error;
      
      const targetEmployeeId = isAdmin ? viewingEmployeeId : employee.id;
      fetchTimeEntries(targetEmployeeId);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el estado');
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

  const filteredEntries = statusFilter === 'all' 
    ? entries 
    : entries.filter(e => e.status === statusFilter);

  const filteredEmployees = employees.filter(emp =>
    `${emp.first_name} ${emp.last_name} ${emp.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const selectedEmployeeData = employees.find(e => e.id === viewingEmployeeId);

  const stats = {
    total: entries.length,
    totalHours: entries.reduce((sum, e) => sum + (e.hours || 0), 0),
    approved: entries.filter(e => e.status === 'approved').length,
    pending: entries.filter(e => e.status === 'pending').length,
    rejected: entries.filter(e => e.status === 'rejected').length
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Registro de Tiempo</h1>
          <p className="text-text-secondary mt-1">
            {isAdmin ? 'Gestión de horas por empleado' : 'Control de horas trabajadas'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Registrar Horas
        </button>
      </div>

      {/* Selector de Empleado - SOLO visible para ADMIN */}
      {isAdmin && (
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary-400" />
              <span className="text-text-secondary font-medium">Ver horas de:</span>
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <p className="text-text-tertiary text-sm">Total Registros</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <p className="text-text-tertiary text-sm">Horas Totales</p>
          <p className="text-2xl font-bold text-white">{stats.totalHours}</p>
        </div>
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <p className="text-text-tertiary text-sm">Aprobadas</p>
          <p className="text-2xl font-bold text-accent-400">{stats.approved}</p>
        </div>
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <p className="text-text-tertiary text-sm">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
        </div>
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <p className="text-text-tertiary text-sm">Rechazadas</p>
          <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
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

      {/* Lista de registros */}
      <div className="bg-surface-800 rounded-xl border border-white/10 overflow-hidden">
        <div className="divide-y divide-white/10">
          {filteredEntries.map((entry) => {
            const statusConfig = getStatusConfig(entry.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <div key={entry.id} className="p-4 hover:bg-surface-700/30 transition flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary-600/10 rounded-lg">
                    <Clock className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{new Date(entry.entry_date).toLocaleDateString()}</p>
                    <p className="text-sm text-text-tertiary">{entry.project?.name || 'Sin proyecto'}</p>
                    <p className="text-xs text-text-tertiary mt-1">{entry.description}</p>
                    {isAdmin && (
                      <p className="text-xs text-primary-400 mt-1">
                        Empleado: {entry.employee?.first_name} {entry.employee?.last_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-medium text-white">{entry.hours} hrs</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </span>
                  
                  {/* Botones de aprobación - SOLO visibles para ADMIN */}
                  {isAdmin && entry.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateStatus(entry.id, 'approved')}
                        className="px-3 py-1 bg-accent-600/20 text-accent-400 rounded-lg text-sm hover:bg-accent-600/30 transition"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(entry.id, 'rejected')}
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

        {filteredEntries.length === 0 && (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-surface-600 mx-auto mb-4" />
            <p className="text-text-tertiary">No hay registros de tiempo</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-primary-400 hover:text-primary-300 text-sm"
            >
              Registrar primeras horas
            </button>
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