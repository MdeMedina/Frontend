import React from 'react';
import { DateSelector } from '../../../components/DateSelector';

interface AuditFiltersProps {
  username: string;
  setUsername: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
  apartment: string;
  setApartment: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  startDate: Date | null;
  setStartDate: (d: Date | null) => void;
  endDate: Date | null;
  setEndDate: (d: Date | null) => void;
  clearFilters: () => void;
  categoryOptions: Array<{ value: string; label: string }>;
  setPage: (p: number) => void;
}

export const AuditFilters: React.FC<AuditFiltersProps> = ({ 
  username, setUsername,
  search, setSearch,
  apartment, setApartment,
  category, setCategory,
  startDate, setStartDate,
  endDate, setEndDate,
  clearFilters,
  categoryOptions,
  setPage
}) => {
  const handleFilterChange = (setter: (v: any) => void, value: any) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="bg-white rounded-sm border-2 border-black/[0.08] p-5 mb-6 shadow-xl shadow-black/[0.02] relative group hover:shadow-black/[0.04] transition-all duration-500">
      <div className="absolute top-0 left-0 w-1 bg-black h-full group-hover:bg-blue-600 transition-colors duration-500"></div>
      <div className="flex justify-between items-center mb-5 border-b-2 border-black/[0.04] pb-3.5">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-950 flex items-center gap-2 group-hover:translate-x-1 transition-transform">
          <span className="material-symbols-outlined text-[16px] text-blue-600">filter_list</span>
          Parámetros de Búsqueda
        </h2>
        <button
          onClick={clearFilters}
          className="group/btn flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.15em] text-blue-600 hover:text-white hover:bg-blue-600 transition-all duration-300 bg-blue-50 px-3.5 py-1 rounded-sm border-2 border-blue-100/50 shadow-sm hover:shadow-blue-500/20 active:scale-95"
        >
          <span className="material-symbols-outlined text-[12px] group-hover/btn:rotate-180 transition-transform duration-500">refresh</span>
          Restablecer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Usuario */}
        <div className="group/field">
          <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-1.5 leading-none group-hover/field:text-blue-500 transition-colors">Operador</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Identificador..."
              value={username}
              onChange={(e) => handleFilterChange(setUsername, e.target.value)}
              className="w-full bg-gray-50/30 border-2 border-black/[0.06] rounded-sm px-3.5 py-1.5 text-[11px] font-bold focus:outline-none focus:ring-0 focus:border-black focus:bg-white focus:shadow-[0_0_15px_rgba(0,0,0,0.05)] transition-all placeholder:text-gray-300 shadow-sm"
            />
          </div>
        </div>

        {/* Palabra clave */}
        <div className="group/field">
          <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-1.5 leading-none group-hover/field:text-blue-500 transition-colors">Contenido</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Palabra clave..."
              value={search}
              onChange={(e) => handleFilterChange(setSearch, e.target.value)}
              className="w-full bg-gray-50/30 border-2 border-black/[0.06] rounded-sm px-3.5 py-1.5 text-[11px] font-bold focus:outline-none focus:ring-0 focus:border-black focus:bg-white focus:shadow-[0_0_15px_rgba(0,0,0,0.05)] transition-all placeholder:text-gray-300 shadow-sm"
            />
          </div>
        </div>

        {/* Departamento */}
        <div className="group/field">
          <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-1.5 leading-none group-hover/field:text-blue-500 transition-colors">Unidad</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Número..."
              value={apartment}
              onChange={(e) => handleFilterChange(setApartment, e.target.value)}
              className="w-full bg-gray-50/30 border-2 border-black/[0.06] rounded-sm px-3.5 py-1.5 text-[11px] font-bold focus:outline-none focus:ring-0 focus:border-black focus:bg-white focus:shadow-[0_0_15px_rgba(0,0,0,0.05)] transition-all placeholder:text-gray-300 shadow-sm"
            />
          </div>
        </div>

        {/* Categoría */}
        <div className="group/field">
          <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-1.5 leading-none group-hover/field:text-blue-500 transition-colors">Protocolo</label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => handleFilterChange(setCategory, e.target.value)}
              className="w-full bg-gray-50/30 border-2 border-black/[0.06] rounded-sm px-3 py-1.5 text-[11px] font-bold focus:outline-none focus:ring-0 focus:border-black focus:bg-white transition-all cursor-pointer shadow-sm appearance-none"
            >
              {categoryOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none text-xs" aria-hidden="true">expand_more</span>
          </div>
        </div>

        <div>
          <DateSelector
            label="Inicia"
            date={startDate}
            onChange={(d) => handleFilterChange(setStartDate, d)}
            placeholder="Desde..."
            inputClassName="w-full bg-gray-50/30 border-2 border-black/[0.06] rounded-sm pl-10 pr-3.5 py-1.5 text-[11px] font-bold focus:outline-none focus:ring-0 focus:border-black focus:bg-white focus:shadow-[0_0_15px_rgba(0,0,0,0.05)] transition-all placeholder:text-gray-300 shadow-sm"
            labelClassName="block text-[9px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-1.5 leading-none transition-colors"
          />
        </div>
        <div>
          <DateSelector
            label="Finaliza"
            date={endDate}
            onChange={(d) => handleFilterChange(setEndDate, d)}
            placeholder="Hasta..."
            minDate={startDate || undefined}
            inputClassName="w-full bg-gray-50/30 border-2 border-black/[0.06] rounded-sm pl-10 pr-3.5 py-1.5 text-[11px] font-bold focus:outline-none focus:ring-0 focus:border-black focus:bg-white focus:shadow-[0_0_15px_rgba(0,0,0,0.05)] transition-all placeholder:text-gray-300 shadow-sm"
            labelClassName="block text-[9px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-1.5 leading-none transition-colors"
          />
        </div>
      </div>
    </div>
  );
};
