// src/components/Employees/EmployeeList.jsx
import React, { useState, useEffect } from 'react';
import { Users, Plus, Mail, Phone, MoreVertical, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department_id: '',
    position_id: '',
    hire_date: '',
    status: 'active'
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
      const { error } = await supabase.from('employees').insert([formData]);
      if (error) throw error;
      setShowForm(false);
      setFormData({ first_name: '', last_name: '', email: '', phone: '', department_id: '', position_id: '', hire_date: '', status: 'active' });
      fetchEmployees();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear empleado');
    }
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
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Empleado
        </button>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-surface-700/30 transition">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {employee.first_name?.[0]}{employee.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{employee.first_name} {employee.last_name}</p>
                        <p className="text-xs text-text-tertiary">ID: {employee.id?.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">{employee.position?.title || 'Sin asignar'}</td>
                  <td className="table-cell">{employee.department?.name || 'Sin departamento'}</td>
                  <td className="table-cell">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-text-tertiary">
                        <Mail className="w-3 h-3" />
                        <span>{employee.email}</span>
                      </div>
                      {employee.phone && (
                        <div className="flex items-center gap-1 text-sm text-text-tertiary">
                          <Phone className="w-3 h-3" />
                          <span>{employee.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      employee.status === 'active' ? 'bg-accent-600/20 text-accent-400' : 'bg-surface-600 text-text-tertiary'
                    }`}>
                      {employee.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Empleado */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-800 rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h2 className="text-xl font-display font-bold text-white">Nuevo Empleado</h2>
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
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 btn-secondary">
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
    </div>
  );
};

export default EmployeeList;