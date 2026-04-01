import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ChevronRight } from 'lucide-react';

export const Breadcrumbs = () => {
  const { user, currentResidence, currentBuilding, selectResidence, selectBuilding, stopImpersonation } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Mapeo de rutas a nombres amigables
  const routeLabels: Record<string, string> = {
    'admin': 'Administración',
    'superadmin': 'Superadmin',
    'propietario': 'Propietario',
    'responsable': 'Responsables',
    'conserje': 'Conserje',
    'apartments': 'Departamentos',
    'users': 'Usuarios',
    'reservations': 'Reservas',
    'petitions': 'Peticiones',
    'calendar': 'Calendario',
    'audit': 'Registros',
    'managers': 'Responsables',
    'administrators': 'Administradores',
    'profile': 'Perfil'
  };

  const pathnames = location.pathname.split('/').filter((x) => x);
  
  const isSuperAdmin = user?.role === 'SUPERADMIN';

  const handleLevelClick = (level: 'residence' | 'building') => {
    if (isSuperAdmin && currentResidence) {
      // Para SuperAdmin, siempre volver al Dashboard principal ya que ResidencePanel fue eliminado
      stopImpersonation();
      selectResidence(null);
      selectBuilding(null);
      navigate('/superadmin');
      return;
    }

    if (level === 'residence') {
      navigate('/select-residence');
    } else if (level === 'building') {
      navigate('/select-residence', { state: { startWithResidence: currentResidence } });
    }
  };

  const getPageLabel = () => {
    if (pathnames.length === 0) return null;
    const last = pathnames[pathnames.length - 1];
    const prev = pathnames[pathnames.length - 2];

    const homeRoles = ['admin', 'superadmin', 'propietario', 'responsable', 'conserje'];
    if (pathnames.length === 1 && homeRoles.includes(last)) return 'Inicio';

    // Para Superadmin viendo una residencia específica, el ID no aporta información extra
    // si ya tenemos el nivel de Residencia arriba.
    if (prev === 'residences' && isSuperAdmin) return null; 

    if (routeLabels[last]) return routeLabels[last];
    
    if (/^[0-9a-fA-F-]+$/.test(last) && last.length > 10) return 'Detalle';

    return last;
  };

  const pageLabel = getPageLabel();

  const Separator = () => (
    <ChevronRight size={12} className="text-slate-300 shrink-0" strokeWidth={3} />
  );

  const BreadcrumbLink = ({ children, onClick, to, isActive }: { children: React.ReactNode, onClick?: () => void, to?: string, isActive?: boolean }) => {
    const className = `text-[13px] font-black uppercase tracking-[0.15em] transition-colors ${isActive ? 'text-slate-900 cursor-default' : 'text-slate-400 hover:text-slate-600 cursor-pointer'}`;
    
    if (to && !isActive) {
      return (
        <Link 
          to={to} 
          className={className}
          onClick={() => {
            if (onClick) onClick();
          }}
        >
          {children}
        </Link>
      );
    }
    
    return (
      <button
        type="button"
        onClick={isActive ? undefined : onClick}
        disabled={isActive}
        className={className}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="bg-white border-b border-white/50 shadow-[var(--shadow-surgical)] relative z-30">
      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3 overflow-x-auto no-scrollbar whitespace-nowrap">
        
        {/* Nivel Superadmin (Solo si es Superadmin) */}
        {isSuperAdmin && (
          <>
            <BreadcrumbLink 
              to="/superadmin" 
              isActive={location.pathname === '/superadmin' || location.pathname === '/superadmin/'}
              onClick={() => {
                selectResidence(null);
                selectBuilding(null);
                stopImpersonation();
                navigate('/superadmin');
              }}
            >
              Superadmin
            </BreadcrumbLink>
            <Separator />
          </>
        )}

        {/* Nivel Residencia */}
        {currentResidence && (
          <>
            <BreadcrumbLink 
              onClick={() => handleLevelClick('residence')}
              isActive={false} // Siempre permitir clic para re-seleccionar residencia
            >
              {currentResidence.name}
            </BreadcrumbLink>
            {(currentBuilding || pageLabel) && <Separator />}
          </>
        )}

        {/* Nivel Torre */}
        {currentBuilding && (
          <>
            <BreadcrumbLink 
              onClick={() => handleLevelClick('building')}
              isActive={false} // Siempre permitir clic para re-seleccionar torre
            >
              {currentBuilding.name}
            </BreadcrumbLink>
            {pageLabel && <Separator />}
          </>
        )}

        {/* Nivel Página Actual */}
        {pageLabel && (
          <span className="text-[13px] font-black uppercase tracking-[0.15em] text-slate-900">
            {pageLabel}
          </span>
        )}
      </nav>
    </div>
  );
};
