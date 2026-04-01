import { useState, type ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Notifications } from './Notifications';
import { Breadcrumbs } from './Breadcrumbs';
import {
  Home, Landmark, Users, Building2, Building,
  CalendarDays, ClipboardList, Calendar, FileText,
  Menu, ArrowLeft, X, LogOut
} from 'lucide-react';

interface LayoutProps { children: ReactNode }

type NavItem = { label: string; path: string; icon: React.ElementType };

const NAV: Record<string, NavItem[]> = {
  SUPERADMIN: [
    { label: 'Inicio',          path: '/superadmin',                icon: Home      },
    { label: 'Administradores', path: '/superadmin/administrators', icon: Users     },
  ],
  ADMIN: [
    { label: 'Inicio',        path: '/admin',              icon: Home          },
    { label: 'Usuarios',      path: '/admin/users',        icon: Users         },
    { label: 'Departamentos', path: '/admin/apartments',   icon: Building      },
    { label: 'Reservas',      path: '/admin/reservations', icon: CalendarDays  },
    { label: 'Peticiones',    path: '/admin/petitions',    icon: ClipboardList },
    { label: 'Calendario',    path: '/admin/calendar',     icon: Calendar      },
    { label: 'Registros',     path: '/admin/audit',        icon: FileText      },
  ],
  OWNER: [
    { label: 'Inicio',        path: '/propietario',              icon: Home          },
    { label: 'Departamentos', path: '/propietario/apartments',   icon: Building      },
    { label: 'Responsables',  path: '/propietario/managers',     icon: Users         },
    { label: 'Reservas',      path: '/propietario/reservations', icon: CalendarDays  },
    { label: 'Peticiones',    path: '/propietario/petitions',    icon: ClipboardList },
    { label: 'Calendario',    path: '/propietario/calendar',     icon: Calendar      },
  ],
  ASSIGNED_MANAGER: [
    { label: 'Inicio',        path: '/responsable',              icon: Home         },
    { label: 'Departamentos', path: '/responsable/apartments',   icon: Building     },
    { label: 'Reservas',      path: '/responsable/reservations', icon: CalendarDays },
    { label: 'Peticiones',    path: '/responsable/petitions',    icon: ClipboardList },
    { label: 'Calendario',    path: '/responsable/calendar',     icon: Calendar      },
  ],
  CONCIERGE: [],
};

const HOME: Record<string, string> = {
  SUPERADMIN: '/superadmin', ADMIN: '/admin', OWNER: '/propietario',
  ASSIGNED_MANAGER: '/responsable', CONCIERGE: '/conserje',
};

const ROLE_LABEL: Record<string, string> = {
  SUPERADMIN: 'Super Administrador', ADMIN: 'Administrador', OWNER: 'Propietario',
  ASSIGNED_MANAGER: 'Responsable',   CONCIERGE: 'Conserje',
};

// Nav button — active uses bottom-border indicator (surgical precision signal)
const btnBase   = 'relative flex items-center gap-1.5 px-4 h-9 text-[10px] font-bold tracking-widest uppercase transition-all duration-200 rounded-lg';
const btnActive  = 'bg-white text-[#001640] shadow-md';
const btnDefault = 'text-white/70 hover:text-white hover:bg-white/5';

export const Layout = ({ children }: LayoutProps) => {
  const { user, logout, impersonationMode, stopImpersonation, currentResidence, currentBuilding, selectResidence, selectBuilding } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const effectiveRole = impersonationMode ? 'ADMIN' : (user?.role ?? '');
  const navItems      = NAV[effectiveRole] ?? [];
  const homePath      = impersonationMode ? '/admin' : (HOME[user?.role ?? ''] ?? '/');
  const isActive      = (path: string) => location.pathname === path;

  // User initials for the avatar chip
  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase();

  return (
    <div className="min-h-screen bg-[var(--color-background)]">


      <nav
        aria-label="Navegación principal"
        className="bg-[#001640] border-b border-white/10 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            <div className="flex items-center gap-3">
              <button
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                aria-controls="mobile-nav"
                aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
                className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center
                           rounded-lg text-white
                           hover:bg-white/10 transition-colors"
              >
                {open
                  ? <X    size={18} strokeWidth={1.5} aria-hidden="true" />
                  : <Menu size={18} strokeWidth={1.5} aria-hidden="true" />
                }
              </button>
              <button
                onClick={() => navigate(homePath)}
                aria-label="Ir al inicio"
                className="flex items-center gap-2.5 min-h-[44px] group"
              >
                <div className="flex items-center justify-center w-8 h-8
                                bg-white rounded-lg
                                group-hover:opacity-90 transition-opacity">
                  <Building2 size={16} strokeWidth={2.5} className="text-[#001640]" aria-hidden="true" />
                </div>
                <span className="hidden sm:block text-[10px] font-bold tracking-widest uppercase text-white">
                  {currentResidence?.name || 'Gestión Residencial'}
                </span>
              </button>
            </div>

            <div className="hidden md:flex items-center h-16 gap-2">
              {navItems.map(({ path, label, icon: Icon }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  aria-current={isActive(path) ? 'page' : undefined}
                  className={`${btnBase} ${isActive(path) ? btnActive : btnDefault}`}
                >
                  <Icon size={13} strokeWidth={1.5} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {user?.role !== 'SUPERADMIN' && user?.role !== 'CONCIERGE' && <Notifications />}

              <button
                onClick={() => navigate('/profile')}
                aria-label={`Perfil de ${user?.firstName} ${user?.lastName}`}
                className="hidden sm:flex items-center gap-2 min-h-[44px] group"
              >
                <div className="w-7 h-7 rounded-lg bg-white
                                flex items-center justify-center
                                text-[#001640] text-[10px] font-bold tracking-wide
                                group-hover:opacity-90 transition-opacity"
                     aria-hidden="true">
                  {initials || '?'}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 group-hover:text-white transition-colors">
                  {ROLE_LABEL[user?.role ?? ''] ?? user?.role}
                </span>
              </button>

              <button
                onClick={async () => { await logout(); navigate('/login'); }}
                className="text-[10px] font-bold tracking-widest uppercase text-white/50
                           hover:text-white transition-colors min-h-[44px] px-2 flex items-center gap-2"
                title="Cerrar sesión"
              >
                <LogOut size={13} strokeWidth={2} className="opacity-70" />
                Salir
              </button>
            </div>

          </div>
        </div>

        {open && (
          <div id="mobile-nav" className="md:hidden border-t border-white/10 bg-[#001640]">
            <div className="px-2 py-3 space-y-0.5">
              {navItems.map(({ path, label, icon: Icon }) => (
                <button
                  key={path}
                  onClick={() => { navigate(path); setOpen(false); }}
                  aria-current={isActive(path) ? 'page' : undefined}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5
                              rounded-lg text-sm font-medium transition-colors
                               ${isActive(path)
                                ? 'bg-white text-[#001640] shadow-sm'
                                : 'text-white/70 hover:bg-white/5'
                              }`}
                >
                  <Icon size={14} strokeWidth={1.5} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white
                                flex items-center justify-center text-[#001640] text-[10px] font-bold"
                     aria-hidden="true">
                  {initials || '?'}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                  {user?.firstName} {user?.lastName} · {ROLE_LABEL[user?.role ?? ''] ?? user?.role}
                </p>
              </div>
              <button
                onClick={async () => { await logout(); navigate('/login'); }}
                className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors py-2"
              >
                Salir
              </button>
            </div>
          </div>
        )}
      </nav>

      <Breadcrumbs />

      {location.pathname !== homePath && (
        <button
          onClick={() => navigate(homePath)}
          aria-label="Volver al inicio"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2
                     bg-primary text-white text-xs font-semibold tracking-wide uppercase
                     px-4 py-3 min-h-[44px] rounded-lg
                     hover:opacity-90 motion-safe:transition-opacity"
        >
          <ArrowLeft size={13} strokeWidth={1.5} aria-hidden="true" />
          Inicio
        </button>
      )}

      <main key={location.pathname} className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both">
        {children}
      </main>
    </div>
  );
};
