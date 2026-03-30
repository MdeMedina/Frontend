interface ManagerFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onNewManager: () => void;
}

export const ManagerFilters = ({
  searchTerm,
  onSearchChange,
  onNewManager,
}: ManagerFiltersProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div className="relative flex-1 max-w-md">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
          search
        </span>
        <input
          type="text"
          placeholder="Buscar por nombre, email o RUT..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all tracking-tight"
        />
      </div>

      <button
        onClick={onNewManager}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-slate-800 active:scale-[0.98] transition-all shadow-sm shadow-slate-200"
      >
        <span className="material-symbols-outlined text-[18px]">person_add</span>
        Nuevo Responsable
      </button>
    </div>
  );
};
