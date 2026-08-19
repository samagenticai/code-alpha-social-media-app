import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Keeps admins on /admin and normal users off /admin after auth restore (refresh).
 */
export const RoleBasedRouting = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.role) return;

    const path = location.pathname;

    if (user.role === 'admin' && !path.startsWith('/admin')) {
      navigate('/admin', { replace: true });
      return;
    }

    if (user.role !== 'admin' && path.startsWith('/admin')) {
      navigate('/feed', { replace: true });
    }
  }, [isLoading, isAuthenticated, user?.role, location.pathname, navigate]);

  return null;
};

export default RoleBasedRouting;
