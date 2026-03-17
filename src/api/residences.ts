import api from './client';

export type Residence = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    buildings: number;
    apartments: number;
    stays: number;
  };
  admins?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    lastLogin?: string;
    createdAt?: string;
    isMain?: boolean;
  }[];
};

export const residencesApi = {
  getAll: async (): Promise<Residence[]> => {
    const response = await api.get('/residences');
    return response.data;
  },

  getById: async (id: string): Promise<Residence> => {
    const response = await api.get(`/residences/${id}`);
    return response.data;
  },

  create: async (
    name: string,
    admin?: {
      email?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      userId?: string;
    },
  ): Promise<Residence> => {
    const response = await api.post('/residences', {
      name,
      admin: admin || undefined,
    });
    return response.data;
  },

  update: async (
    id: string,
    name: string,
    admin?: {
      email?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      userId?: string;
    },
  ): Promise<Residence> => {
    const response = await api.patch(`/residences/${id}`, {
      name,
      admin: admin || undefined,
    });
    return response.data;
  },

  getAvailableAdmins: async (includeInactive?: boolean): Promise<
    Array<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
      residenceId?: string;
      residence?: {
        id: string;
        name: string;
      };
      residences?: Array<{
        id: string;
        name: string;
        isMain?: boolean;
      }>;
    }>
  > => {
    const response = await api.get('/residences/available-admins', {
      params: includeInactive ? { includeInactive: 'true' } : {},
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/residences/${id}`);
  },

  toggleActive: async (id: string): Promise<Residence> => {
    const response = await api.patch(`/residences/${id}/toggle-active`);
    return response.data;
  },

  removeAdmin: async (residenceId: string, adminId: string): Promise<{ message: string; adminDeactivated: boolean }> => {
    const response = await api.delete(`/residences/${residenceId}/admins/${adminId}`);
    return response.data;
  },

  setMainAdmin: async (residenceId: string, adminId: string): Promise<{ message: string }> => {
    const response = await api.patch(`/residences/${residenceId}/admins/${adminId}/set-main`);
    return response.data;
  },
};
