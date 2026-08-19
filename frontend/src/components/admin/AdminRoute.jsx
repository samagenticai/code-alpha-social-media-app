import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const AdminRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/?redirect=/admin" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/feed" replace />;
  }

  return children;
};

export default AdminRoute;
