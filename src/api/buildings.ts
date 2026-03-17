import api from './client';

export interface Building {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  apartmentsCount?: number;
  apartments?: {
    id: string;
    number: string;
    floor: number;
    isActive: boolean;
    owner?: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }[];
}

export interface CreateBuildingDto {
  name: string;
}

export interface UpdateBuildingDto {
  name?: string;
  isActive?: boolean;
}

export const buildingsApi = {
  getAll: async (includeInactive = false): Promise<{ data: Building[] }> => {
    const response = await api.get(`/buildings?includeInactive=${includeInactive}`);
    return response.data;
  },

  getOne: async (id: string): Promise<Building> => {
    const response = await api.get(`/buildings/${id}`);
    return response.data;
  },

  checkApartmentExists: async (buildingId: string, apartmentNumber: string): Promise<{ exists: boolean }> => {
    const response = await api.get(`/buildings/${buildingId}/check-apartment/${encodeURIComponent(apartmentNumber)}`);
    return response.data;
  },

  create: async (data: CreateBuildingDto): Promise<Building> => {
    const response = await api.post('/buildings', data);
    return response.data;
  },

  update: async (id: string, data: UpdateBuildingDto): Promise<Building> => {
    const response = await api.patch(`/buildings/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/buildings/${id}`);
  },
};
