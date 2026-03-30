import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Modal } from '../../../../components/Modal';
import { categoryLabels, statusLabels } from '../../../../api/stays';
import type { Stay } from '../../../../api/stays';

interface ReservationDetailModalProps {
  stay: Stay | null;
  isOpen: boolean;
  onClose: () => void;
}

const Card = ({ title, icon, children, className = '' }: any) => (
  <div className={`bg-white rounded-lg p-5 border border-slate-200 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.02)] flex flex-col ${className}`}>
    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
      <span className="material-symbols-outlined text-slate-900 text-lg font-bold">{icon}</span>
      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</h3>
    </div>
    {children}
  </div>
);

const Field = ({ label, value, className = '' }: any) => (
  <div className={`bg-slate-50 p-3 rounded border border-slate-100 flex flex-col items-center justify-center ${className}`}>
    <p className="text-[9px] uppercase font-black tracking-wider text-slate-400 mb-1">{label}</p>
    <p className="text-sm font-black text-slate-900 truncate tabular-nums">{value || 'N/A'}</p>
  </div>
);

export const ReservationDetailModal = ({ stay, isOpen, onClose }: ReservationDetailModalProps) => {
  if (!stay) return null;

  const formatDateLong = (dateString: string) => {
    try {
      return format(new Date(dateString), "EEEE, d 'de' MMMM", { locale: es });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "HH:mm 'hrs'");
    } catch {
      return '';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Departamento ${stay.apartment?.number || 'S/N'}`}
      width="max-w-xl"
    >
      <div className="flex flex-col gap-6 max-h-[80vh] overflow-y-auto custom-scrollbar pr-2 py-2">
        
        {/* Header Summary */}
        <div className="flex items-center justify-between bg-slate-900 p-6 rounded-xl shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <span className="px-2.5 py-0.5 rounded-sm bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.2em]">
                        {categoryLabels[stay.category]}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-sm text-white text-[10px] font-black uppercase tracking-[0.2em] border ${stay.status === 'CHECKED_IN' ? 'bg-blue-600 border-blue-400' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                        {statusLabels[stay.status]}
                    </span>
                </div>
                <h4 className="text-2xl font-black text-white tracking-tighter capitalize leading-tight">
                    {stay.guestFirstName} {stay.guestLastName}
                </h4>
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1">
                    Documento: {stay.guestDocument || 'No registrado'}
                </p>
            </div>
            
            <div className="w-20 h-20 rounded-lg bg-white/5 flex items-center justify-center text-white/20 text-4xl font-black border border-white/10 relative z-10 tabular-nums">
                {getInitials(stay.guestFirstName || '', stay.guestLastName || '')}
            </div>
            
            {/* Background design elements */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        </div>

        {/* Schedule Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="Entrada (Check-In)" icon="login" className="border-l-4 border-l-slate-900">
                <div className="flex flex-col gap-3">
                    <div className="text-center bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fecha Programada</p>
                        <p className="text-sm font-black text-slate-900">{formatDateLong(stay.scheduledCheckIn)}</p>
                        <p className="text-2xl font-black text-slate-900 tracking-tighter mt-1 tabular-nums">{formatTime(stay.scheduledCheckIn)}</p>
                    </div>
                    {stay.actualCheckIn && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded">
                            <span className="material-symbols-outlined text-blue-600 text-sm font-black">verified</span>
                            <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Realizado: {formatTime(stay.actualCheckIn)}</span>
                        </div>
                    )}
                </div>
            </Card>

            <Card title="Salida (Check-Out)" icon="logout" className="opacity-80">
                <div className="flex flex-col gap-3">
                    <div className="text-center bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Fecha Programada</p>
                        <p className="text-sm font-black text-slate-900">{formatDateLong(stay.scheduledCheckOut)}</p>
                        <p className="text-2xl font-black text-slate-900 tracking-tighter mt-1 tabular-nums">{formatTime(stay.scheduledCheckOut)}</p>
                    </div>
                    {stay.actualCheckOut && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-200 rounded">
                            <span className="material-symbols-outlined text-slate-500 text-sm font-black">history</span>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Realizado: {formatTime(stay.actualCheckOut)}</span>
                        </div>
                    )}
                </div>
            </Card>
        </div>

        {/* Stay Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="Ubicación" icon="location_on">
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Torre" value={typeof stay.apartment?.building === 'string' ? stay.apartment.building : stay.apartment?.building?.name} />
                    <Field label="Piso" value={stay.apartment?.floor || 'S/N'} />
                </div>
            </Card>

            {stay.guests && stay.guests.length > 0 && (
                <Card title="Acompañantes" icon="group">
                    <div className="space-y-2">
                        {stay.guests.map((g, i) => (
                            <div key={i} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded border border-slate-100">
                                <span className="text-[11px] font-black tracking-tighter text-slate-900 uppercase">{g.firstName} {g.lastName}</span>
                                <span className="text-[9px] font-bold text-slate-400 tabular-nums">{g.document}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>

        {/* Notes & Constraints */}
        {stay.notes && (
            <Card title="Observaciones" icon="notes">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 italic">
                    <p className="text-sm font-medium text-slate-600 leading-relaxed tabular-nums">
                        "{stay.notes}"
                    </p>
                </div>
            </Card>
        )}

        {stay.isLocked && (
            <div className="bg-slate-900/5 border border-slate-900/10 rounded-xl p-5 flex items-start gap-4">
                <span className="material-symbols-outlined text-slate-900 font-black">lock</span>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 mb-1">Registro Bloqueado</p>
                    <p className="text-xs font-bold text-slate-500 leading-tight">
                        Para realizar modificaciones en esta reserva, por favor genere una petición formal a través del buzón de administración.
                    </p>
                </div>
            </div>
        )}
      </div>
    </Modal>
  );
};
