import { useState } from 'react';
import { Layout } from '../../components/Layout';
import { SetupLinkModal } from '../../components/SetupLinkModal';
import { useManagers, type Manager } from './Managers/useManagers';
import { ManagerFilters } from './Managers/ManagerFilters';
import { ManagerTableRow } from './Managers/ManagerTableRow';
import { UpsertManagerModal } from './Managers/ManagerModals/UpsertManagerModal';
import { ViewManagerModal } from './Managers/ManagerModals/ViewManagerModal';
import { AssignmentModal } from './Managers/ManagerModals/AssignmentModal';
import apiClient from '../../api/client';

export const PropietarioManagers = () => {
  const {
    managers,
    myApartments,
    pendingPetitions,
    loading,
    error,
    setError,
    success,
    setSuccess,
    generateResetLink,
    createManagerPetition,
    updateManagerPetition,
    deleteManagerPetition,
    assignManagerPetition,
  } = useManagers();

  const [searchTerm, setSearchTerm] = useState('');
  const [showUpsertModal, setShowUpsertModal] = useState(false);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [viewingManager, setViewingManager] = useState<Manager | null>(null);
  const [managerToAssign, setManagerToAssign] = useState<Manager | null>(null);
  
  // Modal de enlace configuracion
  const [setupLink, setSetupLink] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [isResetLink, setIsResetLink] = useState(false);
  const [recentlyCreatedName, setRecentlyCreatedName] = useState('');

  const filteredManagers = managers.filter(m => {
    const searchStr = `${m.firstName} ${m.lastName} ${m.email} ${m.rut || ''}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  const handleCreateNew = () => {
    setEditingManager(null);
    setShowUpsertModal(true);
  };

  const handleEdit = (manager: Manager) => {
    setEditingManager(manager);
    setShowUpsertModal(true);
  };

  const handleResetKey = async (manager: Manager) => {
    try {
      const link = await generateResetLink(manager);
      setSetupLink(link);
      setRecentlyCreatedName(`${manager.firstName} ${manager.lastName}`);
      setIsResetLink(true);
      setShowLinkModal(true);
    } catch (err) {
      alert('Error al generar enlace de reseteo');
    }
  };

  const handleUpsertSubmit = async (data: any) => {
    try {
      if (editingManager) {
        await updateManagerPetition(editingManager.id, data);
        setSuccess('Petición de modificación enviada correctamente');
      } else {
        const res = await createManagerPetition(data);
        if (res?.setupLink) {
          setSetupLink(res.setupLink);
          setRecentlyCreatedName(`${data.firstName} ${data.lastName}`);
          setIsResetLink(false);
          setShowLinkModal(true);
        } else {
          setSuccess('Petición de creación enviada correctamente');
        }
      }
      setShowUpsertModal(false);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (manager: Manager) => {
     const reason = prompt(`¿Por qué deseas eliminar a ${manager.firstName} ${manager.lastName}?`);
     if (!reason) return;
     try {
       await deleteManagerPetition(manager, reason);
       setSuccess('Petición de eliminación enviada');
       setTimeout(() => setSuccess(''), 5000);
     } catch (err: any) {
       setError(err.message);
     }
  };

  const handleConfirmAssignment = async (apartment: any) => {
    if (!managerToAssign) return;
    try {
      await assignManagerPetition(managerToAssign, apartment);
      setSuccess(`Petición de asignación enviada (DEPTO ${apartment.number})`);
      setManagerToAssign(null);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await apiClient.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.url;
    } catch (err) {
      alert('Error al subir el archivo');
      return undefined;
    }
  };

  return (
    <Layout>
      <div className="p-8 max-w-[1400px] mx-auto animate-fadeIn">
        {/* Header Section */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
           <div>
            <div className="flex items-center gap-2 mb-2 text-slate-400">
              <span className="material-symbols-outlined text-[18px]">group</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">PERSONAL ADMINISTRATIVO</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tighter">Mis Responsables</h1>
            <p className="text-sm font-medium text-slate-500 mt-2 tracking-tight">
              Gestiona el equipo encargado de la operación y reservas de tus departamentos.
            </p>
          </div>
        </header>

        {/* Alerts */}
        {(error || success) && (
          <div className="mb-8 space-y-3">
             {error && (
                <div className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl text-red-800 animate-slideDown">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]">error</span>
                    <span className="text-xs font-bold uppercase tracking-tight">{error}</span>
                  </div>
                  <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 transition-colors">✕</button>
                </div>
             )}
             {success && (
                <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 animate-slideDown">
                   <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    <span className="text-xs font-bold uppercase tracking-tight">{success}</span>
                  </div>
                  <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-emerald-600 transition-colors">✕</button>
                </div>
             )}
          </div>
        )}

        {/* Pending Petitions Banner */}
        {pendingPetitions.length > 0 && (
          <div className="mb-10 bg-slate-900 rounded-2xl p-6 text-white shadow-2xl shadow-slate-200">
            <div className="flex items-center gap-3 mb-6">
               <div className="p-2 bg-white/10 rounded-lg">
                  <span className="material-symbols-outlined text-white">pending_actions</span>
               </div>
               <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest">Solicitudes en Proceso</h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Esperando aprobación de Administración</p>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingPetitions.map(petition => (
                <div key={petition.id} className="bg-white/5 border border-white/10 rounded-xl p-4 group hover:bg-white/10 transition-all cursor-default">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {petition.type.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-[9px] font-bold uppercase tracking-tighter rounded">PENDIENTE</span>
                  </div>
                  <p className="text-xs font-bold tracking-tight text-white mb-1">{petition.title}</p>
                  <p className="text-[10px] text-slate-500 font-medium tracking-tight">ENVIADO: {new Date(petition.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters & Table Section */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/50 overflow-hidden">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30">
            <ManagerFilters 
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onNewManager={handleCreateNew}
            />
          </div>

          <div className="overflow-x-auto">
             {loading && managers.length === 0 ? (
               <div className="p-20 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mx-auto mb-4"></div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sincronizando equipo...</p>
               </div>
             ) : filteredManagers.length === 0 ? (
               <div className="p-20 text-center">
                  <span className="material-symbols-outlined text-slate-200 text-[60px] mb-4">group_off</span>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tighter">No se encontraron responsables</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Prueba con otros términos de búsqueda o agrega uno nuevo.</p>
               </div>
             ) : (
               <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="py-4 pl-8 pr-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Responsable</th>
                      <th className="py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contacto</th>
                      <th className="py-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asignaciones</th>
                      <th className="py-4 pl-3 pr-8 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {filteredManagers.map(manager => (
                      <ManagerTableRow 
                        key={manager.id}
                        manager={manager}
                        onView={setViewingManager}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onAssign={setManagerToAssign}
                        onResetKey={handleResetKey}
                        showAssignButton={myApartments.some(apt => !apt.managerId)}
                      />
                    ))}
                 </tbody>
               </table>
             )}
          </div>
        </div>

        {/* Modals */}
        <UpsertManagerModal 
          isOpen={showUpsertModal}
          onClose={() => setShowUpsertModal(false)}
          editingManager={editingManager}
          myApartments={myApartments}
          onSubmit={handleUpsertSubmit}
          loading={loading}
          onFileUpload={handleFileUpload}
          onResetKey={handleResetKey}
        />

        <ViewManagerModal 
          isOpen={!!viewingManager}
          onClose={() => setViewingManager(null)}
          manager={viewingManager}
        />

        <AssignmentModal 
          isOpen={!!managerToAssign}
          onClose={() => setManagerToAssign(null)}
          manager={managerToAssign}
          apartments={myApartments}
          onConfirm={handleConfirmAssignment}
        />

        <SetupLinkModal 
          isOpen={showLinkModal}
          onClose={() => setShowLinkModal(false)}
          setupLink={setupLink}
          userName={recentlyCreatedName}
          isReset={isResetLink}
        />
      </div>
    </Layout>
  );
};

