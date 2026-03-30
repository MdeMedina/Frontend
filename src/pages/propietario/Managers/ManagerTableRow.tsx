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
    <tr className="hover:bg-slate-50/50 transition-colors group border-b border-slate-100 last:border-0">
      <td className="py-4 pl-4 pr-3 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold tracking-tighter">
            {initials}
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 tracking-tighter">
              {manager.firstName} {manager.lastName}
            </div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">
              {manager.email}
            </div>
          </div>
        </div>
      </td>
      
      <td className="py-4 px-3 whitespace-nowrap">
        <div className="text-xs font-medium text-slate-600">
          {manager.phone ? formatPhoneNumber(manager.phone) : '—'}
        </div>
      </td>

      <td className="py-4 px-3">
        <div className="flex flex-wrap gap-1.5 max-w-[300px]">
          {manager.managedApartments && manager.managedApartments.length > 0 ? (
            manager.managedApartments.map((apt) => (
              <span
                key={apt.id}
                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 tracking-tight"
              >
                {apt.number} ({typeof apt.building === 'object' ? apt.building.name : apt.building})
              </span>
            ))
          ) : (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 tracking-tight flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">warning</span>
              SIN ASIGNAR
            </span>
          )}
        </div>
      </td>

      <td className="py-4 pl-3 pr-4 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onView(manager)}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
            title="Ver detalles"
          >
            <span className="material-symbols-outlined text-[18px]">visibility</span>
          </button>
          
          <button
            onClick={() => onEdit(manager)}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
            title="Editar"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>

          <button
            onClick={() => onResetKey(manager)}
            className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
            title="Reiniciar clave"
          >
            <span className="material-symbols-outlined text-[18px]">key</span>
          </button>

          {showAssignButton && (
            <button
              onClick={() => onAssign(manager)}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Asignar departamento"
            >
              <span className="material-symbols-outlined text-[18px]">apartment</span>
            </button>
          )}

          <button
            onClick={() => onDelete(manager)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Eliminar"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </td>
    </tr>
  );
};
