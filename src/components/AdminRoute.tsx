import { Navigate, Outlet } from 'react-router-dom';
import { useQuizStore } from '../store';

export default function AdminRoute() {
  const isAuthenticated = useQuizStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
