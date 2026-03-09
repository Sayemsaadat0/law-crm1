import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import ProtectedRoute from './ProtectedRoute';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: ('admin' | 'owner' | 'lawyer')[];
}

export default function RoleBasedRoute({ children, allowedRoles }: RoleBasedRouteProps) {
  const { user } = useAuthStore();

  return (
    <ProtectedRoute>
      {user && allowedRoles.includes(user.role) ? (
        <>{children}</>
      ) : (
        <Navigate to="/dashboard/home" replace />
      )}
    </ProtectedRoute>
  );
}

