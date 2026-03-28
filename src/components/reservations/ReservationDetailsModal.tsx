import type { Stay, Guest } from '../../api/stays';
import { ReservationStatusBadge } from './ReservationStatusBadge';

interface ReservationDetailsModalProps {
  stay: Stay | null;
  onClose: () => void;
  extraActions?: React.ReactNode;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const ReservationDetailsModal = ({ stay, onClose, extraActions }: ReservationDetailsModalProps) => {
  if (!stay) return null;

  const buildingName = typeof stay.apartment.building === 'object' 
    ? stay.apartment.building?.name 
    : stay.apartment.building;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Estado Operativo */}
      <div className="flex items-center gap-3 border-b border-black/[0.03] pb-5">
        <ReservationStatusBadge type="category" value={stay.category} />
        <ReservationStatusBadge type="status" value={stay.status} />
        {stay.isLocked && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full border border-amber-200/30">
            <span className="material-symbols-outlined text-[11px]">lock_person</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Registro Blindado</span>
          </div>
        )}
      </div>

      {/* Cédula del Departamento */}
      <div className="bg-gray-50/50 p-5 rounded-sm border border-black/[0.03]">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
          Identificación de Unidad
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">Terminal</div>
            <div className="text-sm font-bold text-gray-900 tracking-tight">{stay.apartment.number}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">Ubicación</div>
            <div className="text-[12px] font-bold text-gray-700 uppercase tracking-tight">{buildingName || 'S/T'}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">Nivel</div>
            <div className="text-[12px] font-bold text-gray-700 uppercase tracking-tight">Piso {stay.apartment.floor}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">Parking</div>
            <div className="text-[12px] font-bold text-primary uppercase tracking-tight font-mono">{stay.effectiveParkingNumber || 'S/E'}</div>
          </div>
        </div>
      </div>

      {/* Bitácora de Tiempos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-50/[0.15] p-5 rounded-sm border border-emerald-500/10 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-emerald-500/10 pb-2">
            <span className="material-symbols-outlined text-base text-emerald-500">login</span>
            <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Check-In Operativo</div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-[10px] font-bold text-emerald-700/60 uppercase tracking-wider mb-1 font-mono">Planificado</div>
              <div className="text-[13px] font-bold text-emerald-900 font-mono tracking-tight">{formatDate(stay.scheduledCheckIn)}</div>
            </div>
            {stay.actualCheckIn && (
              <div className="pt-2 border-t border-emerald-500/5">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 font-mono">Ejecutado</div>
                <div className="text-[13px] font-bold text-gray-600 font-mono tracking-tight">{formatDate(stay.actualCheckIn)}</div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-rose-50/[0.15] p-5 rounded-sm border border-rose-500/10 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-rose-500/10 pb-2">
            <span className="material-symbols-outlined text-base text-rose-500">logout</span>
            <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Check-Out Operativo</div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-[10px] font-bold text-rose-700/60 uppercase tracking-wider mb-1 font-mono">Planificado</div>
              <div className="text-[13px] font-bold text-rose-900 font-mono tracking-tight">{formatDate(stay.scheduledCheckOut)}</div>
            </div>
            {stay.actualCheckOut && (
              <div className="pt-2 border-t border-rose-500/5">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 font-mono">Ejecutado</div>
                <div className="text-[13px] font-bold text-gray-600 font-mono tracking-tight">{formatDate(stay.actualCheckOut)}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expediente del Titular */}
      {(stay.category === 'GUEST' || stay.category === 'STAFF') && (stay.guestFirstName || stay.guestLastName) && (
        <div className="pt-2">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4 font-mono">Persona Titular en Registro</div>
          <div className="bg-white p-5 rounded-sm border border-black/[0.03] shadow-sm flex items-center gap-5">
            <div className={`h-14 w-14 rounded-sm flex items-center justify-center text-white text-xl font-bold shadow-lg shrink-0 ${stay.category === 'GUEST' ? 'bg-gray-900' : 'bg-primary'}`}>
              {stay.guestFirstName?.[0]}{stay.guestLastName?.[0]}
            </div>
            <div>
              <div className="text-[18px] font-bold text-gray-900 tracking-tight leading-none mb-2">
                {stay.guestFirstName} {stay.guestLastName}
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wide rounded-sm border border-black/[0.03]">
                  {stay.category === 'GUEST' ? 'Huésped' : 'Personal Técnico'}
                </span>
                {stay.guestDocument && (
                  <span className="text-[11px] font-bold text-primary font-mono tracking-wider">
                    ID: {stay.guestDocument}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registro de Acompañantes */}
      {stay.guests && stay.guests.length > 0 && (
        <div className="pt-2">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4 font-mono">Acompañantes / Grupo Operativo</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stay.guests.map((guest: Guest, idx: number) => (
              <div key={idx} className="bg-gray-50/50 p-4 rounded-sm border border-black/[0.03] flex flex-col gap-1 hover:border-black/10 transition-colors group">
                <div className="text-[11px] font-bold text-gray-800 tracking-tight flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full group-hover:bg-primary transition-colors"></span>
                  {guest.firstName} {guest.lastName}
                </div>
                {guest.document && (
                  <div className="text-[10px] font-bold text-gray-500 uppercase font-mono tracking-wider pl-3">{guest.document}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Observaciones de Bitácora */}
      {stay.notes && (
        <div className="bg-amber-50/[0.2] p-5 rounded-sm border border-amber-500/10 backdrop-blur-sm">
          <div className="text-[10px] font-bold text-amber-900/60 uppercase tracking-wider mb-3 font-mono">Notas de Seguridad / Conserjería</div>
          <p className="text-[13px] text-gray-700 font-medium leading-relaxed italic border-l-2 border-amber-400/30 pl-3">{stay.notes}</p>
        </div>
      )}

      {/* Controles Finales */}
      <div className="pt-8 border-t border-black/[0.03] flex justify-between items-center">
        <div className="flex gap-3">
          {extraActions}
        </div>
        <button
          onClick={onClose}
          className="px-8 py-3 bg-gray-900 text-white rounded-sm hover:bg-black active:scale-[0.98] transition-all text-[9px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-black/10 font-mono"
        >
          Cerrar Expediente
        </button>
      </div>
    </div>
  );
};
