import { DirectoryAccordion } from '../ControlComponents/DirectoryAccordion';

interface DirectoryViewProps {
  buildings: any[];
  selectedBuildingId: string;
  onBuildingChange: (id: string) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  filteredDirectory: any[];
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
}

export const DirectoryView = ({
  buildings, selectedBuildingId, onBuildingChange,
  searchTerm, onSearchChange, filteredDirectory,
  expandedIds, onToggleExpand
}: DirectoryViewProps) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Directorio de Contacto</h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">
            Propietarios y responsables por unidad
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filtrar por Torre</label>
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
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ocular de Búsqueda</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-sm">search</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Unidad, Nombre, Email..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[12px] font-bold text-slate-900 focus:outline-none focus:border-slate-900 shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredDirectory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2 opacity-30">
              <span className="material-symbols-outlined text-4xl">folder_off</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sin resultados en esta torre</span>
            </div>
          ) : (
            filteredDirectory.map(apt => (
              <DirectoryAccordion
                key={apt.id}
                apartment={apt}
                isExpanded={expandedIds.has(apt.id)}
                onToggle={onToggleExpand}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
