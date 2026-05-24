import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';

// Módulos Completos
import EmployeeList from './components/Employees/EmployeeList';
import JobPostings from './components/Recruiting/JobPostings';
import OnboardingTasks from './components/Onboarding/OnboardingTasks';
import TimeEntries from './components/Time/TimeEntries';
import LeaveRequests from './components/Leave/LeaveRequests';
import GoalsList from './components/Talent/GoalsList';
import Compensation from './components/Compensation/Compensation';
import ExpensesList from './components/Expenses/ExpensesList';
import SelfService from './components/SelfService/SelfService';
import Reports from './components/Reports/Reports';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Cargando...</p>
        </div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/login" />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="employees" element={<EmployeeList />} />
        <Route path="recruitment" element={<JobPostings />} />
        <Route path="onboarding" element={<OnboardingTasks />} />
        <Route path="time-tracking" element={<TimeEntries />} />
        <Route path="leave" element={<LeaveRequests />} />
        <Route path="talent" element={<GoalsList />} />
        <Route path="compensation" element={<Compensation />} />
        <Route path="expenses" element={<ExpensesList />} />
        <Route path="self-service" element={<SelfService />} />
        <Route path="analytics" element={<Reports />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;