import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

interface AuthInitializerProps {
  children: React.ReactNode;
}

export default function AuthInitializer({ children }: AuthInitializerProps) {
  const { token, fetchUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // If we have a token but user is not authenticated, try to fetch user
    if (token && !isAuthenticated) {
      fetchUser().catch(() => {
        // Error is handled in the store
      });
    }
  }, [token, isAuthenticated, fetchUser]);

  return <>{children}</>;
}

