import type { Apartment } from '../../../../api/apartments';

interface DirectoryAccordionProps {
  apartment: Apartment;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}

export const DirectoryAccordion = ({ apartment, isExpanded, onToggle }: DirectoryAccordionProps) => {
  return (
    <div className={`
      group border-b border-slate-100 last:border-0 transition-colors
      ${isExpanded ? 'bg-slate-50/50' : 'bg-white hover:bg-slate-50'}
    `}>
      <button
        onClick={() => onToggle(apartment.id)}
        className="w-full flex items-center justify-between p-4 focus:outline-none"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center bg-slate-100 border border-slate-200 text-slate-900 rounded-lg font-black text-[13px] group-hover:scale-105 transition-transform">
            {apartment.number}
          </div>
          <div className="text-left">
            <div className="text-[14px] font-black uppercase tracking-tighter text-slate-900 group-hover:tracking-[0.1em] transition-all">Unidad {apartment.number}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-0.5">
              Piso {apartment.floor} 
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              {apartment.owner ? 'Propietario Registrado' : 'Sin Registro'}
            </div>
          </div>
        </div>
        <span className={`material-symbols-outlined text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-slate-900' : ''}`}>
          expand_more
        </span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Propietario */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-slate-900 opacity-10"></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-sm">person</span>
              </div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Propietario</h3>
            </div>
            
            {apartment.owner ? (
              <div className="space-y-3">
                <div className="text-[14px] font-black text-slate-900 border-b border-slate-50 pb-2">
                  {apartment.owner.firstName} {apartment.owner.lastName}
                </div>
                <div className="flex flex-col gap-1.5">
                  <a href={`mailto:${apartment.owner.email}`} className="text-[12px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-2 transition-colors">
                    <span className="material-symbols-outlined text-[16px]">mail</span>
                    {apartment.owner.email}
                  </a>
                  {apartment.owner.phone && (
                    <a href={`tel:${apartment.owner.phone}`} className="text-[12px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-2 transition-colors">
                      <span className="material-symbols-outlined text-[16px]">phone</span>
                      {apartment.owner.phone}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-[11px] font-black text-slate-300 uppercase italic">Sin datos de propietario</p>
              </div>
            )}
          </div>

          {/* Responsable Asignado */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-slate-400 opacity-20"></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded bg-slate-400 text-white flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-sm">manage_accounts</span>
              </div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Responsable Asignado</h3>
            </div>
            
            {apartment.manager ? (
              <div className="space-y-3">
                <div className="text-[14px] font-black text-slate-900 border-b border-slate-50 pb-2">
                  {apartment.manager.firstName} {apartment.manager.lastName}
                </div>
                <div className="flex flex-col gap-1.5">
                  <a href={`mailto:${apartment.manager.email}`} className="text-[12px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-2 transition-colors">
                    <span className="material-symbols-outlined text-[16px]">mail</span>
                    {apartment.manager.email}
                  </a>
                  {apartment.manager.phone && (
                    <a href={`tel:${apartment.manager.phone}`} className="text-[12px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-2 transition-colors">
                      <span className="material-symbols-outlined text-[16px]">phone</span>
                      {apartment.manager.phone}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-[11px] font-black text-slate-300 uppercase italic">Sin responsable asignado</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
