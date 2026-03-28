import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout';
import { petitionsApi, type Petition } from '../../api/petitions';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from '../../components/Modal';
import { 
  getInitials, 
  getRecipientLabel, 
  formatDate, 
  formatRelativeTime, 
  getTypeLabel, 
  getTypeColor,
  getStatusColor, 
  getStatusLabel 
} from './petitions.utils';
import { Card, Field, DiffField } from './components/PetitionUI';

export const AdminPetitions = () => {
  const { currentBuilding, impersonationMode } = useAuth();
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [selectedPetition, setSelectedPetition] = useState<Petition | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'resolved' | 'general'>('pending');

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [rejectionReasonEnum, setRejectionReasonEnum] = useState('INCOMPLETE_INFO');
  const [reviewReason, setReviewReason] = useState('');

  // Document Preview State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  // Correction Modal State
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionStatus, setCorrectionStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

  // --- LOGIC HELPERS ---

  const handleCorrectResolution = async () => {
    if (!selectedPetition || !correctionNotes.trim()) {
      alert('Por favor agrega notas sobre la causa de esta corrección.');
      return;
    }

    try {
      setIsSubmittingCorrection(true);
      await petitionsApi.correct(selectedPetition.id, {
        status: correctionStatus,
        notes: correctionNotes
      });

      await fetchPetitions();
      setShowCorrectionModal(false);
      setCorrectionNotes('');
    } catch (err: any) {
      alert('Error al corregir la petición: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  const fetchPetitions = async () => {
    try {
      setLoading(true);
      const response = await petitionsApi.getAll({ 
        limit: 100,
        ...(currentBuilding?.id ? { buildingId: currentBuilding.id } : {})
      });
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
  }, [currentBuilding?.id]);

  const isAdminApprovalRestricted = (petition: Petition) => {
    return petition.user.role === 'CONCIERGE' && petition.type !== 'CANCEL_MOVEMENT';
  };

  const filteredItems = petitions.filter(p => {
    const isRestricted = isAdminApprovalRestricted(p);
    if (activeTab === 'general') return isRestricted;
    if (isRestricted) return false;
    if (activeTab === 'pending') return p.status === 'PENDING';
    if (activeTab === 'resolved') return p.status === 'APPROVED' || p.status === 'REJECTED';
    return false;
  });

  useEffect(() => {
    if (filteredItems.length > 0 && (!selectedPetition || !filteredItems.find(p => p.id === selectedPetition.id))) {
      setSelectedPetition(filteredItems[0]);
    } else if (filteredItems.length === 0) {
      setSelectedPetition(null);
    }
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
      finalNote = reviewReason;
    }

    try {
      await petitionsApi.review(selectedPetition.id, {
        status: reviewAction,
        adminNotes: finalNote
      });

      const response = await petitionsApi.getAll({ 
        limit: 100,
        ...(currentBuilding?.id ? { buildingId: currentBuilding.id } : {})
      });
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

  const isCorrectionAllowed = (petition: Petition) => {
    if (!petition.reviewedAt) return false;
    const reviewedDate = new Date(petition.reviewedAt);
    const now = new Date();
    const diffInHours = (now.getTime() - reviewedDate.getTime()) / (1000 * 60 * 60);
    return diffInHours <= 24;
  };



  // --- RENDER HELPERS ---

  const renderPetitionDetails = (petition: Petition) => {
    const data = petition.requestedData || {};

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
              <h4 className="text-[12px] font-bold truncate text-gray-900">{name}</h4>
              <p className="text-[11px] font-medium text-gray-500 truncate">{managerData.email || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <Field label="RUT" value={(managerData as any).rut} />
            <Field label="Teléfono" value={managerData.phone || (managerData as any).phoneNumber} />
            <Field label="Tipo" value={petition.type === 'DELETE_MANAGER' ? 'Eliminar' : 'Asignar'} />
          </div>

          {petition.apartment && (
            <div className="mt-3 border-t border-black/[0.03] pt-3">
              <p className="text-[9px] text-gray-400 mb-2 font-bold uppercase tracking-widest">Asignar a:</p>
              <div className="flex gap-2">
                <span className="text-[11px] font-bold font-mono bg-gray-100 px-2 py-0.5 rounded-sm border border-black/[0.05] text-gray-900">DEPTO {petition.apartment.number}</span>
                <span className="text-[11px] font-bold text-gray-800 uppercase tracking-tight">
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
      const aptData = (petition.type === 'CREATE_APARTMENT' || !petition.apartment) ? data : petition.apartment;
      const buildingName = typeof aptData.building === 'string' ? aptData.building : aptData.building?.name || data.buildingName;

      if (petition.type === 'MODIFY_APARTMENT') {
        return (
          <Card title="Comparativa de Departamento" icon="compare_arrows" className="h-full border-amber-200 bg-amber-50/10">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <DiffField label="Número" current={aptData.number} requested={data.number} formatDate={formatDate} />
                <DiffField label="Piso" current={aptData.floor} requested={data.floor} formatDate={formatDate} />
              </div>
              <div className="grid grid-cols-1">
                <DiffField label="Estacionamiento" current={(aptData as any).parkingNumber} requested={data.parkingNumber} formatDate={formatDate} />
              </div>
              <div className="grid grid-cols-1">
                <DiffField 
                  label="Descripción" 
                  current={aptData.description} 
                  requested={data.description !== undefined ? data.description : undefined} 
                  formatDate={formatDate}
                />
              </div>
              <div className="p-2.5 bg-gray-100/50 rounded-sm border border-black/[0.05] text-center">
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-0.5">Torre (Fijo)</p>
                <p className="text-[12px] font-bold text-gray-700">{buildingName}</p>
              </div>
            </div>
          </Card>
        );
      }

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
              <div className="col-span-3 mt-2 text-[11px] text-gray-600 italic bg-gray-50 p-3 rounded-sm border border-black/[0.03]">
                "{(aptData as any).description}"
              </div>
          </div>
        </Card>
      );
    }

    // 3. STAY / CANCEL PETITIONS
    if (['MODIFY_STAY', 'CANCEL_MOVEMENT', 'MODIFY_GUEST_DATA'].includes(petition.type)) {
      const stayData = petition.stay || data;
      const apartment = stayData.apartment || (petition.apartment) || {};
      const building = apartment.building || {};

      const isModify = petition.type === 'MODIFY_STAY' || petition.type === 'MODIFY_GUEST_DATA';

      return (
        <div className="grid grid-cols-1 gap-4">
          <Card title={isModify ? "Comparativa de Reserva" : "Datos de la Reserva"} icon={isModify ? "compare_arrows" : "bed"} className={`h-full ${isModify ? 'border-amber-200 bg-amber-50/10' : ''}`}>
            <div className="space-y-2">
              {!isModify ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1">Huésped</p>
                    <p className="font-bold text-[13px] text-gray-900">{stayData.guestFirstName} {stayData.guestLastName}</p>
                    <p className="text-[11px] font-mono text-gray-400">{stayData.guestDocument || 'N/A'}</p>
                  </div>
                  <Field label="Check-In" value={formatDate(stayData.scheduledCheckIn)} />
                  <Field label="Check-Out" value={formatDate(stayData.scheduledCheckOut)} />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <DiffField label="Nombre" current={petition.stay?.guestFirstName} requested={data.guestFirstName} formatDate={formatDate} />
                    <DiffField label="Apellido" current={petition.stay?.guestLastName} requested={data.guestLastName} formatDate={formatDate} />
                  </div>
                  <DiffField label="Documento" current={petition.stay?.guestDocument} requested={data.guestDocument} formatDate={formatDate} />
                  <div className="grid grid-cols-2 gap-3">
                    <DiffField label="Check-In" current={petition.stay?.scheduledCheckIn} requested={data.scheduledCheckIn || data.newCheckIn} isDate formatDate={formatDate} />
                    <DiffField label="Check-Out" current={petition.stay?.scheduledCheckOut} requested={data.scheduledCheckOut || data.newCheckOut} isDate formatDate={formatDate} />
                  </div>
                </div>
              )}
              
              {stayData.actualCheckIn && !isModify && (
                <Field label="Check-In Real" value={formatDate(stayData.actualCheckIn)} />
              )}
            </div>
          </Card>

          <Card title="Departamento" icon="apartment" className="h-full">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-2.5 rounded-sm text-gray-900 border border-black/[0.05] font-bold text-xl">
                {apartment.number || 'N/A'}
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Torre / Edificio</p>
                <p className="font-bold text-[12px] text-gray-900">{building.name || 'N/A'}</p>
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
      const targetApt = assignment?.targetApartment;
      const targetNum = targetApt 
        ? `${targetApt.number}${targetApt.building?.name ? ` - ${targetApt.building.name}` : ''}`
        : data.targetApartmentNumber 
          ? `${data.targetApartmentNumber}${data.targetBuildingName ? ` - ${data.targetBuildingName}` : ''}`
          : 'Desconocido';

      const sourceApt = assignment?.sourceApartment || petition.apartment;
      const sourceNum = sourceApt 
        ? `${sourceApt.number}${sourceApt.building?.name ? ` - ${sourceApt.building.name}` : ''}`
        : 'Mío';

      return (
        <Card title="Asignación de Estacionamiento" icon="local_parking" className="h-full border-pink-200 bg-pink-50/10">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2 bg-white p-3 rounded-sm border border-pink-100 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">N° Estacionamiento</p>
                  <p className="text-2xl font-bold text-pink-700 tracking-tight">{data.parkingNumber || assignment?.parkingNumber || 'N/A'}</p>
                </div>
                <div className="bg-pink-100 p-2 rounded-full text-pink-600">
                  <span className="material-symbols-outlined text-3xl">local_parking</span>
                </div>
              </div>

              <div className="p-2.5 bg-gray-50/50 rounded-sm border border-black/[0.03]">
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-0.5">Propiedad Origen</p>
                <p className="text-[12px] font-bold text-gray-900">{sourceNum}</p>
              </div>

              <div className="p-2.5 bg-pink-50/50 rounded-sm border border-pink-200">
                <p className="text-[10px] uppercase font-bold text-pink-400 tracking-wider mb-0.5">Beneficiario (Destino)</p>
                <p className="text-[12px] font-bold text-pink-700">{targetNum}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1 bg-white p-3 rounded-sm border border-gray-100 shadow-sm">
              <div className="text-center border-r border-black/[0.03]">
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-0.5">Vigencia Desde</p>
                <p className="text-[11px] font-bold text-gray-900">{formatDate(data.startDate || assignment?.startDate).split(',')[0]}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-0.5">Vigencia Hasta</p>
                <p className="text-[11px] font-bold text-gray-900">{formatDate(data.endDate || assignment?.endDate).split(',')[0]}</p>
              </div>
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
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-sm bg-gray-100 border border-black/[0.05] flex items-center justify-center text-gray-900 font-bold text-sm">
              {getInitials(stay.guestFirstName || '', '')}
            </div>
            <div>
              <h4 className="text-[12px] font-bold text-gray-900">{stay.guestFirstName} {stay.guestLastName}</h4>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ID: {stay.guestDocument || 'N/A'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            <Field label="Check-in Actual" value={formatDate(stay.scheduledCheckIn).split(',')[0]} />
            <Field label="Check-out Actual" value={formatDate(stay.scheduledCheckOut).split(',')[0]} />
          </div>

          {data && (data.newCheckIn || data.newCheckOut) && (
            <div className="bg-amber-50 border border-amber-100 p-1.5 rounded">
              <p className="text-[10px] font-bold text-amber-600 uppercase mb-2 flex items-center gap-1 tracking-wider">
                <span className="material-symbols-outlined text-[12px]">edit</span> Cambios Realizados
              </p>
              <div className="grid grid-cols-2 gap-3">
                {data.newCheckIn && (
                  <div>
                    <p className="text-[10px] font-bold text-amber-500/70 uppercase tracking-wider">Nuevo Check-in</p>
                    <p className="text-[11px] font-bold text-gray-900">{formatDate(data.newCheckIn).split(',')[0]}</p>
                  </div>
                )}
                {data.newCheckOut && (
                  <div>
                    <p className="text-[10px] font-bold text-amber-500/70 uppercase tracking-wider">Nuevo Check-out</p>
                    <p className="text-[11px] font-bold text-gray-900">{formatDate(data.newCheckOut).split(',')[0]}</p>
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
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in-scale {
          animation: fadeInScale 0.2s ease-out forwards;
        }
        .animate-slide-in-right {
          animation: slideInRight 0.25s cubic-bezier(0, 0, 0.2, 1) forwards;
        }
      `}</style>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white  font-sans text-gray-900 ">

        {/* SIDEBAR */}
        <aside className="w-[300px] border-r border-gray-200  bg-white  flex flex-col shrink-0">
          <div className="p-3 border-b border-gray-200  bg-gray-50/50 ">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-xs uppercase tracking-wider text-gray-500">Solicitudes</h2>
              {petitions.length > 0 && (
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {petitions.length} TOTAL
                </span>
              )}
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-200  p-0.5 rounded-sm">
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider ${
                  activeTab === 'pending' ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Pendientes
              </button>
              <button
                onClick={() => setActiveTab('resolved')}
                className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider ${
                  activeTab === 'resolved' ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Resueltas
              </button>
              <button
                onClick={() => setActiveTab('general')}
                className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all uppercase tracking-wider ${
                  activeTab === 'general' ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'
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
              <div className="text-center p-4 text-xs text-gray-400">
                No hay solicitudes {activeTab === 'pending' ? 'pendientes' : activeTab === 'resolved' ? 'resueltas' : 'generales'}.
              </div>
            ) : (
              filteredItems.map((petition) => (
                <div
                  key={petition.id}
                  onClick={() => setSelectedPetition(petition)}
                  className={`p-2.5 rounded-sm cursor-pointer transition-all duration-200 border-l-2 active:scale-[0.98] ${selectedPetition?.id === petition.id
                    ? 'border-l-primary bg-primary/[0.03] border-y-primary/10 border-r-primary/10'
                    : 'border-l-transparent border-y-transparent border-r-transparent hover:bg-gray-50/80 hover:border-l-gray-200'
                    }`}
                >
                  <div className="flex justify-between items-start mb-0.5 pointer-events-none">
                    {activeTab === 'general' && (
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm border border-black/[0.05] ${
                        petition.type === 'CANCEL_MOVEMENT' 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'bg-purple-50 text-purple-700'
                      }`}>
                        {getRecipientLabel(petition)}
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{formatRelativeTime(petition.createdAt)}</span>
                  </div>
                  <h3 className={`text-[13px] font-bold text-gray-950 truncate mt-1 tracking-tight ${selectedPetition?.id === petition.id ? 'text-primary' : ''}`}>
                    {petition.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="w-5 h-5 rounded-sm bg-gray-100 border border-black/10 flex items-center justify-center text-[10px] font-bold text-gray-900">
                      {(() => {
                        const owner = petition.apartment?.owner || (petition.stay as any)?.apartment?.owner;
                        // For CANCEL_MOVEMENT, always show the petitioner (concierge) as the primary name
                        const displayUser = (petition.type === 'CANCEL_MOVEMENT' || !owner) ? petition.user : owner;
                        return getInitials(displayUser.firstName, displayUser.lastName);
                      })()}
                    </div>
                    <p className="text-[11px] text-gray-600  truncate">
                      {(() => {
                        const owner = petition.apartment?.owner || (petition.stay as any)?.apartment?.owner;
                        // For CANCEL_MOVEMENT, priority is the petitioner (concierge)
                        const displayUser = (petition.type === 'CANCEL_MOVEMENT' || !owner) ? petition.user : owner;
                        const aptNum = petition.apartment?.number || (petition.stay as any)?.apartment?.number;
                        return (
                          <span>
                            {displayUser.firstName} {displayUser.lastName}
                            {aptNum && <span className="text-gray-400 ml-1">(Dpto {aptNum})</span>}
                          </span>
                        );
                      })()}
                    </p>
                    {petition.status !== 'PENDING' && (
                      <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-sm border ${getStatusColor(petition.status)} flex items-center gap-1 uppercase tracking-wider`}>
                        {getStatusLabel(petition.status)}
                        {petition.isCorrected && (
                          <span className="material-symbols-outlined text-[12px] text-amber-500" title="Corregida">edit_square</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <section className="flex-1 flex flex-col bg-gray-50  overflow-hidden relative">
          {selectedPetition ? (
            <>
              {/* HEADER */}
              <div className="bg-white  px-5 py-3 border-b border-gray-200  flex items-center justify-between shrink-0">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[18px] font-bold text-gray-950 leading-none tracking-tight">
                      {selectedPetition.title}
                    </h2>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-sm border uppercase tracking-widest ${getStatusColor(selectedPetition.status)}`}>
                      {getStatusLabel(selectedPetition.status)}
                    </span>
                  </div>
                  <p className="text-gray-500 text-[11px] font-medium tracking-tight">
                    Solicitada el {formatDate(selectedPetition.createdAt)} • ID: #{selectedPetition.id.substring(0, 8)}
                  </p>
                </div>
              </div>

              {/* CONTENT BODY */}
              <div className="flex-1 p-3 flex flex-col gap-3 min-h-0 overflow-y-auto">

                {/* GRID: REQUESTER & CONTEXT */}
                <div key={`details-${selectedPetition.id}`} className="animate-slide-in-right flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3 shrink-0">

                  {/* Requester Card */}
                  <div className="bg-white  rounded-sm p-3 border border-gray-200  shadow-sm">
                    <div className="flex items-center gap-2 mb-3 border-b border-black/[0.03] pb-2">
                      <span className="material-symbols-outlined text-primary text-base">account_circle</span>
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Solicitante</h3>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-12 h-12 rounded-sm bg-gray-100 border border-black/10 flex items-center justify-center text-gray-900 font-bold text-sm">
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
                            <div className="flex flex-col gap-1.5 min-w-0">
                              <h4 className="text-[14px] font-bold text-gray-950 tracking-tight leading-none truncate">{displayUser.firstName} {displayUser.lastName}</h4>
                              <div className="flex items-baseline gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border uppercase tracking-widest ${(displayUser as any).role === 'CONCIERGE' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-gray-950 text-white border-transparent shadow-sm'}`}>
                                  {roleLabel}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1 mt-1">
                                <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                                  <span className="material-symbols-outlined text-[14px]">mail</span>
                                  <span className="truncate">{displayUser.email}</span>
                                </div>
                                {/* Display Apartment Number if available here too for context */}
                                {(selectedPetition.apartment || (selectedPetition.stay as any)?.apartment) && (
                                  <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                                    <span className="material-symbols-outlined text-[14px]">apartment</span>
                                    <span className="truncate">
                                      DEPTO {(selectedPetition.apartment?.number || (selectedPetition.stay as any)?.apartment?.number)}
                                      {selectedPetition.apartment?.building && ` • ${typeof selectedPetition.apartment.building === 'string' ? selectedPetition.apartment.building : (selectedPetition.apartment.building as any).name}`}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Detail Card (Dynamic based on type) */}
                  <div className="animate-fade-in-scale">
                    {renderPetitionDetails(selectedPetition)}
                  </div>
                  </div>
                </div>

                {/* DESCRIPTION CARD */}
                {selectedPetition.reason &&
                  !selectedPetition.reason.startsWith('Solicito registrar a') &&
                  !selectedPetition.reason.startsWith('Solicito actualizar los datos') &&
                  !selectedPetition.reason.startsWith('Modificación de datos') &&
                  selectedPetition.reason !== 'Sin descripción adicional' && (
                    <div className="flex flex-col bg-white  rounded-sm border border-black/[0.05] shadow-sm overflow-hidden shrink-0">
                      <div className="px-4 py-2 border-b border-black/[0.03] flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-base">chat_bubble</span>
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Descripción de la Solicitud</h3>
                      </div>
                      <div className="p-3 bg-blue-50/20 ">
                        <p className="text-gray-700  leading-snug text-[13px] italic">
                          "{selectedPetition.reason}"
                        </p>
                      </div>
                    </div>
                  )}

                {/* ATTACHED DOCUMENTS CARD */}
                {(selectedPetition.requestedData as any)?.rutDocumentUrl && (
                  <div className="flex flex-col bg-white rounded-sm border border-black/[0.05] shadow-sm overflow-hidden shrink-0 mt-3">
                    <div className="px-4 py-2 border-b border-black/[0.03] flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">attach_file</span>
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Documentos Adjuntos</h3>
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
                <div className="bg-gray-100 border-t border-gray-200 p-8 flex flex-col sm:flex-row items-center justify-center gap-6 shrink-0">
                  {selectedPetition.user.role === 'CONCIERGE' && selectedPetition.type !== 'CANCEL_MOVEMENT' ? (
                    <div className="flex-1 text-center text-xs text-gray-500 italic bg-white/50 py-3 rounded-sm border border-gray-200/50 max-w-md">
                      Esta petición debe ser revisada por el Propietario.
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={openRejectModal}
                        className="w-full sm:w-[200px] py-4 px-6 text-[11px] font-bold uppercase tracking-widest rounded-sm border border-red-200 bg-red-50 text-red-700 shadow-sm hover:bg-red-100 transition-all flex items-center justify-center gap-2 group"
                      >
                        <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform font-bold">cancel</span>
                        Rechazar
                      </button>
                      <button
                        onClick={openApproveModal}
                        className="w-full sm:w-[200px] py-4 px-6 text-[11px] font-bold uppercase tracking-widest rounded-sm bg-gray-950 text-white shadow-xl shadow-black/20 hover:bg-black hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 group"
                      >
                        <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform font-bold">check_circle</span>
                        Aprobar
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* READ ONLY ACTION BAR FOR PROCESSED PETITIONS */}
              {selectedPetition.status !== 'PENDING' && (
                <div className="bg-gray-50 border-t border-gray-200 p-3 flex flex-col items-center gap-2">
                  <div className="text-[11px] text-gray-500">
                    Esta solicitud fue {selectedPetition.status === 'APPROVED' ? 'aprobada' : 'rechazada'} el {formatDate(selectedPetition.reviewedAt || '')}.
                  </div>
                  {selectedPetition.adminNotes && (
                    <div className="text-[11px] font-bold bg-white p-3 rounded-sm border border-black/[0.05] text-left max-w-lg shadow-sm">
                      <span className="text-gray-400 uppercase text-[10px] block mb-1">Nota Administrativa:</span>
                      {selectedPetition.adminNotes}
                    </div>
                  )}
                  {selectedPetition.isCorrected && (
                    <div className="text-[11px] font-medium bg-amber-50 text-amber-800 p-2 rounded border border-amber-200 text-left max-w-lg mt-1 flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-sm">info</span>
                      <div>
                        <span className="font-bold">Corrección:</span> {selectedPetition.correctionNotes}
                      </div>
                    </div>
                  )}
                  {!impersonationMode && isCorrectionAllowed(selectedPetition) && (
                    <button
                      onClick={() => {
                        setCorrectionStatus(selectedPetition.status as 'APPROVED' | 'REJECTED');
                        setCorrectionNotes('');
                        setShowCorrectionModal(true);
                      }}
                      className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-600 hover:text-blue-600 font-bold transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">edit_square</span>
                      Editar Resolución
                    </button>
                  )}
                </div>
              )}

            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-2">
              <span className="material-symbols-outlined text-4xl text-gray-300">inbox</span>
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
          <p className="text-sm text-gray-600  mb-6">
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
                  className={`group flex items-center p-3 border rounded-sm cursor-pointer transition-all ${rejectionReasonEnum === option.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200  hover:border-primary/50'
                    }`}
                >
                  <input
                    type="radio"
                    name="rejection_reason"
                    checked={rejectionReasonEnum === option.id}
                    onChange={() => setRejectionReasonEnum(option.id)}
                    className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700 ">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2 block" htmlFor="comments">
              {reviewAction === 'APPROVED' ? 'Notas (Opcional)' : 'Comentarios adicionales (Opcional)'}
            </label>
            <textarea
              id="comments"
              className="w-full px-4 py-3 rounded-sm border border-gray-200  bg-white  text-gray-800  placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none text-sm"
              placeholder={reviewAction === 'APPROVED' ? "Opcional..." : "Escriba detalles adicionales aquí..."}
              rows={3}
              value={reviewReason}
              onChange={(e) => setReviewReason(e.target.value)}
            />
          </div>

          <div className="mt-6 flex justify-end items-center gap-3">
            <button
              onClick={() => setShowReviewModal(false)}
              className="px-5 py-2.5 text-sm font-medium text-gray-600  hover:bg-gray-200  rounded-sm transition-colors"
            >
              Volver
            </button>
            <button
              onClick={handleProcessReview}
              className={`px-6 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white rounded-sm shadow-lg transition-all ${reviewAction === 'REJECTED'
                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/10'
                : 'bg-gray-900 hover:bg-black shadow-black/10'
                }`}
            >
              {reviewAction === 'APPROVED' ? 'Confirmar Aprobación' : 'Confirmar Rechazo'}
            </button>
          </div>
        </div>
      </Modal>
      {/* CORRECTION MODAL */}
      <Modal
        isOpen={showCorrectionModal}
        onClose={() => setShowCorrectionModal(false)}
        title="Corregir Resolución"
        width="max-w-lg"
      >
        <div className="p-1">
          <p className="text-sm text-gray-600 mb-6">
            Estás editando la resolución de una petición ya procesada. 
            <span className="block mt-2 font-bold text-amber-600">
              ⚠️ Si cambias de Aprobado a Rechazado, el sistema intentará revertir los cambios automáticos (como fechas o estacionamientos).
            </span>
          </p>

          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nuevo Estado</label>
            <div className="flex gap-4">
              <button
                onClick={() => setCorrectionStatus('APPROVED')}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-sm border-2 transition-all ${
                  correctionStatus === 'APPROVED' 
                    ? 'border-green-600 bg-green-50 text-green-700' 
                    : 'border-gray-100 bg-white text-gray-400 opacity-50'
                }`}
              >
                <span className="material-symbols-outlined">check_circle</span>
                Aprobada
              </button>
              <button
                onClick={() => setCorrectionStatus('REJECTED')}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-sm border-2 transition-all ${
                  correctionStatus === 'REJECTED' 
                    ? 'border-red-600 bg-red-50 text-red-700' 
                    : 'border-gray-100 bg-white text-gray-400 opacity-50'
                }`}
              >
                <span className="material-symbols-outlined">cancel</span>
                Rechazada
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Motivo de la Corrección</label>
            <textarea
              value={correctionNotes}
              onChange={(e) => setCorrectionNotes(e.target.value)}
              placeholder="Explica brevemente por qué se está realizando esta corrección..."
              className="w-full p-3 text-sm border border-gray-200 rounded-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none h-32"
            />
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={() => setShowCorrectionModal(false)}
              className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleCorrectResolution}
              disabled={isSubmittingCorrection || !correctionNotes.trim()}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-sm hover:bg-blue-700 disabled:opacity-50 transition shadow-lg shadow-blue-500/20"
            >
              {isSubmittingCorrection ? 'Guardando...' : 'Guardar Corrección'}
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
        <div className="flex justify-center items-center p-4 bg-gray-50 rounded-sm min-h-[300px]">
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
