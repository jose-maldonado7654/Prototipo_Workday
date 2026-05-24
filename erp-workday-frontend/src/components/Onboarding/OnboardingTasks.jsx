// src/components/Onboarding/OnboardingTasks.jsx
import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, Circle, Plus, Upload, FileText, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const OnboardingTasks = () => {
  const { employee, isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showDocForm, setShowDocForm] = useState(false);
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

  useEffect(() => {
    if (employee?.id) {
      fetchTasks();
      fetchDocuments();
      if (isAdmin) fetchEmployees();
    } else {
      setLoading(false);
    }
  }, [employee, isAdmin]);

  const fetchTasks = async () => {
    if (!employee?.id) return;

    try {
      let query = supabase.from('onboarding_tasks').select('*');
      
      if (!isAdmin) {
        query = query.eq('employee_id', employee.id);
      } else {
        query = query.select('*, employee:employees(first_name, last_name)');
      }
      
      const { data } = await query.order('due_date', { ascending: true });
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    if (!employee?.id) return;

    try {
      let query = supabase.from('employee_documents').select('*');
      
      if (!isAdmin) {
        query = query.eq('employee_id', employee.id);
      } else {
        query = query.select('*, employee:employees(first_name, last_name)');
      }
      
      const { data } = await query;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchEmployees = async () => {
    const { data } = await supabase.from('employees').select('id, first_name, last_name');
    setEmployees(data || []);
  };

  const handleCompleteTask = async (taskId) => {
    await supabase
      .from('onboarding_tasks')
      .update({ completed: true, completed_date: new Date() })
      .eq('id', taskId);
    fetchTasks();
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    await supabase.from('onboarding_tasks').insert([formData]);
    setShowTaskForm(false);
    setFormData({ employee_id: '', task_name: '', assigned_to: '', due_date: '' });
    fetchTasks();
  };

  const getDocumentTypeLabel = (type) => {
    const types = {
      contract: 'Contrato',
      id_copy: 'Copia de DNI',
      degree: 'Título',
      photo: 'Foto'
    };
    return types[type] || type;
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
          <h1 className="text-2xl font-display font-bold text-white">Onboarding</h1>
          <p className="text-text-secondary mt-1">Tareas de integración y documentos</p>
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

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <p className="text-text-tertiary text-sm">Tareas Completadas</p>
          <p className="text-2xl font-bold text-white">{tasks.filter(t => t.completed).length}</p>
        </div>
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <p className="text-text-tertiary text-sm">Tareas Pendientes</p>
          <p className="text-2xl font-bold text-white">{tasks.filter(t => !t.completed).length}</p>
        </div>
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <p className="text-text-tertiary text-sm">Documentos Subidos</p>
          <p className="text-2xl font-bold text-white">{documents.length}</p>
        </div>
      </div>

      {/* Tareas de Onboarding */}
      <div className="bg-surface-800 rounded-xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-display font-semibold text-white">Tareas de Integración</h2>
        </div>
        <div className="divide-y divide-white/10">
          {tasks.map((task) => (
            <div key={task.id} className="p-4 flex items-center justify-between hover:bg-surface-700/30 transition">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => !task.completed && handleCompleteTask(task.id)}
                  className="flex-shrink-0"
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
                      <span>Vence: {new Date(task.due_date).toLocaleDateString()}</span>
                    )}
                    {isAdmin && task.employee && (
                      <span>Empleado: {task.employee.first_name} {task.employee.last_name}</span>
                    )}
                  </div>
                </div>
              </div>
              {task.completed && task.completed_date && (
                <span className="text-xs text-text-tertiary">
                  Completado: {new Date(task.completed_date).toLocaleDateString()}
                </span>
              )}
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="p-8 text-center">
              <ClipboardList className="w-12 h-12 text-surface-600 mx-auto mb-3" />
              <p className="text-text-tertiary">No hay tareas de onboarding</p>
            </div>
          )}
        </div>
      </div>

      {/* Documentos */}
      <div className="bg-surface-800 rounded-xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-lg font-display font-semibold text-white">Documentos</h2>
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
            <div key={doc.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary-400" />
                <div>
                  <p className="text-white">{getDocumentTypeLabel(doc.document_type)}</p>
                  <p className="text-xs text-text-tertiary mt-1">
                    Subido: {new Date(doc.uploaded_at).toLocaleDateString()}
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

      {/* Modal Crear Tarea */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-800 rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-display font-bold text-white">Nueva Tarea</h2>
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
                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Tarea</label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="Ej: Entregar equipo de computo"
                  value={formData.task_name}
                  onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Asignado a</label>
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
                  Crear
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
            <form onSubmit={async (e) => {
              e.preventDefault();
              await supabase.from('employee_documents').insert([{
                employee_id: employee.id,
                ...docData
              }]);
              setShowDocForm(false);
              setDocData({ document_type: '', document_url: '' });
              fetchDocuments();
            }} className="p-6 space-y-4">
              <div>
                <label className="label">Tipo de Documento</label>
                <select
                  required
                  className="input"
                  value={docData.document_type}
                  onChange={(e) => setDocData({ ...docData, document_type: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  <option value="contract">Contrato</option>
                  <option value="id_copy">Copia de DNI</option>
                  <option value="degree">Título</option>
                  <option value="photo">Foto</option>
                </select>
              </div>
              <div>
                <label className="label">URL del Documento</label>
                <input
                  type="url"
                  required
                  className="input"
                  placeholder="https://..."
                  value={docData.document_url}
                  onChange={(e) => setDocData({ ...docData, document_url: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowDocForm(false)} className="flex-1 btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Subir
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