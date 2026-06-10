// src/components/Onboarding/OnboardingTasks.jsx
import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, Circle, Plus, Upload, FileText, X, Users, Search, Eye, Calendar, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const OnboardingTasks = () => {
  const { employee, isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showDocForm, setShowDocForm] = useState(false);
  const [viewingEmployeeId, setViewingEmployeeId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    employee_id: '',
    task_name: '',
    assigned_to: '',
    due_date: ''
  });
  const [docData, setDocData] = useState({
    document_type: '',
    document_url: ''
  });

  // Cargar datos según el rol
  useEffect(() => {
    if (isAdmin) {
      fetchAllEmployees();
      fetchAllTasks();
      fetchAllDocuments();
    } else if (employee?.id) {
      setViewingEmployeeId(employee.id);
      fetchTasks(employee.id);
      fetchDocuments(employee.id);
    }
  }, [isAdmin, employee]);

  // Cuando cambia el empleado seleccionado (admin), cargar sus datos
  useEffect(() => {
    if (isAdmin && viewingEmployeeId) {
      fetchTasks(viewingEmployeeId);
      fetchDocuments(viewingEmployeeId);
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

  const fetchAllTasks = async () => {
    try {
      const { data } = await supabase
        .from('onboarding_tasks')
        .select('*, employee:employees(first_name, last_name)')
        .order('due_date', { ascending: true });
      setAllTasks(data || []);
    } catch (error) {
      console.error('Error fetching all tasks:', error);
    }
  };

  const fetchAllDocuments = async () => {
    try {
      const { data } = await supabase
        .from('employee_documents')
        .select('*, employee:employees(first_name, last_name)');
      console.log('All documents:', data);
    } catch (error) {
      console.error('Error fetching all documents:', error);
    }
  };

  const fetchTasks = async (empId) => {
    if (!empId) return;
    setLoading(true);
    try {
      let query = supabase
        .from('onboarding_tasks')
        .select('*');
      
      if (!isAdmin) {
        query = query.eq('employee_id', empId);
      } else {
        query = query.eq('employee_id', empId);
      }
      
      const { data, error } = await query.order('due_date', { ascending: true });
      
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (empId) => {
    if (!empId) return;
    try {
      let query = supabase
        .from('employee_documents')
        .select('*');
      
      if (!isAdmin) {
        query = query.eq('employee_id', empId);
      } else {
        query = query.eq('employee_id', empId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('onboarding_tasks').insert([formData]);
      if (error) throw error;
      
      setShowTaskForm(false);
      setFormData({ employee_id: '', task_name: '', assigned_to: '', due_date: '' });
      
      if (isAdmin && viewingEmployeeId) {
        fetchTasks(viewingEmployeeId);
        fetchAllTasks();
      } else if (employee?.id) {
        fetchTasks(employee.id);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear la tarea');
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      const { error } = await supabase
        .from('onboarding_tasks')
        .update({ completed: true, completed_date: new Date() })
        .eq('id', taskId);
      
      if (error) throw error;
      
      if (isAdmin && viewingEmployeeId) {
        fetchTasks(viewingEmployeeId);
        fetchAllTasks();
      } else if (employee?.id) {
        fetchTasks(employee.id);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al completar la tarea');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    
    try {
      const { error } = await supabase
        .from('onboarding_tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
      
      if (isAdmin && viewingEmployeeId) {
        fetchTasks(viewingEmployeeId);
        fetchAllTasks();
      } else if (employee?.id) {
        fetchTasks(employee.id);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar la tarea');
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    const targetEmployeeId = isAdmin ? viewingEmployeeId : employee.id;
    
    try {
      const { error } = await supabase.from('employee_documents').insert([{
        employee_id: targetEmployeeId,
        ...docData
      }]);
      
      if (error) throw error;
      
      setShowDocForm(false);
      setDocData({ document_type: '', document_url: '' });
      
      if (isAdmin && viewingEmployeeId) {
        fetchDocuments(viewingEmployeeId);
      } else if (employee?.id) {
        fetchDocuments(employee.id);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al subir el documento');
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

  const filteredEmployees = employees.filter(emp =>
    `${emp.first_name} ${emp.last_name} ${emp.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const selectedEmployeeData = employees.find(e => e.id === viewingEmployeeId);

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0
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
          <h1 className="text-2xl font-display font-bold text-white">Onboarding</h1>
          <p className="text-text-secondary mt-1">
            {isAdmin ? 'Gestión de integración de empleados' : 'Tareas de integración y documentos'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowTaskForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva Tarea
          </button>
        )}
      </div>

      {/* Selector de Empleado - SOLO visible para ADMIN */}
      {isAdmin && (
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary-400" />
              <span className="text-text-secondary font-medium">Ver onboarding de:</span>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <p className="text-text-tertiary text-sm">Total Tareas</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <p className="text-text-tertiary text-sm">Completadas</p>
          <p className="text-2xl font-bold text-accent-400">{stats.completed}</p>
        </div>
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <p className="text-text-tertiary text-sm">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
        </div>
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <p className="text-text-tertiary text-sm">Progreso</p>
          <p className="text-2xl font-bold text-primary-400">{stats.completionRate}%</p>
        </div>
      </div>

      {/* Tareas de Onboarding */}
      <div className="bg-surface-800 rounded-xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-display font-semibold text-white">Tareas de Integración</h2>
          </div>
        </div>
        <div className="divide-y divide-white/10">
          {tasks.map((task) => (
            <div key={task.id} className="p-4 flex items-center justify-between hover:bg-surface-700/30 transition">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => !task.completed && handleCompleteTask(task.id)}
                  className="flex-shrink-0"
                  disabled={task.completed}
                >
                  {task.completed ? (
                    <CheckCircle className="w-5 h-5 text-accent-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-text-tertiary hover:text-primary-400 transition" />
                  )}
                </button>
                <div>
                  <p className={`font-medium ${task.completed ? 'text-text-tertiary line-through' : 'text-white'}`}>
                    {task.task_name}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-text-tertiary mt-1">
                    <span>Asignado a: {task.assigned_to || 'No asignado'}</span>
                    {task.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Vence: {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                    {task.completed && task.completed_date && (
                      <span>Completado: {new Date(task.completed_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
              {/* Botón eliminar - SOLO visible para ADMIN */}
              {isAdmin && (
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1 text-text-tertiary hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                  title="Eliminar tarea"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="p-8 text-center">
              <ClipboardList className="w-12 h-12 text-surface-600 mx-auto mb-3" />
              <p className="text-text-tertiary">No hay tareas de onboarding</p>
              {isAdmin && (
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="mt-4 text-primary-400 hover:text-primary-300 text-sm"
                >
                  Crear primera tarea
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Documentos */}
      <div className="bg-surface-800 rounded-xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-display font-semibold text-white">Documentos</h2>
          </div>
          <button
            onClick={() => setShowDocForm(true)}
            className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1"
          >
            <Upload className="w-4 h-4" />
            Subir Documento
          </button>
        </div>
        <div className="divide-y divide-white/10">
          {documents.map((doc) => (
            <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-surface-700/30 transition">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary-400" />
                <div>
                  <p className="text-white">{getDocumentTypeLabel(doc.document_type)}</p>
                  <p className="text-xs text-text-tertiary mt-1">
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
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear Tarea - SOLO visible para ADMIN */}
      {showTaskForm && isAdmin && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-800 rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-display font-bold text-white">Nueva Tarea de Onboarding</h2>
              <button onClick={() => setShowTaskForm(false)} className="text-text-tertiary hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
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
              <div>
                <label className="label">Nombre de la Tarea</label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="Ej: Entregar equipo de cómputo"
                  value={formData.task_name}
                  onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Responsable</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej: IT, RH, Facilities"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
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
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowTaskForm(false)} className="flex-1 btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Crear Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Subir Documento */}
      {showDocForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-800 rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-display font-bold text-white">Subir Documento</h2>
              <button onClick={() => setShowDocForm(false)} className="text-text-tertiary hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUploadDocument} className="p-6 space-y-4">
              <div>
                <label className="label">Tipo de Documento</label>
                <select
                  required
                  className="input"
                  value={docData.document_type}
                  onChange={(e) => setDocData({ ...docData, document_type: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  <option value="contract">📄 Contrato Laboral</option>
                  <option value="id_copy">🆔 Documento de Identidad</option>
                  <option value="degree">🎓 Título Profesional</option>
                  <option value="photo">📸 Fotografía</option>
                  <option value="bank_account">🏦 Datos Bancarios</option>
                  <option value="medical">🏥 Examen Médico</option>
                </select>
              </div>
              <div>
                <label className="label">URL del Documento</label>
                <input
                  type="url"
                  required
                  className="input"
                  placeholder="https://ejemplo.com/documento.pdf"
                  value={docData.document_url}
                  onChange={(e) => setDocData({ ...docData, document_url: e.target.value })}
                />
              </div>
              <p className="text-xs text-text-tertiary">
                * Por ahora solo se puede enlazar documentos ya alojados en la nube
              </p>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowDocForm(false)} className="flex-1 btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Subir Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingTasks;