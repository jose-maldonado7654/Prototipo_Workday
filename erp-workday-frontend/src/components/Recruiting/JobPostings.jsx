// src/components/Recruiting/JobPostings.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Briefcase, MapPin, Clock, Users, Edit2, Trash2, Eye, X, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const JobPostings = () => {
  const { employee } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showCandidates, setShowCandidates] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    department_id: '',
    description: '',
    requirements: '',
    status: 'open'
  });
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchJobs();
    fetchDepartments();
    fetchCandidates();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data } = await supabase
        .from('job_postings')
        .select('*, department:departments(name)')
        .order('created_at', { ascending: false });
      
      setJobs(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    const { data } = await supabase.from('departments').select('*');
    setDepartments(data || []);
  };

  const fetchCandidates = async () => {
    const { data } = await supabase
      .from('candidates')
      .select('*, applications:applications(job_posting_id)')
      .order('created_at', { ascending: false });
    setCandidates(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedJob) {
        await supabase
          .from('job_postings')
          .update(formData)
          .eq('id', selectedJob.id);
      } else {
        await supabase
          .from('job_postings')
          .insert([formData]);
      }
      setShowForm(false);
      setSelectedJob(null);
      setFormData({ title: '', department_id: '', description: '', requirements: '', status: 'open' });
      fetchJobs();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar esta oferta?')) {
      await supabase.from('job_postings').delete().eq('id', id);
      fetchJobs();
    }
  };

  const getCandidatesForJob = (jobId) => {
    return candidates.filter(c => 
      c.applications?.some(app => app.job_posting_id === jobId)
    );
  };

  const getStatusBadge = (status) => {
    if (status === 'open') {
      return { color: 'bg-accent-600/20 text-accent-400', label: 'Activa' };
    } else if (status === 'closed') {
      return { color: 'bg-red-600/20 text-red-400', label: 'Cerrada' };
    }
    return { color: 'bg-yellow-600/20 text-yellow-400', label: 'En pausa' };
  };

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
          <h1 className="text-2xl font-display font-bold text-white">Reclutamiento</h1>
          <p className="text-text-secondary mt-1">Gestiona ofertas de trabajo y candidatos</p>
        </div>
        {employee?.role === 'admin' && (
          <button
            onClick={() => {
              setSelectedJob(null);
              setFormData({ title: '', department_id: '', description: '', requirements: '', status: 'open' });
              setShowForm(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva Oferta
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-tertiary text-sm">Ofertas Activas</p>
              <p className="text-2xl font-bold text-white">{jobs.filter(j => j.status === 'open').length}</p>
            </div>
            <div className="p-3 bg-primary-600/10 rounded-xl">
              <Briefcase className="w-5 h-5 text-primary-400" />
            </div>
          </div>
        </div>
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-tertiary text-sm">Candidatos</p>
              <p className="text-2xl font-bold text-white">{candidates.length}</p>
            </div>
            <div className="p-3 bg-primary-600/10 rounded-xl">
              <Users className="w-5 h-5 text-primary-400" />
            </div>
          </div>
        </div>
        <div className="bg-surface-800 rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-tertiary text-sm">Postulaciones</p>
              <p className="text-2xl font-bold text-white">
                {candidates.reduce((sum, c) => sum + (c.applications?.length || 0), 0)}
              </p>
            </div>
            <div className="p-3 bg-primary-600/10 rounded-xl">
              <Clock className="w-5 h-5 text-primary-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Job Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {jobs.map((job) => {
          const statusConfig = getStatusBadge(job.status);
          const jobCandidates = getCandidatesForJob(job.id);
          
          return (
            <div key={job.id} className="bg-surface-800 rounded-xl border border-white/10 p-6 hover:border-primary-500/30 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-600/10 rounded-lg">
                    <Briefcase className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-white">{job.title}</h3>
                    <p className="text-sm text-text-tertiary">{job.department?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                  {employee?.role === 'admin' && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => {
                          setSelectedJob(job);
                          setFormData({
                            title: job.title,
                            department_id: job.department_id,
                            description: job.description || '',
                            requirements: job.requirements || '',
                            status: job.status
                          });
                          setShowForm(true);
                        }}
                        className="p-1 hover:bg-surface-700 rounded"
                      >
                        <Edit2 className="w-3 h-3 text-text-tertiary" />
                      </button>
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="p-1 hover:bg-surface-700 rounded"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-text-secondary text-sm mb-4 line-clamp-2">{job.description}</p>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-4 text-sm text-text-tertiary">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>Remoto/Híbrido</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{jobCandidates.length} postulantes</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedJob(job);
                    setShowCandidates(true);
                  }}
                  className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  Ver candidatos
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {jobs.length === 0 && (
        <div className="text-center py-12 bg-surface-800 rounded-xl border border-white/10">
          <Briefcase className="w-16 h-16 text-surface-600 mx-auto mb-4" />
          <p className="text-text-secondary">No hay ofertas de trabajo</p>
          {employee?.role === 'admin' && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-primary-400 hover:text-primary-300"
            >
              Crear primera oferta
            </button>
          )}
        </div>
      )}

      {/* Modal de Candidatos */}
      {showCandidates && selectedJob && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-display font-bold text-white">
                Candidatos - {selectedJob.title}
              </h2>
              <button onClick={() => setShowCandidates(false)} className="text-text-tertiary hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4">
              {getCandidatesForJob(selectedJob.id).map((candidate) => (
                <div key={candidate.id} className="bg-surface-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-white">{candidate.first_name} {candidate.last_name}</p>
                      <p className="text-sm text-text-tertiary">{candidate.email}</p>
                      {candidate.phone && (
                        <p className="text-sm text-text-tertiary">{candidate.phone}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      candidate.status === 'hired' ? 'bg-accent-600/20 text-accent-400' :
                      candidate.status === 'rejected' ? 'bg-red-600/20 text-red-400' :
                      'bg-yellow-600/20 text-yellow-400'
                    }`}>
                      {candidate.status === 'applied' ? 'Postulado' :
                       candidate.status === 'screening' ? 'En revisión' :
                       candidate.status === 'interview' ? 'Entrevista' :
                       candidate.status === 'offered' ? 'Ofertado' :
                       candidate.status === 'hired' ? 'Contratado' : 'Rechazado'}
                    </span>
                  </div>
                  {candidate.resume_url && (
                    <a
                      href={candidate.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-400 text-sm mt-2 inline-block hover:underline"
                    >
                      Ver CV
                    </a>
                  )}
                </div>
              ))}
              {getCandidatesForJob(selectedJob.id).length === 0 && (
                <p className="text-center text-text-tertiary py-8">No hay candidatos para esta oferta</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-800 rounded-2xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-display font-bold text-white">
                {selectedJob ? 'Editar Oferta' : 'Nueva Oferta'}
              </h2>
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
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Departamento</label>
                <select
                  required
                  className="input"
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Descripción</label>
                <textarea
                  rows="3"
                  className="input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Requisitos</label>
                <textarea
                  rows="3"
                  className="input"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Estado</label>
                <select
                  className="input"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="open">Activa</option>
                  <option value="closed">Cerrada</option>
                  <option value="on_hold">En pausa</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {selectedJob ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPostings;