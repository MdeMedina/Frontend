import apiClient from './client';

// Tipos de acciones auditables
export type AuditAction =
  // Peticiones
  | 'PETITION_CREATED'
  | 'PETITION_APPROVED'
  | 'PETITION_REJECTED'
  // Gestión de Usuarios
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DEACTIVATED'
  | 'USER_ACTIVATED'
  // Gestión de Responsables
  | 'MANAGER_ASSIGNED'
  | 'MANAGER_REMOVED'
  // Reservas
  | 'RESERVATION_CREATED'
  | 'RESERVATION_UPDATED'
  | 'RESERVATION_CANCELLED'
  // Check-in/Check-out
  | 'CHECKIN_CONFIRMED'
  | 'CHECKOUT_CONFIRMED'
  // Departamentos
  | 'APARTMENT_CREATED'
  | 'APARTMENT_UPDATED'
  | 'APARTMENT_DEACTIVATED'
  | 'APARTMENT_BULK_IMPORT'
  // Sesiones
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'LOGIN_FAILED';

export type AuditLog = {
  id: string;
  performedById?: string;
  performedBy?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  performedByName: string;
  performedByRole: string;
  action: AuditAction;
  description: string;
  targetUserId?: string;
  targetUserName?: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  apartmentNumber?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
};

export type AuditQueryParams = {
  page?: number;
  limit?: number;
  performedById?: string;
  entityType?: string;
  action?: AuditAction;
  startDate?: string;
  endDate?: string;
  search?: string;
  username?: string;
  apartment?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AuditStats = {
  totalLogs: number;
  todayLogs: number;
  byAction: { action: AuditAction; count: number }[];
};

export const auditApi = {
  getHistory: async (params?: AuditQueryParams): Promise<PaginatedResponse<AuditLog>> => {
    const response = await apiClient.get('/audit', { params });
    return response.data;
  },

  getStats: async (): Promise<AuditStats> => {
    const response = await apiClient.get('/audit/stats');
    return response.data;
  },
};

// Etiquetas legibles para las acciones
export const actionLabels: Record<AuditAction, string> = {
  PETITION_CREATED: 'Petición Creada',
  PETITION_APPROVED: 'Petición Aprobada',
  PETITION_REJECTED: 'Petición Rechazada',
  USER_CREATED: 'Usuario Creado',
  USER_UPDATED: 'Usuario Actualizado',
  USER_DEACTIVATED: 'Usuario Desactivado',
  USER_ACTIVATED: 'Usuario Activado',
  MANAGER_ASSIGNED: 'Responsable Asignado',
  MANAGER_REMOVED: 'Responsable Removido',
  RESERVATION_CREATED: 'Reserva Creada',
  RESERVATION_UPDATED: 'Reserva Actualizada',
  RESERVATION_CANCELLED: 'Reserva Cancelada',
  CHECKIN_CONFIRMED: 'Check-In Confirmado',
  CHECKOUT_CONFIRMED: 'Check-Out Confirmado',
  APARTMENT_CREATED: 'Departamento Creado',
  APARTMENT_UPDATED: 'Departamento Actualizado',
  APARTMENT_DEACTIVATED: 'Departamento Desactivado',
  APARTMENT_BULK_IMPORT: 'Carga Masiva (Excel)',
  USER_LOGIN: 'Inicio de Sesión',
  USER_LOGOUT: 'Cierre de Sesión',
  LOGIN_FAILED: 'Intento Fallido de Login',
};

// Colores para cada tipo de acción
export const actionColors: Record<AuditAction, string> = {
  PETITION_CREATED: 'bg-purple-100 text-purple-800 border-purple-300',
  PETITION_APPROVED: 'bg-green-100 text-green-800 border-green-300',
  PETITION_REJECTED: 'bg-red-100 text-red-800 border-red-300',
  USER_CREATED: 'bg-blue-100 text-blue-800 border-blue-300',
  USER_UPDATED: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  USER_DEACTIVATED: 'bg-orange-100 text-orange-800 border-orange-300',
  USER_ACTIVATED: 'bg-teal-100 text-teal-800 border-teal-300',
  MANAGER_ASSIGNED: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  MANAGER_REMOVED: 'bg-pink-100 text-pink-800 border-pink-300',
  RESERVATION_CREATED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  RESERVATION_UPDATED: 'bg-sky-100 text-sky-800 border-sky-300',
  RESERVATION_CANCELLED: 'bg-rose-100 text-rose-800 border-rose-300',
  CHECKIN_CONFIRMED: 'bg-lime-100 text-lime-800 border-lime-300',
  CHECKOUT_CONFIRMED: 'bg-amber-100 text-amber-800 border-amber-300',
  APARTMENT_CREATED: 'bg-violet-100 text-violet-800 border-violet-300',
  APARTMENT_UPDATED: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300',
  APARTMENT_DEACTIVATED: 'bg-stone-100 text-stone-800 border-stone-300',
  APARTMENT_BULK_IMPORT: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  USER_LOGIN: 'bg-gray-100 text-gray-800 border-gray-300',
  USER_LOGOUT: 'bg-slate-100 text-slate-800 border-slate-300',
  LOGIN_FAILED: 'bg-red-200 text-red-900 border-red-400',
};

// Iconos para cada categoría de acción
export const actionIcons: Record<AuditAction, string> = {
  PETITION_CREATED: '📝',
  PETITION_APPROVED: '✅',
  PETITION_REJECTED: '❌',
  USER_CREATED: '👤',
  USER_UPDATED: '✏️',
  USER_DEACTIVATED: '🚫',
  USER_ACTIVATED: '✓',
  MANAGER_ASSIGNED: '👔',
  MANAGER_REMOVED: '👋',
  RESERVATION_CREATED: '📅',
  RESERVATION_UPDATED: '🔄',
  RESERVATION_CANCELLED: '🗑️',
  CHECKIN_CONFIRMED: '🟢',
  CHECKOUT_CONFIRMED: '🔴',
  APARTMENT_CREATED: '🏢',
  APARTMENT_UPDATED: '🔧',
  APARTMENT_DEACTIVATED: '🏚️',
  APARTMENT_BULK_IMPORT: '📊',
  USER_LOGIN: '🔑',
  USER_LOGOUT: '🚪',
  LOGIN_FAILED: '⚠️',
};

// Categorías de acciones para filtrar
export const actionCategories = {
  petitions: ['PETITION_CREATED', 'PETITION_APPROVED', 'PETITION_REJECTED'] as AuditAction[],
  users: ['USER_CREATED', 'USER_UPDATED', 'USER_DEACTIVATED', 'USER_ACTIVATED'] as AuditAction[],
  managers: ['MANAGER_ASSIGNED', 'MANAGER_REMOVED'] as AuditAction[],
  reservations: ['RESERVATION_CREATED', 'RESERVATION_UPDATED', 'RESERVATION_CANCELLED'] as AuditAction[],
  checkInOut: ['CHECKIN_CONFIRMED', 'CHECKOUT_CONFIRMED'] as AuditAction[],
  apartments: ['APARTMENT_CREATED', 'APARTMENT_UPDATED', 'APARTMENT_DEACTIVATED', 'APARTMENT_BULK_IMPORT'] as AuditAction[],
  sessions: ['USER_LOGIN', 'USER_LOGOUT', 'LOGIN_FAILED'] as AuditAction[],
};
