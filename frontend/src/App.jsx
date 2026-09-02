import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Auth pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import AcademicRecords from './pages/student/AcademicRecords';
import Skills from './pages/student/Skills';
import Goals from './pages/student/Goals';
import CareerProfile from './pages/student/CareerProfile';
import SupportRequests from './pages/student/SupportRequests';
import AIInsights from './pages/student/AIInsights';

// Coordinator pages
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';
import StudentList from './pages/coordinator/StudentList';
import StudentDetail from './pages/coordinator/StudentDetail';
import AttentionList from './pages/coordinator/AttentionList';
import Interactions from './pages/coordinator/Interactions';
import FollowUps from './pages/coordinator/FollowUps';
import Analytics from './pages/coordinator/Analytics';

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Student routes */}
      <Route element={
        <ProtectedRoute roles={['student', 'coordinator', 'admin']}>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route path="/student/dashboard" element={
          <ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>
        } />
        <Route path="/student/profile" element={
          <ProtectedRoute roles={['student']}><StudentProfile /></ProtectedRoute>
        } />
        <Route path="/student/academic-records" element={
          <ProtectedRoute roles={['student']}><AcademicRecords /></ProtectedRoute>
        } />
        <Route path="/student/skills" element={
          <ProtectedRoute roles={['student']}><Skills /></ProtectedRoute>
        } />
        <Route path="/student/goals" element={
          <ProtectedRoute roles={['student']}><Goals /></ProtectedRoute>
        } />
        <Route path="/student/career" element={
          <ProtectedRoute roles={['student']}><CareerProfile /></ProtectedRoute>
        } />
        <Route path="/student/support" element={
          <ProtectedRoute roles={['student']}><SupportRequests /></ProtectedRoute>
        } />
        <Route path="/student/ai" element={
          <ProtectedRoute roles={['student']}><AIInsights /></ProtectedRoute>
        } />

        {/* Coordinator routes */}
        <Route path="/coordinator/dashboard" element={
          <ProtectedRoute roles={['coordinator', 'admin']}><CoordinatorDashboard /></ProtectedRoute>
        } />
        <Route path="/coordinator/students" element={
          <ProtectedRoute roles={['coordinator', 'admin']}><StudentList /></ProtectedRoute>
        } />
        <Route path="/coordinator/students/:id" element={
          <ProtectedRoute roles={['coordinator', 'admin']}><StudentDetail /></ProtectedRoute>
        } />
        <Route path="/coordinator/attention" element={
          <ProtectedRoute roles={['coordinator', 'admin']}><AttentionList /></ProtectedRoute>
        } />
        <Route path="/coordinator/interactions" element={
          <ProtectedRoute roles={['coordinator', 'admin']}><Interactions /></ProtectedRoute>
        } />
        <Route path="/coordinator/followups" element={
          <ProtectedRoute roles={['coordinator', 'admin']}><FollowUps /></ProtectedRoute>
        } />
        <Route path="/coordinator/analytics" element={
          <ProtectedRoute roles={['coordinator', 'admin']}><Analytics /></ProtectedRoute>
        } />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: '12px',
                background: '#1a1a1a',
                color: '#fff',
                fontSize: '13px',
                padding: '12px 16px',
              },
              success: {
                iconTheme: { primary: '#AAFF00', secondary: '#1a1a1a' },
              },
              error: {
                iconTheme: { primary: '#ff5555', secondary: '#fff' },
              },
            }}
          />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
