import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEmployee = async (userId) => {
    if (!userId) {
      console.error('No userId provided');
      return;
    }
    
    console.log('Fetching employee for userId:', userId);
    
    const { data, error } = await supabase
      .from('employees')
      .select('*, department:departments(name), position:positions(title)')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching employee:', error);
    } else {
      console.log('Employee fetched:', data);
      setEmployee(data);
    }
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setEmployee(null);
  };

  useEffect(() => {
    // Verificar sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        localStorage.setItem('supabase_token', session.access_token);
        fetchEmployee(session.user.id);
      }
      setLoading(false);
    });

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        localStorage.setItem('supabase_token', session.access_token);
        fetchEmployee(session.user.id);
      } else {
        setUser(null);
        setEmployee(null);
        localStorage.removeItem('supabase_token');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    employee,
    loading,
    login,
    logout,
    isAdmin: employee?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};