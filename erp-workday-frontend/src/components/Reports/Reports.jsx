// src/components/Reports/Reports.jsx
import React from 'react';
import { BarChart3, FileText, Download } from 'lucide-react';

const Reports = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Reportes y Analítica</h1>
        <p className="text-surface-400 mt-1">Visualiza métricas y estadísticas de la empresa</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-surface-800 rounded-xl border border-white/8 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary-600/10 rounded-lg">
              <FileText className="w-5 h-5 text-primary-400" />
            </div>
            <h3 className="font-display font-semibold text-white">Reporte de Empleados</h3>
          </div>
          <p className="text-surface-400 text-sm mb-4">Estadísticas de headcount, rotación y contrataciones</p>
          <button className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
            <Download className="w-4 h-4" />
            Descargar PDF
          </button>
        </div>

        <div className="bg-surface-800 rounded-xl border border-white/8 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary-600/10 rounded-lg">
              <BarChart3 className="w-5 h-5 text-primary-400" />
            </div>
            <h3 className="font-display font-semibold text-white">Análisis de Ausencias</h3>
          </div>
          <p className="text-surface-400 text-sm mb-4">Reporte de vacaciones, permisos y ausencias por departamento</p>
          <button className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
            <Download className="w-4 h-4" />
            Descargar PDF
          </button>
        </div>

        <div className="bg-surface-800 rounded-xl border border-white/8 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary-600/10 rounded-lg">
              <BarChart3 className="w-5 h-5 text-primary-400" />
            </div>
            <h3 className="font-display font-semibold text-white">Gastos por Departamento</h3>
          </div>
          <p className="text-surface-400 text-sm mb-4">Resumen financiero de gastos y reembolsos</p>
          <button className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
            <Download className="w-4 h-4" />
            Descargar PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;