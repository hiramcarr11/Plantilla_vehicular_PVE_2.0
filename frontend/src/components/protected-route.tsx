import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../modules/auth/auth-context';
import type { Role } from '../types';

type ProtectedRouteProps = {
  allowedRoles: Role[];
  children: ReactElement;
};

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(session.user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
