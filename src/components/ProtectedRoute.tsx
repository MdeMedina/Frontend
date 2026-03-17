import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('ADMIN' | 'OWNER' | 'ASSIGNED_MANAGER' | 'CONCIERGE')[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading, impersonationMode, managedResidence } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si es SUPERADMIN, tiene acceso a todo (God Mode)
  if (user?.role === 'SUPERADMIN') {
    return <>{children}</>;
  }

  // Verificar si necesita seleccionar residencia (Solo si NO es superadmin)
  // Si tiene múltiples residencias disponibles y no ha seleccionado ninguna,
  // redirigir a la página de selección, A MENOS que ya esté ahí.
  if (
    user?.availableResidences && 
    user.availableResidences.length > 1 && 
    !managedResidence &&    location.pathname !== '/select-residence'
  ) {
      return <Navigate to="/select-residence" replace />;
  }

  // Si está en modo impersonación, también lo tratamos como ADMIN para la UI, pero el check de arriba ya pasó si es SUPERADMIN
  // Mantener esto por si en el futuro hay lógica específica, pero con el cambio de arriba quizás ya no sea bloqueante.
  const effectiveRole = impersonationMode ? 'ADMIN' : user?.role;

  if (allowedRoles && effectiveRole && !allowedRoles.includes(effectiveRole as any)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600">No tienes permisos para acceder a esta página.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

