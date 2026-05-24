// src/components/SelfService/SelfService.jsx
import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Calendar, FileText, Edit2, Save, X, CheckCircle, Clock, Award } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const SelfService = () => {
  const { employee: authEmployee } = useAuth();
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [summary, setSummary] = useState(null);
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
      fetchSummary();
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

  const fetchSummary = async () => {
    if (!authEmployee?.id) return;

    try {
      const [leaveBalance, pendingRequests, upcomingTasks] = await Promise.all([
        supabase
          .from('leave_balances')
          .select('*, policy:leave_policies(name, days_per_year)')
          .eq('employee_id', authEmployee.id)
          .eq('year', new Date().getFullYear()),
        supabase
          .from('leave_requests')
          .select('*')
          .eq('employee_id', authEmployee.id)
          .eq('status', 'pending'),
        supabase
          .from('onboarding_tasks')
          .select('*')
          .eq('employee_id', authEmployee.id)
          .eq('completed', false)
          .order('due_date', { ascending: true })
          .limit(5)
      ]);
      
      setSummary({
        leaveBalance: leaveBalance.data || [],
        pendingRequests: pendingRequests.data || [],
        upcomingTasks: upcomingTasks.data || []
      });
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!authEmployee?.id) return;

    try {
      await supabase
        .from('employees')
        .update({
          phone: editForm.phone,
          address: editForm.address,
          birth_date: editForm.birth_date
        })
        .eq('id', authEmployee.id);
      
      setEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const getDocumentTypeLabel = (type) => {
    const types = {
      contract: 'Contrato Laboral',
      id_copy: 'Cédula/Identificación',
      degree: 'Título Profesional',
      photo: 'Foto'
    };
    return types[type] || type;
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
          {/* Perfil Personal */}
          <div className="bg-surface-800 rounded-xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-600/10 rounded-lg">
                  <User className="w-5 h-5 text-primary-400" />
                </div>
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
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-text-tertiary text-sm">Nombre</label>
                  <p className="text-white font-medium">{profile?.first_name} {profile?.last_name}</p>
                </div>
                <div>
                  <label className="text-text-tertiary text-sm">Email</label>
                  <p className="text-white font-medium">{profile?.email}</p>
                </div>
                <div>
                  <label className="text-text-tertiary text-sm">Departamento</label>
                  <p className="text-white font-medium">{profile?.department?.name || 'Sin asignar'}</p>
                </div>
                <div>
                  <label className="text-text-tertiary text-sm">Cargo</label>
                  <p className="text-white font-medium">{profile?.position?.title || 'Sin asignar'}</p>
                </div>
                <div>
                  <label className="text-text-tertiary text-sm">Teléfono</label>
                  {editing ? (
                    <input
                      type="text"
                      className="input mt-1"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  ) : (
                    <p className="text-white font-medium">{profile?.phone || 'No registrado'}</p>
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
                    <p className="text-white font-medium">
                      {profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString() : 'No registrado'}
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="text-text-tertiary text-sm">Dirección</label>
                  {editing ? (
                    <textarea
                      className="input mt-1"
                      rows="2"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    />
                  ) : (
                    <p className="text-white font-medium">{profile?.address || 'No registrada'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Documentos */}
          <div className="bg-surface-800 rounded-xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-600/10 rounded-lg">
                  <FileText className="w-5 h-5 text-primary-400" />
                </div>
                <h2 className="text-lg font-display font-semibold text-white">Mis Documentos</h2>
              </div>
            </div>
            <div className="divide-y divide-white/10">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white">{getDocumentTypeLabel(doc.document_type)}</p>
                    <p className="text-xs text-text-tertiary">
                      Subido: {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
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
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha - Resumen */}
        <div className="space-y-6">
          {/* Saldo de Vacaciones */}
          <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
            <h3 className="font-display font-semibold text-white mb-4">Saldo de Vacaciones</h3>
            <div className="space-y-3">
              {summary?.leaveBalance?.map((balance) => (
                <div key={balance.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">{balance.policy?.name}</span>
                    <span className="text-text-primary font-medium">{balance.remaining_days} días</span>
                  </div>
                  <div className="w-full bg-surface-700 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full"
                      style={{ width: `${(balance.used_days / balance.total_days) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-tertiary mt-1">
                    {balance.used_days} de {balance.total_days} días usados
                  </p>
                </div>
              ))}
              {summary?.leaveBalance?.length === 0 && (
                <p className="text-text-tertiary text-center py-4">No hay información de saldo</p>
              )}
            </div>
          </div>

          {/* Solicitudes Pendientes */}
          <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
            <h3 className="font-display font-semibold text-white mb-4">Solicitudes Pendientes</h3>
            <div className="space-y-3">
              {summary?.pendingRequests?.map((request) => (
                <div key={request.id} className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <div>
                    <p className="text-white text-sm">Solicitud de ausencia</p>
                    <p className="text-xs text-text-tertiary">
                      {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {summary?.pendingRequests?.length === 0 && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-accent-400" />
                  <p className="text-text-tertiary text-sm">No hay solicitudes pendientes</p>
                </div>
              )}
            </div>
          </div>

          {/* Tareas Pendientes */}
          <div className="bg-surface-800 rounded-xl border border-white/10 p-6">
            <h3 className="font-display font-semibold text-white mb-4">Tareas Pendientes</h3>
            <div className="space-y-3">
              {summary?.upcomingTasks?.map((task) => (
                <div key={task.id} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                  <div>
                    <p className="text-white text-sm">{task.task_name}</p>
                    <p className="text-xs text-text-tertiary">
                      {task.due_date ? `Vence: ${new Date(task.due_date).toLocaleDateString()}` : 'Sin fecha límite'}
                    </p>
                  </div>
                </div>
              ))}
              {summary?.upcomingTasks?.length === 0 && (
                <div className="flex items-center gap-3">
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