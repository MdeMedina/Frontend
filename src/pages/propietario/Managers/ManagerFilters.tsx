interface ManagerFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const ManagerFilters = ({
  searchTerm,
  onSearchChange,
}: ManagerFiltersProps) => {
  return (
    <div className="w-full relative">
      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="material-symbols-outlined text-gray-400">search</span>
      </span>
      <input
        type="text"
        placeholder="Buscar por nombre, email o teléfono..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full border border-[var(--color-border)] rounded-xl pl-10 pr-4 py-2.5 
                   focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white shadow-[var(--shadow-surgical)]"
      />
    </div>
  );
};
