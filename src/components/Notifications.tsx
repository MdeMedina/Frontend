import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { notificationsApi, type Notification } from '../api/notifications';
import { io, Socket } from 'socket.io-client';
import { getApiUrl } from '../api/client';

export const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastNotification, setToastNotification] = useState<Notification | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) {
      console.log('Notifications: No user, component not rendered');
      return;
    }

    console.log('Notifications: Component mounted, loading notifications');
    // Cargar notificaciones iniciales
    loadNotifications();
    loadUnreadCount();

    // Configurar WebSocket para notificaciones en tiempo real
    const token = localStorage.getItem('token');
    if (token) {
      const apiUrl = getApiUrl();
      const socket = io(apiUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[Notifications] WebSocket connected for notifications');
      });

      socket.on('connect_error', (error) => {
        console.error('[Notifications] WebSocket connection error:', error);
      });

      socket.on('notification', (notification: Notification) => {
        console.log('[Notifications] New notification received:', notification);
        // Agregar nueva notificación al inicio de la lista
        setNotifications(prev => [notification, ...prev]);
        // Incrementar contador de no leídas si no está leída
        // El backend envía 'isRead' pero puede venir como 'read', verificar ambos
        const isUnread = !notification.isRead && !(notification as any).read;
        if (isUnread) {
          setUnreadCount(prev => {
            const newCount = prev + 1;
            console.log('[Notifications] Unread count updated:', newCount);
            return newCount;
          });
          
          // Mostrar popup/toast con la notificación
          setToastNotification(notification);
          setShowToast(true);
          console.log('[Notifications] Toast should be visible now');
          
          // Ocultar el toast después de 5 segundos
          if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
          }
          toastTimeoutRef.current = setTimeout(() => {
            setShowToast(false);
            setToastNotification(null);
          }, 5000);
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('[Notifications] WebSocket disconnected:', reason);
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log(`[Notifications] WebSocket reconnected after ${attemptNumber} attempts`);
      });

      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`[Notifications] WebSocket reconnection attempt ${attemptNumber}`);
      });

      socket.on('error', (error) => {
        console.error('[Notifications] WebSocket error:', error);
      });
    }

    // Cerrar conexión al desmontar
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [user]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationsApi.getAll(20);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await notificationsApi.getUnreadCount();
      setUnreadCount(count);
      console.log('Unread count loaded:', count); // Debug
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Marcar como leída
    if (!notification.isRead) {
      try {
        await notificationsApi.markAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navegar según el tipo de notificación y el rol del usuario
    const path = notificationsApi.getNavigationPath(notification, user?.role);
    if (path) {
      navigate(path);
      setIsOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'PETITION_APPROVED':
        return '✅';
      case 'PETITION_REJECTED':
        return '❌';
      case 'PETITION_CREATED':
        return '📝';
      case 'RESERVATION_CREATED':
        return '📅';
      case 'CHECK_IN_CONFIRMED':
        return '🔑';
      case 'CHECK_OUT_CONFIRMED':
        return '🚪';
      case 'ADMIN_ACTION':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  const handleToastClick = (notification: Notification) => {
    // Cerrar el toast
    setShowToast(false);
    setToastNotification(null);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    
    // Abrir el dropdown y navegar a la notificación
    setIsOpen(true);
    handleNotificationClick(notification);
  };

  const handleToastClose = () => {
    setShowToast(false);
    setToastNotification(null);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
  };

  if (!user) return null;

  // Debug: mostrar estado actual
  console.log('Notifications render - unreadCount:', unreadCount, 'showToast:', showToast);

  return (
    <>
      {/* Popup/Toast de notificación */}
      {showToast && toastNotification && (
        <div className="fixed top-4 right-4 z-[9999] animate-slideIn" style={{ zIndex: 9999 }}>
          <div 
            onClick={() => handleToastClick(toastNotification)}
            className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[320px] max-w-[400px] cursor-pointer hover:shadow-2xl transition-all transform hover:scale-[1.02]"
            style={{ pointerEvents: 'auto' }}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl flex-shrink-0">
                {getNotificationIcon(toastNotification.type)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {toastNotification.title}
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToastClose();
                    }}
                    className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {toastNotification.message}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {formatDate(toastNotification.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative" ref={dropdownRef} style={{ position: 'relative' }}>
        {/* Botón de notificaciones */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              loadNotifications();
            }
          }}
          className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg transition"
          title={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} no leídas)` : ''}`}
          style={{ position: 'relative' }}
        >
          <span className="text-2xl">🔔</span>
          {unreadCount > 0 && (
            <span 
              className="absolute bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-white"
              style={{ 
                top: '-4px',
                right: '-4px',
                height: '24px',
                minWidth: '24px',
                padding: '0 6px',
                zIndex: 10,
                lineHeight: '20px'
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

      {/* Dropdown de notificaciones */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* Lista de notificaciones */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No hay notificaciones
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                      !notification.isRead ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <span className="flex-shrink-0 w-2 h-2 bg-indigo-600 rounded-full mt-1"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </>
  );
};
