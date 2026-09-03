import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center animate-pulse">
            <span className="text-[#AAFF00] font-black text-sm">SO</span>
          </div>
          <p className="text-sm text-[#6b7280]">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'student' ? '/student/dashboard' : '/coordinator/dashboard'} replace />;
  }

  return children;
}
