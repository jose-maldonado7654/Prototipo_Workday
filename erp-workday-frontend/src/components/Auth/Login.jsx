// src/components/Auth/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, Mail, Lock, Eye, EyeOff, Building2, Users, Calendar, Clock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-900 via-surface-900 to-primary-900/20 flex items-center justify-center p-4">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Tarjeta de Login */}
      <div className="relative w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl mb-4">
            <Briefcase className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            ERP Workday
          </h1>
          <p className="text-text-tertiary text-sm">
            Sistema de Gestión Empresarial
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-surface-800/50 backdrop-blur-sm rounded-2xl border border-white/10 p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Email */}
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-text-tertiary" />
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-surface-700 border border-white/10 rounded-lg text-text-primary placeholder-text-tertiary/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="nombre@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-text-tertiary" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-surface-700 border border-white/10 rounded-lg text-text-primary placeholder-text-tertiary/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-tertiary hover:text-text-primary transition"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-600/20 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Botón Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Separador */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-surface-800 text-text-tertiary">Características del Sistema</span>
            </div>
          </div>

          {/* Características */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-text-tertiary text-sm">
              <Users className="w-4 h-4 text-primary-400" />
              <span>Gestión de Talento</span>
            </div>
            <div className="flex items-center gap-2 text-text-tertiary text-sm">
              <Calendar className="w-4 h-4 text-primary-400" />
              <span>Control de Ausencias</span>
            </div>
            <div className="flex items-center gap-2 text-text-tertiary text-sm">
              <Clock className="w-4 h-4 text-primary-400" />
              <span>Registro de Tiempo</span>
            </div>
            <div className="flex items-center gap-2 text-text-tertiary text-sm">
              <Building2 className="w-4 h-4 text-primary-400" />
              <span>10 Módulos Integrados</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-text-tertiary text-xs">
            Sistema seguro • Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;