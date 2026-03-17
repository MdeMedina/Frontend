import apiClient from './client';

export type UserRole = 'ADMIN' | 'OWNER' | 'ASSIGNED_MANAGER' | 'CONCIERGE';

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  rut?: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  isMainAdmin?: boolean; // Indicates if this admin is the main admin of their residence
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateUserDto = {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  rut?: string;
  phone?: string;
  role: UserRole;
  residenceId?: string;
};

export type UpdateUserDto = {
  email?: string;
  firstName?: string;
  lastName?: string;
  rut?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
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

// Tipo para jerarquía de propietarios
export type OwnerWithHierarchy = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  ownedApartments: {
    id: string;
    number: string;
    floor: number;
    building: string;
    isActive: boolean;
    manager?: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
      isActive: boolean;
    };
  }[];
};

export const usersApi = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  create: async (data: CreateUserDto): Promise<User> => {
    const response = await apiClient.post('/users', data);
    return response.data;
  },

  update: async (id: string, data: UpdateUserDto): Promise<User> => {
    const response = await apiClient.patch(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.patch('/users/change-password', {
      currentPassword,
      newPassword,
    });
  },

  toggleActive: async (id: string, isActive: boolean): Promise<User> => {
    const response = await apiClient.patch(`/users/${id}/toggle-active`, { isActive });
    return response.data;
  },

  getHierarchy: async (): Promise<OwnerWithHierarchy[]> => {
    const response = await apiClient.get('/users/hierarchy');
    return response.data;
  },
};

// Etiquetas para roles en español
export const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  OWNER: 'Propietario',
  ASSIGNED_MANAGER: 'Responsable Asignado',
  CONCIERGE: 'Conserje',
};

// Colores para roles
export const roleColors: Record<UserRole, string> = {
  ADMIN: 'bg-red-100 text-red-800',
  OWNER: 'bg-blue-100 text-blue-800',
  ASSIGNED_MANAGER: 'bg-purple-100 text-purple-800',
  CONCIERGE: 'bg-green-100 text-green-800',
};


