import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { APP_ROUTES } from '../lib/routes';
import { useAuth } from '../modules/auth/auth-context';
import type { Role } from '../types';

type ProtectedRouteProps = {
  allowedRoles: Role[];
  children: ReactElement;
};

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { session, isHydrating } = useAuth();

  if (isHydrating) {
    return null;
  }

  if (!session) {
    return <Navigate to={APP_ROUTES.access} replace />;
  }

  if (!allowedRoles.includes(session.user.role)) {
    return <Navigate to={APP_ROUTES.home} replace />;
  }

  return children;
}
