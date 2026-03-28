import apiClient from './client';

// Huésped simplificado: solo Nombre, Apellido y Documento
export type Guest = {
  firstName: string;
  lastName: string;
  document: string;
};

export type Stay = {
  id: string;
  apartmentId: string;
  apartment: {
    id: string;
    number: string;
    floor: number;
    building: string | {
      id: string;
      name: string;
    };
    owner?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  userId?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  category: 'GUEST' | 'STAFF';
  status: 'SCHEDULED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
  scheduledCheckIn: string;
  scheduledCheckOut: string;
  actualCheckIn?: string;
  actualCheckOut?: string;
  // Huésped principal: solo 3 campos
  guestFirstName?: string;
  guestLastName?: string;
  guestDocument?: string;
  // Huéspedes adicionales
  guests?: Guest[];
  notes?: string;
  parkingNumber?: string;
  effectiveParkingNumber?: string;
  isLocked: boolean;
  lockedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginationParams = {
  page?: number;
  limit?: number;
  buildingId?: string;
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

export type CreateStayDto = {
  apartmentId: string;
  userId?: string;
  category: 'GUEST' | 'STAFF';
  scheduledCheckIn: string;
  scheduledCheckOut: string;
  // Huésped principal: solo 3 campos
  guestFirstName?: string;
  guestLastName?: string;
  guestDocument?: string;
  // Huéspedes adicionales
  guests?: Guest[];
  notes?: string;
};

export type UpdateStayDto = Partial<Omit<CreateStayDto, 'apartmentId'>> & {
  status?: 'SCHEDULED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
  actualCheckIn?: string;
  actualCheckOut?: string;
};

// Helper para obtener nombre completo del huésped
export const getGuestFullName = (stay: Stay): string => {
  if (stay.guestFirstName && stay.guestLastName) {
    return `${stay.guestFirstName} ${stay.guestLastName}`;
  }
  if (stay.guestFirstName) return stay.guestFirstName;
  return '-';
};

// Labels para estados
export const statusLabels: Record<string, string> = {
  SCHEDULED: 'Programada',
  CHECKED_IN: 'En Depto',
  CHECKED_OUT: 'Finalizada',
  CANCELLED: 'Cancelada',
};

// Configuración visual para categorías (Diseño Quirúrgico)
export const categoryConfig: Record<string, { label: string; bg: string; text: string; dot: string; border: string }> = {
  GUEST: { 
    label: 'Huésped', 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-800', 
    dot: 'bg-emerald-500',
    border: 'border-emerald-200/50'
  },
  STAFF: { 
    label: 'Mantenimiento', 
    bg: 'bg-sky-50', 
    text: 'text-sky-800', 
    dot: 'bg-sky-500',
    border: 'border-sky-200/50'
  },
};

// Aliases para compatibilidad con componentes existentes (Calendario, etc)
export const categoryLabels: Record<string, string> = {
  GUEST: categoryConfig.GUEST.label,
  STAFF: categoryConfig.STAFF.label,
};

export const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  GUEST: { 
    bg: categoryConfig.GUEST.bg, 
    text: categoryConfig.GUEST.text, 
    border: categoryConfig.GUEST.border 
  },
  STAFF: { 
    bg: categoryConfig.STAFF.bg, 
    text: categoryConfig.STAFF.text, 
    border: categoryConfig.STAFF.border 
  },
};

// Configuración visual para estados (Diseño Quirúrgico)
export const statusConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  SCHEDULED: { label: 'Programada', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200/50' },
  CHECKED_IN: { label: 'En Depto', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200/50' },
  CHECKED_OUT: { label: 'Finalizada', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200/50' },
  CANCELLED: { label: 'Cancelada', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200/50' },
};

export const staysApi = {
  getAll: async (params?: PaginationParams) => {
    const response = await apiClient.get<PaginatedResponse<Stay>>('/stays', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Stay>(`/stays/${id}`);
    return response.data;
  },

  create: async (data: CreateStayDto) => {
    const response = await apiClient.post<Stay>('/stays', data);
    return response.data;
  },

  update: async (id: string, data: UpdateStayDto) => {
    const response = await apiClient.patch<Stay>(`/stays/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/stays/${id}`);
    return response.data;
  },

  checkIn: async (id: string) => {
    const response = await apiClient.post<Stay>(`/stays/${id}/check-in`);
    return response.data;
  },

  checkOut: async (id: string) => {
    const response = await apiClient.post<Stay>(`/stays/${id}/check-out`);
    return response.data;
  },
};
