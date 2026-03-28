import type { AuditLog } from '../../api/audit';
import { actionLabels, actionColors, actionIcons } from '../../api/audit';

export const formatAuditDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getActionLabel = (action: string) => actionLabels[action as keyof typeof actionLabels] || action;
export const getActionColor = (action: string) => actionColors[action as keyof typeof actionColors] || 'bg-gray-100 text-gray-800 border-gray-200';
export const getActionIcon = (action: string) => actionIcons[action as keyof typeof actionIcons] || 'info';

export const categoryOptions = [
  { value: '', label: 'Todas las acciones' },
  { value: 'petitions', label: 'Peticiones' },
  { value: 'users', label: 'Gestión de Usuarios' },
  { value: 'managers', label: 'Responsables' },
  { value: 'reservations', label: 'Reservas' },
  { value: 'checkInOut', label: 'Check-In / Check-Out' },
  { value: 'apartments', label: 'Departamentos' },
  { value: 'sessions', label: 'Sesiones' },
];

export const getStatusDetails = (log: AuditLog) => {
  let status = 'PENDING';
  let statusLabel = 'Por revisar';
  let statusColor = 'bg-amber-50 text-amber-700 border-amber-200';

  if (log.action === 'PETITION_APPROVED') {
    status = 'APPROVED';
    statusLabel = 'Aprobada';
    statusColor = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (log.action === 'PETITION_REJECTED') {
    status = 'REJECTED';
    statusLabel = 'Rechazada';
    statusColor = 'bg-red-50 text-red-700 border-red-200';
  }

  return { status, statusLabel, statusColor };
};
