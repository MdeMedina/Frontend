import { useState } from 'react';
import { format as dateFnsFormat } from 'date-fns';
import { Layout } from '../../components/Layout';
import { usePetitions, type Petition, type PetitionType, type PetitionStatus } from './Petitions/usePetitions';
import { PetitionFilters } from './Petitions/PetitionFilters';
import { PetitionSidebar } from './Petitions/PetitionSidebar';
import { PetitionDetails } from './Petitions/PetitionDetails';
import { UpsertPetitionModal } from './Petitions/PetitionModals/UpsertPetitionModal';
import { ReviewPetitionModal } from './Petitions/PetitionModals/ReviewPetitionModal';
import { DocumentPreviewModal } from './Petitions/PetitionModals/DocumentPreviewModal';

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-700 border-slate-200',
  APPROVED: 'bg-blue-50 text-blue-700 border-blue-100',
  REJECTED: 'bg-red-50 text-red-700 border-red-100',
};

export const PropietarioPetitions = () => {
  const {
    loading,
    sentPetitions,
    receivedPetitions,
    myApartments,
    allApartments,
    selectedPetition,
    setSelectedPetition,
    activeTab,
    setActiveTab,
    filterStatus,
    setFilterStatus,
    createPetition,
    reviewPetition,
  } = usePetitions();

  // Modal States
  const [showUpsertModal, setShowUpsertModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredPetitionsByStatus = (activeTab === 'sent' ? sentPetitions : receivedPetitions)
    .filter(p => !filterStatus || p.status === filterStatus);

  const handleCreateSubmit = async (formData: any) => {
    const result = await createPetition(formData);
    if (result.success) {
      setSuccessMessage('Su petición ha sido procesada exitosamente');
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  const handleReviewConfirm = async (action: 'APPROVED' | 'REJECTED', note: string) => {
    if (!selectedPetition) return;
    await reviewPetition(selectedPetition.id, action, note);
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '';
      return dateFnsFormat(new Date(dateString), "d 'de' MMMM yyyy");
    } catch {
      return dateString;
    }
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white font-sans text-slate-900 border-t border-slate-100">
        
        {/* SIDEBAR */}
        <aside className="w-[320px] border-r border-slate-200 bg-white flex flex-col shrink-0">
          <PetitionFilters
            activeTab={activeTab}
            onTabChange={setActiveTab}
            filterStatus={filterStatus}
            onStatusChange={setFilterStatus}
            onNewPetition={() => setShowUpsertModal(true)}
            successMessage={successMessage}
          />

          <PetitionSidebar
            petitions={filteredPetitionsByStatus}
            selectedPetitionId={selectedPetition?.id}
            onSelect={setSelectedPetition}
            activeTab={activeTab}
            loading={loading}
          />
        </aside>

        {/* MAIN CONTENT */}
        <section className="flex-1 flex flex-col bg-slate-50/30 overflow-hidden relative">
          {selectedPetition ? (
            <>
              {/* HEADER */}
              <div className="bg-white px-8 py-5 border-b border-slate-200 flex items-center justify-between shrink-0 shadow-[0px_4px_12px_rgba(0,0,0,0.02)]">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-black tracking-tighter text-slate-900 leading-none">
                      {selectedPetition.title}
                    </h2>
                    <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-sm border ${statusColors[selectedPetition.status]}`}>
                      {statusLabels[selectedPetition.status]}
                    </span>
                  </div>
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                    Solicitada el {formatDate(selectedPetition.createdAt)}
                  </p>
                </div>
              </div>

              {/* CONTENT BODY */}
              <div className="flex-1 p-6 flex flex-col gap-6 min-h-0 overflow-y-auto custom-scrollbar">
                
                {/* TOP GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 shrink-0">
                  
                  {/* Sender/Recipient Info */}
                  <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.02)] flex flex-col">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                      <span className="material-symbols-outlined text-slate-900 text-lg font-bold">account_circle</span>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {activeTab === 'received' ? 'Solicitante' : 'Datos del Remitente'}
                      </h3>
                    </div>
                    {selectedPetition.user && (
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded bg-slate-900 flex items-center justify-center text-white text-2xl font-black shrink-0">
                          {selectedPetition.user.firstName[0]}{selectedPetition.user.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-lg font-black tracking-tighter text-slate-900 truncate">
                            {selectedPetition.user.firstName} {selectedPetition.user.lastName}
                          </h4>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded border mb-2 mt-1 inline-block uppercase tracking-wider ${selectedPetition.user.role === 'CONCIERGE' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {selectedPetition.user.role === 'CONCIERGE' ? 'CONSERJERÍA' : 'PROPIETARIO'}
                          </span>
                          <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mt-1">
                            <span className="material-symbols-outlined text-sm">alternate_email</span>
                            {selectedPetition.user.email}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description / Reason */}
                  <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.02)] flex flex-col">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                      <span className="material-symbols-outlined text-slate-900 text-lg font-bold">subject</span>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Motivo / Descripción</h3>
                    </div>
                    <div className="flex-1 bg-slate-50/50 p-4 rounded border border-slate-100 italic">
                        <p className="text-sm font-bold text-slate-800 leading-relaxed tabular-nums">
                            {selectedPetition.reason || 'Sin descripción adicional proporcionada.'}
                        </p>
                    </div>
                  </div>
                </div>

                {/* DYNAMIC DETAILS */}
                <div className="shrink-0">
                    <PetitionDetails petition={selectedPetition} allApartments={allApartments} />
                </div>

                {/* ATTACHMENTS & ADMIN NOTES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
                    {(selectedPetition.requestedData as any)?.rutDocumentUrl && (
                        <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.02)]">
                            <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                                <span className="material-symbols-outlined text-slate-900 text-lg font-bold">file_present</span>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Documentos Adjuntos</h3>
                            </div>
                            <button
                                onClick={() => {
                                    setPreviewUrl((selectedPetition.requestedData as any).rutDocumentUrl);
                                    setShowPreviewModal(true);
                                }}
                                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded border border-slate-100 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-900 transition-colors">description</span>
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-600 group-hover:text-slate-900">Documento RUT</span>
                                </div>
                                <span className="material-symbols-outlined text-slate-400 text-lg">open_in_new</span>
                            </button>
                        </div>
                    )}

                    {selectedPetition.adminNotes && (
                        <div className="bg-slate-900 rounded-lg p-5 shadow-xl">
                            <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                                <span className="material-symbols-outlined text-white text-lg font-bold">reply</span>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Respuesta de Administración</h3>
                            </div>
                            <p className="text-white text-sm font-bold leading-relaxed italic">
                                "{selectedPetition.adminNotes}"
                            </p>
                        </div>
                    )}
                </div>
              </div>

              {/* ACTION BAR (Received PENDING ONLY) */}
              {activeTab === 'received' && selectedPetition.status === 'PENDING' && (
                <div className="bg-white border-t border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-center gap-6 shrink-0 shadow-[0px_-4px_12px_rgba(0,0,0,0.02)]">
                  <button
                    onClick={() => { setReviewAction('REJECTED'); setShowReviewModal(true); }}
                    className="w-full sm:w-[220px] py-3.5 px-6 text-[11px] font-black uppercase tracking-[0.2em] rounded-md border-2 border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-600/20 hover:bg-red-50 transition-all flex items-center justify-center gap-2 group"
                  >
                    <span className="material-symbols-outlined text-lg">block</span>
                    Rechazar
                  </button>
                  <button
                    onClick={() => { setReviewAction('APPROVED'); setShowReviewModal(true); }}
                    className="w-full sm:w-[220px] py-3.5 px-6 text-[11px] font-black uppercase tracking-[0.2em] rounded-md bg-slate-900 text-white shadow-xl shadow-slate-900/10 hover:bg-slate-800 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group ring-offset-2 focus:ring-2 focus:ring-slate-900"
                  >
                    <span className="material-symbols-outlined text-lg">verified</span>
                    Aprobar
                  </button>
                </div>
              )}

            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-4">
              <div className="p-8 rounded-full bg-white border border-slate-100 shadow-sm animate-pulse">
                <span className="material-symbols-outlined text-6xl">outgoing_mail</span>
              </div>
              <div className="text-center">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Seleccione una petición</h3>
                <p className="text-[10px] font-bold text-slate-300 italic max-w-[200px] mt-1 mx-auto">Para visualizar los detalles quirúrgicos de la solicitud</p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* MODALS */}
      <UpsertPetitionModal
        isOpen={showUpsertModal}
        onClose={() => setShowUpsertModal(false)}
        onSubmit={handleCreateSubmit}
        myApartments={myApartments}
        allApartments={allApartments}
      />

      <ReviewPetitionModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        action={reviewAction}
        onConfirm={handleReviewConfirm}
      />

      <DocumentPreviewModal
        isOpen={showPreviewModal}
        url={previewUrl}
        onClose={() => setShowPreviewModal(false)}
      />
    </Layout>
  );
};
