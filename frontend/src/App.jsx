import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import ApplicantDashboard from './pages/applicant/Dashboard';
import LoanApplicationForm from './pages/applicant/LoanApplicationForm';
import MyApplications from './pages/applicant/MyApplications';
import ApplicationDetail from './pages/applicant/ApplicationDetail';

import OfficerDashboard from './pages/officer/Dashboard';
import OfficerApplications from './pages/officer/Applications';
import OfficerApplicationDetail from './pages/officer/ApplicationDetail';

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'bank_officer'
    ? <Navigate to="/officer/dashboard" replace />
    : <Navigate to="/applicant/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Applicant Routes */}
          <Route path="/applicant/dashboard" element={
            <ProtectedRoute role="applicant"><ApplicantDashboard /></ProtectedRoute>
          } />
          <Route path="/applicant/apply" element={
            <ProtectedRoute role="applicant"><LoanApplicationForm /></ProtectedRoute>
          } />
          <Route path="/applicant/applications" element={
            <ProtectedRoute role="applicant"><MyApplications /></ProtectedRoute>
          } />
          <Route path="/applicant/applications/:id" element={
            <ProtectedRoute role="applicant"><ApplicationDetail /></ProtectedRoute>
          } />

          {/* Bank Officer Routes */}
          <Route path="/officer/dashboard" element={
            <ProtectedRoute role="bank_officer"><OfficerDashboard /></ProtectedRoute>
          } />
          <Route path="/officer/applications" element={
            <ProtectedRoute role="bank_officer"><OfficerApplications /></ProtectedRoute>
          } />
          <Route path="/officer/applications/:id" element={
            <ProtectedRoute role="bank_officer"><OfficerApplicationDetail /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
