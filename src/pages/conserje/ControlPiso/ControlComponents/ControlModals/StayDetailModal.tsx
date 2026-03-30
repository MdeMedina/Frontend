import { Modal } from '../../../../../components/Modal';
import type { Stay, Guest } from '../../../../../api/stays';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface StayDetailModalProps {
  stay: Stay | null;
  isOpen: boolean;
  onClose: () => void;
  onCheckIn: (id: string) => void;
  onCheckOut: (id: string) => void;
  onCreatePetition: (type?: string) => void;
  movementType: 'checkin' | 'checkout';
}

export const StayDetailModal = ({ 
  stay, isOpen, onClose, onCheckIn, onCheckOut, onCreatePetition, movementType 
}: StayDetailModalProps) => {
  if (!stay) return null;

  const isCheckIn = movementType === 'checkin';
  const canPerformAction = isCheckIn ? stay.status === 'SCHEDULED' : stay.status === 'CHECKED_IN';
  const isCompleted = isCheckIn ? (stay.status === 'CHECKED_IN' || stay.status === 'CHECKED_OUT') : stay.status === 'CHECKED_OUT';

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCheckIn ? 'Control de Check-In' : 'Control de Check-Out'}
      width="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Unit & Parking Header */}
        <div className="grid grid-cols-2 gap-3">
            <Card title="Unidad" icon="apartment" accent="slate">
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 tracking-tighter">Depto {stay.apartment.number}</span>
                    <span className="text-[11px] font-bold text-slate-400">Piso {stay.apartment.floor}</span>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    {(stay.apartment.building as any)?.name || 'Torre Principal'}
                </p>
            </Card>
            
            <Card title="Estacionamiento" icon="local_parking" accent="slate">
                <span className="text-3xl font-black text-slate-900 tracking-tighter">
                    {stay.effectiveParkingNumber || 'S/N'}
                </span>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    Espacio Asignado
                </p>
            </Card>
        </div>

        {/* Guest Info */}
        <Card title="Huésped Principal" icon="person" accent="slate">
            <div className="grid grid-cols-2 gap-4">
                <Metadata label="Nombre Completo" value={`${stay.guestFirstName} ${stay.guestLastName}`} />
                <Metadata label="Documento / RUT" value={stay.guestDocument} mono />
            </div>
            {stay.notes && (
                <div className="mt-3 p-2 bg-slate-50 border border-slate-100 rounded text-[11px] font-medium text-slate-600 italic">
                    "{stay.notes}"
                </div>
            )}
        </Card>

        {/* Additional Guests */}
        {stay.guests && stay.guests.length > 0 && (
            <Card title={`Acompañantes (${stay.guests.length})`} icon="group" accent="slate">
                <div className="grid grid-cols-2 gap-2">
                    {stay.guests.map((g: Guest, i: number) => (
                        <div key={i} className="p-2 bg-slate-50 rounded border border-slate-100 flex flex-col">
                            <span className="text-[11px] font-bold text-slate-900">{g.firstName} {g.lastName}</span>
                            <span className="text-[9px] font-mono text-slate-400">{g.document}</span>
                        </div>
                    ))}
                </div>
            </Card>
        )}

        {/* Timing */}
        <div className="grid grid-cols-2 gap-4">
            <Card title="Programado" icon="schedule" accent="slate">
                <div className="flex flex-col">
                    <span className="text-[13px] font-black text-slate-900">
                        {format(new Date(isCheckIn ? stay.scheduledCheckIn : stay.scheduledCheckOut), 'HH:mm', { locale: es })}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {format(new Date(isCheckIn ? stay.scheduledCheckIn : stay.scheduledCheckOut), 'dd MMMM yyyy', { locale: es })}
                    </span>
                </div>
            </Card>
            
            <Card title="Ejecución Real" icon="history" accent={isCompleted ? 'slate' : 'slate'}>
                {isCompleted ? (
                    <div className="flex flex-col">
                        <span className="text-[13px] font-black text-slate-900">
                            {format(new Date(isCheckIn ? (stay.actualCheckIn || '') : (stay.actualCheckOut || '')), 'HH:mm', { locale: es })}
                        </span>
                        <span className="text-[10px] font-bold text-green-600 uppercase flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">check_circle</span>
                            Completado
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center h-full">
                        <span className="text-[10px] font-black text-slate-300 uppercase italic tracking-widest">Pendiente de registro</span>
                    </div>
                )}
            </Card>
        </div>

        {/* Actions Footer */}
        <div className="mt-8 flex flex-col gap-3">
            <div className="flex gap-2">
                <button
                    onClick={() => onCreatePetition()}
                    className="flex-1 px-4 py-3 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-sm">emergency_home</span>
                    Hacer Petición
                </button>
                <button
                    onClick={() => onCreatePetition('CANCEL_MOVEMENT')}
                    className="px-4 py-3 bg-white text-slate-900 border border-slate-900 text-[11px] font-bold uppercase tracking-widest rounded hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-sm">warning</span>
                    Reportar
                </button>
            </div>

            {canPerformAction ? (
                <button
                    onClick={() => isCheckIn ? onCheckIn(stay.id) : onCheckOut(stay.id)}
                    className={`w-full py-4 text-white text-[12px] font-black uppercase tracking-[0.3em] rounded transition-all flex items-center justify-center gap-3 ${
                        isCheckIn 
                        ? 'bg-slate-900 shadow-[0px_4px_12px_rgba(0,0,0,0.2)] hover:bg-black' 
                        : 'bg-slate-900 shadow-[0px_4px_12px_rgba(0,0,0,0.2)] hover:bg-black'
                    }`}
                >
                    <span className="material-symbols-outlined">{isCheckIn ? 'login' : 'logout'}</span>
                    Registrar {isCheckIn ? 'Check-In' : 'Check-Out'} Ahora
                </button>
            ) : isCompleted ? (
                <div className="w-full py-4 bg-slate-100 border border-slate-200 text-slate-400 text-[11px] font-black uppercase tracking-[0.3em] rounded flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    {isCheckIn ? 'Check-In' : 'Check-Out'} Ya Registrado
                </div>
            ) : null}
            
            <button
                onClick={onClose}
                className="w-full py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
            >
                Cerrar Ventana
            </button>
        </div>
      </div>
    </Modal>
  );
};
