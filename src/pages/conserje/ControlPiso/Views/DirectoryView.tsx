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
      <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-surgical)] overflow-hidden">
        <div className="p-4 border-b border-[#001640] bg-[#001640] grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
          </div>
          <div className="space-y-1.5 text-right flex flex-col justify-end items-end w-full">
            <div className="relative w-full max-w-sm">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
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
