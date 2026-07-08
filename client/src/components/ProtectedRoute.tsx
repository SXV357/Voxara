import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <span className="text-muted text-sm">Loading…</span>
      </div>
    );
  }

  return session ? <Outlet /> : <Navigate to="/login" replace />;
}
