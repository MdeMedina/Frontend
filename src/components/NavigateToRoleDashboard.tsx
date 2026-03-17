import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const NavigateToRoleDashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'SUPERADMIN':
      return <Navigate to="/superadmin" replace />;
    case 'ADMIN':
      return <Navigate to="/admin" replace />;
    case 'OWNER':
      return <Navigate to="/propietario" replace />;
    case 'ASSIGNED_MANAGER':
      return <Navigate to="/responsable" replace />;
    case 'CONCIERGE':
      return <Navigate to="/conserje" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

