import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import useAuthStore from './store/authStore';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';

// Teacher Pages
import TeacherDashboard from './pages/teacher/Dashboard';
import ClassDetail from './pages/teacher/ClassDetail';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import PreExamPage from './pages/student/PreExamPage';
import ExamRoom from './pages/student/ExamRoom';
import ResultPage from './pages/student/ResultPage';

// Guards
const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />;
  if (user.isFirstLogin && window.location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  return children;
};

export default function App() {
  const { fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />

        {/* Teacher */}
        <Route path="/teacher" element={<ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>} />
        <Route path="/teacher/class/:classId" element={<ProtectedRoute role="teacher"><ClassDetail /></ProtectedRoute>} />

        {/* Student */}
        <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/pre-exam" element={<ProtectedRoute role="student"><PreExamPage /></ProtectedRoute>} />
        <Route path="/student/exam" element={<ProtectedRoute role="student"><ExamRoom /></ProtectedRoute>} />
        <Route path="/student/result" element={<ProtectedRoute role="student"><ResultPage /></ProtectedRoute>} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      
      {/* Vercel Web Analytics */}
      <Analytics />
    </BrowserRouter>
  );
}
