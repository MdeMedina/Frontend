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
  isLocked: boolean;
  lockedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginationParams = {
  page?: number;
  limit?: number;
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

// Labels para categorías
export const categoryLabels: Record<string, string> = {
  GUEST: 'Huésped',
  STAFF: 'Mantenimiento',
};

// Colores para categorías en calendario
export const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  GUEST: { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-800' },
  STAFF: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-800' },
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
