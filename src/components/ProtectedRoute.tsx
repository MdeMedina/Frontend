import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('SUPERADMIN' | 'ADMIN' | 'OWNER' | 'ASSIGNED_MANAGER' | 'CONCIERGE')[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading, impersonationMode, managedResidence, managedBuilding } = useAuth();
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

  // Verificar si necesita seleccionar residencia o torre (Solo si NO es superadmin)
  // Redirigir a la página de selección si falta la residencia o el edificio (torre) gestionado,
  // siempre que no sea SUPERADMIN y no esté ya en la vista de selección.
  if (user?.role !== 'SUPERADMIN' && location.pathname !== '/select-residence') {
    // Caso 1: Tiene múltiples residencias y no ha elegido ninguna
    if (user?.availableResidences && user.availableResidences.length > 1 && !managedResidence) {
      return <Navigate to="/select-residence" replace />;
    }
    
    // Caso 2: Tiene residencia (o se auto-seleccionó la única que hay) pero falta elegir torre
    // Solo si la residencia tiene edificios (>1) o si managedBuilding es null y hay edificios
    if (!managedBuilding) {
      // Buscar los edificios de la residencia actual (ya sea la seleccionada o la única que tiene)
      const resId = managedResidence?.id || (user?.availableResidences?.length === 1 ? user.availableResidences[0].id : null);
      const resObj = user?.availableResidences?.find((r: any) => r.id === resId);
      
      if (resObj && resObj.buildings && resObj.buildings.length > 1) {
        return <Navigate to="/select-residence" replace />;
      }
    }
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

