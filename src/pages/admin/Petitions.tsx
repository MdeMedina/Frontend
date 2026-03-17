import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { petitionsApi, type Petition } from '../../api/petitions';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Modal } from '../../components/Modal';

export const AdminPetitions = () => {
  const { impersonationMode } = useAuth();
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [selectedPetition, setSelectedPetition] = useState<Petition | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'propias' | 'generales'>('propias');

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [rejectionReasonEnum, setRejectionReasonEnum] = useState('INCOMPLETE_INFO');
  const [reviewReason, setReviewReason] = useState('');

  // Document Preview State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const fetchPetitions = async () => {
    try {
      setLoading(true);
      const response = await petitionsApi.getAll({ limit: 100 });
      // Remove filter to allow CONCIERGE petitions (like CANCEL_MOVEMENT)
      // const filteredPetitions = response.data.filter(p => !p.user || p.user.role !== 'CONCIERGE'); 
      const filteredPetitions = response.data;
      setPetitions(filteredPetitions);

      if (filteredPetitions.length > 0 && !selectedPetition) {
        setSelectedPetition(filteredPetitions[0]);
      } else if (filteredPetitions.length === 0) {
        setSelectedPetition(null);
      }
    } catch (err: any) {
      console.error('Error al cargar peticiones', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPetitions();
  }, []);

  // Helper to determine if a petition belongs to "Generales" (Admin can't approve)
  const isAdminApprovalRestricted = (petition: Petition) => {
    return petition.user.role === 'CONCIERGE' && petition.type !== 'CANCEL_MOVEMENT';
  };

  const filteredItems = petitions.filter(p => {
    const isRestricted = isAdminApprovalRestricted(p);
    return activeTab === 'propias' ? !isRestricted : isRestricted;
  });

  // Auto-select first petition when tab changes
  useEffect(() => {
    if (filteredItems.length > 0 && (!selectedPetition || !filteredItems.find(p => p.id === selectedPetition.id))) {
      setSelectedPetition(filteredItems[0]);
    } else if (filteredItems.length === 0) {
      setSelectedPetition(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, petitions]);

  const handleProcessReview = async () => {
    if (!selectedPetition || !reviewAction) return;

    let finalNote = '';

    if (reviewAction === 'REJECTED') {
      const reasonMap: Record<string, string> = {
        'INCOMPLETE_INFO': 'Información incompleta',
        'EXPIRED_DOCS': 'Documentación vencida',
        'REQUIREMENTS_NOT_MET': 'No cumple con requisitos',
        'OTHER': 'Otros'
      };
      const selectedReasonText = reasonMap[rejectionReasonEnum];
      finalNote = `Motivo: ${selectedReasonText}. ${reviewReason ? `Comentarios: ${reviewReason}` : ''}`;

      if (rejectionReasonEnum === 'OTHER' && !reviewReason.trim()) {
        alert('Por favor agrega comentarios adicionales para el motivo "Otros".');
        return;
      }
    } else {
      // Approved
      finalNote = reviewReason; // Optional for approval
    }

    try {
      await petitionsApi.review(selectedPetition.id, {
        status: reviewAction,
        adminNotes: finalNote
      });

      const response = await petitionsApi.getAll({ limit: 100 });
      // Remove filter here as well
      const filteredPetitions = response.data;
      setPetitions(filteredPetitions);

      setShowReviewModal(false);
      setReviewAction(null);
      setRejectionReasonEnum('INCOMPLETE_INFO');
      setReviewReason('');

      if (filteredPetitions.length > 0) {
        setSelectedPetition(filteredPetitions[0]);
      } else {
        setSelectedPetition(null);
      }
    } catch (err: any) {
      alert('Error al procesar la solicitud: ' + (err.response?.data?.message || err.message));
    }
  };

  const openApproveModal = () => {
    setReviewAction('APPROVED');
    setReviewReason('');
    setShowReviewModal(true);
  };

  const openRejectModal = () => {
    setReviewAction('REJECTED');
    setRejectionReasonEnum('INCOMPLETE_INFO');
    setReviewReason('');
    setShowReviewModal(true);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '';
      // Create date object and adjust for timezone offset to display as UTC
      const date = new Date(dateString);
      const userTimezoneOffset = date.getTimezoneOffset() * 60000;
      const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
      return format(adjustedDate, "d 'de' MMM yyyy, HH:mm", { locale: es });
    } catch {
      return dateString;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

      if (diffInMinutes < 60) return `${diffInMinutes} min`;
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours} h`;
      return format(date, "d MMM", { locale: es });
    } catch {
      return '';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'CREATE_MANAGER': return 'Asignar Responsable';
      case 'CREATE_APARTMENT': return 'Crear Departamento';
      case 'MODIFY_STAY': return 'Modificar Reserva';
      case 'DELETE_APARTMENT': return 'Eliminar Departamento';
      case 'CANCEL_MOVEMENT': return 'Cancelar Movimiento';
      case 'MODIFY_GUEST_DATA': return 'Modificar Huésped';
      case 'ASSIGN_PARKING': return 'Asignar Estacionamiento';
      default: return 'Solicitud';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CREATE_MANAGER': return 'bg-purple-100 text-purple-700';
      case 'CREATE_APARTMENT': return 'bg-emerald-100 text-emerald-700';
      case 'MODIFY_STAY': return 'bg-blue-100 text-blue-700';
      case 'DELETE_APARTMENT': return 'bg-red-100 text-red-700';
      case 'CANCEL_MOVEMENT': return 'bg-red-100 text-red-700';
      case 'MODIFY_GUEST_DATA': return 'bg-orange-100 text-orange-700';
      case 'ASSIGN_PARKING': return 'bg-pink-100 text-pink-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-700 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'APROBADA';
      case 'REJECTED': return 'RECHAZADA';
      default: return 'PENDIENTE';
    }
  };

  // --- RENDER HELPERS ---

  const renderPetitionDetails = (petition: Petition) => {
    const data = petition.requestedData || {};

    // Common Card Wrapper
    const Card = ({ title, icon, children, className }: any) => (
      <div className={`bg-white  rounded-lg p-3 border border-slate-200  shadow-sm ${className}`}>
        <div className="flex items-center gap-2 mb-2 border-b border-slate-100  pb-1.5">
          <span className="material-symbols-outlined text-primary text-base">{icon}</span>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{title}</h3>
        </div>
        {children}
      </div>
    );

    const Field = ({ label, value }: any) => (
      <div className="bg-slate-50  p-1.5 rounded border border-slate-100  text-center">
        <p className="text-[8px] uppercase font-bold text-slate-400">{label}</p>
        <p className="text-xs font-bold text-slate-800  truncate">{value || 'N/A'}</p>
      </div>
    );

    // 1. MANAGER PETITIONS
    if (['CREATE_MANAGER', 'MODIFY_MANAGER', 'DELETE_MANAGER'].includes(petition.type)) {
      const managerData = petition.type === 'DELETE_MANAGER'
        ? (petition.apartment?.manager || data)
        : data;

      const name = managerData.firstName
        ? `${managerData.firstName} ${managerData.lastName || ''}`
        : ((managerData as any).managerName || 'Sin nombre');

      return (
        <Card title="Datos del Responsable" icon="manage_accounts" className="h-full">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
              {getInitials(name, '')}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold truncate text-slate-900 ">{name}</h4>
              <p className="text-[10px] text-slate-500 truncate">{managerData.email || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <Field label="RUT" value={(managerData as any).rut} />
            <Field label="Teléfono" value={managerData.phone || (managerData as any).phoneNumber} />
            <Field label="Tipo" value={petition.type === 'DELETE_MANAGER' ? 'Eliminar' : 'Asignar'} />
          </div>

          {petition.apartment && (
            <div className="mt-2 border-t border-slate-100 pt-2">
              <p className="text-[9px] text-slate-400 mb-1 font-bold uppercase">Asignar a:</p>
              <div className="flex gap-2">
                <span className="text-xs font-mono bg-slate-100 px-1 rounded">Dept {petition.apartment.number}</span>
                <span className="text-xs text-slate-500">
                  {typeof petition.apartment.building === 'string' ? petition.apartment.building : (petition.apartment.building as any)?.name}
                </span>
              </div>
            </div>
          )}
        </Card>
      );
    }

    // 2. APARTMENT PETITIONS
    if (['CREATE_APARTMENT', 'MODIFY_APARTMENT', 'DELETE_APARTMENT'].includes(petition.type)) {
      const aptData = petition.type === 'CREATE_APARTMENT' ? data : (petition.apartment || data);
      const buildingName = typeof aptData.building === 'string' ? aptData.building : aptData.building?.name || data.buildingName;

      return (
        <Card title="Datos del Departamento" icon="apartment" className="h-full">
          <div className="grid grid-cols-3 gap-1.5">
            <Field label="Número" value={aptData.number} />
            <Field label="Piso" value={aptData.floor} />
            <Field label="Torre" value={buildingName} />
            {(aptData as any).parkingNumber && (
              <div className="col-span-3">
                <Field label="Estacionamiento" value={(aptData as any).parkingNumber} />
              </div>
            )}
            {(aptData as any).description && (
              <div className="col-span-3 mt-2 text-[10px] text-slate-500 italic bg-gray-50 p-2 rounded border border-gray-100">
                "{(aptData as any).description}"
              </div>
            )}
          </div>
        </Card>
      );
    }

    // 3. STAY / CANCEL PETITIONS
    if (['MODIFY_STAY', 'CANCEL_MOVEMENT', 'MODIFY_GUEST_DATA'].includes(petition.type)) {
      const stayData = petition.stay || data;
      const apartment = stayData.apartment || (petition.apartment) || {};
      const building = apartment.building || {};

      return (
        <div className="grid grid-cols-1 gap-4">
          <Card title="Datos de la Reserva" icon="bed" className="h-full">
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Huésped</p>
                <p className="font-semibold text-sm">
                  {stayData.guestFirstName} {stayData.guestLastName}
                </p>
                <p className="text-xs text-mono text-slate-500">{stayData.guestDocument || 'N/A'}</p>
              </div>

              <Field label="Check-In" value={formatDate(stayData.scheduledCheckIn)} />
              <Field label="Check-Out" value={formatDate(stayData.scheduledCheckOut)} />

              {stayData.actualCheckIn && (
                <Field label="Check-In Real" value={formatDate(stayData.actualCheckIn)} />
              )}
              {stayData.actualCheckOut && (
                <Field label="Check-Out Real" value={formatDate(stayData.actualCheckOut)} />
              )}
            </div>
          </Card>

          <Card title="Departamento" icon="apartment" className="h-full">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-lg text-blue-600 font-bold text-xl">
                {apartment.number || 'N/A'}
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Torre/Edificio</p>
                <p className="font-bold text-slate-800">{building.name || 'N/A'}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Field label="Piso" value={apartment.floor} />
            </div>
          </Card>
        </div>
      );
    }

    // 4. ASSIGN PARKING
    if (petition.type === 'ASSIGN_PARKING') {
      const assignment = (petition as any).parkingAssignment;
      // Use assignment if available (approved/active), otherwise use requestedData (pending)
      const targetNum = assignment?.targetApartment?.number || data.targetApartmentNumber || 'Desconocido';

      const sourceNum = assignment?.sourceApartment?.number || petition.apartment?.number || 'Mío';

      return (
        <Card title="Asignación de Estacionamiento" icon="local_parking" className="h-full bg-pink-50/30 border-pink-100">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2 flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Estacionamiento:</span>
              <span className="text-sm font-bold text-slate-900">{data.parkingNumber || assignment?.parkingNumber}</span>
            </div>

            <Field label="Origen (Prop.)" value={sourceNum} />
            <Field label="Destino (Benef.)" value={targetNum} />

            <div className="col-span-2 grid grid-cols-2 gap-2 mt-1 bg-white p-2 rounded border border-pink-50">
              <Field label="Desde" value={formatDate(data.startDate || assignment?.startDate).split(',')[0]} />
              <Field label="Hasta" value={formatDate(data.endDate || assignment?.endDate).split(',')[0]} />
            </div>
          </div>
        </Card>
      );
    }

    // 5. MODIFY STAY
    if (petition.type === 'MODIFY_STAY') {
      const stay = petition.stay;
      if (!stay) return <Card title="Reserva" icon="hotel"><p className="text-xs text-red-500">Datos no disponibles</p></Card>;

      return (
        <Card title="Datos de la Reserva" icon="hotel" className="h-full">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
              {getInitials(stay.guestFirstName || '', '')}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">{stay.guestFirstName} {stay.guestLastName}</h4>
              <p className="text-[9px] text-slate-500">ID: {stay.guestDocument || 'N/A'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            <Field label="Check-in Actual" value={formatDate(stay.scheduledCheckIn).split(',')[0]} />
            <Field label="Check-out Actual" value={formatDate(stay.scheduledCheckOut).split(',')[0]} />
          </div>

          {data && (data.newCheckIn || data.newCheckOut) && (
            <div className="bg-amber-50 border border-amber-100 p-1.5 rounded">
              <p className="text-[9px] font-bold text-amber-700 uppercase mb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px]">edit</span> Cambios
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {data.newCheckIn && (
                  <div>
                    <p className="text-[8px] text-amber-600">Nuevo Check-in</p>
                    <p className="text-[10px] font-bold text-slate-800">{formatDate(data.newCheckIn).split(',')[0]}</p>
                  </div>
                )}
                {data.newCheckOut && (
                  <div>
                    <p className="text-[8px] text-amber-600">Nuevo Check-out</p>
                    <p className="text-[10px] font-bold text-slate-800">{formatDate(data.newCheckOut).split(',')[0]}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      );
    }

    return null;
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white  font-sans text-slate-900 ">

        {/* SIDEBAR */}
        <aside className="w-[300px] border-r border-slate-200  bg-white  flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-200  bg-slate-50/50 ">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-xs">Solicitudes</h2>
              {petitions.length > 0 && (
                <span className="bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {petitions.length} total
                </span>
              )}
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-200  p-0.5 rounded-lg">
              <button
                onClick={() => setActiveTab('propias')}
                className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${
                  activeTab === 'propias' ? 'bg-white shadow text-primary' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Propias
              </button>
              <button
                onClick={() => setActiveTab('generales')}
                className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${
                  activeTab === 'generales' ? 'bg-white shadow text-primary' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Generales
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
            {loading ? (
              <div className="flex justify-center p-4"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div></div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center p-4 text-xs text-slate-400">
                No hay solicitudes {activeTab === 'propias' ? 'para ti' : 'generales'}.
              </div>
            ) : (
              filteredItems.map((petition) => (
                <div
                  key={petition.id}
                  onClick={() => setSelectedPetition(petition)}
                  className={`p-2.5 rounded-lg cursor-pointer transition-all border ${selectedPetition?.id === petition.id
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-transparent hover:bg-slate-50'
                    }`}
                >
                  <div className="flex justify-between items-start mb-0.5">
                    <span className={`text-[8px] uppercase font-bold tracking-wider px-1 py-0.5 rounded ${getTypeColor(petition.type)}`}>
                      {getTypeLabel(petition.type)}
                    </span>
                    <span className="text-[9px] text-slate-500">{formatRelativeTime(petition.createdAt)}</span>
                  </div>
                  <h3 className="text-[13px] font-semibold text-slate-800  truncate mt-1">
                    {petition.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="w-4 h-4 rounded-full bg-slate-200  flex items-center justify-center text-[8px] font-bold">
                      {(() => {
                        const owner = petition.apartment?.owner || (petition.stay as any)?.apartment?.owner;
                        // For CANCEL_MOVEMENT, always show the petitioner (concierge) as the primary name
                        const displayUser = (petition.type === 'CANCEL_MOVEMENT' || !owner) ? petition.user : owner;
                        return getInitials(displayUser.firstName, displayUser.lastName);
                      })()}
                    </div>
                    <p className="text-[11px] text-slate-600  truncate">
                      {(() => {
                        const owner = petition.apartment?.owner || (petition.stay as any)?.apartment?.owner;
                        // For CANCEL_MOVEMENT, priority is the petitioner (concierge)
                        const displayUser = (petition.type === 'CANCEL_MOVEMENT' || !owner) ? petition.user : owner;
                        const aptNum = petition.apartment?.number || (petition.stay as any)?.apartment?.number;
                        return (
                          <span>
                            {displayUser.firstName} {displayUser.lastName}
                            {aptNum && <span className="text-slate-400 ml-1">(Dpto {aptNum})</span>}
                          </span>
                        );
                      })()}
                    </p>
                    {petition.status !== 'PENDING' && (
                      <span className={`ml-auto text-[8px] font-bold px-1.5 py-0.5 rounded border ${getStatusColor(petition.status)}`}>
                        {getStatusLabel(petition.status)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <section className="flex-1 flex flex-col bg-slate-50  overflow-hidden relative">
          {selectedPetition ? (
            <>
              {/* HEADER */}
              <div className="bg-white  px-5 py-3 border-b border-slate-200  flex items-center justify-between shrink-0">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900  leading-none">
                      {selectedPetition.title}
                    </h2>
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full border ${getStatusColor(selectedPetition.status)}`}>
                      {getStatusLabel(selectedPetition.status)}
                    </span>
                  </div>
                  <p className="text-slate-500  text-[10px]">
                    Solicitada el {formatDate(selectedPetition.createdAt)} • ID: #{selectedPetition.id.substring(0, 8)}
                  </p>
                </div>
              </div>

              {/* CONTENT BODY */}
              <div className="flex-1 p-3 flex flex-col gap-3 min-h-0 overflow-y-auto">

                {/* GRID: REQUESTER & CONTEXT */}
                <div className="grid grid-cols-2 gap-3 shrink-0">

                  {/* Requester Card */}
                  <div className="bg-white  rounded-lg p-3 border border-slate-200  shadow-sm">
                    <div className="flex items-center gap-2 mb-2 border-b border-slate-100  pb-1.5">
                      <span className="material-symbols-outlined text-primary text-base">account_circle</span>
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Solicitante</h3>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                        {getInitials(selectedPetition.user.firstName, selectedPetition.user.lastName)}
                      </div>
                      <div className="min-w-0">
                        {/* Logic to determine which user to show: Real Owner vs Concierge/User */}
                        {(() => {
                          const owner = selectedPetition.apartment?.owner || selectedPetition.stay?.apartment?.owner;
                          // For CANCEL_MOVEMENT, we want to see the CONCIERGE as the requester
                          const showOwnerContext = !!owner && selectedPetition.type !== 'CANCEL_MOVEMENT';
                          const displayUser = showOwnerContext ? owner : selectedPetition.user;
                          const roleLabel = showOwnerContext ? 'Propietario' : ((displayUser as any).role === 'CONCIERGE' ? 'Conserje' : 'Solicitante');

                          return (
                            <>
                              <h4 className="text-[13px] font-bold truncate">{displayUser.firstName} {displayUser.lastName}</h4>
                              <span className={`text-[9px] px-1 rounded border mr-2 ${(displayUser as any).role === 'CONCIERGE' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                {roleLabel}
                              </span>
                              <div className="flex flex-col gap-1 mt-0.5">
                                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                  <span className="material-symbols-outlined text-[12px]">mail</span>
                                  <span className="truncate">{displayUser.email}</span>
                                </div>
                                {/* Display Apartment Number if available here too for context */}
                                {(selectedPetition.apartment || (selectedPetition.stay as any)?.apartment) && (
                                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                    <span className="material-symbols-outlined text-[12px]">apartment</span>
                                    <span className="truncate font-medium">
                                      Dpto {(selectedPetition.apartment?.number || (selectedPetition.stay as any)?.apartment?.number)}
                                      {selectedPetition.apartment?.building && ` - ${typeof selectedPetition.apartment.building === 'string' ? selectedPetition.apartment.building : (selectedPetition.apartment.building as any).name}`}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Detail Card (Dynamic based on type) */}
                  {renderPetitionDetails(selectedPetition)}

                </div>

                {/* DESCRIPTION CARD */}
                {selectedPetition.reason &&
                  !selectedPetition.reason.startsWith('Solicito registrar a') &&
                  !selectedPetition.reason.startsWith('Solicito actualizar los datos') &&
                  !selectedPetition.reason.startsWith('Modificación de datos') &&
                  selectedPetition.reason !== 'Sin descripción adicional' && (
                    <div className="flex flex-col bg-white  rounded-lg border border-slate-200  shadow-sm overflow-hidden shrink-0">
                      <div className="px-3 py-1.5 border-b border-slate-100  flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-base">chat_bubble</span>
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Descripción de la Solicitud</h3>
                      </div>
                      <div className="p-3 bg-blue-50/20 ">
                        <p className="text-slate-700  leading-snug text-[13px] italic">
                          "{selectedPetition.reason}"
                        </p>
                      </div>
                    </div>
                  )}

                {/* ATTACHED DOCUMENTS CARD */}
                {(selectedPetition.requestedData as any)?.rutDocumentUrl && (
                  <div className="flex flex-col bg-white  rounded-lg border border-slate-200  shadow-sm overflow-hidden shrink-0 mt-3">
                    <div className="px-3 py-1.5 border-b border-slate-100  flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">attach_file</span>
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Documentos Adjuntos</h3>
                    </div>
                    <div className="p-3">
                      <button
                        onClick={() => {
                          setPreviewUrl((selectedPetition.requestedData as any).rutDocumentUrl);
                          setPreviewModalOpen(true);
                        }}
                        className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
                      >
                        <span className="material-symbols-outlined text-lg">description</span>
                        Ver RUT Adjunto
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* FIXED ACTION BAR */}
              {!impersonationMode && selectedPetition.status === 'PENDING' && (
                <div className="bg-white  border-t border-slate-200  p-2 flex items-center justify-end gap-2 shrink-0">
                  {selectedPetition.user.role === 'CONCIERGE' && selectedPetition.type !== 'CANCEL_MOVEMENT' ? (
                    <div className="flex-1 text-center text-xs text-slate-500 italic">
                      Esta petición debe ser revisada por el Propietario.
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={openRejectModal}
                        className="px-4 py-1.5 text-[11px] font-semibold rounded border border-red-500/50 text-red-600 hover:bg-red-50  transition-colors"
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={openApproveModal}
                        className="px-5 py-1.5 text-[11px] font-bold rounded bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all"
                      >
                        Aprobar Solicitud
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* READ ONLY ACTION BAR FOR PROCESSED PETITIONS */}
              {selectedPetition.status !== 'PENDING' && (
                <div className="bg-slate-50 border-t border-slate-200 p-3 text-center text-xs text-slate-500">
                  Esta solicitud fue {selectedPetition.status === 'APPROVED' ? 'aprobada' : 'rechazada'} el {formatDate(selectedPetition.reviewedAt || '')}.
                  {selectedPetition.adminNotes && (
                    <div className="mt-1 font-medium bg-white p-2 rounded border border-slate-200 inline-block text-left max-w-lg">
                      Nota: {selectedPetition.adminNotes}
                    </div>
                  )}
                </div>
              )}

            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 flex-col gap-2">
              <span className="material-symbols-outlined text-4xl text-slate-300">inbox</span>
              <p className="text-sm">Selecciona una solicitud</p>
            </div>
          )}
        </section>

      </div>

      {/* REJECTION / APPROVAL MODAL */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title={reviewAction === 'APPROVED' ? 'Aprobar Solicitud' : 'Rechazar Petición'}
        width="max-w-lg"
      >
        <div className="p-1">
          <p className="text-sm text-slate-600  mb-6">
            {reviewAction === 'APPROVED'
              ? '¿Estás seguro de que deseas aprobar esta solicitud? Se aplicarán los cambios correspondientes.'
              : 'Por favor, seleccione el motivo del rechazo para informar al solicitante. Esta acción no se puede deshacer.'
            }
          </p>

          {reviewAction === 'REJECTED' && (
            <div className="space-y-3 mb-6">
              {[
                { id: 'INCOMPLETE_INFO', label: 'Información incompleta' },
                { id: 'EXPIRED_DOCS', label: 'Documentación vencida' },
                { id: 'REQUIREMENTS_NOT_MET', label: 'No cumple con requisitos' },
                { id: 'OTHER', label: 'Otros' }
              ].map((option) => (
                <label
                  key={option.id}
                  className={`group flex items-center p-3 border rounded-lg cursor-pointer transition-all ${rejectionReasonEnum === option.id
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200  hover:border-primary/50'
                    }`}
                >
                  <input
                    type="radio"
                    name="rejection_reason"
                    checked={rejectionReasonEnum === option.id}
                    onChange={() => setRejectionReasonEnum(option.id)}
                    className="w-4 h-4 text-primary border-slate-300 focus:ring-primary"
                  />
                  <span className="ml-3 text-sm font-medium text-slate-700 ">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 " htmlFor="comments">
              {reviewAction === 'APPROVED' ? 'Notas (Opcional)' : 'Comentarios adicionales (Opcional)'}
            </label>
            <textarea
              id="comments"
              className="w-full px-4 py-3 rounded-lg border border-slate-200  bg-white  text-slate-800  placeholder-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none text-sm"
              placeholder={reviewAction === 'APPROVED' ? "Opcional..." : "Escriba detalles adicionales aquí..."}
              rows={3}
              value={reviewReason}
              onChange={(e) => setReviewReason(e.target.value)}
            />
          </div>

          <div className="mt-6 flex justify-end items-center gap-3">
            <button
              onClick={() => setShowReviewModal(false)}
              className="px-5 py-2.5 text-sm font-medium text-slate-600  hover:bg-slate-200  rounded-lg transition-colors"
            >
              Volver
            </button>
            <button
              onClick={handleProcessReview}
              className={`px-6 py-2.5 text-sm font-semibold text-white rounded-lg shadow-sm transition-all ${reviewAction === 'REJECTED'
                ? 'bg-red-600 hover:bg-red-700 hover:shadow-md'
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
                }`}
            >
              {reviewAction === 'APPROVED' ? 'Aprobar' : 'Rechazar'}
            </button>
          </div>
        </div>
      </Modal>
      {/* DOCUMENT PREVIEW MODAL */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title="Vista Previa del Documento"
        width="max-w-4xl"
      >
        <div className="flex justify-center items-center p-4 bg-gray-50 rounded-lg min-h-[300px]">
          {previewUrl && (
            previewUrl.toLowerCase().endsWith('.pdf') ? (
              <iframe
                src={previewUrl}
                className="w-full h-[600px] border-0"
                title="Document Preview"
              />
            ) : (
              <img
                src={previewUrl}
                alt="Document Preview"
                className="max-w-full max-h-[600px] object-contain"
              />
            )
          )}
        </div>
      </Modal>
    </Layout>
  );
};
