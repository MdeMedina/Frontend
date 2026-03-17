import apiClient from './client';

export type PetitionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type PetitionType =
  | 'MODIFY_STAY'
  | 'CREATE_APARTMENT'
  | 'MODIFY_APARTMENT'
  | 'DELETE_APARTMENT'
  | 'CREATE_MANAGER'
  | 'MODIFY_MANAGER'
  | 'DELETE_MANAGER'
  | 'MODIFY_GUEST_DATA'
  | 'CANCEL_MOVEMENT'
  | 'ASSIGN_PARKING'
  | 'OTHER';

export type Petition = {
  id: string;
  type: PetitionType;
  stayId?: string;
  stay?: {
    id: string;
    category: 'GUEST' | 'STAFF';
    status: 'SCHEDULED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
    scheduledCheckIn: string;
    scheduledCheckOut: string;
    actualCheckIn?: string;
    actualCheckOut?: string;
    guestFirstName?: string;
    guestLastName?: string;
    guestDocument?: string;
    guests?: Array<{
      firstName: string;
      lastName: string;
      document: string;
    }>;
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
  };
  apartmentId?: string;
  apartment?: {
    id: string;
    number: string;
    floor: number;
    building: string;
    manager?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
    owner?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  title: string;
  reason: string;
  requestedData?: Record<string, any>;
  status: PetitionStatus;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreatePetitionDto = {
  type: PetitionType;
  title: string;
  reason: string;
  stayId?: string;
  apartmentId?: string;
  requestedData?: Record<string, any>;
};

export type ReviewPetitionDto = {
  status: 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  rejectionReason?: string;
};

export type PaginationParams = {
  page?: number;
  limit?: number;
  status?: PetitionStatus;
  type?: PetitionType;
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

export const petitionsApi = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Petition>> => {
    const response = await apiClient.get('/petitions', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Petition> => {
    const response = await apiClient.get(`/petitions/${id}`);
    return response.data;
  },

  create: async (data: CreatePetitionDto): Promise<Petition> => {
    const response = await apiClient.post('/petitions', data);
    return response.data;
  },

  review: async (id: string, data: ReviewPetitionDto): Promise<Petition> => {
    const response = await apiClient.patch(`/petitions/${id}/review`, data);
    return response.data;
  },
};

// Etiquetas para estados en español
export const statusLabels: Record<PetitionStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
};

// Colores para estados
export const statusColors: Record<PetitionStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

// Etiquetas para tipos de petición
export const typeLabels: Record<PetitionType, string> = {
  MODIFY_STAY: 'Modificar Reserva',
  CREATE_APARTMENT: 'Crear Departamento',
  MODIFY_APARTMENT: 'Modificar Departamento',
  DELETE_APARTMENT: 'Eliminar Departamento',
  CREATE_MANAGER: 'Asignar Responsable',
  MODIFY_MANAGER: 'Modificar Responsable',
  DELETE_MANAGER: 'Eliminar Responsable',
  MODIFY_GUEST_DATA: 'Modificar Datos de Huésped',
  CANCEL_MOVEMENT: 'Cancelar Movimiento',
  ASSIGN_PARKING: 'Asignar Estacionamiento',
  OTHER: 'Otra solicitud',
};

// Colores para tipos
export const typeColors: Record<PetitionType, string> = {
  MODIFY_STAY: 'bg-blue-100 text-blue-800',
  CREATE_APARTMENT: 'bg-green-100 text-green-800',
  MODIFY_APARTMENT: 'bg-cyan-100 text-cyan-800',
  DELETE_APARTMENT: 'bg-red-100 text-red-800',
  CREATE_MANAGER: 'bg-purple-100 text-purple-800',
  MODIFY_MANAGER: 'bg-indigo-100 text-indigo-800',
  DELETE_MANAGER: 'bg-pink-100 text-pink-800',
  MODIFY_GUEST_DATA: 'bg-orange-100 text-orange-800',
  CANCEL_MOVEMENT: 'bg-red-100 text-red-700',
  ASSIGN_PARKING: 'bg-pink-100 text-pink-700',
  OTHER: 'bg-gray-100 text-gray-800',
};
