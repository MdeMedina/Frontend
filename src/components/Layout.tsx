import { useState, type ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Notifications } from './Notifications';

interface LayoutProps {
  children: ReactNode;
}

// Configuración de navegación por rol
const navigationByRole: Record<string, { label: string; path: string; icon: string }[]> = {
  SUPERADMIN: [
    { label: 'Inicio', path: '/superadmin', icon: '🏠' },
    { label: 'Residencias', path: '/superadmin/residences', icon: '🏛️' },
    { label: 'Administradores', path: '/superadmin/administrators', icon: '👥' },
  ],
  ADMIN: [
    { label: 'Inicio', path: '/admin', icon: '🏠' },
    { label: 'Usuarios', path: '/admin/users', icon: '👥' },
    { label: 'Torres', path: '/admin/buildings', icon: '🏗️' },
    { label: 'Departamentos', path: '/admin/apartments', icon: '🏢' },
    { label: 'Reservas', path: '/admin/reservations', icon: '📅' },
    { label: 'Peticiones', path: '/admin/petitions', icon: '📝' },
    { label: 'Calendario', path: '/admin/calendar', icon: '🗓️' },
    { label: 'Registros', path: '/admin/audit', icon: '📋' },
  ],
  OWNER: [
    { label: 'Inicio', path: '/propietario', icon: '🏠' },
    { label: 'Departamentos', path: '/propietario/apartments', icon: '🏢' },
    { label: 'Responsables', path: '/propietario/managers', icon: '👥' },
    { label: 'Reservas', path: '/propietario/reservations', icon: '📅' },
    { label: 'Peticiones', path: '/propietario/petitions', icon: '📝' },
    { label: 'Calendario', path: '/propietario/calendar', icon: '🗓️' },
  ],
  ASSIGNED_MANAGER: [
    { label: 'Inicio', path: '/responsable', icon: '🏠' },
    { label: 'Departamentos', path: '/responsable/apartments', icon: '🏢' },
    { label: 'Reservas', path: '/responsable/reservations', icon: '📅' },
    { label: 'Calendario', path: '/responsable/calendar', icon: '🗓️' },
  ],
  CONCIERGE: [],
};

// Obtener la ruta de inicio según el rol
const getHomePath = (role: string) => {
  switch (role) {
    case 'SUPERADMIN': return '/superadmin';
    case 'ADMIN': return '/admin';
    case 'OWNER': return '/propietario';
    case 'ASSIGNED_MANAGER': return '/responsable';
    case 'CONCIERGE': return '/conserje';
    default: return '/';
  }
};

export const Layout = ({ children }: LayoutProps) => {
  const { user, logout, impersonationMode, stopImpersonation, currentResidence } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleStopImpersonation = () => {
    stopImpersonation();
    navigate('/superadmin');
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPERADMIN': return 'Super Administrador';
      case 'ADMIN': return 'Administrador';
      case 'OWNER': return 'Propietario';
      case 'ASSIGNED_MANAGER': return 'Responsable';
      case 'CONCIERGE': return 'Conserje';
      default: return role;
    }
  };

  // Si estamos impersonando, usamos el menú de ADMIN
  const effectiveRole = impersonationMode ? 'ADMIN' : (user?.role || '');
  const navItems = effectiveRole ? navigationByRole[effectiveRole] || [] : [];
  // Si estamos impersonando, el home path es /admin
  const homePath = impersonationMode ? '/admin' : (user?.role ? getHomePath(user.role) : '/');
  // const navItems = user?.role ? navigationByRole[user.role] || [] : [];
  // const homePath = user?.role ? getHomePath(user.role) : '/';
  const isHome = location.pathname === homePath;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner de Impersonación */}
      {/* Banner de Contexto (Impersonación o Multi-residencia) */}
      {(impersonationMode || (user?.availableResidences && user.availableResidences.length > 1 && currentResidence)) && (
        <div className="bg-blue-600 text-white px-4 py-2 text-center shadow-md relative z-50">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <span className="font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-white">apartment</span>
              {currentResidence?.name || 'Residencia Seleccionada'}
            </span>
            <button
              onClick={impersonationMode ? handleStopImpersonation : () => navigate('/select-residence')}
              className="bg-white text-blue-700 px-3 py-1 rounded text-sm font-bold hover:bg-blue-50 transition-colors"
            >
              {impersonationMode ? 'Salir de la vista' : 'Cambiar Residencia'}
            </button>
          </div>
        </div>
      )}
      {/* Barra superior */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo y botón menú móvil */}
            <div className="flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 mr-2"
              >
                <span className="text-xl">☰</span>
              </button>
              <h1
                onClick={() => navigate(homePath)}
                className="text-xl font-bold text-gray-900 cursor-pointer hover:text-indigo-600 transition"
              >
                {currentResidence?.name || 'Sistema de Gestión'}
              </h1>
            </div>

            {/* Navegación escritorio */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${location.pathname === item.path
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Usuario, notificaciones y logout */}
            <div className="flex items-center space-x-4">
              {/* Notificaciones - Solo para usuarios que no son SUPERADMIN */}
              {user?.role !== 'SUPERADMIN' && <Notifications />}

              <div className="hidden sm:block text-sm text-gray-700">
                <span className="font-medium">
                  {user?.firstName} {user?.lastName}
                </span>

                <button
                  onClick={() => navigate('/profile')}
                  className="ml-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  Perfil
                </button>
              </div>
              {!impersonationMode && (
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
                >
                  Salir
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Menú móvil */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 py-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center gap-2 ${location.pathname === item.path
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {user?.firstName} {user?.lastName} ({getRoleLabel(user?.role || '')})
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Botón flotante "Volver al inicio" (solo si no está en home) */}
      {!isHome && (
        <div className="fixed bottom-6 left-6 z-50">
          <button
            onClick={() => navigate(homePath)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-full shadow-lg transition transform hover:scale-105"
          >
            <span className="text-lg">←</span>
            <span className="font-medium">Volver al inicio</span>
          </button>
        </div>
      )}

      {/* Contenido principal */}
      <main>{children}</main>
    </div>
  );
};
