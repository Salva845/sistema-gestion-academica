// =========================================
// src/components/auth/ProtectedRoute.jsx
// Componente para proteger rutas
// =========================================

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loading } from '../ui/Loading';

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(profile?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};