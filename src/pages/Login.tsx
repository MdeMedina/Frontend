import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const loggedUser = await login(email, password);
      const routes: Record<string, string> = {
        ADMIN:            '/admin',
        OWNER:            '/propietario',
        ASSIGNED_MANAGER: '/responsable',
        CONCIERGE:        '/conserje',
      };
      navigate(routes[loggedUser.role] ?? '/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Credenciales incorrectas.');
    } finally {
      setIsLoading(false);
    }
  };

  // Shared input classes — both fields follow the same base, size differentiated below
  const inputBase =
    'w-full border border-[var(--color-border)] rounded-[var(--radius-sm)] ' +
    'bg-[var(--color-surface)] text-[var(--color-text-primary)] ' +
    'placeholder:text-[var(--color-text-muted)] outline-none ' +
    'focus:border-[var(--color-primary)] transition-colors duration-200';

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — brand statement (desktop only) ─────────── */}
      <div className="hidden lg:flex lg:w-[55%] bg-primary flex-col justify-between p-16">
        
        {/* Logotype */}
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
            Gestión de<br />
            <span className="text-action">Precisión.</span>
          </h1>
          <p className="mt-8 text-white/60 text-base leading-relaxed max-w-xs">
            Control total de residencias, reservas y peticiones en un sistema
            diseñado para rigor operacional.
          </p>
        </div>

        {/* Footer note */}
        <p className="text-white/30 text-xs tracking-wide">
          Acceso restringido · Solo personal autorizado
        </p>
      </div>

      {/* ── Right panel — form ───────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-[var(--color-background)] px-8 lg:px-16">
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
