import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { residencesApi, type Residence } from '../../api/residences';
import { buildingsApi } from '../../api/buildings';
import { Layout } from '../../components/Layout';
import { Modal } from '../../components/Modal';
import { Landmark, Users, Building2, Building, Plus, Trash2 } from 'lucide-react';

const card = 'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-[var(--shadow-surgical)]';
const skel = 'bg-[var(--color-background)] rounded-xl animate-pulse';

const ACTIONS = [
  { label: 'Gestionar Residencias', sub: 'Crear, editar o desactivar residencias', icon: Landmark, path: '/superadmin/residences' },
  { label: 'Gestionar Administradores', sub: 'Ver y gestionar cuentas de administradores', icon: Users, path: '/superadmin/administrators' },
];

export function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { stopImpersonation, startImpersonation, selectResidence, selectBuilding } = useAuth();
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

  // States for residence creation
  const [isResidenceModalOpen, setIsResidenceModalOpen] = useState(false);
  const [newResidenceName, setNewResidenceName] = useState('');
  const [isCreatingResidence, setIsCreatingResidence] = useState(false);

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

  const handleDeleteTower = async (e: React.MouseEvent, towerId: string, towerName: string) => {
    e.stopPropagation();
    if (!window.confirm(`¿Está seguro de que desea eliminar la torre "${towerName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await buildingsApi.delete(towerId);
      fetchResidences();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Error al eliminar la torre');
    }
  };

  const handleCreateResidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResidenceName.trim()) return;

    try {
      setIsCreatingResidence(true);
      await residencesApi.create(newResidenceName.trim());
      setNewResidenceName('');
      setIsResidenceModalOpen(false);
      fetchResidences();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Error al crear la residencia');
    } finally {
      setIsCreatingResidence(false);
    }
  };

  useEffect(() => { 
    selectResidence(null);
    selectBuilding(null);
    stopImpersonation(); 
    fetchResidences(); 
  }, []);


  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div role="alert"
            className="flex items-center gap-3 border border-[var(--color-danger)] bg-[var(--color-danger-subtle)]
                          rounded-lg px-4 py-3 mb-8">
            <p className="text-sm text-[var(--color-danger)]">{error}</p>
            <button onClick={fetchResidences}
              className="ml-auto text-xs font-semibold text-[var(--color-danger)] hover:opacity-70 transition-opacity">
              Reintentar
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-[var(--color-text-muted)]">
            Gestión de Residencias
          </h2>
          <button
            onClick={() => setIsResidenceModalOpen(true)}
            className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg hover:opacity-90 transition-all active:scale-[0.98] shadow-lg shadow-[var(--color-primary)]/20"
          >
            <Plus size={14} strokeWidth={3} />
            Crear Residencia
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
          {loading ? (
            <>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className={`${skel} h-40`} />)}
            </>
          ) : error ? null : residences.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-sm">
              <p className="text-sm text-[var(--color-text-muted)] mb-4 uppercase tracking-widest font-bold">No hay residencias registradas</p>
              <button
                onClick={() => setIsResidenceModalOpen(true)}
                className="bg-[var(--color-primary)] text-white text-[10px] font-bold uppercase tracking-widest
                           px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
                Crear primera residencia
              </button>
            </div>
          ) : (
            <>
              {residences.map((r) => (
                <div
                  key={r.id}
                  className={`${card} overflow-hidden flex flex-col p-0 text-left transition-all group animate-in fade-in slide-in-from-bottom duration-500`}
                >
                  <div className="h-2 bg-[#001640]" />
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex flex-col gap-4 mb-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center justify-center w-12 h-12 shrink-0 bg-[var(--color-primary-subtle)] rounded-lg group-hover:scale-105 transition-transform border border-[var(--color-primary)]/10">
                          <Landmark size={24} strokeWidth={1.5} className="text-[var(--color-primary)]" aria-hidden="true" />
                        </div>
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg shrink-0
                          ${r.isActive ? 'bg-[var(--color-action-subtle)] text-[var(--action-text)]' : 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)]'}`}>
                          {r.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-[var(--color-text-primary)] leading-tight line-clamp-1 mb-1">
                          {r.name}
                        </p>
                        {r.admins?.find(a => a.isMain) && (
                          <div className="flex items-center gap-1.5 opacity-60">
                            <Users size={12} strokeWidth={2} className="text-[var(--color-text-muted)] mt-[1px]" />
                            <span className="text-[10px] font-bold uppercase tracking-widest truncate">
                              {(() => {
                                const main = r.admins?.find(a => a.isMain);
                                return `${main?.firstName} ${main?.lastName}`;
                              })()}
                            </span>
                          </div>
                        )}
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
                            className="px-3 py-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg flex items-center justify-between group/tower hover:border-[var(--color-primary)] transition-colors cursor-pointer pr-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${b.isActive ? 'bg-[var(--color-action)]' : 'bg-[var(--color-danger)]'}`} />
                              <span className="text-[10px] font-black text-[var(--color-text-secondary)] group-hover/tower:text-[var(--color-primary)] transition-colors truncate uppercase tracking-widest">
                                {b.name}
                              </span>
                            </div>
                            <button
                              onClick={(e) => handleDeleteTower(e, b.id, b.name)}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] transition-all opacity-0 group-hover/tower:opacity-100"
                              title="Eliminar torre"
                            >
                              <Trash2 size={12} strokeWidth={2.5} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="flex-1 flex items-center justify-center border border-dashed border-[var(--color-border)] rounded-lg py-4">
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
                      className="w-full py-2.5 rounded-lg border border-dashed border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)] text-[11px] font-bold uppercase tracking-[0.1em] hover:bg-[var(--color-primary)] hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={14} strokeWidth={3} />
                      Añadir torre
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
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
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-sm focus:border-[var(--color-primary)] focus:outline-none transition-colors"
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
              className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
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

      {/* Modal para añadir nueva residencia */}
      <Modal
        isOpen={isResidenceModalOpen}
        onClose={() => !isCreatingResidence && setIsResidenceModalOpen(false)}
        title="Crear Nueva Residencia"
      >
        <form onSubmit={handleCreateResidence} className="space-y-6 py-2">
          <div>
            <label htmlFor="residenceName" className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              Nombre de la Residencia
            </label>
            <input
              id="residenceName"
              type="text"
              value={newResidenceName}
              onChange={(e) => setNewResidenceName(e.target.value)}
              placeholder="Ej. Condominio Vicuña, Edificio Almagro..."
              autoFocus
              className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-sm focus:border-[var(--color-primary)] focus:outline-none transition-colors"
              disabled={isCreatingResidence}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsResidenceModalOpen(false)}
              disabled={isCreatingResidence}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreatingResidence || !newResidenceName.trim()}
              className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {isCreatingResidence ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Iniciando...
                </>
              ) : 'Crear Residencia'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
