import apiClient from './client';

export type LoginCredentials = {
  email: string;
  password: string;
};

export type AuthResponse = {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'OWNER' | 'ASSIGNED_MANAGER' | 'CONCIERGE';
    residenceIds?: string[];
    isMainAdmin?: Record<string, boolean>;
    availableResidences?: { id: string; name: string }[];
  };
};

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  generateResetLink: async (userId: string, isNewUser: boolean = false) => {
    const response = await apiClient.post('/auth/generate-reset-link', { userId, isNewUser });
    return response.data;
  },
};

