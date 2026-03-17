import api from './client';

export type NotificationType = 
  | 'PETITION_APPROVED'
  | 'PETITION_REJECTED'
  | 'PETITION_CREATED'
  | 'RESERVATION_CREATED'
  | 'CHECK_IN_CONFIRMED'
  | 'CHECK_OUT_CONFIRMED'
  | 'ADMIN_ACTION';

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string;
  relatedType?: string;
  residenceId?: string;
  residence?: {
    id: string;
    name: string;
  };
  createdAt: string;
};

export type NotificationNavigation = {
  type: NotificationType;
  path: string;
  params?: Record<string, string>;
};

export const notificationsApi = {
  getAll: async (limit?: number): Promise<Notification[]> => {
    const response = await api.get('/notifications', {
      params: limit ? { limit } : {},
    });
    return response.data;
  },

  getUnread: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications/unread');
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/notifications/unread/count');
    return response.data.count;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },

  /**
   * Obtener la ruta de navegación según el tipo de notificación y el rol del usuario
   */
  getNavigationPath: (notification: Notification, userRole?: string): string | null => {
    // Si es una notificación de petición para conserje, agregar parámetro de tab
    if ((notification.type === 'PETITION_APPROVED' || 
         notification.type === 'PETITION_REJECTED' || 
         notification.type === 'PETITION_CREATED') && 
        userRole === 'CONCIERGE') {
      return '/conserje?tab=petitions';
    }
    switch (notification.type) {
      case 'PETITION_APPROVED':
      case 'PETITION_REJECTED':
      case 'PETITION_CREATED':
        if (userRole === 'ADMIN') {
          return '/admin/petitions';
        } else if (userRole === 'CONCIERGE') {
          return '/conserje';
        } else if (userRole === 'OWNER' || userRole === 'ASSIGNED_MANAGER') {
          return '/propietario/petitions';
        }
        return '/admin/petitions';
      
      case 'RESERVATION_CREATED':
        if (userRole === 'ADMIN') {
          return '/admin/reservations';
        } else if (userRole === 'OWNER') {
          return '/propietario/reservations';
        } else if (userRole === 'ASSIGNED_MANAGER') {
          return '/responsable/reservations';
        }
        return '/admin/reservations';
      
      case 'CHECK_IN_CONFIRMED':
      case 'CHECK_OUT_CONFIRMED':
        if (userRole === 'OWNER') {
          return '/propietario/reservations';
        } else if (userRole === 'ASSIGNED_MANAGER') {
          return '/responsable/reservations';
        }
        return '/propietario/reservations';
      
      case 'ADMIN_ACTION':
        if (userRole === 'ADMIN') {
          // Para admins, ir a la entidad correspondiente
          if (notification.relatedType === 'User') {
            return '/admin/users';
          } else if (notification.relatedType === 'Building') {
            return '/admin/buildings';
          } else if (notification.relatedType === 'Apartment') {
            return '/admin/apartments';
          }
          return '/admin';
        }
        return null;
      
      default:
        return null;
    }
  },
};
