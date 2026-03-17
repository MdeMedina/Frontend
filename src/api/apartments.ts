import apiClient from './client';

export type Apartment = {
  id: string;
  number: string;
  floor: number;
  buildingId: string;
  building: {
    id: string;
    name: string;
  };
  description?: string;
  parkingNumber?: string;
  isActive: boolean;
  ownerId?: string;
  owner?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    rut?: string;
  };
  managerId?: string;
  manager?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type CreateApartmentDto = {
  number: string;
  floor: number;
  buildingId: string;
  description?: string;
  parkingNumber?: string;
  ownerId?: string;
  managerId?: string;
};

export type UpdateApartmentDto = Partial<CreateApartmentDto> & {
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

export const apartmentsApi = {
  getAll: async (params?: PaginationParams) => {
    const response = await apiClient.get<PaginatedResponse<Apartment>>('/apartments', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Apartment>(`/apartments/${id}`);
    return response.data;
  },

  create: async (data: CreateApartmentDto) => {
    const response = await apiClient.post<Apartment>('/apartments', data);
    return response.data;
  },

  update: async (id: string, data: UpdateApartmentDto) => {
    const response = await apiClient.patch<Apartment>(`/apartments/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/apartments/${id}`);
    return response.data;
  },

  downloadTemplate: async () => {
    const response = await apiClient.get('/apartments/template', {
      responseType: 'blob',
    });
    return response.data;
  },

  bulkImport: async (file: File, buildingId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('buildingId', buildingId);
    
    const response = await apiClient.post<{
      success: number;
      failed: number;
      errors: Array<{ row: number; data: any; error: string }>;
      created: Array<{ number: string; floor: number }>;
      stats: {
        ownersCreated: number;
        ownersUpdated: number;
        apartmentsCreated: number;
        apartmentsUpdated: number;
      };
    }>('/apartments/bulk-import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};


