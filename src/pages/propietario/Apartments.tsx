import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import type { Apartment, PendingApartmentPetition, AvailableManager } from './apartments.types';
import { fetchApartmentsData, fetchManagers, submitPetition } from './apartments.utils';
import { ApartmentsHeader, ApartmentCard, PendingPetitionsProtocol } from './components/ApartmentsUI';
import { AssignManagerModal, EditApartmentModal } from './components/ApartmentModals';

export const PropietarioApartments = () => {
  const { user } = useAuth();
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [availableManagers, setAvailableManagers] = useState<AvailableManager[]>([]);
  const [pendingPetitions, setPendingPetitions] = useState<PendingApartmentPetition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isManager = user?.role === 'ASSIGNED_MANAGER';

  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [assignReason, setAssignReason] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ parkingNumber: '' });

  const refreshData = () => fetchApartmentsData(user, setApartments, setPendingPetitions, setError, setLoading);

  useEffect(() => {
    refreshData();
    fetchManagers(setAvailableManagers);
  }, [user?.id]);

  const handleAssignSubmit = async () => {
    if (!selectedApartment) return;
    const selectedManager = availableManagers.find(m => m.id === selectedManagerId);
    
    await submitPetition({
      type: selectedApartment.manager ? 'MODIFY_MANAGER' : 'CREATE_MANAGER',
      title: `${selectedApartment.manager ? 'Cambiar' : 'Asignar'} responsable del departamento ${selectedApartment.number}`,
      reason: assignReason || `Solicitud técnica para gestión de responsable en Depto ${selectedApartment.number}`,
      apartmentId: selectedApartment.id,
      requestedData: {
        managerId: selectedManagerId,
        managerName: selectedManager ? `${selectedManager.firstName} ${selectedManager.lastName}` : null,
        managerEmail: selectedManager?.email,
      },
    }, setSuccess, setError, () => {
      setShowAssignModal(false);
      refreshData();
    });
  };

  const handleRemoveManager = (apartment: Apartment) => {
    const reason = prompt('Indica el motivo técnico para remover al responsable:');
    if (!reason) return;

    submitPetition({
      type: 'DELETE_MANAGER',
      title: `Remover responsable del departamento ${apartment.number}`,
      reason,
      apartmentId: apartment.id,
      requestedData: {
        managerId: apartment.manager?.id,
        managerName: `${apartment.manager?.firstName} ${apartment.manager?.lastName}`,
      },
    }, setSuccess, setError, refreshData);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApartment) return;

    await submitPetition({
      type: 'MODIFY_APARTMENT',
      title: `Modificar estacionamiento Depto ${selectedApartment.number}`,
      reason: `Actualización de asignación de estacionamiento para la unidad ${selectedApartment.number}.`,
      apartmentId: selectedApartment.id,
      requestedData: {
        parkingNumber: editData.parkingNumber,
      },
    }, setSuccess, setError, () => {
      setShowEditModal(false);
      refreshData();
    });
  };

  return (
    <Layout>
      <div className="flex-1 h-[calc(100vh-64px)] overflow-y-auto bg-gray-50/30 font-sans text-gray-900 animate-in fade-in duration-700">
        <div className="max-w-7xl mx-auto p-12 animate-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
          
          <ApartmentsHeader isManager={isManager} />

          {/* Messages */}
          {error && (
            <div role="alert" className="flex items-center gap-4 border-2 border-red-600 bg-red-50 p-5 mb-10 animate-in shake duration-500 shadow-2xl shadow-red-600/5">
              <span className="material-symbols-outlined text-red-600 text-[24px]">error_outline</span>
              <p className="text-[13px] font-black text-red-600 uppercase tracking-tight">{error}</p>
              <button onClick={() => setError('')} className="ml-auto text-red-600 font-bold text-xl hover:scale-110 transition-transform">×</button>
            </div>
          )}

          {success && (
            <div role="alert" className="flex items-center gap-4 border-2 border-blue-600 bg-blue-50 p-5 mb-10 animate-in slide-in-from-top-4 duration-500 shadow-2xl shadow-blue-600/5">
              <span className="material-symbols-outlined text-blue-600 text-[24px]">verified</span>
              <p className="text-[13px] font-black text-blue-600 uppercase tracking-tight">{success}</p>
              <button onClick={() => setSuccess('')} className="ml-auto text-blue-600 font-bold text-xl hover:scale-110 transition-transform">×</button>
            </div>
          )}

          {/* Pending Petitions Protocol */}
          {!isManager && pendingPetitions.length > 0 && (
            <PendingPetitionsProtocol petitions={pendingPetitions} />
          )}

          {/* Main List */}
          {loading ? (
            <div className="flex flex-col justify-center items-center h-80 bg-white border-2 border-black/[0.03] rounded-sm shadow-sm animate-in fade-in duration-500">
              <div className="relative">
                <div className="h-12 w-12 rounded-sm border-2 border-blue-600 animate-spin"></div>
                <div className="absolute inset-0 h-12 w-12 rounded-sm border-2 border-gray-200 animate-ping opacity-20"></div>
              </div>
              <p className="mt-8 text-[11px] font-black uppercase tracking-[0.4em] text-gray-400">Sincronizando Activos...</p>
            </div>
          ) : apartments.length === 0 ? (
            <div className="bg-white border-2 border-black/[0.08] rounded-sm p-24 text-center animate-in zoom-in duration-700 shadow-2xl shadow-black/[0.02]">
              <div className="h-20 w-20 bg-gray-50 rounded-sm flex items-center justify-center mx-auto mb-8 border-2 border-black/[0.03]">
                <span className="material-symbols-outlined text-[48px] text-gray-200">domain_disabled</span>
              </div>
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] mb-4">Status: No_Assets_Found</h3>
              <h2 className="text-2xl font-black text-gray-950 tracking-tighter uppercase mb-6">No hay departamentos registrados</h2>
              <p className="text-[14px] font-medium text-gray-500 max-w-sm mx-auto mb-10 uppercase tracking-tight leading-relaxed">Solicite el registro inicial de una unidad habitacional mediante un ticket administrativo.</p>
              <button
                onClick={() => window.location.href = '/propietario/petitions'}
                className="bg-gray-950 text-white px-10 py-4 rounded-sm font-black uppercase tracking-[0.2em] text-[12px] transition-all flex items-center gap-3 mx-auto shadow-2xl shadow-black/20 hover:bg-blue-600 active:scale-95"
              >
                Abrir Protocolo de Petición
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {apartments.map((apartment) => (
                <ApartmentCard 
                  key={apartment.id}
                  apartment={apartment}
                  isManager={isManager}
                  onEdit={(a) => {
                    setSelectedApartment(a);
                    setEditData({ parkingNumber: (a as any).parkingNumber || '' });
                    setShowEditModal(true);
                  }}
                  onAssignManager={(a) => {
                    setSelectedApartment(a);
                    setSelectedManagerId(a.manager?.id || '');
                    setAssignReason('');
                    setShowAssignModal(true);
                  }}
                  onRemoveManager={handleRemoveManager}
                />
              ))}
            </div>
          )}

          {/* Global Protocol Footer */}
          <div className="mt-20 py-8 border-t-2 border-black/[0.1] flex flex-col md:flex-row justify-between items-center gap-8 opacity-40 group hover:opacity-100 transition-opacity">
            <div className="flex gap-12">
               <div className="space-y-1">
                 <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400">Security_Level</p>
                 <p className="text-[11px] font-black uppercase tracking-widest text-gray-950">AES_256_GCM</p>
               </div>
               <div className="space-y-1 text-center md:text-left">
                 <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400">Sync_Protocol</p>
                 <p className="text-[11px] font-black uppercase tracking-widest text-gray-950">Active_Link_SPS</p>
               </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mb-1">Terminal_ID</p>
              <p className="text-[11px] font-black uppercase tracking-tight text-gray-950">0x-PROPIETARIO-SYSC-042</p>
            </div>
          </div>
        </div>
      </div>

      <AssignManagerModal 
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        apartment={selectedApartment}
        availableManagers={availableManagers}
        selectedManagerId={selectedManagerId}
        setSelectedManagerId={setSelectedManagerId}
        reason={assignReason}
        setReason={setAssignReason}
        onSubmit={handleAssignSubmit}
      />

      <EditApartmentModal 
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        apartment={selectedApartment}
        formData={editData}
        setFormData={setEditData}
        onSubmit={handleEditSubmit}
      />
    </Layout>
  );
};
