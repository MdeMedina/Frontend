import type { Stay } from '../../../../api/stays';
import { getGuestFullName } from '../../../../api/stays';

interface ControlTableRowProps {
  stay: Stay;
  onClick: () => void;
  formatDateOnly: (date: string) => string;
  formatTime: (date: string) => string;
}

export const ControlTableRow = ({ stay, onClick, formatDateOnly, formatTime }: ControlTableRowProps) => {
  const checkInDate = new Date(stay.scheduledCheckIn);
  const checkOutDate = new Date(stay.scheduledCheckOut);

  const isLateCheckIn = stay.actualCheckIn && new Date(stay.actualCheckIn).getTime() > checkInDate.getTime() + (30 * 60 * 1000); // 30 min grace
  const isLateCheckOut = stay.actualCheckOut && new Date(stay.actualCheckOut).getTime() > checkOutDate.getTime();

  const getStatusPill = () => {
    switch (stay.status) {
      case 'CHECKED_IN':
        return <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white border border-slate-900 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">En Curso</span>;
      case 'CHECKED_OUT':
        return <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-400 border border-slate-200 rounded-full">Finalizado</span>;
      case 'CANCELLED':
        return <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-700 border border-red-100 rounded-full">Cancelado</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-white text-slate-900 border border-slate-900 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]">Programado</span>;
    }
  };

  return (
    <tr
      onClick={onClick}
      className="group hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-100 last:border-0"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center bg-slate-900 text-white rounded font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] group-hover:scale-110 transition-transform">
            {stay.apartment.number}
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-black uppercase tracking-widest text-slate-400 leading-none">Unidad</span>
            <span className="text-[13px] font-bold text-slate-900 leading-tight">Depto {stay.apartment.number}</span>
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-[13px] font-bold text-slate-900">{getGuestFullName(stay)}</span>
          <span className="text-[11px] font-medium text-slate-400 font-mono tracking-tight">{stay.guestDocument || 'S/Documento'}</span>
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="text-[13px] font-black text-slate-900">{formatTime(stay.scheduledCheckIn)}</span>
            {stay.actualCheckIn && (
              <span className="material-symbols-outlined text-[10px] text-slate-300">check_circle</span>
            )}
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">{formatDateOnly(stay.scheduledCheckIn)}</span>
          {isLateCheckIn && (
            <span className="mt-1 w-max text-[9px] font-black uppercase tracking-widest bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-100">Retraso</span>
          )}
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="text-[13px] font-black text-slate-900">{formatTime(stay.scheduledCheckOut)}</span>
            {stay.actualCheckOut && (
              <span className="material-symbols-outlined text-[10px] text-slate-300">check_circle</span>
            )}
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">{formatDateOnly(stay.scheduledCheckOut)}</span>
          {isLateCheckOut && (
            <span className="mt-1 w-max text-[9px] font-black uppercase tracking-widest bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-100">Excedido</span>
          )}
        </div>
      </td>

      <td className="px-6 py-4 text-center">
        {getStatusPill()}
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          {stay.effectiveParkingNumber ? (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded shadow-inner">
              <span className="material-symbols-outlined text-sm text-slate-400">local_parking</span>
              <span className="text-[12px] font-black text-slate-900">{stay.effectiveParkingNumber}</span>
            </div>
          ) : (
            <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">N/A</span>
          )}
          <span className="material-symbols-outlined text-sm text-slate-300 group-hover:text-slate-900 transition-colors">chevron_right</span>
        </div>
      </td>
    </tr>
  );
};
