import { DateSelector } from '../DateSelector';
import { statusLabels } from '../../api/stays';

interface ReservationFiltersProps {
  filters: {
    filterApartment: string;
    setFilterApartment: (v: string) => void;
    filterCheckInFrom: Date | null;
    setFilterCheckInFrom: (v: Date | null) => void;
    filterCheckInTo: Date | null;
    setFilterCheckInTo: (v: Date | null) => void;
    filterCheckOutFrom: Date | null;
    setFilterCheckOutFrom: (v: Date | null) => void;
    filterCheckOutTo: Date | null;
    setFilterCheckOutTo: (v: Date | null) => void;
    filterStatus: string;
    setFilterStatus: (v: string) => void;
    filterCategory: string;
    setFilterCategory: (v: string) => void;
  };
  clearFilters: () => void;
  totalCount: number;
  filteredCount: number;
}

export const ReservationFilters = ({ filters, clearFilters, totalCount, filteredCount }: ReservationFiltersProps) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-sm shadow-sm p-5 mb-6 border border-black/[0.03] animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-gray-400">tune</span>
          <h2 className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">Parámetros de Filtrado</h2>
        </div>
        <button
          onClick={clearFilters}
          className="text-[10px] font-bold text-primary hover:text-primary-dark uppercase tracking-wider transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-xs">backspace</span>
          Resetear
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
        {/* Filtro por departamento */}
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 font-mono">
            Unidad / Depto
          </label>
          <div className="relative">
            <input
              type="text"
              value={filters.filterApartment}
              onChange={(e) => filters.setFilterApartment(e.target.value)}
              placeholder="Ej: 101"
              className="w-full border border-black/[0.05] rounded-sm px-3 py-2 text-[12px] 
                         focus:outline-none focus:border-black/20 bg-gray-50/30 transition-all font-mono placeholder:text-gray-300"
            />
          </div>
        </div>

        {/* Check-In Range */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-3">
          <DateSelector
            label="Check-In (Inicio)"
            date={filters.filterCheckInFrom}
            onChange={filters.setFilterCheckInFrom}
            placeholder="Desde..."
          />
          <DateSelector
            label="Check-In (Fin)"
            date={filters.filterCheckInTo}
            onChange={filters.setFilterCheckInTo}
            placeholder="Hasta..."
            minDate={filters.filterCheckInFrom || undefined}
          />
        </div>

        {/* Check-Out Range */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-3">
          <DateSelector
            label="Check-Out (Inicio)"
            date={filters.filterCheckOutFrom}
            onChange={filters.setFilterCheckOutFrom}
            placeholder="Desde..."
          />
          <DateSelector
            label="Check-Out (Fin)"
            date={filters.filterCheckOutTo}
            onChange={filters.setFilterCheckOutTo}
            placeholder="Hasta..."
            minDate={filters.filterCheckOutFrom || undefined}
          />
        </div>

        {/* Filtro por estado */}
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 font-mono">
            Estado Operativo
          </label>
          <select
            value={filters.filterStatus}
            onChange={(e) => filters.setFilterStatus(e.target.value)}
            className="w-full border border-black/[0.05] rounded-sm px-3 py-2
                       focus:outline-none focus:border-black/20 h-[38px]
                       text-[12px] bg-gray-50/30 transition-all font-medium appearance-none"
          >
            <option value="">Cualquier estado</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Filtro por categoría */}
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 font-mono">
            Categoría Registro
          </label>
          <select
            value={filters.filterCategory}
            onChange={(e) => filters.setFilterCategory(e.target.value)}
            className="w-full border border-black/[0.05] rounded-sm px-3 py-2
                       focus:outline-none focus:border-black/20 h-[38px]
                       text-[12px] bg-gray-50/30 transition-all font-medium appearance-none"
          >
            <option value="">Todas</option>
            <option value="GUEST">Huéspedes</option>
            <option value="STAFF">Mantenimiento</option>
          </select>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-black/[0.03] flex justify-between items-center">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          Sincronización: {filteredCount} / {totalCount} Registros
        </div>
        <div className="flex gap-2">
          {filters.filterApartment || filters.filterStatus || filters.filterCategory ? (
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/5 text-primary rounded-full text-[10px] font-bold uppercase tracking-tight border border-primary/10">
              <span className="w-1 h-1 rounded-full bg-primary animate-pulse"></span>
              Filtros Activos
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};
