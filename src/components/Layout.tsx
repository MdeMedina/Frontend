import { useState, type ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Notifications } from './Notifications';
import {
  Home, Landmark, Users, Building2, Building,
  CalendarDays, ClipboardList, Calendar, FileText,
  Menu, ArrowLeft, X,
} from 'lucide-react';

interface LayoutProps { children: ReactNode }

type NavItem = { label: string; path: string; icon: React.ElementType };

const NAV: Record<string, NavItem[]> = {
  SUPERADMIN: [
    { label: 'Inicio',          path: '/superadmin',                icon: Home      },
    { label: 'Residencias',     path: '/superadmin/residences',     icon: Landmark  },
    { label: 'Administradores', path: '/superadmin/administrators', icon: Users     },
  ],
  ADMIN: [
    { label: 'Inicio',        path: '/admin',              icon: Home          },
    { label: 'Usuarios',      path: '/admin/users',        icon: Users         },
    { label: 'Torres',        path: '/admin/buildings',    icon: Building2     },
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
    { label: 'Calendario',    path: '/responsable/calendar',     icon: Calendar     },
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
const btnBase   = 'relative flex items-center gap-1.5 px-3 h-full text-xs font-semibold tracking-wide uppercase transition-colors duration-150';
const btnActive  = 'text-[var(--color-primary)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[var(--color-primary)] after:rounded-t-sm';
const btnDefault = 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]';

export const Layout = ({ children }: LayoutProps) => {
  const { user, logout, impersonationMode, stopImpersonation, currentResidence } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const effectiveRole = impersonationMode ? 'ADMIN' : (user?.role ?? '');
  const navItems      = NAV[effectiveRole] ?? [];
  const homePath      = impersonationMode ? '/admin' : (HOME[user?.role ?? ''] ?? '/');
  const isActive      = (path: string) => location.pathname === path;
  const showBanner    = impersonationMode || (user?.availableResidences && user.availableResidences.length > 1 && currentResidence);

  // User initials for the avatar chip
  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join('').toUpperCase();

  return (
    <div className="min-h-screen bg-[var(--color-background)]">

      {/* Context banner */}
      {showBanner && (
        <div className="bg-primary border-b border-[var(--color-border)] text-white px-4 py-2 relative z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-white/80">
              <Building2 size={14} strokeWidth={1.5} aria-hidden="true" />
              {currentResidence?.name || 'Residencia Seleccionada'}
            </span>
            <button
              onClick={impersonationMode
                ? () => { stopImpersonation(); navigate('/superadmin'); }
                : () => navigate('/select-residence')}
              className="bg-[var(--color-surface)] text-[var(--color-primary)]
                         px-3 py-1 rounded-[var(--radius-sm)]
                         text-xs font-semibold tracking-wide hover:opacity-90 transition-opacity"
            >
              {impersonationMode ? 'Salir de la vista' : 'Cambiar Residencia'}
            </button>
          </div>
        </div>
      )}

      <nav
        aria-label="Navegación principal"
        className="bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-40"
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
                           rounded-[var(--radius-sm)] text-[var(--color-text-secondary)]
                           hover:bg-[var(--color-background)] transition-colors"
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
                                bg-primary rounded-[var(--radius-sm)]
                                group-hover:opacity-90 transition-opacity">
                  <Building2 size={16} strokeWidth={1.5} className="text-white" aria-hidden="true" />
                </div>
                <span className="hidden sm:block text-xs font-bold tracking-widest uppercase text-[var(--color-text-primary)]">
                  {currentResidence?.name || 'Gestión Residencial'}
                </span>
              </button>
            </div>

            <div className="hidden md:flex items-stretch h-16">
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
              {user?.role !== 'SUPERADMIN' && <Notifications />}

              <button
                onClick={() => navigate('/profile')}
                aria-label={`Perfil de ${user?.firstName} ${user?.lastName}`}
                className="hidden sm:flex items-center gap-2 min-h-[44px] group"
              >
                <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-primary
                                flex items-center justify-center
                                text-white text-xs font-bold tracking-wide
                                group-hover:opacity-90 transition-opacity"
                     aria-hidden="true">
                  {initials || '?'}
                </div>
                <span className="text-xs font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
                  {ROLE_LABEL[user?.role ?? ''] ?? user?.role}
                </span>
              </button>

              {!impersonationMode && (
                <button
                  onClick={async () => { await logout(); navigate('/login'); }}
                  className="text-xs font-semibold tracking-wide uppercase text-[var(--color-text-muted)]
                             hover:text-[var(--color-danger)] transition-colors min-h-[44px] px-2"
                >
                  Salir
                </button>
              )}
            </div>

          </div>
        </div>

        {open && (
          <div id="mobile-nav" className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="px-2 py-3 space-y-0.5">
              {navItems.map(({ path, label, icon: Icon }) => (
                <button
                  key={path}
                  onClick={() => { navigate(path); setOpen(false); }}
                  aria-current={isActive(path) ? 'page' : undefined}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5
                              rounded-[var(--radius-sm)] text-sm font-medium transition-colors
                              ${isActive(path)
                                ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background)]'
                              }`}
                >
                  <Icon size={14} strokeWidth={1.5} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-[var(--color-border)] flex items-center gap-2">
              <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-primary
                              flex items-center justify-center text-white text-xs font-bold"
                   aria-hidden="true">
                {initials || '?'}
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                {user?.firstName} {user?.lastName} · {ROLE_LABEL[user?.role ?? ''] ?? user?.role}
              </p>
            </div>
          </div>
        )}
      </nav>

      {location.pathname !== homePath && (
        <button
          onClick={() => navigate(homePath)}
          aria-label="Volver al inicio"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2
                     bg-primary text-white text-xs font-semibold tracking-wide uppercase
                     px-4 py-3 min-h-[44px] rounded-[var(--radius-sm)]
                     hover:opacity-90 motion-safe:transition-opacity"
        >
          <ArrowLeft size={13} strokeWidth={1.5} aria-hidden="true" />
          Inicio
        </button>
      )}

      <main>{children}</main>
    </div>
  );
};
