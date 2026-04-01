import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Building, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, selectResidence, selectBuilding } = useAuth();
  const navigate = useNavigate();
  const [showSelection, setShowSelection] = useState(false);
  const [selectionUser, setSelectionUser] = useState<any>(null);
  const [selectedResidence, setSelectedResidence] = useState<any>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const loggedUser = await login(email, password);
      const routes: Record<string, string> = {
        ADMIN: '/admin',
        OWNER: '/propietario',
        ASSIGNED_MANAGER: '/responsable',
        CONCIERGE: '/conserje',
      };

      const hasMultipleOptions =
        (loggedUser.availableResidences && loggedUser.availableResidences.length > 1) ||
        (loggedUser.availableResidences?.length === 1 &&
          loggedUser.availableResidences[0].buildings &&
          loggedUser.availableResidences[0].buildings.length > 1);

      if (hasMultipleOptions) {
        setSelectionUser(loggedUser);
        setShowSelection(true);
        // We do not navigate yet; the residence selection UI handle the navigation later.
      } else {
        navigateToRole(loggedUser.role);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Credenciales incorrectas.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToRole = (roleFallback?: string) => {
    setIsExiting(true);
    setTimeout(() => {
      const routes: Record<string, string> = {
        SUPERADMIN: '/superadmin',
        ADMIN: '/admin',
        OWNER: '/propietario',
        ASSIGNED_MANAGER: '/responsable',
        CONCIERGE: '/conserje',
      };
      const finalRole = roleFallback || selectionUser?.role;
      navigate(routes[finalRole] ?? '/', { replace: true });
    }, 800);
  }

  const handleSelectResidence = (residence: any) => {
    if (residence.buildings && residence.buildings.length > 0) {
      if (residence.buildings.length === 1) {
        selectResidence(residence);
        selectBuilding(residence.buildings[0]);
        navigateToRole();
        return;
      }
      setIsTransitioning(true);
      setTimeout(() => {
        setSelectedResidence(residence);
        setIsTransitioning(false);
      }, 500); 
    } else {
      selectResidence(residence);
      selectBuilding(null);
      navigateToRole();
    }
  };

  const handleSelectBuilding = (building: any) => {
    selectResidence(selectedResidence);
    selectBuilding(building);
    navigateToRole();
  };

  const inputBase =
    'w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] ' +
    'bg-[var(--color-surface)] text-[var(--color-text-primary)] ' +
    'placeholder:text-[var(--color-text-muted)] outline-none ' +
    'focus:border-[var(--color-primary)] transition-colors duration-200';

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[var(--color-background)]">

      <div
        className={`absolute top-0 bottom-0 left-0 bg-primary z-20 
                    transition-all duration-800 cubic-bezier(0.16, 1, 0.3, 1) pointer-events-none
                    ${isExiting 
                      ? '-translate-x-full w-full' 
                      : ((showSelection || isTransitioning)
                          ? 'w-full translate-x-0 translate-y-0' 
                          : 'lg:w-[55%] w-full -translate-y-full lg:translate-y-0 translate-x-0')
                     } 
                    flex flex-col justify-between p-8 lg:p-16`}
      >
        <div className={`transition-all duration-700 ease-out flex flex-col justify-between h-full
                         ${(showSelection || isExiting || isTransitioning) ? 'opacity-0 translate-y-10 scale-95 pointer-events-none' : 'opacity-100 translate-y-0 scale-100 delay-300 pointer-events-auto'}`}>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-[var(--radius-sm)] bg-white/10 border border-white/20">
              <Building2 className="text-white" size={18} strokeWidth={1.5} aria-hidden="true" />
            </div>
            <span className="text-white/70 text-sm font-medium tracking-widest uppercase">
              Gestión Residencial
            </span>
          </div>

          {/* Hero copy */}
          <div>
            <p className="text-action text-xs font-semibold tracking-[0.2em] uppercase mb-6">
              Plataforma de Control
            </p>
            <h1 className="text-fluid-hero text-white font-bold leading-none tracking-tight">
              Hubitat
            </h1>
            <p className="mt-8 text-white/60 text-base leading-relaxed max-w-xs">
              Control total de residencias, reservas y peticiones en un sistema
              diseñado para rigor operacional.
            </p>
          </div>

          {/* Footer note */}
          <p className="hidden lg:block text-white/30 text-xs tracking-wide">
            Acceso restringido · Solo personal autorizado
          </p>
        </div>

        {/* Selection State New Content */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none`}>
          <div className={`transition-all duration-500 ease-in-out flex flex-col items-center justify-center w-full max-w-[1200px] pointer-events-auto
                           ${isExiting ? 'opacity-0 scale-95 -translate-x-10' : (showSelection && !isTransitioning ? 'opacity-100 scale-100 blur-none delay-300' : 'opacity-0 scale-[1.15] blur-md translate-y-8 pointer-events-none')}`}>
            
            {!selectedResidence ? (
              <>
                <h2 className="text-white text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-center px-4 animate-in fade-in zoom-in-95 duration-700">
                  Bienvenido a <span className="text-emerald-300">Hubitat</span>
                </h2>
                <p className="text-white/80 text-sm lg:text-lg tracking-wide text-center px-4 max-w-md animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
                  Por favor seleccione la residencia que desea gestionar:
                </p>
              </>
            ) : (
              <>
                <h2 className="text-white text-3xl lg:text-4xl font-bold tracking-tight mb-3 text-center px-4 animate-in fade-in zoom-in-95 duration-700">
                  Residencia seleccionada: <span className="text-emerald-300">{selectedResidence.name}</span>
                </h2>
                <p className="text-white/80 text-sm lg:text-lg tracking-wide text-center px-4 max-w-md animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
                  Seleccione una torre:
                </p>
              </>
            )}

            {/* Tarjetas de Selección */}
            <div className="mt-12 flex flex-wrap justify-center gap-6 w-full px-6">
              {(selectedResidence ? selectedResidence.buildings : selectionUser?.availableResidences)?.map((item: any, idx: number) => {
                const isBuilding = !!selectedResidence;
                const title = item.name;

                return (
                  <button
                    key={item.id}
                    onClick={() => isBuilding ? handleSelectBuilding(item) : handleSelectResidence(item)}
                    className="bg-white rounded-[1.5rem] p-8 shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] hover:-translate-y-2 transition-all duration-300 w-full sm:w-[240px] flex flex-col items-center justify-center gap-5 group animate-in zoom-in-90 fade-in fill-mode-both"
                    style={{ animationDelay: `${(isBuilding ? 0 : 700) + idx * 100}ms` }}
                  >
                    <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors duration-300">
                      {isBuilding ? (
                        <Building size={28} className="text-[#001640] group-hover:text-blue-600 transition-colors duration-300" />
                      ) : (
                        <Building2 size={28} className="text-[#001640] group-hover:text-blue-600 transition-colors duration-300" />
                      )}
                    </div>
                    <span className="text-xl font-bold text-gray-900 group-hover:text-blue-600 text-center leading-tight tracking-tight transition-colors duration-300">
                      {title}
                    </span>
                    
                    {!isBuilding && item.buildings && item.buildings.length > 0 && (
                      <span className="text-xs font-semibold text-gray-400 group-hover:text-blue-400 uppercase tracking-widest transition-colors duration-300">
                        {item.buildings.length} Torre{item.buildings.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

          </div>
        </div>

      </div>

      {/* ── Right panel — form ───────────────────────────────────── */}
      <div className={`flex-1 flex items-center justify-center bg-[var(--color-background)] px-8 lg:px-16 lg:ml-[55%] z-10 transition-all duration-700 ${isExiting ? 'opacity-0 translate-x-10 pointer-events-none' : (showSelection ? 'opacity-0 pointer-events-none' : 'opacity-100 delay-300')}`}>
        <div className="w-full max-w-xs">

          {/* Mobile logotype (hidden lg) */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="bg-primary flex items-center justify-center w-9 h-9 rounded-[var(--radius-sm)]">
              <Building2 className="text-white" size={18} strokeWidth={1.5} aria-hidden="true" />
            </div>
            <span className="text-sm font-medium text-[var(--color-text-secondary)] tracking-widest uppercase">
              Gestión Residencial
            </span>
          </div>

          {/* Heading */}
          <div className="anim-1 mb-10">
            <h2 className="text-fluid-title font-bold tracking-tight text-[var(--color-text-primary)]">
              Bienvenido
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Error alert — aria-live so screen readers announce it */}
          <div role="alert" aria-live="polite">
            {error && (
              <div className="anim-1 flex items-start gap-3 bg-danger-subtle border border-danger rounded-[var(--radius-sm)] px-4 py-3 mb-6">
                <AlertCircle size={15} strokeWidth={1.5} className="text-danger mt-0.5 shrink-0" aria-hidden="true" />
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            aria-label="Formulario de inicio de sesión"
            className="space-y-5"
          >
            {/* Email — secondary visual weight */}
            <div className="anim-2">
              <label
                htmlFor="email"
                className="block mb-1.5 text-xs font-semibold tracking-widest uppercase text-[var(--color-text-muted)]"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                aria-required="true"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputBase} px-3 py-2.5 text-sm`}
              />
            </div>

            {/* Password — primary critical input (1.25× scale: text-base, py-3.5) */}
            <div className="anim-3">
              <label
                htmlFor="password"
                className="block mb-1.5 text-xs font-semibold tracking-widest uppercase text-[var(--color-text-muted)]"
              >
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                aria-required="true"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputBase} px-3 py-3.5 text-base`}
              />
            </div>

            {/* CTA — dominant scale, full primary */}
            <div className="anim-4 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                aria-disabled={isLoading}
                className="w-full flex items-center justify-between gap-2
                           px-6 py-4 rounded-[var(--radius-sm)]
                           text-base font-semibold
                           bg-primary text-[var(--color-text-inverse)]
                           hover:opacity-90
                           active:opacity-80
                           transition-opacity duration-150
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span>Iniciando…</span>
                    <Loader2 size={16} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
                  </>
                ) : (
                  <>
                    <span>Iniciar Sesión</span>
                    <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>

    </div>
  );
};
