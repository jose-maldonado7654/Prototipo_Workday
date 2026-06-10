// src/components/Employees/EmployeeList.jsx
import React, { useState, useEffect } from 'react';
import { Users, Plus, Mail, Phone, MoreVertical, Edit2, Trash2, Eye, X, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const EmployeeList = () => {
  const { employee, isAdmin } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department_id: '',
    position_id: '',
    hire_date: '',
    status: 'active',
    role: 'employee'
  });

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchPositions();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data } = await supabase
        .from('employees')
        .select('*, department:departments(name), position:positions(title)')
        .order('created_at', { ascending: false });
      
      setEmployees(data || []);
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

  const fetchPositions = async () => {
    const { data } = await supabase.from('positions').select('*');
    setPositions(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formMode === 'create') {
        const { error } = await supabase.from('employees').insert([formData]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('employees')
          .update(formData)
          .eq('id', selectedEmployee.id);
        if (error) throw error;
      }
      setShowForm(false);
      setFormData({ first_name: '', last_name: '', email: '', phone: '', department_id: '', position_id: '', hire_date: '', status: 'active', role: 'employee' });
      fetchEmployees();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el empleado');
    }
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;
    
    try {
      // Primero eliminar referencias en otras tablas
      await supabase.from('leave_requests').delete().eq('employee_id', selectedEmployee.id);
      await supabase.from('leave_balances').delete().eq('employee_id', selectedEmployee.id);
      await supabase.from('time_entries').delete().eq('employee_id', selectedEmployee.id);
      await supabase.from('expense_reports').delete().eq('employee_id', selectedEmployee.id);
      await supabase.from('goals').delete().eq('employee_id', selectedEmployee.id);
      await supabase.from('onboarding_tasks').delete().eq('employee_id', selectedEmployee.id);
      await supabase.from('employee_documents').delete().eq('employee_id', selectedEmployee.id);
      await supabase.from('salary_history').delete().eq('employee_id', selectedEmployee.id);
      await supabase.from('bonus_payments').delete().eq('employee_id', selectedEmployee.id);
      
      // Finalmente eliminar el empleado
      const { error } = await supabase.from('employees').delete().eq('id', selectedEmployee.id);
      if (error) throw error;
      
      setShowDeleteModal(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar el empleado');
    }
  };

  const handleEdit = (emp) => {
    setSelectedEmployee(emp);
    setFormData({
      first_name: emp.first_name || '',
      last_name: emp.last_name || '',
      email: emp.email || '',
      phone: emp.phone || '',
      department_id: emp.department_id || '',
      position_id: emp.position_id || '',
      hire_date: emp.hire_date || '',
      status: emp.status || 'active',
      role: emp.role || 'employee'
    });
    setFormMode('edit');
    setShowForm(true);
  };

  const handleView = (emp) => {
    setSelectedEmployee(emp);
    setShowViewModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return { color: 'bg-accent-600/20 text-accent-400', label: 'Activo' };
      case 'inactive':
        return { color: 'bg-red-600/20 text-red-400', label: 'Inactivo' };
      case 'on_leave':
        return { color: 'bg-yellow-600/20 text-yellow-400', label: 'De licencia' };
      default:
        return { color: 'bg-surface-600 text-text-tertiary', label: status };
    }
  };

  const getRoleBadge = (role) => {
    return role === 'admin' 
      ? 'bg-primary-600/20 text-primary-400'
      : 'bg-surface-600 text-text-tertiary';
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Empleados</h1>
          <p className="text-text-secondary mt-1">Gestión del talento humano</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setFormMode('create');
              setFormData({ first_name: '', last_name: '', email: '', phone: '', department_id: '', position_id: '', hire_date: '', status: 'active', role: 'employee' });
              setShowForm(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Empleado
          </button>
        )}
      </div>

      <div className="bg-surface-800 rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-surface-700/50">
              <tr>
                <th className="table-header">Empleado</th>
                <th className="table-header">Cargo</th>
                <th className="table-header">Departamento</th>
                <th className="table-header">Contacto</th>
                <th className="table-header">Estado</th>
                <th className="table-header">Rol</th>
                {isAdmin && <th className="table-header">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {employees.map((emp) => {
                const statusBadge = getStatusBadge(emp.status);
                return (
                  <tr key={emp.id} className="hover:bg-surface-700/30 transition">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {emp.first_name?.[0]}{emp.last_name?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-white">{emp.first_name} {emp.last_name}</p>
                          <p className="text-xs text-text-tertiary">ID: {emp.id?.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">{emp.position?.title || 'Sin asignar'}</td>
                    <td className="table-cell">{emp.department?.name || 'Sin departamento'}</td>
                    <td className="table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-text-tertiary">
                          <Mail className="w-3 h-3" />
                          <span>{emp.email}</span>
                        </div>
                        {emp.phone && (
                          <div className="flex items-center gap-1 text-sm text-text-tertiary">
                            <Phone className="w-3 h-3" />
                            <span>{emp.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(emp.role)}`}>
                        {emp.role === 'admin' ? 'Administrador' : 'Empleado'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleView(emp)}
                            className="p-1 text-text-tertiary hover:text-primary-400 transition"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(emp)}
                            className="p-1 text-text-tertiary hover:text-yellow-400 transition"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setShowDeleteModal(true);
                            }}
                            className="p-1 text-text-tertiary hover:text-red-400 transition"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {employees.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-surface-600 mx-auto mb-4" />
            <p className="text-text-tertiary">No hay empleados registrados</p>
            {isAdmin && (
              <button
                onClick={() => {
                  setFormMode('create');
                  setShowForm(true);
                }}
                className="mt-4 text-primary-400 hover:text-primary-300"
              >
                Agregar primer empleado
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal Ver Detalles */}
      {showViewModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-white/10 sticky top-0 bg-surface-800">
              <h2 className="text-xl font-display font-bold text-white">Detalles del Empleado</h2>
              <button onClick={() => setShowViewModal(false)} className="text-text-tertiary hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-3xl">
                    {selectedEmployee.first_name?.[0]}{selectedEmployee.last_name?.[0]}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold text-white">
                    {selectedEmployee.first_name} {selectedEmployee.last_name}
                  </h3>
                  <p className="text-text-tertiary">{selectedEmployee.email}</p>
                  <div className="flex gap-2 mt-2">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedEmployee.status).color}`}>
                      {getStatusBadge(selectedEmployee.status).label}
                    </span>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(selectedEmployee.role)}`}>
                      {selectedEmployee.role === 'admin' ? 'Administrador' : 'Empleado'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-text-tertiary text-sm">Teléfono</p>
                  <p className="text-text-primary">{selectedEmployee.phone || 'No registrado'}</p>
                </div>
                <div>
                  <p className="text-text-tertiary text-sm">Fecha de Contratación</p>
                  <p className="text-text-primary">
                    {selectedEmployee.hire_date ? new Date(selectedEmployee.hire_date).toLocaleDateString() : 'No registrada'}
                  </p>
                </div>
                <div>
                  <p className="text-text-tertiary text-sm">Departamento</p>
                  <p className="text-text-primary">{selectedEmployee.department?.name || 'Sin asignar'}</p>
                </div>
                <div>
                  <p className="text-text-tertiary text-sm">Cargo</p>
                  <p className="text-text-primary">{selectedEmployee.position?.title || 'Sin asignar'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-text-tertiary text-sm">Dirección</p>
                  <p className="text-text-primary">{selectedEmployee.address || 'No registrada'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear/Editar Empleado */}
      {showForm && isAdmin && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-white/10 sticky top-0 bg-surface-800">
              <h2 className="text-xl font-display font-bold text-white">
                {formMode === 'create' ? 'Nuevo Empleado' : 'Editar Empleado'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-text-tertiary hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Nombre</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Apellido</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  required
                  className="input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input
                  type="text"
                  className="input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Departamento</label>
                <select
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
                <label className="label">Cargo</label>
                <select
                  className="input"
                  value={formData.position_id}
                  onChange={(e) => setFormData({ ...formData, position_id: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  {positions.map((pos) => (
                    <option key={pos.id} value={pos.id}>{pos.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Fecha de Contratación</label>
                <input
                  type="date"
                  className="input"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Estado</label>
                <select
                  className="input"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="on_leave">De licencia</option>
                </select>
              </div>
              <div>
                <label className="label">Rol</label>
                <select
                  className="input"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="employee">Empleado</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {formMode === 'create' ? 'Crear' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {showDeleteModal && selectedEmployee && isAdmin && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-800 rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-display font-bold text-white">Confirmar Eliminación</h2>
              <button onClick={() => setShowDeleteModal(false)} className="text-text-tertiary hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <p className="text-text-primary">
                  ¿Estás seguro de eliminar a <span className="font-bold">{selectedEmployee.first_name} {selectedEmployee.last_name}</span>?
                </p>
              </div>
              <p className="text-text-tertiary text-sm mb-6">
                Esta acción eliminará también todas las solicitudes, metas, gastos y registros asociados a este empleado. No se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 btn-secondary">
                  Cancelar
                </button>
                <button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition">
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;