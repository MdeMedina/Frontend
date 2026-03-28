import type { Stay } from '../../api/stays';
import { getGuestFullName } from '../../api/stays';
import { ReservationStatusBadge } from './ReservationStatusBadge';

interface ReservationTableRowProps {
  stay: Stay;
  onDetail: (stay: Stay) => void;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getTotalGuests = (stay: Stay) => {
  let count = (stay.guestFirstName || stay.guestLastName) ? 1 : 0;
  if (stay.guests && Array.isArray(stay.guests)) {
    count += stay.guests.length;
  }
  return count;
};

export const ReservationTableRow = ({ stay, onDetail }: ReservationTableRowProps) => {
  const buildingName = typeof stay.apartment.building === 'object' 
    ? stay.apartment.building?.name 
    : stay.apartment.building;

  return (
    <tr 
      onClick={() => onDetail(stay)}
      className="hover:bg-gray-50/50 transition-colors group cursor-pointer border-b border-black/5"
    >
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="font-bold text-gray-900 text-[14px] tracking-tight group-hover:translate-x-1 transition-transform inline-block">
          {stay.apartment.number}
        </div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5 font-mono">
          {buildingName || 'S/T'} · P{stay.apartment.floor}
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <ReservationStatusBadge type="category" value={stay.category} />
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {stay.category === 'GUEST' ? (
          <div>
            <div className="text-[13px] font-bold text-gray-800 leading-tight">
              {getGuestFullName(stay)}
            </div>
            <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mt-0.5">
              {getTotalGuests(stay)} {getTotalGuests(stay) === 1 ? 'PAX' : 'PAX'}
            </div>
          </div>
        ) : (
          <span className="text-gray-200 font-mono text-[10px]"> — </span>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-[11px] font-bold text-gray-600 font-mono tracking-tight">{formatDate(stay.scheduledCheckIn)}</div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-[11px] font-bold text-gray-600 font-mono tracking-tight">{formatDate(stay.scheduledCheckOut)}</div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <ReservationStatusBadge type="status" value={stay.status} />
          {stay.isLocked && (
            <span className="text-amber-500 flex items-center" title="Registro bloqueado">
              <span className="material-symbols-outlined text-[14px]">lock</span>
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-right">
        <button
          className="text-gray-900 hover:text-black font-bold text-[10px] uppercase tracking-wider transition-all py-1.5 px-3 rounded-sm border border-black/10 hover:border-black/20 bg-gray-50/50 hover:bg-white"
        >
          Expediente
        </button>
      </td>
    </tr>
  );
};
