const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

interface CalendarHeaderProps {
  currentMonth: number;
  currentYear: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  myApartments: any[];
  filterApartment: string;
  onFilterChange: (id: string) => void;
}

export const CalendarHeader = ({
  currentMonth,
  currentYear,
  onPrev,
  onNext,
  onToday,
  myApartments,
  filterApartment,
  onFilterChange,
}: CalendarHeaderProps) => {
  return (
    <div className="bg-white p-5 border-b border-slate-200 flex flex-wrap justify-between items-center gap-6 shadow-[0px_4px_12px_rgba(0,0,0,0.02)] shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1 shadow-inner">
          <button
            onClick={onPrev}
            className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-400 hover:text-slate-900 group active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px] font-bold group-hover:scale-110 transition-transform">chevron_left</span>
          </button>
          
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900 min-w-[180px] text-center pointer-events-none">
            {monthNames[currentMonth]} {currentYear}
          </h2>

          <button
            onClick={onNext}
            className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-400 hover:text-slate-900 group active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px] font-bold group-hover:scale-110 transition-transform">chevron_right</span>
          </button>
        </div>

        <button
          onClick={onToday}
          className="px-6 py-2 text-[10px] uppercase font-black tracking-widest bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-all shadow-lg active:scale-95"
        >
          Hoy
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-slate-900 transition-colors">apartment</span>
          <select
            value={filterApartment}
            onChange={(e) => onFilterChange(e.target.value)}
            className="pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:border-slate-900 focus:bg-white transition-all appearance-none cursor-pointer"
          >
            <option value="">Todos los departamentos</option>
            {myApartments.map((apt) => (
              <option key={apt.id} value={apt.id}>
                Depto {apt.number}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">expand_more</span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.3)]"></div>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 italic">Ocupado</span>
            </div>
            <div className="w-px h-3 bg-slate-200"></div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 italic">Libre</span>
            </div>
        </div>
      </div>
    </div>
  );
};
