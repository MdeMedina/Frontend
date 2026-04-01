import type { Manager } from './useManagers';
import { formatPhoneNumber } from '../../../utils/phone';

interface ManagerTableRowProps {
  manager: Manager;
  onView: (manager: Manager) => void;
  onEdit: (manager: Manager) => void;
  onDelete: (manager: Manager) => void;
  onAssign: (manager: Manager) => void;
  onResetKey: (manager: Manager) => void;
  showAssignButton: boolean;
}

export const ManagerTableRow = ({
  manager,
  onView,
  onEdit,
  onDelete,
  onAssign,
  onResetKey,
  showAssignButton,
}: ManagerTableRowProps) => {
  const initials = `${manager.firstName[0]}${manager.lastName[0]}`.toUpperCase();

  return (
    <tr className="hover:bg-gray-50/60 transition-colors duration-200 border-b border-[var(--color-border)] last:border-0 group">
      <td className="px-6 py-4">
        <div className="flex items-center cursor-pointer" onClick={() => onView(manager)}>
          <div className="h-10 w-10 flex-shrink-0">
            <div className="h-10 w-10 rounded-xl bg-[#7B1FA2] flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-sm">
              {initials}
            </div>
          </div>
          <div className="ml-4">
            <div className="text-[15px] font-bold text-gray-900 leading-tight">
              {manager.firstName} {manager.lastName}
            </div>
            <div className="text-sm text-[var(--color-text-muted)] font-medium mt-0.5">
              {manager.email}
            </div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500 font-medium">
          {manager.phone ? formatPhoneNumber(manager.phone) : '—'}
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1.5 max-w-[300px]">
          {manager.managedApartments && manager.managedApartments.length > 0 ? (
            manager.managedApartments.map((apt) => (
              <span
                key={apt.id}
                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 tracking-tight whitespace-nowrap"
              >
                {apt.number} ({typeof apt.building === 'object' ? apt.building.name : apt.building})
              </span>
            ))
          ) : (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 tracking-tight flex items-center gap-1 whitespace-nowrap uppercase">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              SIN ASIGNAR
            </span>
          )}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
        <button
          onClick={() => onEdit(manager)}
          className="text-primary hover:text-primary/80 active:scale-95 transition-all mr-4 font-semibold text-xs uppercase"
        >
          Editar
        </button>
        <button
          onClick={() => onResetKey(manager)}
          className="text-[#E64A19] hover:text-[#D84315] active:scale-95 transition-all mr-4 font-semibold text-xs uppercase"
        >
          Reseteo CLAVE
        </button>
        {showAssignButton && (
          <button
            onClick={() => onAssign(manager)}
            className="text-[#7B1FA2] hover:text-[#4A148C] active:scale-95 transition-all mr-4 font-semibold text-xs uppercase"
          >
            ASIGNAR
          </button>
        )}
        <button
          onClick={() => onDelete(manager)}
          className="text-red-600 hover:text-red-800 active:scale-95 transition-all font-semibold text-xs uppercase"
        >
          Eliminar
        </button>
      </td>
    </tr>
  );
};
