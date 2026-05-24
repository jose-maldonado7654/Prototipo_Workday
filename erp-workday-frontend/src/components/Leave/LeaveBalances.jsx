// src/components/Leave/LeaveBalances.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const LeaveBalances = () => {
  const { employee } = useAuth();
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);

  useEffect(() => {
    fetchBalances();
    fetchAvailableYears();
  }, [year, employee?.id]);

  const fetchBalances = async () => {
    if (!employee?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('leave_balances')
        .select(`
          *,
          policy:leave_policies(id, name, days_per_year, carry_over)
        `)
        .eq('employee_id', employee.id)
        .eq('year', year);
      
      if (error) throw error;
      setBalances(data || []);
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableYears = async () => {
    if (!employee?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('leave_balances')
        .select('year')
        .eq('employee_id', employee.id)
        .order('year', { ascending: false });
      
      if (error) throw error;
      
      const years = [...new Set(data.map(item => item.year))];
      setAvailableYears(years);
    } catch (error) {
      console.error('Error fetching years:', error);
    }
  };

  const getUsageColor = (used, total) => {
    const percentage = (used / total) * 100;
    if (percentage >= 90) return 'text-red-400';
    if (percentage >= 70) return 'text-yellow-400';
    return 'text-accent-400';
  };

  const getProgressColor = (used, total) => {
    const percentage = (used / total) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-accent-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-white">Mis Saldos</h2>
          <p className="text-text-tertiary text-sm mt-1">
            Días disponibles por tipo de ausencia
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Selector de año */}
          {availableYears.length > 0 && (
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="bg-surface-700 border border-white/10 rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
              <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
            </select>
          )}
          
          <button
            onClick={fetchBalances}
            className="p-2 text-text-tertiary hover:text-text-primary transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tarjetas de saldos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {balances.map((balance) => {
          const percentage = (balance.used_days / balance.total_days) * 100;
          const isLow = balance.remaining_days <= 3;
          const isDepleted = balance.remaining_days === 0;
          
          return (
            <div
              key={balance.id}
              className="bg-surface-800 rounded-xl border border-white/10 p-6 hover:border-primary-500/30 transition-all group"
            >
              {/* Header de la tarjeta */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-600/10 rounded-lg">
                    <Calendar className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-white">
                      {balance.policy?.name || 'Sin nombre'}
                    </h3>
                    <p className="text-xs text-text-tertiary">
                      {balance.policy?.days_per_year} días por año
                      {balance.policy?.carry_over && ' • Acumulable'}
                    </p>
                  </div>
                </div>
                
                {/* Indicador de estado */}
                {isDepleted ? (
                  <div className="px-2 py-1 bg-red-600/20 rounded-full">
                    <span className="text-xs text-red-400">Agotado</span>
                  </div>
                ) : isLow ? (
                  <div className="px-2 py-1 bg-yellow-600/20 rounded-full">
                    <span className="text-xs text-yellow-400">Pocos días</span>
                  </div>
                ) : (
                  <div className="px-2 py-1 bg-accent-600/20 rounded-full">
                    <span className="text-xs text-accent-400">Disponible</span>
                  </div>
                )}
              </div>
              
              {/* Días restantes - número grande */}
              <div className="text-center py-4">
                <div className="relative inline-block">
                  <span className={`text-5xl font-display font-bold ${getUsageColor(balance.used_days, balance.total_days)}`}>
                    {balance.remaining_days}
                  </span>
                  <span className="text-text-tertiary text-lg ml-1">/ {balance.total_days}</span>
                </div>
                <p className="text-text-tertiary text-sm mt-1">días disponibles</p>
              </div>
              
              {/* Barra de progreso */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-text-tertiary mb-1">
                  <span>Usado: {balance.used_days} días</span>
                  <span>{Math.round(percentage)}%</span>
                </div>
                <div className="w-full bg-surface-700 rounded-full h-2">
                  <div
                    className={`${getProgressColor(balance.used_days, balance.total_days)} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
              
              {/* Nota adicional si aplica */}
              {isLow && !isDepleted && (
                <div className="mt-4 flex items-center gap-2 text-xs text-yellow-400 bg-yellow-600/10 p-2 rounded-lg">
                  <AlertCircle className="w-3 h-3" />
                  <span>Te quedan pocos días. ¡Planifica tus próximas ausencias!</span>
                </div>
              )}
              
              {isDepleted && (
                <div className="mt-4 flex items-center gap-2 text-xs text-red-400 bg-red-600/10 p-2 rounded-lg">
                  <AlertCircle className="w-3 h-3" />
                  <span>No te quedan días disponibles para este tipo de ausencia.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mensaje cuando no hay balances */}
      {balances.length === 0 && (
        <div className="bg-surface-800 rounded-xl border border-white/10 p-12 text-center">
          <Calendar className="w-16 h-16 text-surface-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No hay saldos registrados</h3>
          <p className="text-text-tertiary">
            No se encontraron políticas de ausencia configuradas para este año.
          </p>
        </div>
      )}

      {/* Resumen anual */}
      {balances.length > 0 && (
        <div className="bg-surface-800/50 rounded-xl border border-white/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary-400" />
            <h4 className="text-sm font-medium text-text-primary">Resumen {year}</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-white">
                {balances.reduce((sum, b) => sum + b.total_days, 0)}
              </p>
              <p className="text-xs text-text-tertiary">Días totales</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">
                {balances.reduce((sum, b) => sum + b.used_days, 0)}
              </p>
              <p className="text-xs text-text-tertiary">Días usados</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent-400">
                {balances.reduce((sum, b) => sum + b.remaining_days, 0)}
              </p>
              <p className="text-xs text-text-tertiary">Días restantes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-400">
                {Math.round(balances.reduce((sum, b) => sum + (b.used_days / b.total_days) * 100, 0) / balances.length)}%
              </p>
              <p className="text-xs text-text-tertiary">Uso promedio</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveBalances;