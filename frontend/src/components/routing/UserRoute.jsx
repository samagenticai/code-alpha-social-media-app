import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Protects normal user routes (/feed, /profile).
 * Admins are always redirected to the admin dashboard.
 */
export const UserRoute = ({ children }) => {
  const { isAuthenticated, isLoading, isGuest, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isAuthenticated && user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (!isAuthenticated && !isGuest) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default UserRoute;
