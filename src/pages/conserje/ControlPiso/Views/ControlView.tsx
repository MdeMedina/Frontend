import { ControlTableRow } from '../ControlComponents/ControlTableRow';
import type { Stay } from '../../../../api/stays';

interface ControlViewProps {
  buildings: any[];
  selectedBuildingId: string;
  onBuildingChange: (id: string) => void;
  searchFilter: string;
  onSearchChange: (val: string) => void;
  filteredStays: Stay[];
  isLoading: boolean;
  onRowClick: (stay: Stay) => void;
  formatDateOnly: (date: string) => string;
  formatTime: (date: string) => string;
  currentDate: Date;
}

export const ControlView = ({
  buildings, selectedBuildingId, onBuildingChange,
  searchFilter, onSearchChange, filteredStays,
  isLoading, onRowClick, formatDateOnly, formatTime, currentDate
}: ControlViewProps) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Control de Piso</h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">
            Movimientos: {formatDateOnly(currentDate.toISOString())}
          </p>
        </div>
      </div>

      {/* Control Surface */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Seleccionar Torre</label>
            <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-lg shadow-inner">
              {buildings.map(b => (
                <button
                  key={b.id}
                  onClick={() => onBuildingChange(b.id)}
                  className={`px-4 py-1.5 rounded text-[11px] font-black uppercase tracking-widest transition-all ${selectedBuildingId === b.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5 text-right">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Búsqueda Quirúrgica</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-sm">search</span>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Unidad, Nombre o Documento..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[12px] font-bold text-slate-900 focus:outline-none focus:border-slate-900 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Dense Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-b-slate-900 animate-spin"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Sincronizando...</span>
            </div>
          ) : filteredStays.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 opacity-30">
              <span className="material-symbols-outlined text-4xl">inventory_2</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sin movimientos registrados</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Unidad</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Huésped / Documento</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Check-In</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Check-Out</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Estado</th>
                  <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Parking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStays.map(stay => (
                  <ControlTableRow
                    key={stay.id}
                    stay={stay}
                    onClick={() => onRowClick(stay)}
                    formatDateOnly={formatDateOnly}
                    formatTime={formatTime}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
