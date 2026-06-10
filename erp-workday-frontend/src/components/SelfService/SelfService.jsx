// src/components/SelfService/SelfService.jsx
import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Calendar, FileText, Edit2, Save, X, CheckCircle, Clock, Award, Mail, Briefcase, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const SelfService = () => {
  const { employee: authEmployee } = useAuth();
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    phone: '',
    address: '',
    birth_date: ''
  });

  useEffect(() => {
    if (authEmployee?.id) {
      fetchProfile();
      fetchDocuments();
      fetchLeaveBalance();
      fetchRecentRequests();
      fetchUpcomingTasks();
    } else {
      setLoading(false);
    }
  }, [authEmployee]);

  const fetchProfile = async () => {
    if (!authEmployee?.id) return;

    try {
      const { data } = await supabase
        .from('employees')
        .select('*, department:departments(name), position:positions(title)')
        .eq('id', authEmployee.id)
        .single();
      
      setProfile(data);
      setEditForm({
        phone: data?.phone || '',
        address: data?.address || '',
        birth_date: data?.birth_date || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchDocuments = async () => {
    if (!authEmployee?.id) return;

    try {
      const { data } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', authEmployee.id);
      
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchLeaveBalance = async () => {
    if (!authEmployee?.id) return;

    try {
      const { data } = await supabase
        .from('leave_balances')
        .select('*, policy:leave_policies(name, days_per_year)')
        .eq('employee_id', authEmployee.id)
        .eq('year', new Date().getFullYear());
      
      setLeaveBalance(data || []);
    } catch (error) {
      console.error('Error fetching leave balance:', error);
    }
  };

  const fetchRecentRequests = async () => {
    if (!authEmployee?.id) return;

    try {
      const { data } = await supabase
        .from('leave_requests')
        .select('*, policy:leave_policies(name)')
        .eq('employee_id', authEmployee.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      setRecentRequests(data || []);
    } catch (error) {
      console.error('Error fetching recent requests:', error);
    }
  };

  const fetchUpcomingTasks = async () => {
    if (!authEmployee?.id) return;

    try {
      const { data } = await supabase
        .from('onboarding_tasks')
        .select('*')
        .eq('employee_id', authEmployee.id)
        .eq('completed', false)
        .order('due_date', { ascending: true })
        .limit(5);
      
      setUpcomingTasks(data || []);
    } catch (error) {
      console.error('Error fetching upcoming tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!authEmployee?.id) return;

    try {
      const { error } = await supabase
        .from('employees')
        .update({
          phone: editForm.phone,
          address: editForm.address,
          birth_date: editForm.birth_date || null
        })
        .eq('id', authEmployee.id);
      
      if (error) throw error;
      
      setEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error al actualizar el perfil');
    }
  };

  const getDocumentTypeLabel = (type) => {
    const types = {
      contract: '📄 Contrato Laboral',
      id_copy: '🆔 Documento de Identidad',
      degree: '🎓 Título Profesional',
      photo: '📸 Fotografía',
      bank_account: '🏦 Datos Bancarios',
      medical: '🏥 Examen Médico'
    };
    return types[type] || type;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return { color: 'text-accent-400 bg-accent-600/20', icon: CheckCircle, label: 'Aprobada' };
      case 'rejected':
        return { color: 'text-red-400 bg-red-600/20', icon: XCircle, label: 'Rechazada' };
      default:
        return { color: 'text-yellow-400 bg-yellow-600/20', icon: Clock, label: 'Pendiente' };
    }
  };

  // Estado de carga inicial
  if (!authEmployee?.id) {
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
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Mi Autoservicio</h1>
        <p className="text-text-secondary mt-1">Gestiona tu información personal y documentos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda - Perfil */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tarjeta de bienvenida */}
          <div className="bg-gradient-to-r from-primary-600/20 to-primary-800/20 rounded-xl border border-primary-500/30 p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">
                  {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-white">
                  {profile?.first_name} {profile?.last_name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-text-tertiary" />
                  <span className="text-text-secondary">{profile?.email}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Briefcase className="w-4 h-4 text-text-tertiary" />
                  <span className="text-text-secondary">{profile?.position?.title || 'Sin cargo asignado'}</span>
                  <Building2 className="w-4 h-4 text-text-tertiary ml-2" />
                  <span className="text-text-secondary">{profile?.department?.name || 'Sin departamento'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Información Personal - Editable */}
          <div className="bg-surface-800 rounded-xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-primary-400" />
                <h2 className="text-lg font-display font-semibold text-white">Información Personal</h2>
              </div>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="text-text-tertiary hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleUpdateProfile}
                    className="text-accent-400 hover:text-accent-300 p-1"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-text-tertiary text-sm">Nombre completo</label>
                  <p className="text-text-primary font-medium">{profile?.first_name} {profile?.last_name}</p>
                </div>
                <div>
                  <label className="text-text-tertiary text-sm">Correo electrónico</label>
                  <p className="text-text-primary font-medium">{profile?.email}</p>
                </div>
                <div>
                  <label className="text-text-tertiary text-sm">Teléfono</label>
                  {editing ? (
                    <input
                      type="tel"
                      className="input mt-1"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="+1234567890"
                    />
                  ) : (
                    <p className="text-text-primary font-medium">{profile?.phone || 'No registrado'}</p>
                  )}
                </div>
                <div>
                  <label className="text-text-tertiary text-sm">Fecha de Nacimiento</label>
                  {editing ? (
                    <input
                      type="date"
                      className="input mt-1"
                      value={editForm.birth_date || ''}
                      onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                    />
                  ) : (
                    <p className="text-text-primary font-medium">
                      {profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString() : 'No registrado'}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="text-text-tertiary text-sm">Dirección</label>
                  {editing ? (
                    <textarea
                      className="input mt-1"
                      rows="2"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="Calle, número, ciudad, código postal"
                    />
                  ) : (
                    <p className="text-text-primary font-medium">{profile?.address || 'No registrada'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Documentos */}
          <div className="bg-surface-800 rounded-xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary-400" />
                <h2 className="text-lg font-display font-semibold text-white">Mis Documentos</h2>
              </div>
            </div>
            <div className="divide-y divide-white/10">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-surface-700/30 transition">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary-400" />
                    <div>
                      <p className="text-white">{getDocumentTypeLabel(doc.document_type)}</p>
                      <p className="text-xs text-text-tertiary">
                        Subido: {new Date(doc.uploaded_at).toLocaleDateString()}
                        {doc.verified && ' • Verificado ✅'}
                      </p>
                    </div>
                  </div>
                  <a
                    href={doc.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-400 hover:text-primary-300 text-sm"
                  >
                    Ver
                  </a>
                </div>
              ))}
              {documents.length === 0 && (
                <div className="p-8 text-center">
                  <FileText className="w-12 h-12 text-surface-600 mx-auto mb-3" />
                  <p className="text-text-tertiary">No hay documentos subidos</p>
                  <p className="text-xs text-text-tertiary mt-1">Contacta a RH para subir tu documentación</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha - Resumen */}
        <div className="space-y-6">
          {/* Saldo de Vacaciones */}
          <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
            <h3 className="font-display font-semibold text-white mb-4">📅 Días Disponibles</h3>
            <div className="space-y-4">
              {leaveBalance.map((balance) => {
                const percentage = (balance.used_days / balance.total_days) * 100;
                return (
                  <div key={balance.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-secondary">{balance.policy?.name}</span>
                      <span className="text-text-primary font-medium">{balance.remaining_days} / {balance.total_days} días</span>
                    </div>
                    <div className="w-full bg-surface-700 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-text-tertiary mt-1">
                      Usados: {balance.used_days} días
                    </p>
                  </div>
                );
              })}
              {leaveBalance.length === 0 && (
                <p className="text-text-tertiary text-center py-4">No hay información de saldo</p>
              )}
            </div>
          </div>

          {/* Solicitudes Recientes */}
          <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
            <h3 className="font-display font-semibold text-white mb-4">📋 Solicitudes Recientes</h3>
            <div className="space-y-3">
              {recentRequests.map((request) => {
                const statusConfig = getStatusBadge(request.status);
                const StatusIcon = statusConfig.icon;
                return (
                  <div key={request.id} className="flex items-center gap-3 p-2 bg-surface-700/30 rounded-lg">
                    <Calendar className="w-4 h-4 text-primary-400" />
                    <div className="flex-1">
                      <p className="text-white text-sm">{request.policy?.name}</p>
                      <p className="text-xs text-text-tertiary">
                        {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                  </div>
                );
              })}
              {recentRequests.length === 0 && (
                <p className="text-text-tertiary text-center py-4">No hay solicitudes recientes</p>
              )}
            </div>
          </div>

          {/* Tareas Pendientes */}
          <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
            <h3 className="font-display font-semibold text-white mb-4">✅ Tareas Pendientes</h3>
            <div className="space-y-3">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-2 bg-surface-700/30 rounded-lg">
                  <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-white text-sm">{task.task_name}</p>
                    <p className="text-xs text-text-tertiary">
                      {task.due_date ? `Vence: ${new Date(task.due_date).toLocaleDateString()}` : 'Sin fecha límite'}
                    </p>
                  </div>
                </div>
              ))}
              {upcomingTasks.length === 0 && (
                <div className="flex items-center gap-3 p-2">
                  <CheckCircle className="w-4 h-4 text-accent-400" />
                  <p className="text-text-tertiary text-sm">No hay tareas pendientes</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelfService;