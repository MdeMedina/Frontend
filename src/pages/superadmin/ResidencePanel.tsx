import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { residencesApi, type Residence } from '../../api/residences';
import { buildingsApi } from '../../api/buildings';
import { Layout } from '../../components/Layout';
import { ArrowLeft, Building2, Users, Building, Calendar, Star, Plus, Trash2 } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { formatPhoneNumber } from '../../utils/phone';

const card = 'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)]';
const skel = 'bg-[var(--color-background)] rounded-[var(--radius-sm)] animate-pulse';

export default function ResidencePanel() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { stopImpersonation, startImpersonation } = useAuth();

  const [residence, setResidence] = useState<Residence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for creating tower
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTowerName, setNewTowerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    stopImpersonation();
    if (id) {
      fetchResidence(id);
    }
  }, [id]);

  const handleTowerClick = (tower: { id: string, name: string }) => {
    if (residence) {
      startImpersonation(residence.id, residence.name, tower.id, tower.name);
      navigate('/admin');
    }
  };

  const handleCreateTower = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTowerName.trim() || !id) return;
    
    try {
      setIsCreating(true);
      await buildingsApi.create({ 
        name: newTowerName.trim(),
        residenceId: id 
      });
      setNewTowerName('');
      setIsModalOpen(false);
      fetchResidence(id);
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
      if (id) fetchResidence(id);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Error al eliminar la torre');
    }
  };



  const handleSetMainAdmin = async (adminId: string, adminName: string) => {
    if (!id) return;
    if (!window.confirm(`¿Está seguro de que desea cambiar a "${adminName}" como administrador principal? El administrador actual dejará de serlo.`)) {
      return;
    }

    try {
      await residencesApi.setMainAdmin(id, adminId);
      fetchResidence(id);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Error al cambiar administrador principal');
    }
  };

  const fetchResidence = async (residenceId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await residencesApi.getById(residenceId);
      setResidence(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar la residencia');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className={`${skel} h-8 w-32 mb-6`} />
          <div className={`${skel} h-40 w-full mb-6`} />
          <div className={`${skel} h-64 w-full`} />
        </div>
      </Layout>
    );
  }

  if (error || !residence) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-[var(--color-primary)] hover:opacity-80 transition-opacity mb-6">
            <ArrowLeft size={16} /> Volver
          </button>
          <div role="alert" className="border border-[var(--color-danger)] bg-[var(--color-danger-subtle)] text-[var(--color-danger)] rounded-[var(--radius-sm)] px-4 py-3">
            {error || 'Residencia no encontrada'}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header */}
        <div className="mb-8 flex items-start gap-4">
          <button onClick={() => navigate(-1)} className="mt-1 p-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-primary)] mb-1">
              Panel de Residencia
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] flex items-center gap-3">
              {residence.name}
              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-[var(--radius-sm)] shrink-0 align-middle ${residence.isActive ? 'bg-[var(--color-action-subtle)] text-[var(--color-action)]' : 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)]'}`}>
                {residence.isActive ? 'Activa' : 'Inactiva'}
              </span>
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* General Stats */}
          <div className={`${card} p-6 lg:col-span-2 flex flex-col`}>
            <h2 className="text-xs font-semibold tracking-widest uppercase text-[var(--color-text-muted)] mb-8">Información General</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-auto">
              <div>
                <div className="flex items-center gap-2 text-[var(--color-text-muted)] mb-3">
                  <Users size={16} /> <span className="text-[10px] font-bold uppercase tracking-[0.1em]">Usuarios</span>
                </div>
                <p className="text-4xl font-bold text-[var(--color-text-primary)] tabular-nums leading-none tracking-tight">{residence._count?.users || 0}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-[var(--color-text-muted)] mb-3">
                  <Building2 size={16} /> <span className="text-[10px] font-bold uppercase tracking-[0.1em]">Torres</span>
                </div>
                <p className="text-4xl font-bold text-[var(--color-text-primary)] tabular-nums leading-none tracking-tight">{residence._count?.buildings || 0}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-[var(--color-text-muted)] mb-3">
                  <Building size={16} /> <span className="text-[10px] font-bold uppercase tracking-[0.1em]">Deptos</span>
                </div>
                <p className="text-4xl font-bold text-[var(--color-text-primary)] tabular-nums leading-none tracking-tight">{residence._count?.apartments || 0}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-[var(--color-text-muted)] mb-3">
                  <Calendar size={16} /> <span className="text-[10px] font-bold uppercase tracking-[0.1em]">Reservas</span>
                </div>
                <p className="text-4xl font-bold text-[var(--color-text-primary)] tabular-nums leading-none tracking-tight">{residence._count?.stays || 0}</p>
              </div>
            </div>
          </div>

          {/* Admins */}
          <div className={`${card} p-5 flex flex-col`}>
             <h2 className="text-xs font-semibold tracking-widest uppercase text-[var(--color-text-muted)] mb-4">Administradores</h2>
             <div className="space-y-3 flex-1 overflow-y-auto max-h-[200px] pr-2">
               {residence.admins && residence.admins.length > 0 ? (
                 residence.admins.map(a => (
                   <div key={a.id} className="p-3 bg-[var(--color-background)] rounded-[var(--radius-sm)] border border-[var(--color-border)] relative group/admin">
                     <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--color-text-primary)]">{a.firstName} {a.lastName}</span>
                        {a.isMain && <Star size={12} className="text-[var(--color-warning)] fill-[var(--color-warning)]" />}
                     </div>
                     <p className="text-xs text-[var(--color-text-muted)] mt-1 truncate">{a.email}</p>
                     {a.phone && <p className="text-xs text-[var(--color-text-muted)] truncate">{formatPhoneNumber(a.phone)}</p>}
                     
                     {!a.isMain && (
                       <div className="absolute inset-0 bg-[var(--color-surface)]/90 flex items-center justify-center opacity-0 group-hover/admin:opacity-100 transition-opacity rounded-[var(--radius-sm)]">
                         <button
                           onClick={() => handleSetMainAdmin(a.id, `${a.firstName} ${a.lastName}`)}
                           className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)] hover:underline"
                         >
                           Cambiar a principal
                         </button>
                       </div>
                     )}
                   </div>
                 ))
               ) : (
                 <p className="text-sm text-[var(--color-text-muted)]">Sin administradores asignados</p>
               )}
             </div>
          </div>
        </div>

        {/* Towers List */}
        <div>
          <h2 className="text-xs font-semibold tracking-widest uppercase text-[var(--color-text-muted)] mb-5">
            Torres ({residence.buildings?.length || 0})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {residence.buildings && residence.buildings.map(b => (
              <button 
                key={b.id} 
                onClick={() => handleTowerClick({ id: b.id, name: b.name })}
                className={`${card} p-4 flex flex-col gap-3 text-left hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] transition-all group shadow-sm hover:shadow-md`}
              >
                 <div className="flex items-start justify-between">
                   <div className="w-8 h-8 rounded shrink-0 bg-[var(--color-background)] flex items-center justify-center border border-[var(--color-border)] group-hover:border-[var(--color-primary)] transition-colors">
                     <Building2 size={16} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] transition-colors" />
                   </div>
                   <div className="flex items-center gap-2">
                     {b._count?.apartments === 0 && (
                       <button
                         onClick={(e) => handleDeleteTower(e, b.id, b.name)}
                         className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] rounded-[var(--radius-sm)] transition-all"
                         title="Eliminar torre"
                       >
                         <Trash2 size={14} />
                       </button>
                     )}
                     <span className={`w-2 h-2 rounded-full ${b.isActive ? 'bg-[var(--color-action)]' : 'bg-[var(--color-danger)]'}`} />
                   </div>
                 </div>
                 <div>
                   <p className="text-sm font-bold text-[var(--color-text-primary)] line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors">{b.name}</p>
                   <p className="text-xs font-medium text-[var(--color-text-muted)] mt-1">
                     {b._count?.apartments || 0} departamentos
                   </p>
                 </div>
              </button>
            ))}

            {/* Add Tower Button */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-sm)] p-4 flex flex-col items-center justify-center gap-2 text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] transition-all group min-h-[140px]"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--color-background)] flex items-center justify-center border border-[var(--color-border)] group-hover:border-[var(--color-primary)] transition-colors">
                <Plus size={20} className="group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.15em]">Añadir Torre</span>
            </button>
          </div>
        </div>

        {/* Modal para añadir torre */}
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

      </div>
    </Layout>
  );
}
