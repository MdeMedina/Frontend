import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { residencesApi, type Residence } from '../../api/residences';
import { buildingsApi } from '../../api/buildings';
import { Layout } from '../../components/Layout';
import { Modal } from '../../components/Modal';
import { Landmark, Users, Building2, Building, Plus } from 'lucide-react';

const card = 'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)]';
const skel = 'bg-[var(--color-background)] rounded-[var(--radius-sm)] animate-pulse';

const ACTIONS = [
  { label: 'Gestionar Residencias', sub: 'Crear, editar o desactivar residencias', icon: Landmark, path: '/superadmin/residences' },
  { label: 'Gestionar Administradores', sub: 'Ver y gestionar cuentas de administradores', icon: Users, path: '/superadmin/administrators' },
];

export function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { stopImpersonation, startImpersonation } = useAuth();
  const [residences, setResidences] = useState<Residence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  // States for fast tower creation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTowerName, setNewTowerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedResidenceId, setSelectedResidenceId] = useState<string | null>(null);

  const handleCreateTower = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTowerName.trim() || !selectedResidenceId) return;
    
    try {
      setIsCreating(true);
      await buildingsApi.create({ 
        name: newTowerName.trim(),
        residenceId: selectedResidenceId 
      });
      setNewTowerName('');
      setIsModalOpen(false);
      setSelectedResidenceId(null);
      fetchResidences();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Error al crear la torre');
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => { stopImpersonation(); fetchResidences(); }, []);

  const stats = [
    { label: 'Residencias', value: residences.length, color: 'bg-[var(--color-primary)]' },
    { label: 'Usuarios', value: residences.reduce((s, r) => s + (r._count?.users || 0), 0), color: 'bg-blue-500' },
    { label: 'Torres', value: residences.reduce((s, r) => s + (r._count?.buildings || 0), 0), color: 'bg-indigo-500' },
    { label: 'Departamentos', value: residences.reduce((s, r) => s + (r._count?.apartments || 0), 0), color: 'bg-gray-500' },
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Side: Residences (9/12 width) */}
          <div className="lg:col-span-9">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-[var(--color-text-muted)] mb-5">
              Gestión de Residencias
            </h2>

            <div className="max-h-[75vh] overflow-y-auto p-6 bg-[var(--color-background-subtle,rgba(0,0,0,0.02))] border border-[var(--color-border)] rounded-[var(--radius-sm)] shadow-inner custom-scrollbar">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className={`${skel} h-40`} />)}
                </div>
              ) : error ? null : residences.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-[var(--color-text-muted)] mb-4">No hay residencias registradas</p>
                  <button
                    onClick={() => navigate('/superadmin/residences')}
                    className="bg-[var(--color-primary)] text-white text-sm font-semibold
                               px-5 py-2.5 rounded-[var(--radius-sm)] hover:opacity-90 transition-opacity">
                    Crear primera residencia
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {residences.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => navigate(`/superadmin/residences/${r.id}`)}
                      className={`${card} flex flex-col p-6 text-left bg-[var(--color-surface)] hover:bg-[var(--color-background)] transition-all group hover:shadow-md`}
                    >
                      <div className="flex flex-col gap-4 mb-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center justify-center w-12 h-12 shrink-0 bg-[var(--color-primary-subtle)] rounded-[var(--radius-sm)] group-hover:scale-105 transition-transform border border-[var(--color-primary)]/10">
                            <Landmark size={24} strokeWidth={1.5} className="text-[var(--color-primary)]" aria-hidden="true" />
                          </div>
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-[var(--radius-sm)] shrink-0
                            ${r.isActive ? 'bg-[var(--color-action-subtle)] text-[var(--action-text)]' : 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)]'}`}>
                            {r.isActive ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors leading-tight line-clamp-2">
                            {r.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[160px] pr-1 custom-scrollbar mb-4">
                        {r.buildings && r.buildings.length > 0 ? (
                          r.buildings.map(b => (
                            <div
                              key={b.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                startImpersonation(r.id, r.name, b.id, b.name);
                                navigate('/admin');
                              }}
                              className="px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-sm)] flex items-center justify-between group/tower hover:border-[var(--color-primary)] transition-colors cursor-pointer"
                            >
                              <span className="text-[11px] font-bold text-[var(--color-text-secondary)] group-hover/tower:text-[var(--color-primary)] transition-colors truncate uppercase tracking-wider">
                                {b.name}
                              </span>
                              <div className={`w-1.5 h-1.5 rounded-full ${b.isActive ? 'bg-[var(--color-action)]' : 'bg-[var(--color-danger)]'}`} />
                            </div>
                          ))
                        ) : (
                          <div className="flex-1 flex items-center justify-center border border-dashed border-[var(--color-border)] rounded-[var(--radius-sm)] py-4">
                            <span className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-widest">Sin torres</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedResidenceId(r.id);
                          setIsModalOpen(true);
                        }}
                        className="w-full py-2.5 rounded-[var(--radius-sm)] border border-dashed border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)] text-[11px] font-bold uppercase tracking-[0.1em] hover:bg-[var(--color-primary)] hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <Plus size={14} strokeWidth={3} />
                        Añadir torre
                      </button>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Stats Panel (3/12 width) */}
          <div className="lg:col-span-3">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-[var(--color-text-muted)] mb-5">
              Panel de Estadísticas
            </h2>
            <div className={`${card} p-6 flex flex-col gap-6 h-fit shadow-sm`}>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-6">
                      <div className={`${skel} w-3 h-3 rounded-full`} />
                      <div className={`${skel} w-6 h-6 rounded`} />
                      <div className={`${skel} w-24 h-4 rounded`} />
                    </div>
                  ))}
                </div>
              ) : (
                stats.map((s) => (
                  <div key={s.label} className="flex flex-col gap-1.5 min-w-[100px]">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${s.color}`} />
                      <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em] whitespace-nowrap">{s.label}</span>
                    </div>
                    <span className="text-lg font-bold tabular-nums text-[var(--color-text-primary)] leading-none ml-4">{s.value}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Modal para añadir torre desde dashboard */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isCreating && setIsModalOpen(false)}
        title="Añadir Nueva Torre"
      >
        <form onSubmit={handleCreateTower} className="space-y-6 py-2">
          <div>
            <label htmlFor="towerNameDashboard" className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              Nombre de la Torre
            </label>
            <input
              id="towerNameDashboard"
              type="text"
              value={newTowerName}
              onChange={(e) => setNewTowerName(e.target.value)}
              placeholder="Ej. Torre A, Edificio Norte..."
              autoFocus
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-sm)] px-4 py-3 text-sm focus:border-[var(--color-primary)] focus:outline-none transition-colors"
              disabled={isCreating}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isCreating}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreating || !newTowerName.trim()}
              className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-[var(--radius-sm)] text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creando...
                </>
              ) : 'Crear Torre'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
