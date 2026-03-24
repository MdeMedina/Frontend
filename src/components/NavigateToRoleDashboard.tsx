import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const NavigateToRoleDashboard = () => {
  const { user, managedResidence, managedBuilding } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si no es SUPERADMIN, verificar si tiene todo seleccionado
  if (user.role !== 'SUPERADMIN') {
    const hasMultipleRes = user.availableResidences && user.availableResidences.length > 1;
    const needsResSelection = hasMultipleRes && !managedResidence;
    
    // Buscar si la residencia actual (seleccionada o única) tiene múltiples torres
    const resId = managedResidence?.id || (user.availableResidences?.length === 1 ? user.availableResidences[0].id : null);
    const resObj = user.availableResidences?.find((r: any) => r.id === resId);
    const hasMultipleBuildings = resObj && resObj.buildings && resObj.buildings.length > 1;
    const needsBuildingSelection = hasMultipleBuildings && !managedBuilding;

    if (needsResSelection || needsBuildingSelection) {
      return <Navigate to="/select-residence" replace />;
    }
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

