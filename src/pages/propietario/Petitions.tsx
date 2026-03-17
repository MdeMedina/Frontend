import { useState, useEffect, useRef } from 'react';
import { Layout } from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/client';
import { io, Socket } from 'socket.io-client';
import { getApiUrl } from '../../api/client';
import { Modal } from '../../components/Modal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type PetitionType =
  | 'MODIFY_STAY'
  | 'CREATE_APARTMENT'
  | 'MODIFY_APARTMENT'
  | 'DELETE_APARTMENT'
  | 'CREATE_MANAGER'
  | 'MODIFY_MANAGER'
  | 'DELETE_MANAGER'
  | 'MODIFY_GUEST_DATA'
  | 'ASSIGN_PARKING'
  | 'CANCEL_MOVEMENT'
  | 'OTHER';

type PetitionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

type Petition = {
  id: string;
  type: PetitionType;
  title: string;
  reason: string;
  status: PetitionStatus;
  apartmentId?: string;
  apartment?: {
    id: string;
    number: string;
    building: string;
    manager?: any;
    floor?: string;
  };
  stayId?: string;
  stay?: {
    id: string;
    category: 'GUEST' | 'STAFF';
    status: 'SCHEDULED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
    scheduledCheckIn: string;
    scheduledCheckOut: string;
    actualCheckIn?: string;
    actualCheckOut?: string;
    guestFirstName?: string;
    guestLastName?: string;
    guestDocument?: string;
    guests?: Array<{
      firstName: string;
      lastName: string;
      document: string;
    }>;
    apartment?: {
      id: string;
      number: string;
      floor: number;
      building: string | {
        id: string;
        name: string;
      };
    };
  };
  userId: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  requestedData?: any;
  adminNotes?: string;
  reviewedAt?: string;
  createdAt: string;
};

const typeLabels: Record<PetitionType, string> = {
  MODIFY_STAY: 'Modificar Reserva',
  CREATE_APARTMENT: 'Crear Departamento',
  MODIFY_APARTMENT: 'Modificar Departamento',
  DELETE_APARTMENT: 'Eliminar Departamento',
  CREATE_MANAGER: 'Asignar Responsable',
  MODIFY_MANAGER: 'Cambiar Responsable',
  DELETE_MANAGER: 'Remover Responsable',
  MODIFY_GUEST_DATA: 'Modificar Datos de Huésped',
  ASSIGN_PARKING: 'Asignar Estacionamiento',
  CANCEL_MOVEMENT: 'Cancelar Movimiento',
  OTHER: 'Otro',
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'CREATE_MANAGER': return 'bg-purple-100 text-purple-700';
    case 'CREATE_APARTMENT': return 'bg-emerald-100 text-emerald-700';
    case 'MODIFY_STAY': return 'bg-blue-100 text-blue-700';
    case 'DELETE_APARTMENT': return 'bg-red-100 text-red-700';
    case 'MODIFY_GUEST_DATA': return 'bg-indigo-100 text-indigo-700';
    case 'ASSIGN_PARKING': return 'bg-pink-100 text-pink-700';
    default: return 'bg-amber-100 text-amber-700';
  }
};

const statusLabels: Record<PetitionStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
};

const statusColors: Record<PetitionStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  APPROVED: 'bg-green-100 text-green-800 border-green-300',
  REJECTED: 'bg-red-100 text-red-800 border-red-300',
};

export const PropietarioPetitions = () => {
  const { user } = useAuth();
  const [sentPetitions, setSentPetitions] = useState<Petition[]>([]);
  const [receivedPetitions, setReceivedPetitions] = useState<Petition[]>([]);
  const [myApartments, setMyApartments] = useState<any[]>([]);
  const [allApartments, setAllApartments] = useState<any[]>([]);
  // Document Preview State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const [loading, setLoading] = useState(true);

  const [selectedPetition, setSelectedPetition] = useState<Petition | null>(null);
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');

  // Modal States
  const [showModal, setShowModal] = useState(false);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [rejectionReasonEnum, setRejectionReasonEnum] = useState('INCOMPLETE_INFO');
  const [reviewReason, setReviewReason] = useState('');

  const [formData, setFormData] = useState({
    type: 'OTHER' as PetitionType,
    title: '',
    reason: '',
    apartmentId: '',
    showDescription: false,
    // Assign Parking Fields
    targetApartment: '',
    parkingNumber: '',
    startDate: '',
    endDate: '',
  });

  const [filterStatus, setFilterStatus] = useState('');
  const socketRef = useRef<Socket | null>(null);

  // --- HELPERS ---
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '';
      // Create date object and adjust for timezone offset to display as UTC
      const date = new Date(dateString);
      const userTimezoneOffset = date.getTimezoneOffset() * 60000;
      const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
      return format(adjustedDate, "d 'de' MMM yyyy", { locale: es });
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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const fetchPetitions = async () => {
    try {
      setLoading(true);
      const [petitionsRes, apartmentsRes] = await Promise.all([
        apiClient.get('/petitions', { params: { limit: 100 } }),
        apiClient.get('/apartments'),
      ]);

      const allPetitions = petitionsRes.data.data || [];
      const apartmentsList = apartmentsRes.data.data || apartmentsRes.data;
      setAllApartments(apartmentsList);

      // Mis departamentos
      const mine = apartmentsList.filter((apt: any) => apt.owner?.id === user?.id);
      setMyApartments(mine);
      const myApartmentIds = mine.map((a: any) => a.id);

      // Sent
      const sent = allPetitions.filter(
        (p: Petition) => p.userId === user?.id || p.user?.id === user?.id
      );
      setSentPetitions(sent);

      // Received
      const received = allPetitions.filter(
        (p: Petition) => {
          if (p.userId === user?.id || p.user?.id === user?.id) return false;
          // EXCEPCIÓN: No mostrar peticiones de CANCEL_MOVEMENT en recibidas (son solo para el Admin)
          if (p.type === 'CANCEL_MOVEMENT') return false;
          if (p.apartmentId && myApartmentIds.includes(p.apartmentId)) return true;
          if (p.stay?.apartment && mine.some((apt: any) => apt.number === (p.stay as any).apartment.number)) return true;
          if (p.requestedData?.apartmentId && myApartmentIds.includes(p.requestedData.apartmentId)) return true;
          if (p.type === 'MODIFY_GUEST_DATA' && p.stayId) return true;
          return false;
        }
      );
      setReceivedPetitions(received);

      // Auto-select logic
      if (!selectedPetition) {
        const listToSelect = activeTab === 'sent' ? sent : received;
        if (listToSelect.length > 0) setSelectedPetition(listToSelect[0]);
      }

    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPetitions();
  }, [user?.id]);

  useEffect(() => {
    const currentList = activeTab === 'sent' ? sentPetitions : receivedPetitions;
    const filtered = currentList.filter(p => !filterStatus || p.status === filterStatus);

    if (filtered.length > 0 && (!selectedPetition || !filtered.find(p => p.id === selectedPetition.id))) {
      setSelectedPetition(filtered[0]);
    } else if (filtered.length === 0) {
      setSelectedPetition(null);
    }
  }, [activeTab, filterStatus, sentPetitions, receivedPetitions]);

  // WebSocket Logic
  useEffect(() => {
    if (!user?.id) return;
    const token = localStorage.getItem('token');
    if (token) {
      const apiUrl = getApiUrl();
      const socket = io(apiUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
      });
      socketRef.current = socket;

      socket.on('petition_updated', (data: { petition: any }) => {
        setSentPetitions(prev => prev.map(p => p.id === data.petition.id ? data.petition : p));
        setReceivedPetitions(prev => prev.map(p => p.id === data.petition.id ? data.petition : p));
        if (selectedPetition?.id === data.petition.id) setSelectedPetition(data.petition);
      });

      socket.on('petition_created', (data: { petition: any }) => {
        if (data.petition.userId !== user.id && data.petition.user?.id !== user.id) {
          fetchPetitions();
        }
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [user?.id, selectedPetition?.id]);

  const currentPetitions = activeTab === 'sent' ? sentPetitions : receivedPetitions;
  const filteredPetitions = currentPetitions.filter(p => {
    if (filterStatus && p.status !== filterStatus) return false;
    return true;
  });

  // --- ACTIONS ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetApt = allApartments.find(a => a.id === formData.targetApartment);

      await apiClient.post('/petitions', {
        type: formData.type,
        title: formData.title,
        reason: formData.showDescription && formData.reason.trim() ? formData.reason : 'Sin descripción adicional',
        apartmentId: formData.apartmentId || undefined,
        requestedData: formData.type === 'ASSIGN_PARKING' ? {
          targetApartmentId: formData.targetApartment,
          targetApartmentNumber: targetApt?.number,
          parkingNumber: formData.parkingNumber,
          startDate: formData.startDate,
          endDate: formData.endDate
        } : undefined,
      });
      fetchPetitions();
      setFormData({
        type: 'OTHER', title: '', reason: '', apartmentId: '', showDescription: false,
        targetApartment: '', parkingNumber: '', startDate: '', endDate: ''
      });
      setTimeout(() => {}, 3000);
    } catch (err: any) {
      console.error(err);
    }
  };

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
      await apiClient.patch(`/petitions/${selectedPetition.id}/review`, {
        status: reviewAction,
        adminNotes: finalNote
      });
      fetchPetitions();
      setShowReviewModal(false);
      setReviewAction(null);
      setRejectionReasonEnum('INCOMPLETE_INFO');
      setReviewReason('');
    } catch (err: any) {
      console.error(err);
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

  const openCreateModal = () => {
    setFormData({
      type: 'OTHER', title: '', reason: '', apartmentId: '', showDescription: false,
      targetApartment: '', parkingNumber: '', startDate: '', endDate: ''
    });
    setShowModal(true);
  };

  // --- RENDER HELPERS (Adapted for Propietario with Diff View) ---

  const renderPetitionDetails = (petition: Petition) => {
    const data = petition.requestedData || {};

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
      if (petition.type === 'MODIFY_MANAGER') {
        const managerId = data.managerId;
        const resolvedApartment = allApartments.find(a =>
          a.manager?.id === managerId || (typeof a.manager === 'object' && a.manager?.id === managerId)
        );
        const currentManager = resolvedApartment?.manager || petition.apartment?.manager;

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-full">
            {currentManager && (
              <Card title="Responsable Actual" icon="manage_accounts" className="opacity-75">
                <div className="space-y-1.5">
                  <Field label="Nombre" value={`${currentManager.firstName} ${currentManager.lastName}`} />
                  <Field label="Email" value={currentManager.email} />
                </div>
              </Card>
            )}
            <Card title="Cambios Solicitados" icon="edit_note" className="border-amber-200 bg-amber-50/30">
              <div className="space-y-1.5">
                <Field label="Nuevo Nombre" value={`${data.firstName || ''} ${data.lastName || ''}`} />
                <Field label="Nuevo Email" value={data.email} />
                <Field label="Nuevo RUT" value={data.rut} />
                {(data.phone || data.phoneNumber) && <Field label="Nuevo Teléfono" value={data.phone || data.phoneNumber} />}
              </div>
            </Card>
          </div>
        );
      }

      const managerData = petition.type === 'DELETE_MANAGER' ? (petition.apartment?.manager || data) : data;
      const name = managerData.firstName ? `${managerData.firstName} ${managerData.lastName || ''}` : ((managerData as any).managerName || 'Sin nombre');

      return (
        <Card title="Datos del Responsable" icon="manage_accounts" className="h-full">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
              {getInitials(name, '')}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold truncate text-slate-900">{name}</h4>
              <p className="text-[10px] text-slate-500 truncate">{managerData.email || 'N/A'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <Field label="RUT" value={managerData.rut || (managerData as any).rut} />
            <Field label="Teléfono" value={managerData.phone || (managerData as any).phoneNumber} />
            <Field label="Acción" value={petition.type === 'DELETE_MANAGER' ? 'Eliminar' : 'Asignar'} />
          </div>
          {petition.apartment && (
            <div className="mt-2 text-center text-[10px] text-slate-500 bg-slate-100 p-1 rounded">
              Dept: {petition.apartment.number}
            </div>
          )}
        </Card>
      );
    }

    // 2. APARTMENT PETITIONS
    if (['CREATE_APARTMENT', 'MODIFY_APARTMENT', 'DELETE_APARTMENT'].includes(petition.type)) {
      const aptData = petition.type === 'CREATE_APARTMENT' ? data : (petition.apartment || data);

      return (
        <div className="grid grid-cols-1 gap-3 h-full">
          <Card title="Datos del Departamento" icon="apartment">
            <div className="grid grid-cols-3 gap-1.5">
              <Field label="Número" value={aptData.number} />
              <Field label="Piso" value={aptData.floor} />
              <Field label="Torre" value={typeof aptData.building === 'string' ? aptData.building : aptData.building?.name} />
              {(aptData.parkingNumber) && <div className="col-span-3"><Field label="Estacionamiento" value={aptData.parkingNumber} /></div>}
            </div>
          </Card>

          {petition.type === 'MODIFY_APARTMENT' && (
            <Card title="Cambios Solicitados" icon="edit_note" className="border-amber-200 bg-amber-50/30">
              <div className="space-y-1.5">
                {data.parkingNumber !== undefined && data.parkingNumber !== aptData.parkingNumber &&
                  <Field label="Nuevo Estacionamiento" value={data.parkingNumber} />
                }
                {data.description !== undefined && data.description !== aptData.description &&
                  <div className="text-[10px] italic text-slate-600 bg-white p-1 rounded border border-amber-100">"{data.description}"</div>
                }
              </div>
            </Card>
          )}
        </div>
      );
    }

    // 3. STAY / GUEST
    if (petition.type === 'MODIFY_STAY' || petition.type === 'MODIFY_GUEST_DATA') {
      const stay = petition.stay;
      if (!stay) return <Card title="Reserva" icon="hotel"><p className="text-xs text-red-500">No disponible</p></Card>;

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

    // 4. ASSIGN PARKING
    if (petition.type === 'ASSIGN_PARKING') {
      const assignment = (petition as any).parkingAssignment; // If backend populates it
      const targetAptName = assignment?.targetApartment
        ? `${assignment.targetApartment.number} (${assignment.targetApartment.building?.name})`
        : 'Desconocido';
      const sourceAptName = assignment?.sourceApartment
        ? `${assignment.sourceApartment.number} (${assignment.sourceApartment.building?.name})`
        : petition.apartment?.number || 'Mío';

      return (
        <Card title="Asignación Temporal" icon="local_parking" className="h-full bg-pink-50/50 border-pink-100">
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Origen" value={sourceAptName} />
              <Field label="Estacionamiento" value={data.parkingNumber || assignment?.parkingNumber} />
            </div>
            <div className="grid grid-cols-1">
              <Field label="Destino (Beneficiario)" value={targetAptName || 'Cargando...'} />
            </div>
            <div className="bg-white p-2 rounded border border-pink-100 grid grid-cols-2 gap-2">
              <Field label="Desde" value={formatDate(data.startDate || assignment?.startDate).split(',')[0]} />
              <Field label="Hasta" value={formatDate(data.endDate || assignment?.endDate).split(',')[0]} />
            </div>
          </div>
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
              <h2 className="font-bold text-xs">Mis Peticiones</h2>
              <button
                onClick={openCreateModal}
                className="bg-pink-600 text-white p-1.5 rounded-full hover:bg-pink-700 transition shadow-md flex items-center justify-center"
                title="Nueva Petición"
              >
                <span className="material-symbols-outlined text-lg font-bold">add</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-200  p-0.5 rounded-lg mb-3">
              <button
                onClick={() => setActiveTab('sent')}
                className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${activeTab === 'sent' ? 'bg-white shadow text-primary' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                Enviadas
              </button>
              <button
                onClick={() => setActiveTab('received')}
                className={`flex-1 py-1 rounded-md text-[10px] font-bold transition-all ${activeTab === 'received' ? 'bg-white shadow text-primary' : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                Recibidas
              </button>
            </div>

            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-white  border border-slate-200  text-slate-700  py-1 px-2 rounded text-[10px] focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Todos los estados</option>
              <option value="PENDING">Pendientes</option>
              <option value="APPROVED">Aprobadas</option>
              <option value="REJECTED">Rechazadas</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
            {loading ? (
              <div className="flex justify-center p-4"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div></div>
            ) : filteredPetitions.length === 0 ? (
              <div className="text-center p-4 text-xs text-slate-400">No hay peticiones.</div>
            ) : (
              filteredPetitions.map((petition) => (
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
                      {typeLabels[petition.type] || petition.type}
                    </span>
                    <span className="text-[9px] text-slate-500">{formatRelativeTime(petition.createdAt)}</span>
                  </div>
                  <h3 className="text-[13px] font-semibold text-slate-800  truncate mt-1">
                    {petition.title}
                  </h3>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${statusColors[petition.status]}`}>
                      {statusLabels[petition.status]}
                    </span>
                    {activeTab === 'received' && petition.user && (
                      <span className="text-[9px] text-slate-500">{petition.user.firstName}</span>
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
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full ${statusColors[selectedPetition.status]}`}>
                      {statusLabels[selectedPetition.status]}
                    </span>
                  </div>
                  <p className="text-slate-500  text-[10px]">
                    Solicitada el {formatDate(selectedPetition.createdAt)}
                  </p>
                </div>
              </div>

              {/* CONTENT BODY */}
              <div className="flex-1 p-3 flex flex-col gap-3 min-h-0 overflow-y-auto">

                {/* GRID: INFO & CONTEXT */}
                <div className="grid grid-cols-2 gap-3 shrink-0">

                  {/* User Info Card (Sender) - Only relevant if Received or verifying Sent info */}
                  <div className="bg-white  rounded-lg p-3 border border-slate-200  shadow-sm">
                    <div className="flex items-center gap-2 mb-2 border-b border-slate-100  pb-1.5">
                      <span className="material-symbols-outlined text-primary text-base">account_circle</span>
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {activeTab === 'received' ? 'Solicitante' : 'Enviado por mí'}
                      </h3>
                    </div>
                    {selectedPetition.user && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                          {getInitials(selectedPetition.user.firstName, selectedPetition.user.lastName)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[13px] font-bold truncate">
                            {selectedPetition.user.firstName} {selectedPetition.user.lastName}
                          </h4>
                          <span className={`text-[8px] font-bold px-1 rounded border mr-2 ${selectedPetition.user.role === 'CONCIERGE' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                            {selectedPetition.user.role === 'CONCIERGE' ? 'CONSERJE' : 'SOLICITANTE'}
                          </span>
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                              <span className="material-symbols-outlined text-[10px]">mail</span>
                              {selectedPetition.user.email}
                            </div>

                            {/* Context Info: Apartment & Building */}
                            {(selectedPetition.apartment || (selectedPetition.stay as any)?.apartment) && (
                              <div className="text-[10px] text-slate-600 font-medium flex items-center gap-1">
                                <span className="material-symbols-outlined text-[10px]">apartment</span>
                                <span>
                                  Dpto {selectedPetition.apartment?.number || (selectedPetition.stay as any)?.apartment?.number} - {
                                    selectedPetition.apartment?.building
                                      ? (typeof selectedPetition.apartment.building === 'string' ? selectedPetition.apartment.building : (selectedPetition.apartment.building as any).name)
                                      : (selectedPetition.stay as any)?.apartment?.building
                                        ? (typeof (selectedPetition.stay as any).apartment.building === 'string' ? (selectedPetition.stay as any).apartment.building : (selectedPetition.stay as any).apartment.building.name)
                                        : ''
                                  }
                                </span>
                              </div>
                            )}

                            {/* Context Info: Guest / Stay */}
                            {selectedPetition.stay && (
                              <div className="text-[10px] text-slate-600 font-medium flex items-center gap-1">
                                <span className="material-symbols-outlined text-[10px]">person</span>
                                <span>
                                  Huésped: {selectedPetition.stay.guestFirstName} {selectedPetition.stay.guestLastName}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
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
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Descripción / Motivo</h3>
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

                {/* ADMIN NOTES (Response) */}
                {selectedPetition.adminNotes && (
                  <div className="flex flex-col bg-white  rounded-lg border border-slate-200  shadow-sm overflow-hidden shrink-0">
                    <div className="px-3 py-1.5 border-b border-slate-100  flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-500 text-base">admin_panel_settings</span>
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Respuesta de Administración</h3>
                    </div>
                    <div className="p-3">
                      <p className="text-slate-700  text-[12px]">
                        {selectedPetition.adminNotes}
                      </p>
                    </div>
                  </div>
                )}

              </div>

              {/* FIXED ACTION BAR - Only for Received Petitions */}
              {activeTab === 'received' && selectedPetition.status === 'PENDING' && (
                <div className="bg-white  border-t border-slate-200  p-2 flex items-center justify-end gap-2 shrink-0">
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
                    Aprobar
                  </button>
                </div>
              )}

            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 flex-col gap-2">
              <span className="material-symbols-outlined text-4xl text-slate-300">touch_app</span>
              <p className="text-sm">Selecciona una petición</p>
            </div>
          )}
        </section>
      </div>

      {/* MODALS */}

      {/* Nuevo/Crear */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nueva Petición">
        <form onSubmit={handleSubmit} className="space-y-4 p-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tipo</label>
            <select
              value={formData.type}
              onChange={(e) => {
                const type = e.target.value as PetitionType;
                // Auto-titles could be improved
                setFormData({ ...formData, type, title: '' });
              }}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary"
            >
              <option value="OTHER">Otro</option>
              <option value="CREATE_APARTMENT">Registrar Nuevo Departamento</option>
              <option value="MODIFY_APARTMENT">Modificar Departamento</option>
              <option value="CREATE_MANAGER">Asignar Responsable</option>
              <option value="ASSIGN_PARKING">Asignar Estacionamiento Temporal</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Título</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary"
              placeholder="Resumen breve"
              required
            />
          </div>
          {['MODIFY_APARTMENT', 'CREATE_MANAGER'].includes(formData.type) && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Departamento</label>
              <select
                value={formData.apartmentId}
                onChange={(e) => setFormData({ ...formData, apartmentId: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                required
              >
                <option value="">Selecciona un departamento</option>
                {myApartments.map(apt => (
                  <option key={apt.id} value={apt.id}>
                    {apt.number} - {typeof apt.building === 'string' ? apt.building : apt.building?.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.type === 'ASSIGN_PARKING' && (
            <div className="space-y-3 p-3 bg-pink-50 rounded-lg border border-pink-100">
              <h4 className="text-xs font-bold text-pink-800 uppercase border-b border-pink-200 pb-1">Datos de Asignación</h4>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mi Departamento (Origen)</label>
                <select
                  value={formData.apartmentId}
                  onChange={(e) => {
                    const apt = myApartments.find(a => a.id === e.target.value);
                    setFormData({
                      ...formData,
                      apartmentId: e.target.value,
                      parkingNumber: apt?.parkingNumber || ''
                    });
                  }}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  required
                >
                  <option value="">Selecciona tu departamento</option>
                  {myApartments.map(apt => {
                    const isLent = apt.sourceAssignments && apt.sourceAssignments.length > 0;
                    const hasParking = apt.parkingNumber || isLent; // Tiene estacionamiento (ya sea libre o prestado)

                    if (!hasParking) return null; // No mostrar si no tiene estacionamiento asignado ni prestado

                    return (
                      <option key={apt.id} value={apt.id} disabled={isLent}>
                        {apt.number} {isLent ? '(Prestado)' : `(Est: ${apt.parkingNumber})`}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">Se usará el estacionamiento asignado a este depto.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estacionamiento a prestar</label>
                <input
                  type="text"
                  value={formData.parkingNumber}
                  onChange={(e) => setFormData({ ...formData, parkingNumber: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-100"
                  readOnly // Read only because it comes from source apartment
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Departamento Destino (Beneficiario)</label>
                {/* Custom Searchable Select - Dropdown */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por número o propietario..."
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                    value={formData.targetApartment ?
                      (() => {
                        const apt = allApartments.find(a => a.id === formData.targetApartment);
                        return apt ? `Depto ${apt.number} - ${apt.owner?.firstName || ''} ${apt.owner?.lastName || ''}` : '';
                      })()
                      : (formData as any).searchText || ''}
                    onChange={(e) => {
                      // Si el usuario escribe, borramos la selección actual y actualizamos el texto de búsqueda
                      setFormData(prev => ({
                        ...prev,
                        targetApartment: '',
                        searchText: e.target.value,
                        showDropdown: true
                      } as any));
                    }}
                    onFocus={() => setFormData(prev => ({ ...prev, showDropdown: true } as any))}
                    onBlur={() => setTimeout(() => setFormData(prev => ({ ...prev, showDropdown: false } as any)), 200)}
                    required={!formData.targetApartment}
                  />

                  {formData.targetApartment && (
                    <button
                      type="button"
                      className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
                      onClick={() => setFormData(prev => ({ ...prev, targetApartment: '', searchText: '' } as any))}
                    >
                      <span className="material-symbols-outlined text-sm font-bold">close</span>
                    </button>
                  )}

                  {!(formData.targetApartment) && (
                    <div className="absolute right-2 top-2.5 pointer-events-none">
                      <span className="material-symbols-outlined text-slate-400 text-sm">expand_more</span>
                    </div>
                  )}

                  {(formData as any).showDropdown && (
                    <div className="absolute z-50 w-full bg-white max-h-60 overflow-y-auto border border-slate-200 rounded-lg shadow-xl mt-1 scrollbar-thin scrollbar-thumb-gray-300">
                      {allApartments
                        .filter(a => {
                          const search = ((formData as any).searchText || '').toLowerCase();
                          const ownerName = `${a.owner?.firstName || ''} ${a.owner?.lastName || ''}`.toLowerCase();
                          const aptNumber = a.number.toLowerCase();
                          return aptNumber.includes(search) || ownerName.includes(search);
                        })
                        .filter(a => a.id !== formData.apartmentId) // Exclude source
                        .sort((a, b) => a.number.localeCompare(b.number))
                        .map(apt => (
                          <div
                            key={apt.id}
                            className="p-2.5 hover:bg-pink-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                            onMouseDown={() => {
                              setFormData(prev => ({ ...prev, targetApartment: apt.id, searchText: '', showDropdown: false } as any));
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-800 text-sm">Depto {apt.number}</span>
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                {typeof apt.building === 'string' ? apt.building : apt.building?.name}
                              </span>
                            </div>
                            <span className="block text-xs text-slate-500 mt-0.5">
                              Propietario: <span className="text-slate-700 font-medium">{apt.owner?.firstName || 'Sin'} {apt.owner?.lastName || 'Asignar'}</span>
                            </span>
                          </div>
                        ))}

                      {allApartments.filter(a => {
                        const search = ((formData as any).searchText || '').toLowerCase();
                        const ownerName = `${a.owner?.firstName || ''} ${a.owner?.lastName || ''}`.toLowerCase();
                        return a.number.toLowerCase().includes(search) || ownerName.includes(search);
                      }).filter(a => a.id !== formData.apartmentId).length === 0 && (
                          <div className="p-3 text-xs text-slate-400 text-center italic">No se encontraron resultados</div>
                        )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Desde</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hasta</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    required
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center">
                <span className="block text-xs font-bold text-slate-700 mr-2">Detalle / Motivo</span>
                <input
                  type="checkbox"
                  checked={formData.showDescription}
                  onChange={(e) => setFormData({ ...formData, showDescription: e.target.checked })}
                  className="w-3.5 h-3.5 text-primary rounded border-slate-300 focus:ring-primary"
                />
                <span className="ml-2 text-xs text-slate-600">Agregar descripción</span>
              </label>
            </div>

            {formData.showDescription && (
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm h-24 resize-none"
                placeholder="Describe tu solicitud..."
                required
              />
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-blue-700 font-bold text-xs shadow-md"
            >
              Enviar Petición
            </button>
          </div>
        </form>
      </Modal>

      {/* Revisar/Rechazar */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title={reviewAction === 'APPROVED' ? 'Aprobar Petición' : 'Rechazar Petición'}
        width="max-w-md"
      >
        <div className="space-y-4 p-1">
          {reviewAction === 'REJECTED' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Motivo de Rechazo</label>
              <select
                value={rejectionReasonEnum}
                onChange={(e) => setRejectionReasonEnum(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
              >
                <option value="INCOMPLETE_INFO">Información incompleta</option>
                <option value="EXPIRED_DOCS">Documentación vencida</option>
                <option value="REQUIREMENTS_NOT_MET">No cumple con requisitos</option>
                <option value="OTHER">Otros</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {reviewAction === 'APPROVED' ? 'Notas de Aprobación (Opcional)' : 'Comentarios Adicionales'}
            </label>
            <textarea
              value={reviewReason}
              onChange={(e) => setReviewReason(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm h-24 resize-none focus:ring-primary focus:border-primary"
              placeholder={reviewAction === 'APPROVED' ? "Ej: Aprobado sujeta a revisión..." : "Explica el motivo..."}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              onClick={() => setShowReviewModal(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold text-xs"
            >
              Cancelar
            </button>
            <button
              onClick={handleProcessReview}
              className={`px-4 py-2 rounded-lg text-white font-bold text-xs shadow-md ${reviewAction === 'APPROVED' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'
                }`}
            >
              Confirmar {reviewAction === 'APPROVED' ? 'Aprobación' : 'Rechazo'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title="Vista Previa de Documento"
        width="max-w-4xl"
      >
        <div className="flex justify-center bg-slate-100 rounded-lg overflow-hidden min-h-[500px]">
          {previewUrl ? (
            <iframe src={previewUrl} className="w-full h-[600px] border-none" title="Document Preview" />
          ) : (
            <div className="flex items-center justify-center p-10 text-slate-400">
              No hay documento para mostrar
            </div>
          )}
        </div>
      </Modal>
    </Layout>
  );
};
