import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { type Petition } from '../../api/petitions';

export const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

export const getRecipientLabel = (petition: Petition) => {
  if (petition.type === 'CANCEL_MOVEMENT') return 'Para: Administración';
  const owner = petition.apartment?.owner || (petition.stay as any)?.apartment?.owner;
  return owner ? `Para: ${owner.firstName} ${owner.lastName}` : 'Para: Propietario';
};

export const formatDate = (dateString: string) => {
  try {
    if (!dateString) return '';
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    return format(adjustedDate, "d 'de' MMM yyyy, HH:mm", { locale: es });
  } catch {
    return dateString;
  }
};

export const formatRelativeTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 60) return `${diffInMinutes} min`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} h`;
    return format(date, "d MMM", { locale: es });
  } catch {
    return '';
  }
};

export const getTypeLabel = (type: string) => {
  const types: Record<string, string> = {
    CREATE_MANAGER: 'Asignar Responsable',
    CREATE_APARTMENT: 'Crear Departamento',
    MODIFY_STAY: 'Modificar Reserva',
    DELETE_APARTMENT: 'Eliminar Departamento',
    CANCEL_MOVEMENT: 'Cancelar Movimiento',
    MODIFY_GUEST_DATA: 'Modificar Huésped',
    ASSIGN_PARKING: 'Asignar Estacionamiento',
  };
  return types[type] || 'Solicitud';
};

export const getTypeColor = (type: string) => {
  switch (type) {
    case 'CREATE_MANAGER': return 'bg-purple-100 text-purple-700';
    case 'CREATE_APARTMENT': return 'bg-emerald-100 text-emerald-700';
    case 'MODIFY_STAY': return 'bg-blue-100 text-blue-700';
    case 'DELETE_APARTMENT': return 'bg-red-100 text-red-700';
    case 'CANCEL_MOVEMENT': return 'bg-red-100 text-red-700';
    case 'MODIFY_GUEST_DATA': return 'bg-orange-100 text-orange-700';
    case 'ASSIGN_PARKING': return 'bg-pink-100 text-pink-700';
    default: return 'bg-amber-100 text-amber-700';
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'APPROVED': return 'bg-green-100 text-green-700 border-green-200';
    case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-amber-100 text-amber-700 border-amber-200';
  }
};

export const getStatusLabel = (status: string) => {
  switch (status) {
    case 'APPROVED': return 'APROBADA';
    case 'REJECTED': return 'RECHAZADA';
    default: return 'PENDIENTE';
  }
};
