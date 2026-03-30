import { Modal } from '../../../../../components/Modal';
import type { Petition } from '../../../../../api/petitions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PetitionDetailModalProps {
  petition: Petition | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PetitionDetailModal = ({ petition, isOpen, onClose }: PetitionDetailModalProps) => {
  if (!petition) return null;

  const Card = ({ title, icon, children, accent = 'slate' }: any) => (
    <div className={`bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden`}>
      <div className={`absolute top-0 left-0 w-1 h-full bg-${accent}-900 opacity-10`}></div>
      <div className="flex items-center gap-2 mb-3">
        <span className={`material-symbols-outlined text-[16px] text-${accent}-400`}>{icon}</span>
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</h3>
      </div>
      {children}
    </div>
  );

  const Metadata = ({ label, value, mono = false }: any) => (
    <div className="flex flex-col">
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      <span className={`text-[12px] font-bold text-slate-900 ${mono ? 'font-mono' : ''}`}>{value || 'N/A'}</span>
    </div>
  );

  const statusMap: any = {
    'PENDING': { label: 'Pendiente', style: 'bg-white text-slate-900 border-slate-900', icon: 'schedule' },
    'APPROVED': { label: 'Aprobada', style: 'bg-slate-100 text-slate-400 border-slate-200', icon: 'verified' },
    'REJECTED': { label: 'Rechazada', style: 'bg-red-50 text-red-700 border-red-100', icon: 'cancel' }
  };

  const status = statusMap[petition.status] || { label: petition.status, style: 'bg-slate-50', icon: 'help' };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hoja de Petición"
      width="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Status & ID Header */}
        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">ID de Petición</span>
                <span className="text-[11px] font-mono font-bold text-slate-900">#{(petition.id || '').toUpperCase().slice(0, 8)}</span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-full ${status.style}`}>
                <span className="material-symbols-outlined text-sm">{status.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-widest">{status.label}</span>
            </div>
        </div>

        {/* Content Card */}
        <Card title="Detalles de la Solicitud" icon="description" accent="slate">
            <div className="space-y-4">
                <div className="border-b border-slate-50 pb-3">
                    <span className="text-[14px] font-black text-slate-900 tracking-tight">{petition.title}</span>
                </div>
                <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Descripción / Justificación</span>
                    <p className="text-[12px] font-medium text-slate-600 leading-relaxed italic">
                        "{petition.reason || 'Sin descripción adicional.'}"
                    </p>
                </div>
            </div>
        </Card>

        {/* Assignment & Location */}
        <div className="grid grid-cols-2 gap-4">
            <Card title="Ubicación" icon="apartment" accent="slate">
                <Metadata label="Unidad" value={`Depto ${petition.apartment?.number || (petition.stay as any)?.apartment?.number || 'S/N'}`} />
                <div className="mt-2">
                    <Metadata label="Torre / Bloque" value={(petition.apartment?.building as any)?.name || 'Principal'} />
                </div>
            </Card>
            
            <Card title="Cronología" icon="event" accent="slate">
                <Metadata label="Emitida el" value={format(new Date(petition.createdAt), 'dd MMMM yyyy', { locale: es })} />
                <div className="mt-2">
                    <Metadata label="Hora de Registro" value={format(new Date(petition.createdAt), 'HH:mm', { locale: es })} />
                </div>
            </Card>
        </div>

        {/* Dynamic Data (Requested Data) */}
        {petition.requestedData && Object.keys(petition.requestedData).length > 0 && (
            <Card title="Datos Adjuntos en Petición" icon="attachment" accent="slate">
                <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    {Object.entries(petition.requestedData).map(([key, value]: [string, any]) => {
                        if (key === 'apartmentId' || key === 'additionalGuests') return null;
                        const labelMap: any = {
                            guestFirstName: 'Nombre',
                            guestLastName: 'Apellido',
                            guestDocument: 'Documento / RUT',
                            correctFirstName: 'Nombre Correcto',
                            correctLastName: 'Apellido Correcto',
                            correctDocument: 'Documento Correcto'
                        };
                        return <Metadata key={key} label={labelMap[key] || key} value={value} mono={key.toLowerCase().includes('document')} />;
                    })}
                </div>
                
                {/* Additional Guests List */}
                {(petition.requestedData as any).additionalGuests && (petition.requestedData as any).additionalGuests.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-50">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Acompañantes Declarados</span>
                        <div className="space-y-1">
                            {(petition.requestedData as any).additionalGuests.map((g: any, i: number) => (
                                <div key={i} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100">
                                    <span className="text-[11px] font-bold text-slate-900">{g.firstName} {g.lastName}</span>
                                    <span className="text-[10px] font-mono text-slate-400">{g.document}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Card>
        )}

        {/* Footer info */}
        <div className="pt-6 flex justify-center">
            <button
                onClick={onClose}
                className="px-8 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors border border-slate-200 rounded-full hover:bg-slate-50"
            >
                Cerrar Expediente
            </button>
        </div>
      </div>
    </Modal>
  );
};
