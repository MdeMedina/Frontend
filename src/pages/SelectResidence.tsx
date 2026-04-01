import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Building, LogOut, ArrowRight, Loader2, Plus, X } from 'lucide-react';
import { Modal } from '../components/Modal';
import { buildingsApi } from '../api/buildings';

export const SelectResidence = () => {
  const { user, selectResidence, selectBuilding, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const residences = useMemo(() => user?.availableResidences || [], [user]);

  // Animation states
  const [isEntering, setIsEntering] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Selective start (if coming from breadcrumb level 2)
  const [selectedTempResidence, setSelectedTempResidence] = useState<any>(null);

  // Modal state (SuperAdmin only)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTowerName, setNewTowerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Curtain effect: slide in from left on mount
    const timer = setTimeout(() => setIsEntering(false), 100);

    // Sync selective start if data is available
    const state = location.state as any;
    if (!selectedTempResidence && state?.startWithResidence && user?.availableResidences) {
      const full = user.availableResidences.find((r: any) => r.id === state.startWithResidence.id);
      if (full) setSelectedTempResidence(full);
    }

    return () => clearTimeout(timer);
  }, [user, navigate, location.state, selectedTempResidence]);

  const handleSelectResidence = (residence: any) => {
    if (residence.buildings && residence.buildings.length > 0) {
      if (residence.buildings.length === 1) {
        // Direct selection if only one tower
        finalizeSelection(residence, residence.buildings[0]);
        return;
      }
      // Onda expansiva out
      setIsTransitioning(true);
      setTimeout(() => {
        setSelectedTempResidence(residence);
        // Fade & zoom in the new content
        setIsTransitioning(false);
      }, 500);
    } else {
      finalizeSelection(residence, null);
    }
  };

  const finalizeSelection = (residence: any, building: any) => {
    setIsExiting(true);
    setTimeout(() => {
      selectResidence(residence);
      selectBuilding(building);
      
      const routes: Record<string, string> = {
        ADMIN: '/admin',
        OWNER: '/propietario',
        ASSIGNED_MANAGER: '/responsable',
        CONCIERGE: '/conserje',
        SUPERADMIN: '/superadmin'
      };
      navigate(routes[user?.role ?? ''] ?? '/', { replace: true });
    }, 800);
  };

  const handleLogout = async () => {
    setIsExiting(true);
    setTimeout(async () => {
      await logout();
      navigate('/login');
    }, 800);
  };

  const handleCreateTower = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTowerName.trim() || !selectedTempResidence) return;
    try {
      setIsCreating(true);
      await buildingsApi.create({ 
        name: newTowerName.trim(),
        residenceId: selectedTempResidence.id 
      });
      setNewTowerName('');
      setIsModalOpen(false);
      await refreshUser();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al crear la torre');
    } finally {
      setIsCreating(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden bg-transparent pointer-events-none">
      
      {/* ── Blue Curtain (Panel) ────────────────────────────────────────── */}
      <div 
        className={`absolute inset-0 bg-primary z-10 transition-all duration-800 cubic-bezier(0.16, 1, 0.3, 1) pointer-events-auto
                    ${isEntering ? '-translate-x-full' : (isExiting ? '-translate-x-full' : 'translate-x-0')}`}
      >
        
        {/* Top Bar: Logout */}
        <div className="absolute top-0 left-0 right-0 p-8 flex justify-end z-20">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 border border-white/20 text-white/70 hover:text-white hover:bg-white/20 transition-all text-xs font-bold uppercase tracking-widest"
          >
            <LogOut size={14} strokeWidth={2} />
            Cerrar Sesión
          </button>
        </div>

        {/* Selection Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
          <div className={`transition-all duration-500 ease-in-out flex flex-col items-center justify-center w-full max-w-[1200px]
                           ${isExiting ? 'opacity-0 scale-95 -translate-x-10' : (isEntering ? 'opacity-0 scale-105' : (!isTransitioning ? 'opacity-100 scale-100 blur-none' : 'opacity-0 scale-[1.15] blur-md translate-y-8'))}`}>
            
            {!selectedTempResidence ? (
              <>
                <h2 className="text-white text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-center animate-in fade-in zoom-in-95 duration-700">
                  Bienvenido a <span className="text-emerald-300">Hubitat</span>
                </h2>
                <p className="text-white/80 text-sm lg:text-lg tracking-wide text-center max-w-md animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
                  Por favor seleccione la residencia que desea gestionar:
                </p>
              </>
            ) : (
              <>
                <h2 className="text-white text-3xl lg:text-4xl font-bold tracking-tight mb-3 text-center animate-in fade-in zoom-in-95 duration-700">
                  Residencia seleccionada: <span className="text-emerald-300">{selectedTempResidence.name}</span>
                </h2>
                <p className="text-white/80 text-sm lg:text-lg tracking-wide text-center max-w-md animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
                  Seleccione una torre:
                </p>
              </>
            )}

            {/* Selection Grid */}
            <div className="mt-12 flex flex-wrap justify-center gap-6 w-full">
              {(selectedTempResidence ? selectedTempResidence.buildings : residences).map((item: any, idx: number) => {
                const isBuilding = !!selectedTempResidence;
                const title = item.name;

                return (
                  <button
                    key={item.id}
                    onClick={() => isBuilding ? finalizeSelection(selectedTempResidence, item) : handleSelectResidence(item)}
                    className="bg-white rounded-[1.5rem] p-8 shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] hover:-translate-y-2 transition-all duration-300 w-full sm:w-[240px] flex flex-col items-center justify-center gap-5 group animate-in zoom-in-90 fade-in fill-mode-both"
                    style={{ animationDelay: `${(isTransitioning ? 0 : 500) + idx * 100}ms` }}
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

              {/* Add Tower Button (SuperAdmin on Selection Step 2) */}
              {user?.role === 'SUPERADMIN' && selectedTempResidence && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-white/10 border-2 border-dashed border-white/20 rounded-[1.5rem] p-8 hover:bg-white/20 hover:border-white/40 transition-all duration-300 w-full sm:w-[240px] flex flex-col items-center justify-center gap-4 group animate-in zoom-in-90 fade-in fill-mode-both"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white">
                    <Plus size={24} />
                  </div>
                  <span className="text-sm font-bold text-white uppercase tracking-widest">Añadir Torre</span>
                </button>
              )}
            </div>

            {/* Back to Residences button */}
            {selectedTempResidence && residences.length > 1 && !isExiting && (
              <button
                onClick={() => {
                  setSelectedTempResidence(null);
                  navigate(location.pathname, { replace: true, state: {} });
                }}
                className="mt-12 text-white/50 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center">
                  <ArrowRight size={12} className="rotate-180" />
                </div>
                Volver a Residencias
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal for SuperAdmin */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isCreating && setIsModalOpen(false)}
        title="Añadir Nueva Torre"
      >
        <form onSubmit={handleCreateTower} className="space-y-6 py-2">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Nombre de la Torre</label>
            <input
              type="text"
              value={newTowerName}
              onChange={(e) => setNewTowerName(e.target.value)}
              placeholder="Ej. Torre A"
              autoFocus
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreating || !newTowerName.trim()}
              className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              {isCreating ? <Loader2 size={14} className="animate-spin" /> : 'Crear Torre'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
