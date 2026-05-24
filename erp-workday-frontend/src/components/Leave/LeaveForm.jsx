import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const LeaveForm = ({ onClose, onSuccess, policies }) => {
  const { employee } = useAuth();
  const [formData, setFormData] = useState({
    policy_id: '',
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from('leave_requests').insert([{
        employee_id: employee.id,
        ...formData,
        status: 'pending'
      }]);

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Nueva Solicitud de Ausencia</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Ausencia
              </label>
              <select
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.policy_id}
                onChange={(e) => setFormData({ ...formData, policy_id: e.target.value })}
              >
                <option value="">Selecciona...</option>
                {policies.map((policy) => (
                  <option key={policy.id} value={policy.id}>
                    {policy.name} ({policy.days_per_year} días/año)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Inicio
              </label>
              <input
                type="date"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Fin
              </label>
              <input
                type="date"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo
              </label>
              <textarea
                rows="3"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {submitting ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveForm;