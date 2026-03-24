import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, ArrowRight, LogOut, ShieldAlert, Landmark, ArrowLeft, Plus } from 'lucide-react';
import { Modal } from '../components/Modal';
import { buildingsApi } from '../api/buildings';

export const SelectResidence = () => {
  const { user, selectResidence, selectBuilding, logout, currentResidence, refreshUser } = useAuth();
  const navigate = useNavigate();

  const residences = useMemo(() => user?.availableResidences || [], [user]);

  const [selectedTempResidence, setSelectedTempResidence] = useState<{ id: string, name: string, buildings?: any[] } | null>(() => {
    if (currentResidence && user?.availableResidences) {
      return user.availableResidences.find((r: any) => r.id === currentResidence.id) || null;
    }
    return null;
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTowerName, setNewTowerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // Si no hay usuario, ir al login
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Determinar la residencia activa para mostrar sus torres
  const activeResidence = useMemo(() => {
    if (residences.length === 1) return residences[0];
    return selectedTempResidence;
  }, [residences, selectedTempResidence]);

  const handleSelect = (residence: { id: string; name: string }, building: { id: string; name: string }) => {
    selectResidence(residence);
    selectBuilding(building);
    
    // Redirigir según el rol
    switch (user?.role) {
      case 'ADMIN':
        navigate('/admin');
        break;
      case 'OWNER':
        navigate('/propietario');
        break;
      default:
        navigate('/');
    }
  };

  const handleCreateTower = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTowerName.trim() || !activeResidence) return;
    
    try {
      setIsCreating(true);
      await buildingsApi.create({ 
        name: newTowerName.trim(),
        residenceId: activeResidence.id 
      });
      setNewTowerName('');
      setIsModalOpen(false);
      
      // Actualizar el estado del usuario para obtener las nuevas torres
      await refreshUser();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Error al crear la torre');
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-[var(--color-primary-subtle)] text-[var(--color-primary)] rounded-[var(--radius-full)] flex items-center justify-center mb-4">
            {!activeResidence ? <Landmark className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">
            {!activeResidence ? 'Seleccione una Residencia' : 'Seleccione una Torre'}
          </h2>
          <p className="mt-3 text-sm text-[var(--color-text-muted)] max-w-sm mx-auto">
            {!activeResidence 
              ? 'Por favor, elija la residencia a la que desea ingresar para ver sus torres.'
              : `Seleccione la torre específica dentro de ${activeResidence.name} a la que desea ingresar.`}
          </p>
        </div>
        
        <div className="mt-10 space-y-4">
          
          {residences.length > 0 ? (
            <div className="grid gap-4">
              {/* PASO 1: SELECCION DE RESIDENCIA (Si tiene > 1) */}
              {!activeResidence && residences.length > 1 && residences.map((res) => (
                <button
                  key={res.id}
                  onClick={() => setSelectedTempResidence(res)}
                  className="group w-full flex items-center justify-between p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-sm hover:shadow-md hover:border-[var(--color-primary)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 flex-shrink-0 rounded-[var(--radius-sm)] bg-[var(--color-background-subtle)] flex items-center justify-center text-[var(--color-text-muted)] group-hover:bg-[var(--color-primary-subtle)] group-hover:text-[var(--color-primary)] transition-colors">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-md font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">
                        {res.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        {res.buildings?.length || 0} Torres
                      </p>
                    </div>
                  </div>
                  <div className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </button>
              ))}

              {/* PASO 2: SELECCION DE TORRE */}
              {activeResidence && (
                <>
                  {residences.length > 1 && (
                    <button
                      onClick={() => setSelectedTempResidence(null)}
                      className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Volver a Residencias
                    </button>
                  )}
                  {activeResidence.buildings && activeResidence.buildings.length > 0 ? (
                    activeResidence.buildings.map((b, idx) => (
                      <button
                        key={`${b.id}-${idx}`}
                        onClick={() => handleSelect({ id: activeResidence.id, name: activeResidence.name }, b)}
                        className="group w-full flex items-center justify-between p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-sm hover:shadow-md hover:border-[var(--color-primary)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 flex-shrink-0 rounded-[var(--radius-sm)] bg-[var(--color-background-subtle)] flex items-center justify-center text-[var(--color-text-muted)] group-hover:bg-[var(--color-primary-subtle)] group-hover:text-[var(--color-primary)] transition-colors">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-md font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                              {b.name}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 max-w-[200px] truncate">
                              {activeResidence.name}
                            </p>
                          </div>
                        </div>
                        <div className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all">
                          <ArrowRight className="h-5 w-5" />
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 bg-amber-50 border border-amber-200 rounded-[var(--radius-md)] text-amber-800">
                      <ShieldAlert className="h-8 w-8 mb-3 text-amber-500" />
                      <p className="text-center font-medium">No hay torres configuradas</p>
                      <p className="text-center text-sm mt-1 opacity-80">
                        Esta residencia todavía no tiene torres activas.
                      </p>
                    </div>
                  )}

                  {/* Add Tower Button (Only for SuperAdmins) */}
                  {user?.role === 'SUPERADMIN' && (
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="w-full flex items-center justify-center gap-3 p-5 bg-[#001529] text-white rounded-[var(--radius-md)] shadow-sm hover:shadow-md hover:bg-[#002140] transition-all font-bold uppercase tracking-[0.15em] mt-4"
                    >
                      <Plus className="h-5 w-5" />
                      Añadir Torre
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-amber-50 border border-amber-200 rounded-[var(--radius-md)] text-amber-800">
              <ShieldAlert className="h-8 w-8 mb-3 text-amber-500" />
              <p className="text-center font-medium">No hay acceso configurado</p>
              <p className="text-center text-sm mt-1 opacity-80">
                Su usuario no tiene acceso a ninguna residencia.
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
          <button
            onClick={handleLogout}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-[var(--color-border)] shadow-sm text-sm font-medium rounded-[var(--radius-button)] text-[var(--color-text)] bg-[var(--color-surface)] hover:bg-[var(--color-background-subtle)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => !isCreating && setIsModalOpen(false)}
        title="Añadir Nueva Torre"
      >
        <form onSubmit={handleCreateTower} className="space-y-6 py-2">
          <div>
            <label htmlFor="towerName" className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              Nombre de la Torre
            </label>
            <input
              id="towerName"
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
              className="bg-[#001529] text-white px-6 py-2 rounded-[var(--radius-sm)] text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
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
    </div>
  );
};
