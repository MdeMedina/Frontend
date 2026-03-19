import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { residencesApi, type Residence } from '../../api/residences';
import { Layout } from '../../components/Layout';
import { Landmark, Users, Building2, Building } from 'lucide-react';

const card = 'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)]';
const skel = 'bg-[var(--color-background)] rounded-[var(--radius-sm)] animate-pulse';

const ACTIONS = [
  { label: 'Gestionar Residencias',     sub: 'Crear, editar o desactivar residencias',     icon: Landmark, path: '/superadmin/residences'     },
  { label: 'Gestionar Administradores', sub: 'Ver y gestionar cuentas de administradores', icon: Users,    path: '/superadmin/administrators' },
];

export function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { stopImpersonation } = useAuth();
  const [residences, setResidences] = useState<Residence[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  const fetchResidences = async () => {
    setError('');
    try {
      setResidences(await residencesApi.getAll());
    } catch {
      setError('No se pudieron cargar las residencias. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { stopImpersonation(); fetchResidences(); }, []);

  const stats = [
    { label: 'Residencias',   value: residences.length,                                              icon: Landmark  },
    { label: 'Usuarios',      value: residences.reduce((s, r) => s + (r._count?.users      || 0), 0), icon: Users     },
    { label: 'Torres',        value: residences.reduce((s, r) => s + (r._count?.buildings  || 0), 0), icon: Building2 },
    { label: 'Departamentos', value: residences.reduce((s, r) => s + (r._count?.apartments || 0), 0), icon: Building  },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="mb-10">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-primary)] mb-2">
            Super Administrador
          </p>
          <h1 className="dashboard-hero-title font-bold tracking-tight text-[var(--color-text-primary)] leading-none">
            Vista General
          </h1>
        </div>

        {error && (
          <div role="alert"
               className="flex items-center gap-3 border border-[var(--color-danger)] bg-[var(--color-danger-subtle)]
                          rounded-[var(--radius-sm)] px-4 py-3 mb-8">
            <p className="text-sm text-[var(--color-danger)]">{error}</p>
            <button onClick={fetchResidences}
              className="ml-auto text-xs font-semibold text-[var(--color-danger)] hover:opacity-70 transition-opacity">
              Reintentar
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className={`${card} p-6 flex flex-col gap-3`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-widest uppercase text-[var(--color-text-muted)]">
                  {label}
                </p>
                <div className="flex items-center justify-center w-7 h-7
                                bg-[var(--color-primary-subtle)] rounded-[var(--radius-sm)]">
                  <Icon size={13} strokeWidth={1.5} className="text-[var(--color-primary)]" aria-hidden="true" />
                </div>
              </div>
              {loading
                ? <div className={`${skel} h-10 w-20`} />
                : <p className="text-4xl font-bold text-[var(--color-text-primary)] leading-none tabular-nums">
                    {value}
                  </p>
              }
            </div>
          ))}
        </div>

        <div className={`${card} mb-6`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-[var(--color-text-muted)]">
              Residencias
            </h2>
            <button
              onClick={() => navigate('/superadmin/residences')}
              aria-label="Ver todas las residencias"
              className="text-xs font-semibold text-[var(--color-primary)] hover:opacity-75 transition-opacity">
              Ver todas →
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map(i => <div key={i} className={`${skel} h-14`} />)}
              </div>
            ) : error ? null : residences.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-[var(--color-text-muted)] mb-4">No hay residencias registradas</p>
                <button onClick={() => navigate('/superadmin/residences')}
                  className="bg-primary text-white text-sm font-semibold
                             px-5 py-2.5 rounded-[var(--radius-sm)] hover:opacity-90 transition-opacity">
                  Crear primera residencia
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {residences.slice(0, 5).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => navigate('/superadmin/residences')}
                    aria-label={`Ver residencia ${r.name}`}
                    className={`${card} w-full text-left px-4 py-3 hover:bg-[var(--color-background)] transition-colors`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{r.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                          {r._count?.users || 0} usuarios · {r._count?.buildings || 0} torres · {r._count?.apartments || 0} departamentos
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-[var(--radius-sm)]
                        ${r.isActive
                          ? 'bg-[var(--color-action-subtle)] text-[var(--color-action)]'
                          : 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)]'}`}>
                        {r.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={card}>
          <div className="px-6 py-4 border-b border-[var(--color-border)]">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-[var(--color-text-muted)]">
              Acciones Rápidas
            </h2>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {ACTIONS.map(({ label, sub, icon: Icon, path }) => (
              <button key={path} onClick={() => navigate(path)}
                className={`${card} flex items-center gap-4 p-5 text-left
                            hover:bg-[var(--color-background)] transition-colors group`}>
                <div className="flex items-center justify-center w-10 h-10 shrink-0
                                bg-[var(--color-primary-subtle)] rounded-[var(--radius-sm)]
                                group-hover:opacity-80 transition-opacity">
                  <Icon size={18} strokeWidth={1.5} className="text-[var(--color-primary)]" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{label}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
}
