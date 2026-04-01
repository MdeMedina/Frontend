import { useControlPiso } from './ControlPiso/useControlPiso';
import { Layout } from '../../components/Layout';
import { Notifications } from '../../components/Notifications';
import { ControlView } from './ControlPiso/Views/ControlView';
import { PetitionsView } from './ControlPiso/Views/PetitionsView';
import { DirectoryView } from './ControlPiso/Views/DirectoryView';
import { StayDetailModal } from './ControlPiso/ControlComponents/ControlModals/StayDetailModal';
import { UpsertPetitionModal } from './ControlPiso/ControlComponents/ControlModals/UpsertPetitionModal';
import { PetitionDetailModal } from './ControlPiso/ControlComponents/ControlModals/PetitionDetailModal';
import { handleRutInput, cleanRut } from '../../utils/rut';

export const ControlPiso = () => {
  const {
    user,
    activeTab, setActiveTab,
    buildings, selectedBuildingId, setSelectedBuildingId,
    filteredStays, isLoading,
    petitions, loadingPetitions,
    filteredDirectory, expandedApartments, toggleApartmentExpand,
    searchFilter, setSearchFilter, directorySearchTerm, setDirectorySearchTerm,
    currentDate, formatDateOnly, formatTime,
    selectedStay, setSelectedStay, showDetailModal, setShowDetailModal,
    selectedMovementType, setSelectedMovementType,
    showCreatePetitionModal, setShowCreatePetitionModal,
    newPetitionData, setNewPetitionData,
    selectedPetitionOption, setSelectedPetitionOption,
    petitionApartmentSearchTerm, setPetitionApartmentSearchTerm,
    petitionFormData, setPetitionFormData,
    selectedPetition, setSelectedPetition, showPetitionDetailModal, setShowPetitionDetailModal,
    handleCheckIn, handleCheckOut, handleRowClick, loadPetitions, loadStays, error, setError
  } = useControlPiso();

  // Helper logic from original file for peticiones
  const petitionOptions = [
    { id: 'guest_no_registry', title: 'Huésped en recepción sin registro previo', description: 'Requiere carga de datos para habilitar el ingreso.' },
    { id: 'early_checkin', title: 'Ingreso anticipado fuera del horario de check-in', description: 'Se requiere aprobación.' },
    { id: 'staff_access', title: 'Personal solicita ingreso al dpto', description: 'Requiere carga de datos para habilitar el ingreso.' },
    { id: 'guest_data_mismatch', title: 'Los datos no coinciden con el registro', description: 'Por favor corregir.' },
    { id: 'additional_guests', title: 'Ingreso de huéspedes adicionales', description: 'Por favor completar datos.' },
    { id: 'noise_complaint', title: 'Reclamo por ruidos molestos', description: 'Contactar a su huésped.' },
    { id: 'CANCEL_MOVEMENT', title: 'Cancelar Check-in/Check-out mal realizado', description: 'Solicitar cancelación.' },
    { id: 'OTHER', title: 'Otro', description: '' },
  ];

  const getRequiredFields = (optionId: string) => {
    switch (optionId) {
      case 'guest_no_registry':
      case 'staff_access':
        return { needsGuestData: true, needsApartment: true };
      case 'guest_data_mismatch':
        return { needsGuestData: true, needsApartment: true, needsCorrectData: true };
      case 'additional_guests':
        return { needsApartment: true, needsAdditionalGuests: true };
      case 'noise_complaint':
        return { needsApartment: true };
      case 'early_checkin':
        return { needsApartment: !selectedStay };
      default:
        return {};
    }
  };

  const handlePetitionOptionChange = (optionId: string) => {
    setSelectedPetitionOption(optionId);
    const option = petitionOptions.find(opt => opt.id === optionId);
    if (option) {
      setNewPetitionData((prev: any) => ({
        ...prev,
        title: option.id === 'OTHER' ? 'Petición desde conserjería' : option.title,
        reason: option.description || '',
      }));
      setPetitionFormData(selectedStay ? { apartmentId: selectedStay.apartment.id } : {});
    }
  };

  const handleSubmitPetition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPetitionOption) return setError('Selecciona un tipo');

    try {
      const requestedData: any = {};
      if (petitionFormData.guestFirstName) requestedData.guestFirstName = petitionFormData.guestFirstName;
      if (petitionFormData.guestLastName) requestedData.guestLastName = petitionFormData.guestLastName;
      if (petitionFormData.guestDocument) requestedData.guestDocument = cleanRut(petitionFormData.guestDocument);
      if (petitionFormData.apartmentId) requestedData.apartmentId = petitionFormData.apartmentId;

      await (async () => {
        const data = {
          ...newPetitionData,
          stayId: selectedStay?.id || undefined,
          apartmentId: petitionFormData.apartmentId || undefined,
          requestedData: Object.keys(requestedData).length > 0 ? requestedData : undefined
        };
        const { petitionsApi } = await import('../../api/petitions');
        await petitionsApi.create(data as any);
      })();

      setShowCreatePetitionModal(false);
      setNewPetitionData({ type: 'OTHER', title: '', reason: '', stayId: '' });
      setPetitionFormData({});
      setSelectedPetitionOption('');
      await loadPetitions();
      setActiveTab('petitions');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear');
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50 font-sans text-slate-900">

        {/* UPPER NAVIGATION BAR */}
        <div className="bg-white border-b border-slate-200 px-6 shrink-0 z-10 flex justify-between items-center shadow-sm">
          <nav className="flex gap-8">
            {[
              { id: 'control', label: 'Control de Piso', icon: 'grid_view' },
              { id: 'petitions', label: 'Peticiones', icon: 'history' },
              { id: 'directory', label: 'Contactos', icon: 'contacts' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 flex items-center gap-2 border-b-2 transition-all group ${activeTab === tab.id ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                <span className={`material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform ${activeTab === tab.id ? 'font-black' : ''}`}>{tab.icon}</span>
                <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${activeTab === tab.id ? '' : 'tracking-normal'}`}>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Notifications />
            <div className="h-4 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 border border-slate-200 shadow-inner">
                <span className="material-symbols-outlined text-sm">shield_person</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-900 uppercase leading-none">Agente Autorizado</span>
                <span className="text-[10px] font-bold text-slate-400 truncate max-w-[120px]">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 relative custom-scrollbar">
          {error && (
            <div className="mb-6 p-4 bg-slate-900 text-white rounded-lg border border-slate-800 flex items-center justify-between animate-in slide-in-from-top-4 duration-500 shadow-xl">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-red-500">warning</span>
                <p className="text-[11px] font-bold uppercase tracking-widest">{error}</p>
              </div>
              <button onClick={() => setError('')} className="opacity-50 hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}

          <div className="max-w-7xl mx-auto">
            {activeTab === 'control' && (
              <ControlView
                buildings={buildings}
                selectedBuildingId={selectedBuildingId}
                onBuildingChange={setSelectedBuildingId}
                searchFilter={searchFilter}
                onSearchChange={setSearchFilter}
                filteredStays={filteredStays}
                isLoading={isLoading}
                onRowClick={handleRowClick}
                formatDateOnly={formatDateOnly}
                formatTime={formatTime}
                currentDate={currentDate}
              />
            )}

            {activeTab === 'petitions' && (
              <PetitionsView
                petitions={petitions}
                isLoading={loadingPetitions}
                onPetitionClick={(p) => { setSelectedPetition(p); setShowPetitionDetailModal(true); }}
                onCreateNew={() => setShowCreatePetitionModal(true)}
                formatDateOnly={formatDateOnly}
              />
            )}

            {activeTab === 'directory' && (
              <DirectoryView
                buildings={buildings}
                selectedBuildingId={selectedBuildingId}
                onBuildingChange={setSelectedBuildingId}
                searchTerm={directorySearchTerm}
                onSearchChange={setDirectorySearchTerm}
                filteredDirectory={filteredDirectory}
                expandedIds={expandedApartments}
                onToggleExpand={toggleApartmentExpand}
              />
            )}
          </div>
        </main>
      </div>

      {/* MODALS */}
      <StayDetailModal
        stay={selectedStay}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
        movementType={selectedMovementType}
        onCreatePetition={(type) => {
          handlePetitionOptionChange(type || 'OTHER');
          setShowDetailModal(false);
          setShowCreatePetitionModal(true);
        }}
      />

      <UpsertPetitionModal
        isOpen={showCreatePetitionModal}
        onClose={() => setShowCreatePetitionModal(false)}
        onSubmit={handleSubmitPetition}
        newPetitionData={newPetitionData}
        setNewPetitionData={setNewPetitionData}
        selectedOption={selectedPetitionOption}
        onOptionChange={handlePetitionOptionChange}
        petitionOptions={petitionOptions}
        apartments={activeTab === 'directory' ? filteredDirectory : []} // Or all apartments
        apartmentSearchTerm={petitionApartmentSearchTerm}
        setApartmentSearchTerm={setPetitionApartmentSearchTerm}
        formData={petitionFormData}
        setFormData={setPetitionFormData}
        getRequiredFields={getRequiredFields}
        handleRutInput={handleRutInput}
        cleanRut={cleanRut}
      />

      <PetitionDetailModal
        petition={selectedPetition}
        isOpen={showPetitionDetailModal}
        onClose={() => setShowPetitionDetailModal(false)}
      />
    </Layout>
  );
};
